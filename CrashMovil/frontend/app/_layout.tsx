import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { AppSettingsProvider } from '../src/context/AppSettingsContext';
import { BluetoothProvider } from '../src/context/BluetoothContext';
import { AlertProvider } from '../src/context/AlertContext';
import { LocationProvider } from '../src/context/LocationContext';
import { I18nProvider } from '../src/i18n';
import { COLORS } from '../src/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AppSettingsProvider>
          <AuthProvider>
            <BluetoothProvider>
              <LocationProvider>
              <AlertProvider>
                <StatusBar style="light" translucent />
              <View style={styles.ambientGlow} pointerEvents="none" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: COLORS.bg },
                  animation: 'slide_from_right',
                }}
              />
              </AlertProvider>
              </LocationProvider>
            </BluetoothProvider>
          </AuthProvider>
        </AppSettingsProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 300,
    backgroundColor: 'rgba(204,255,0,0.015)',
    borderBottomLeftRadius: 150, borderBottomRightRadius: 150,
    zIndex: 0,
  },
});
