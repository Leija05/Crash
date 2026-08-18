import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { AuthProvider } from '../src/context/AuthContext';
import { AppSettingsProvider } from '../src/context/AppSettingsContext';
import { BluetoothProvider } from '../src/context/BluetoothContext';
import { AlertProvider } from '../src/context/AlertContext';
import { LocationProvider } from '../src/context/LocationContext';
import { I18nProvider } from '../src/i18n';
import UpdateGate from '../src/components/UpdateGate';
import { COLORS, RED } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  if (!fontsLoaded) return null;

  SplashScreen.hideAsync().catch(() => {});

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
                  entering={FadeIn.duration(800).springify().damping(26).stiffness(200)}
                  style={styles.topGoldLine}
                  pointerEvents="none"
                />
                <Animated.View
                  entering={FadeIn.duration(1000).delay(200).springify().damping(26).stiffness(200)}
                  style={styles.ambientGlow}
                  pointerEvents="none"
                />
                <Animated.View
                  entering={FadeIn.duration(1200).delay(400).springify().damping(26).stiffness(200)}
                  style={styles.brandGlow}
                  pointerEvents="none"
                />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: COLORS.bg },
                    animation: 'slide_from_right',
                  }}
                />
                <UpdateGate />
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
  topGoldLine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    backgroundColor: RED,
    zIndex: 100,
  },
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 300,
    backgroundColor: 'rgba(239,68,68,0.015)',
    borderBottomLeftRadius: 150, borderBottomRightRadius: 150,
    zIndex: 0,
  },
  brandGlow: {
    position: 'absolute',
    top: -80,
    alignSelf: 'center',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(239,68,68,0.03)',
    zIndex: 0,
  },
});
