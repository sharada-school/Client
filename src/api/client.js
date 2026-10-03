const SESSION_KEY = 'sharada_school_admin_session';
const SESSION_TTL_MS = 30 * 60 * 1000;

export const readSession = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.user || !parsed?.expiresAt || parsed.expiresAt <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const writeSession = (user) => {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user, expiresAt: Date.now() + SESSION_TTL_MS }));
};

export const clearSession = () => sessionStorage.removeItem(SESSION_KEY);

const getBaseApiUrl = () => {
  if (import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  // When running in browser under /web subpath, route API calls through /web
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/web')) {
    return '/web';
  }
  return '';
};

export const apiFetch = (url, options = {}, user = null) => {
  const base = getBaseApiUrl();
  let cleanUrl = url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (base && !url.startsWith(base)) {
      cleanUrl = `${base}${url.startsWith('/') ? '' : '/'}${url}`;
    }
  }
  const targetUrl = cleanUrl;

  return fetch(targetUrl, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {})
    }
  });
};
