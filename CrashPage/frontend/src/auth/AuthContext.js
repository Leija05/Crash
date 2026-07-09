import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, formatApiError } from "../lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("crash_token");
    if (!token) { setUser(false); return; }
    try {
      const { data } = await api.get("/auth/monitor/me", { __authProbe: true });
      setUser(data);
    } catch {
      try {
        const { data } = await api.get("/auth/me", { __authProbe: true });
        if (data.role === "superadmin") {
          setUser({ ...data, is_superadmin: true });
        } else {
          setUser(data);
        }
      } catch {
        setUser(false);
      }
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password) => {
    setError("");
    try {
      const { data } = await api.post("/auth/monitor/login", { email, password });
      if (data.access_token) localStorage.setItem("crash_token", data.access_token);
      setUser({ id: data.id, email: data.email, name: data.name, role: data.role, company_id: data.company_id, company_name: data.company_name });
      return true;
    } catch (e) {
      setError(formatApiError(e));
      return false;
    }
  };

  const loginWithToken = async (token, email, password, name) => {
    setError("");
    try {
      const { data } = await api.post("/auth/register-monitor", { token, email, password, name });
      if (data.access_token) localStorage.setItem("crash_token", data.access_token);
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

  const loginSuperAdmin = async (email, password) => {
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      if (data.access_token) localStorage.setItem("crash_token", data.access_token);
      if (data.user.role !== "superadmin") {
        setError("No tienes permisos de SuperAdmin");
        localStorage.removeItem("crash_token");
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
    localStorage.removeItem("crash_token");
    localStorage.removeItem("crash_site_token");
    setUser(false);
  };

  return (
    <AuthCtx.Provider value={{ user, error, login, loginWithToken, loginSuperAdmin, associateMonitor, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
