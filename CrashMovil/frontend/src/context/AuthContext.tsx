import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

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
