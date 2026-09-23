import { NativeModules } from 'react-native';

const { ApkInstaller } = NativeModules;

export function installApk(filePath: string): Promise<boolean> {
  if (!ApkInstaller || !ApkInstaller.installApk) {
    return Promise.reject(new Error('ApkInstaller nativo no disponible'));
  }
  return ApkInstaller.installApk(filePath);
}

export function canRequestPackageInstalls(): Promise<boolean> {
  if (!ApkInstaller || !ApkInstaller.canRequestPackageInstalls) {
    return Promise.resolve(true);
  }
  return ApkInstaller.canRequestPackageInstalls();
}

export function openInstallPermissionSettings(): Promise<boolean> {
  if (!ApkInstaller || !ApkInstaller.openInstallPermissionSettings) {
    return Promise.resolve(false);
  }
  return ApkInstaller.openInstallPermissionSettings();
}

