import axios from "axios";

export const API_BASE = process.env.REACT_APP_BACKEND_URL;
export const API = `${API_BASE}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: false,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ── Almacenamiento de token con opción "mantener sesión iniciada" ──
// remember=true  -> localStorage (persiste entre sesiones del navegador)
// remember=false -> sessionStorage (se borra al cerrar el navegador)
const TOKEN_KEY = "crash_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token, remember = true) {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  if (!token) return;
  (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

// ── Credenciales recordadas (solo con "mantener sesión") ──
// Se guardan en localStorage para poder reautenticar automáticamente
// si el token expira al recargar la página.
const REMEMBER_KEY = "crash_remember";

export function setRememberedCredentials(creds) {
  try { localStorage.setItem(REMEMBER_KEY, JSON.stringify(creds)); } catch { }
}

export function getRememberedCredentials() {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearRememberedCredentials() {
  localStorage.removeItem(REMEMBER_KEY);
}

api.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && !err.config?.__authProbe) {
      clearToken();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    if (
      err.code === "ECONNABORTED" &&
      err.config &&
      !err.config._retry &&
      (err.config.method || "get").toLowerCase() === "get"
    ) {
      err.config._retry = true;
      return api(err.config);
    }
    return Promise.reject(err);
  }
);

export function formatApiError(err) {
  const detail = err?.response?.data?.detail;
  if (detail == null) return err?.message || "Error inesperado";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .join(" ");
  }
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const superAdminAPI = {
  list: () => api.get("/auth/superadmins"),
  create: (email, password, name) =>
    api.post("/auth/superadmin", { email, password, name }),
  remove: (id) => api.delete(`/auth/superadmin/${id}`),
  audit: () => api.get("/admin/audit"),
};

// Gestión de versiones de la app (APK). Publicación y descarga pública.
export const versionsAPI = {
  list: () => api.get("/versions"),
  create: (payload) => api.post("/versions", payload),
  update: (id, payload) => api.put(`/versions/${id}`, payload),
  remove: (id) => api.delete(`/versions/${id}`),
  latest: (platform = "android") => api.get("/versions/latest", { params: { platform } }),
  uploadApk: (file, onProgress) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/versions/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 300000,
      onUploadProgress: onProgress,
    });
  },
};

// Centro de Ayudas, alertas de tokens y mapa de calor (superadmin).
export const adminAPI = {
  tokenAlerts: () => api.get("/admin/token-alerts"),
  heatmap: (params) => api.get("/admin/heatmap", { params }),
  supportList: () => api.get("/admin/support"),
  supportForward: (id) => api.post(`/admin/support/${id}/forward`),
  supportResolve: (id, note) => api.post(`/admin/support/${id}/resolve`, { note }),
  supportResetPassword: (id, targetEmail) =>
    api.post(`/admin/support/${id}/reset-password`, { target_email: targetEmail || undefined }),
  supportRevokeToken: (id, token) =>
    api.post(`/admin/support/${id}/revoke-token`, { token: token || undefined }),
};

// Configuración por empresa (webhooks, suscripción, reportes).
export const companyAPI = {
  createSupport: (type, message) => api.post("/companies/support", { type, message }),
  extendSubscription: (id, days = 30) =>
    api.post(`/companies/${id}/extend-subscription`, { days }),
  getWebhooks: (id) => api.get(`/companies/${id}/webhooks`),
  setWebhooks: (id, data) => api.put(`/companies/${id}/webhooks`, data),
  testWebhook: (id) => api.post(`/companies/${id}/webhooks/test`),
  setReportSchedule: (id, data) => api.put(`/companies/${id}/report-schedule`, data),
};

// Endpoints de monitorista (mapa de calor de su empresa).
export const monitorAPI = {
  heatmap: (params) => api.get("/monitor/heatmap", { params }),
};

// ── Analítica de visitas del sitio ──
const VISITOR_KEY = "crash_visitor_id";

export function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export const analyticsAPI = {
  track: (path) =>
    api.post("/analytics/track", {
      path,
      visitor_id: getVisitorId(),
      referrer: document.referrer || "",
    }).catch(() => {}),
  overview: (days = 30) => api.get("/analytics/overview", { params: { days } }),
};

// Geocercas de riesgo (superadmin).
export const geofencesAPI = {
  list: () => api.get("/geofences"),
  create: (data) => api.post("/geofences", data),
  update: (id, data) => api.put(`/geofences/${id}`, data),
  remove: (id) => api.delete(`/geofences/${id}`),
  stats: (days = 30) => api.get("/geofences/stats", { params: { days } }),
};
