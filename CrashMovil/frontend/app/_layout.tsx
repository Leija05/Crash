import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { AppSettingsProvider } from '../src/context/AppSettingsContext';
import { BluetoothProvider } from '../src/context/BluetoothContext';
import { I18nProvider } from '../src/i18n';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AppSettingsProvider>
          <AuthProvider>
            <BluetoothProvider>
              <StatusBar style="light" translucent />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#050506' },
                  animation: 'slide_from_right',
                }}
              />
            </BluetoothProvider>
          </AuthProvider>
        </AppSettingsProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
