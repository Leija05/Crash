# Maestro Test Flows for C.R.A.S.H. Mobile App

## Installation

```bash
# Install Maestro CLI
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro --version
```

## Available Flows

| Flow | Description |
|------|-------------|
| `bluetooth_connect.yaml` | Tests BLE scan, device discovery, and connection |
| `auto_reconnect.yaml` | Tests auto-reconnect on app launch (requires prior pairing) |
| `debug_terminal.yaml` | Tests admin-only debug terminal visibility |
| `full_smoke.yaml` | Full app smoke test covering all tabs |

## Running Tests

### On iOS Simulator
```bash
# Start iOS simulator first
xcrun simctl boot "iPhone 16"

# Run specific flow
maestro test .maestro/flows/bluetooth_connect.yaml

# Run all flows
maestro test .maestro/flows/
```

### On Android Emulator
```bash
# Start Android emulator first
emulator -avd pixel_7_pro

# Run specific flow
maestro test .maestro/flows/bluetooth_connect.yaml

# Run all flows
maestro test .maestro/flows/
```

### On Real Device (iOS)
```bash
# Connect iOS device via USB
# Ensure USB debugging is enabled
maestro test .maestro/flows/bluetooth_connect.yaml
```

### On Real Device (Android)
```bash
# Connect Android device via USB
# Ensure USB debugging is enabled
maestro test .maestro/flows/bluetooth_connect.yaml
```

## Generating Reports

### JUnit XML Report (for CI/CD)
```bash
maestro test --format=junit .maestro/flows/ > maestro-report.xml
```

### HTML Report
```bash
maestro test --format=html .maestro/flows/ --output=maestro-report.html
```

### Screenshots on Failure
Screenshots are automatically captured on assertion failures and saved to `maestro-screenshots/`.

## CI/CD Integration (GitHub Actions)

```yaml
# .github/workflows/maestro.yml
name: Maestro E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Maestro
        run: curl -Ls "https://get.maestro.mobile.dev" | bash
      - name: Setup iOS Simulator
        run: |
          xcrun simctl create "iPhone 16 Test" com.apple.CoreSimulator.SimDeviceType.iPhone-16
          xcrun simctl boot "iPhone 16 Test"
      - name: Build App
        run: |
          cd CrashMovil/frontend
          npx expo install
          npx expo run:ios --configuration Debug --device "iPhone 16 Test" --no-bundler
      - name: Run Maestro Tests
        run: |
          export MAESTRO_DEVICE="iPhone 16 Test"
          maestro test --format=junit .maestro/flows/ > maestro-report.xml
      - name: Upload Test Results
        uses: actions/upload-artifact@v4
        with:
          name: maestro-report
          path: maestro-report.xml
```

## Test IDs Required

For tests to work reliably, ensure these testIDs exist in your components:

- `tab-home` - Home tab
- `tab-devices` - Devices tab
- `tab-contacts` - Contacts tab
- `tab-impacts` - Impacts tab
- `tab-profile` - Profile tab
- `tab-settings` - Settings tab
- `email-field` - Email input on login
- `password-field` - Password input on login
- `device-name-input` - Device name input in settings
- `save-device-name-btn` - Save device name button
- `threshold-input` - Alert threshold input
- `company-token-input` - Company token input
- `company-link-btn` - Link company button
- `company-unlink-btn` - Unlink company button
- `save-settings-btn` - Save alerts settings button
- `settings-disconnect-btn` - Disconnect button in settings
- `settings-scan-btn` - Scan button in settings
- `simulate-impact-btn` - Simulate impact button
- `disconnect-btn` - Disconnect button on dashboard
- `connect-btn` - Connect button on dashboard

## Notes

- Tests require a physical device or simulator with Bluetooth enabled for BLE tests
- Admin tests require an existing superadmin account
- Auto-reconnect test requires a previously paired device with auto-reconnect enabled
- Run tests in sequence for best results (some tests depend on previous state)