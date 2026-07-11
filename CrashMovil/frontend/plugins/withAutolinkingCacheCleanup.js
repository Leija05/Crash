const { withSettingsGradle } = require('@expo/config-plugins');

/**
 * Fixes expo/expo#46886: a Windows-generated autolinking cache
 * (android/build/generated/autolinking/autolinking.json) can be restored from
 * the EAS build cache on the Linux builder with Windows absolute paths. That
 * makes every autolinked native module resolve with "No variants exist".
 *
 * Deleting the cache on non-Windows builders forces Expo autolinking to
 * regenerate it with correct (Linux) paths on each build.
 */
module.exports = function withAutolinkingCacheCleanup(config) {
  return withSettingsGradle(config, (cfg) => {
    const marker = 'autolinkingCacheDir';
    if (cfg.modResults.contents.includes(marker)) {
      return cfg;
    }
    const snippet = `// Force-delete the autolinking cache so it always regenerates with correct paths
// on the build machine. Prevents a Windows-path cache from reaching the Linux EAS
// builder (see https://github.com/expo/expo/issues/46886).
def autolinkingCacheDir = new File(rootDir, "build/generated/autolinking")
if (!System.getProperty("os.name").toLowerCase().contains("windows")) {
  autolinkingCacheDir.deleteDir()
}

`;
    cfg.modResults.contents = snippet + cfg.modResults.contents;
    return cfg;
  });
};
