import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { AppSettingsProvider } from '../src/context/AppSettingsContext';
import { BluetoothProvider } from '../src/context/BluetoothContext';
import { AlertProvider } from '../src/context/AlertContext';
import { LocationProvider } from '../src/context/LocationContext';
import { I18nProvider } from '../src/i18n';
import UpdateGate from '../src/components/UpdateGate';
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
                <Animated.View
                  entering={FadeIn.duration(800).springify().damping(20)}
                  style={styles.topRedLine}
                  pointerEvents="none"
                />
                <Animated.View
                  entering={FadeIn.duration(1000).delay(200).springify().damping(24)}
                  style={styles.ambientGlow}
                  pointerEvents="none"
                />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: COLORS.bg },
                    animation: 'slide_from_right',
                  }}
                />
                <Animated.View
                  entering={SlideInDown.duration(500).delay(400).springify()}
                >
                  <UpdateGate />
                </Animated.View>
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
  topRedLine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    backgroundColor: COLORS.primary,
    zIndex: 100,
  },
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 300,
    backgroundColor: 'rgba(255,59,48,0.015)',
    borderBottomLeftRadius: 150, borderBottomRightRadius: 150,
    zIndex: 0,
  },
});
