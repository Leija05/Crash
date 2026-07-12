import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  api, formatApiError, getToken, setToken, clearToken,
  getRememberedCredentials, setRememberedCredentials, clearRememberedCredentials,
} from "../lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [initializing, setInitializing] = useState(true);

  const probeUser = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/monitor/me", { __authProbe: true });
      return data;
    } catch {
      try {
        const { data } = await api.get("/auth/me", { __authProbe: true });
        if (data.role === "superadmin") return { ...data, is_superadmin: true };
        return data;
      } catch {
        return null;
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (token) {
      const u = await probeUser();
      if (u) { setUser(u); setInitializing(false); return; }
      clearToken();
    }
    // Token ausente/expirado: reintenta con credenciales recordadas.
    const creds = getRememberedCredentials();
    if (creds?.email && creds?.password) {
      try {
        const { data } = creds.role === "superadmin"
          ? await api.post("/auth/login", { email: creds.email, password: creds.password })
          : await api.post("/auth/monitor/login", { email: creds.email, password: creds.password });
        if (data.access_token) setToken(data.access_token, true);
        if (creds.role === "superadmin") {
          if (data.user?.role === "superadmin") setUser({ ...data.user, is_superadmin: true });
          else setUser(false);
        } else {
          setUser({ id: data.id, email: data.email, name: data.name, role: data.role, company_id: data.company_id, company_name: data.company_name });
        }
        setInitializing(false);
        return;
      } catch {
        clearRememberedCredentials();
      }
    }
    setUser(false);
    setInitializing(false);
  }, [probeUser]);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password, remember = true) => {
    setError("");
    try {
      const { data } = await api.post("/auth/monitor/login", { email, password });
      if (data.access_token) setToken(data.access_token, remember);
      if (remember) setRememberedCredentials({ role: "monitor", email, password });
      else clearRememberedCredentials();
      setUser({ id: data.id, email: data.email, name: data.name, role: data.role, company_id: data.company_id, company_name: data.company_name });
      return true;
    } catch (e) {
      setError(formatApiError(e));
      return false;
    }
  };

  const loginWithToken = async (token, email, password, name, remember = true) => {
    setError("");
    try {
      const { data } = await api.post("/auth/register-monitor", { token, email, password, name });
      if (data.access_token) setToken(data.access_token, remember);
      if (remember) setRememberedCredentials({ role: "monitor", email, password });
      else clearRememberedCredentials();
      setUser({ id: data.user.id, email: data.user.email, name: data.user.name, role: "monitor", company_id: data.user.company_id, company_name: data.user.company_name });
      return true;
    } catch (e) {
      setError(formatApiError(e));
      return false;
    }
  };

  const associateMonitor = async (token) => {
    setError("");
    try {
      await api.post("/auth/monitor/associate", { token });
      const { data } = await api.get("/auth/monitor/me", { __authProbe: true });
      setUser((u) => ({ ...u, company_id: data.company_id, company_name: data.company_name }));
      return true;
    } catch (e) {
      setError(formatApiError(e));
      return false;
    }
  };

  const loginSuperAdmin = async (email, password, remember = true) => {
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      if (data.access_token) setToken(data.access_token, remember);
      if (remember) setRememberedCredentials({ role: "superadmin", email, password });
      else clearRememberedCredentials();
      if (data.user.role !== "superadmin") {
        setError("No tienes permisos de SuperAdmin");
        clearToken();
        clearRememberedCredentials();
        return false;
      }
      setUser({ ...data.user, is_superadmin: true });
      return true;
    } catch (e) {
      setError(formatApiError(e));
      return false;
    }
  };

  const logout = async () => {
    try { await api.post("/auth/monitor/logout"); } catch { }
    // Cierre de sesión completo: se elimina el JWT y las credenciales
    // recordadas. NO se elimina el token de acceso al sitio (crash_site_token)
    // para que no tengan que volver a ingresarlo en la puerta de acceso.
    clearToken();
    clearRememberedCredentials();
    setUser(false);
  };

  return (
    <AuthCtx.Provider value={{ user, error, initializing, login, loginWithToken, loginSuperAdmin, associateMonitor, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
