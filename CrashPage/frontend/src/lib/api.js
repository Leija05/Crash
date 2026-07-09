import axios from "axios";

export const API_BASE = process.env.REACT_APP_BACKEND_URL;
export const API = `${API_BASE}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: false,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("crash_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && !err.config?.__authProbe) {
      localStorage.removeItem("crash_token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    if (err.code === "ECONNABORTED" && err.config && !err.config._retry) {
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
