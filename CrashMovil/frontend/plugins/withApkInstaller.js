const fs = require('fs');
const path = require('path');
const {
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
} = require('@expo/config-plugins');

const MODULE_DIR = 'apkinstaller';
const PKG_NAME = 'com.crash.helmet';

const KOTLIN_MODULE = `package ${PKG_NAME}.apkinstaller

import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

class ApkInstallerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ApkInstaller"

    @ReactMethod
    fun installApk(filePath: String, promise: Promise) {
        try {
            val file = File(filePath)
            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "El archivo APK no existe: $filePath")
                return
            }
            val uri = FileProvider.getUriForFile(
                reactContext,
                "$PKG_NAME.fileprovider",
                file
            )
            val intent = Intent(Intent.ACTION_INSTALL_PACKAGE).apply {
                setDataAndType(uri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("INSTALL_FAILED", e.message ?: "No se pudo instalar")
        }
    }
}
`;

const KOTLIN_PACKAGE = `package ${PKG_NAME}

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class ApkInstallerPackage : ReactPackage() {
    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): List<NativeModule> = listOf(ApkInstallerModule(reactContext))

    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): List<ViewManager<*, *>> = emptyList()
}
`;

const FILE_PATHS_PATCH = `<?xml version="1.0" encoding="utf-8"?>
<paths>
    <external-path name="external" path="." />
    <external-path name="downloads" path="Download" />
    <cache-path name="cache" path="." />
    <files-path name="files" path="." />
</paths>
`;

module.exports = function withApkInstaller(config) {
  config = withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const app = manifest.manifest.application[0];

    app.provider = app.provider || [];
    const authority = `${PKG_NAME}.fileprovider`;
    if (!app.provider.some((p) => p.$['android:authorities'] === authority)) {
      app.provider.push({
        $: {
          'android:name': 'androidx.core.content.FileProvider',
          'android:authorities': authority,
          'android:exported': 'false',
          'android:grantUriPermissions': 'true',
        },
        'meta-data': [
          {
            $: {
              'android:name': 'android.support.FILE_PROVIDER_PATHS',
              'android:resource': '@xml/file_paths',
            },
          },
        ],
      });
    }

    const perms = manifest.manifest['uses-permission'] || [];
    perms.push({
      $: { 'android:name': 'android.permission.REQUEST_INSTALL_PACKAGES' },
    });
    manifest.manifest['uses-permission'] = perms;

    return cfg;
  });

  config = withAppBuildGradle(config, (cfg) => {
    if (!cfg.modResults.contents.includes('apkinstaller')) {
      cfg.modResults.contents += `\nandroid.sourceSets.main.java.srcDirs += ["../${MODULE_DIR}"]\n`;
    }
    return cfg;
  });

  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const modDir = path.join(projectRoot, MODULE_DIR);
      fs.mkdirSync(modDir, { recursive: true });
      fs.writeFileSync(path.join(modDir, 'ApkInstallerModule.kt'), KOTLIN_MODULE);
      fs.writeFileSync(path.join(modDir, 'ApkInstallerPackage.kt'), KOTLIN_PACKAGE);

      const resXml = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');
      fs.mkdirSync(resXml, { recursive: true });
      fs.writeFileSync(path.join(resXml, 'file_paths.xml'), FILE_PATHS_PATCH);

      const mainApp = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        ...PKG_NAME.split('.'),
        'MainApplication.kt'
      );
      if (fs.existsSync(mainApp)) {
        let src = fs.readFileSync(mainApp, 'utf8');
        if (!src.includes('ApkInstallerPackage()')) {
          src = src.replace(
            /(return PackageList\(this\)\.getPackages\(\))/,
            `$1.apply { add(ApkInstallerPackage()) }`
          );
          if (!src.includes('import com.crash.helmet.ApkInstallerPackage')) {
            src = src.replace(
              /(^package .*$)/m,
              `$1\nimport ${PKG_NAME}.ApkInstallerPackage`
            );
          }
          fs.writeFileSync(mainApp, src);
        }
      }

      return cfg;
    },
  ]);

  return config;
};
