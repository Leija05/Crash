const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

/**
 * Config plugin for react-native-bluetooth-classic
 * Adds necessary permissions and configurations for Bluetooth Classic (SPP) on Android and iOS
 */
module.exports = function withBluetoothClassic(config) {
  // Android: Add Bluetooth Classic permissions
  config = withAndroidManifest(config, (cfg) => {
    // Ensure manifest structure exists
    if (!cfg.manifest) cfg.manifest = {};
    if (!cfg.manifest.application) cfg.manifest.application = [{}];
    
    const mainApplication = cfg.manifest.application[0];
    if (!mainApplication) return cfg;

    // Add uses-permission elements
    const permissions = [
      'android.permission.BLUETOOTH',
      'android.permission.BLUETOOTH_ADMIN',
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.BLUETOOTH_SCAN',
      'android.permission.BLUETOOTH_ADVERTISE',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
    ];

    const existingPermissions = cfg.manifest['uses-permission'] || [];
    const existingPermissionNames = new Set(
      existingPermissions.map((p) => p.$ && p.$['android:name']).filter(Boolean)
    );

    for (const perm of permissions) {
      if (!existingPermissionNames.has(perm)) {
        existingPermissions.push({ $: { 'android:name': perm } });
      }
    }
    cfg.manifest['uses-permission'] = existingPermissions;

    // Add uses-feature for Bluetooth
    const features = cfg.manifest['uses-feature'] || [];
    const featureNames = new Set(
      features.map((f) => f.$ && f.$['android:name']).filter(Boolean)
    );
    const requiredFeatures = [
      'android.hardware.bluetooth',
      'android.hardware.bluetooth_le',
    ];
    for (const feat of requiredFeatures) {
      if (!featureNames.has(feat)) {
        features.push({ $: { 'android:name': feat, 'android:required': 'false' } });
      }
    }
    cfg.manifest['uses-feature'] = features;

    // Add queries for Bluetooth device discovery (Android 11+)
    if (!cfg.manifest.queries) cfg.manifest.queries = [{}];
    const queries = cfg.manifest.queries[0];
    if (!queries.intent) queries.intent = [];
    const intentNames = new Set(
      queries.intent.map((i) => i.action && i.action[0] && i.action[0].$ && i.action[0].$['android:name']).filter(Boolean)
    );
    const requiredIntents = [
      'android.bluetooth.device.action.FOUND',
      'android.bluetooth.adapter.action.DISCOVERY_STARTED',
      'android.bluetooth.adapter.action.DISCOVERY_FINISHED',
      'android.bluetooth.adapter.action.STATE_CHANGED',
    ];
    for (const intent of requiredIntents) {
      if (!intentNames.has(intent)) {
        queries.intent.push({ action: [{ $: { 'android:name': intent } }] });
      }
    }

    return cfg;
  });

  // iOS: Add Bluetooth and External Accessory support
  config = withInfoPlist(config, (cfg) => {
    // Bluetooth usage descriptions
    if (!cfg.NSBluetoothAlwaysUsageDescription) {
      cfg.NSBluetoothAlwaysUsageDescription = 'Connect to your smart helmet sensor via Bluetooth Classic';
    }
    if (!cfg.NSBluetoothPeripheralUsageDescription) {
      cfg.NSBluetoothPeripheralUsageDescription = 'Receive telemetry from your smart helmet via SPP';
    }

    // External accessory protocol for SPP
    if (!cfg.UISupportedExternalAccessoryProtocols) {
      cfg.UISupportedExternalAccessoryProtocols = ['com.crash.spp'];
    } else if (!cfg.UISupportedExternalAccessoryProtocols.includes('com.crash.spp')) {
      cfg.UISupportedExternalAccessoryProtocols.push('com.crash.spp');
    }

    // Background modes
    if (!cfg.UIBackgroundModes) {
      cfg.UIBackgroundModes = [];
    }
    const bgModes = ['bluetooth-central', 'external-accessory'];
    for (const mode of bgModes) {
      if (!cfg.UIBackgroundModes.includes(mode)) {
        cfg.UIBackgroundModes.push(mode);
      }
    }

    return cfg;
  });

  return config;
};