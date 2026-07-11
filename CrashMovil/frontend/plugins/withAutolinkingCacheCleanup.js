const { withSettingsGradle } = require('@expo/config-plugins');

/**
 * Fixes expo/expo#46886: a Windows-generated autolinking cache
 * (android/build/generated/autolinking/autolinking.json) can be restored from
 * the EAS build cache on the Linux builder with Windows absolute paths. That
 * makes every autolinked native module resolve with "No variants exist".
 *
 * The cache must be deleted on non-Windows builders before Expo autolinking
 * reads it. This must be injected AFTER the `plugins {}` block (Gradle forbids
 * arbitrary statements before it), but still before autolinking runs.
 */
module.exports = function withAutolinkingCacheCleanup(config) {
  return withSettingsGradle(config, (cfg) => {
    const marker = 'autolinkingCacheCleanup';
    if (cfg.modResults.contents.includes(marker)) {
      return cfg;
    }
    const snippet = `
// [autolinkingCacheCleanup] Delete stale autolinking cache (Windows paths) on
// non-Windows builders. See https://github.com/expo/expo/issues/46886
def autolinkingCacheCleanupDir = new File(rootDir, "build/generated/autolinking")
if (!System.getProperty("os.name").toLowerCase().contains("windows")) {
  autolinkingCacheCleanupDir.deleteDir()
}
`;
    const anchor = 'id("expo-autolinking-settings")\n}';
    if (cfg.modResults.contents.includes(anchor)) {
      cfg.modResults.contents = cfg.modResults.contents.replace(anchor, anchor + snippet);
    } else {
      // Fallback (non-standard template): prepend if the anchor isn't found.
      cfg.modResults.contents = snippet + "\n" + cfg.modResults.contents;
    }
    return cfg;
  });
};
