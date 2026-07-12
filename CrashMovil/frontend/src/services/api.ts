const API_BASE =
  process.env.EXPO_PUBLIC_BACKEND_URL || 'https://crashmovil-backend.onrender.com';
const REQUEST_TIMEOUT = 30000;

type FetchOptions = {
  method?: string;
  body?: any;
  token?: string | null;
};

async function apiRequest(path: string, options: FetchOptions = {}, retries = 1) {
  const { method = 'GET', body, token } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const config: RequestInit = { method, headers, signal: controller.signal };
    if (body) {
      config.body = JSON.stringify(body);
    }

    const res = await fetch(`${API_BASE}/api${path}`, config);
    let data: any = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => null);
    } else {
      await res.text().catch(() => null);
    }

    if (!res.ok) {
      let message = `Error ${res.status} en la solicitud`;
      if (data) {
        if (typeof data.detail === 'string') message = data.detail;
        else if (Array.isArray(data.detail)) {
          message = data.detail
            .map((e: any) => (e && e.msg ? e.msg : null))
            .filter(Boolean)
            .join(' ');
        } else if (data.message) message = data.message;
      }
      throw new Error(message);
    }
    return data;
  } catch (e: any) {
    const isNetworkError = e?.name === 'AbortError' || e instanceof TypeError;
    if (retries > 0 && isNetworkError) {
      return apiRequest(path, options, retries - 1);
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const authAPI = {
  register: (name: string, email: string, password: string) =>
    apiRequest('/auth/register', { method: 'POST', body: { name, email, password } }),
  login: (email: string, password: string) =>
    apiRequest('/auth/login', { method: 'POST', body: { email, password } }),
  me: (token: string) =>
    apiRequest('/auth/me', { token }),
  refresh: (refreshToken: string) =>
    apiRequest('/auth/refresh', { method: 'POST', body: { refresh_token: refreshToken } }),
  linkCompany: (token: string, companyToken: string) =>
    apiRequest('/auth/link-company', { method: 'POST', body: { token: companyToken }, token }),
  driverCompany: (token: string) =>
    apiRequest('/auth/driver-company', { token }),
};

export const profileAPI = {
  get: (token: string) => apiRequest('/riders/profile', { token }),
  update: (token: string, data: any) => apiRequest('/riders/profile', { method: 'PUT', body: data, token }),
};

export const contactsAPI = {
  list: (token: string) => apiRequest('/riders/contacts', { token }),
  add: (token: string, data: { name: string; phone: string; relationship?: string }) =>
    apiRequest('/riders/contacts', { method: 'POST', body: data, token }),
  delete: (token: string, contactId: string) => apiRequest(`/riders/contacts/${contactId}`, { method: 'DELETE', token }),
};

export const impactsAPI = {
  list: (token: string) => apiRequest('/impacts', { token }),
  get: (token: string, id: string) => apiRequest(`/impacts/${id}`, { token }),
  create: (token: string, data: any) => apiRequest('/impacts', { method: 'POST', body: data, token }),
};

export const settingsAPI = {
  get: (token: string) => apiRequest('/riders/settings', { token }),
  update: (token: string, data: any) => apiRequest('/riders/settings', { method: 'PUT', body: data, token }),
};

export const telemetryAPI = {
  send: (token: string, data: any) => apiRequest('/telemetry', { method: 'POST', body: data, token }),
  batch: (token: string, samples: any[]) =>
    apiRequest('/telemetry/batch', { method: 'POST', body: { samples }, token }),
  location: (token: string, data: { latitude: number; longitude: number; gps_accuracy_m?: number | null; helmet_connected?: boolean }) =>
    apiRequest('/telemetry/location', { method: 'POST', body: data, token }),
  history: (token: string, impactId: string, beforeMinutes = 5, afterMinutes = 5) =>
    apiRequest(`/telemetry/history?impact_id=${impactId}&before_minutes=${beforeMinutes}&after_minutes=${afterMinutes}`, { token }),
};

export const geofencesAPI = {
  active: (token: string) => apiRequest('/geofences/active', { token }),
};

export const locationAPI = {
  send: (token: string, data: { latitude: number; longitude: number; gps_accuracy_m?: number | null; helmet_connected?: boolean }) =>
    apiRequest('/telemetry/location', { method: 'POST', body: data, token }),
  linkPermissionLocation: (token: string, data: { latitude: number; longitude: number; accuracy?: number | null }) =>
    apiRequest('/riders/permission-location', { method: 'POST', body: data, token }),
};

export const falseAlarmAPI = {
  create: (token: string, data: any) => apiRequest('/impacts/false-alarm', { method: 'POST', body: data, token }),
};

export const versionsAPI = {
  latest: (platform = 'android') => apiRequest(`/versions/latest?platform=${platform}`),
};
