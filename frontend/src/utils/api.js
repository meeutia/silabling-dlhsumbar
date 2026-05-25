import { clearAuthSession, isTokenExpired, saveAuthSession } from './authStorage';
import { addSnakeCaseAliasesDeep } from './caseTransform';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

let accessToken = '';
let refreshPromise = null;

export function setAccessToken(token = '') {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = '';
}

export async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      let data = null;
      try {
        data = addSnakeCaseAliasesDeep(await res.json());
      } catch {
        data = null;
      }

      if (!res.ok || !data?.success || !data?.data?.token) {
        clearAccessToken();
        if (res.status === 401 || res.status === 403) {
          clearAuthSession();
        }
        return null;
      }

      setAccessToken(data.data.token);
      if (data.data.user) {
        saveAuthSession(data.data.user);
      }

      return {
        token: data.data.token,
        user: data.data.user || null
      };
    } catch {
      clearAccessToken();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch(path, options = {}, config = {}) {
  const { auth = false, retryOnUnauthorized = true } = config;
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});

  const makeRequest = () => fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  if (auth) {
    let token = getAccessToken();

    if (!token || isTokenExpired(token)) {
      const refreshed = await refreshAccessToken();
      token = refreshed?.token || '';
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  let response = await makeRequest();

  if (auth && retryOnUnauthorized && response.status === 401) {
    const refreshed = await refreshAccessToken();
    const token = refreshed?.token || '';

    if (!token) {
      return response;
    }

    headers.set('Authorization', `Bearer ${token}`);
    response = await makeRequest();
  }

  return response;
}