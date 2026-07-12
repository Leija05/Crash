import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { authAPI, locationAPI } from '../services/api';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
} | null;

type AuthState = {
  user: User;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  refreshToken: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

async function linkPermissionLocationOnLogin(token: string) {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    await locationAPI.linkPermissionLocation(token, {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy ?? null,
    });
  } catch (e) {
    console.warn('No se pudo vincular ubicación al iniciar sesión', e);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const loadStoredAuth = useCallback(async () => {
    try {
      const [storedToken, storedRefresh] = await Promise.all([
        AsyncStorage.getItem('access_token'),
        AsyncStorage.getItem('refresh_token'),
      ]);
      if (storedToken && mountedRef.current) {
        const userData = await authAPI.me(storedToken);
        if (mountedRef.current) {
          setUser(userData);
          setToken(storedToken);
          setRefreshToken(storedRefresh);
        }
      }
    } catch {
      if (mountedRef.current) {
        await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { loadStoredAuth(); }, [loadStoredAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authAPI.login(email, password);
    await AsyncStorage.multiSet([
      ['access_token', data.access_token],
      ['refresh_token', data.refresh_token],
    ]);
    setToken(data.access_token);
    setRefreshToken(data.refresh_token);
    setUser(data.user);
    // Vincular ubicación actual con la cuenta
    linkPermissionLocationOnLogin(data.access_token);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await authAPI.register(name, email, password);
    await AsyncStorage.multiSet([
      ['access_token', data.access_token],
      ['refresh_token', data.refresh_token],
    ]);
    setToken(data.access_token);
    setRefreshToken(data.refresh_token);
    setUser(data.user);
    // Vincular ubicación actual con la cuenta
    linkPermissionLocationOnLogin(data.access_token);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
