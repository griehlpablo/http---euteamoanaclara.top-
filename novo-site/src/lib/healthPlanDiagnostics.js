export const APP_CACHE_VERSION = 'diet-app-v9-fix-dieta-and-helena-sync';

export function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

export function getMonthDateRange(dateString) {
  const [year, month] = String(dateString || '').slice(0, 7).split('-').map(Number);
  if (!year || !month || month < 1 || month > 12) {
    const today = new Date();
    return getMonthDateRange(formatLocalDate(today));
  }
  return {
    startDate: formatLocalDate(new Date(year, month - 1, 1)),
    endDate: formatLocalDate(new Date(year, month, 0)),
  };
}

export function safeParseLocalStorage(key, fallback, onError) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === '') return fallback;
    return JSON.parse(raw);
  } catch (error) {
    const backupKey = `${key}_corrupted_backup`;
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) localStorage.setItem(backupKey, raw);
      localStorage.removeItem(key);
    } catch {
      // Ignore secondary storage failures; the caller still receives fallback.
    }
    onError?.({ key, backupKey, message: error.message, stack: error.stack });
    return fallback;
  }
}

function isDomOrReactValue(value) {
  if (!value || typeof value !== 'object') return false;
  if (value.nodeType) return true;
  if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) return true;
  if (typeof Event !== 'undefined' && value instanceof Event) return true;
  if ('target' in value && 'currentTarget' in value && 'preventDefault' in value) return true;
  return Object.keys(value).some((key) => key.startsWith('__react') || key === '_reactInternals');
}

export function sanitizeLogForSave(value, seen = new WeakSet()) {
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') return undefined;
  if (value === null || typeof value !== 'object') return value;
  if (isDomOrReactValue(value)) return undefined;
  if (seen.has(value)) return undefined;
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeLogForSave(item, seen)).filter((item) => item !== undefined);
  const output = {};
  Object.entries(value).forEach(([key, item]) => {
    if (['event', 'target', 'currentTarget', 'nativeEvent', 'view', 'ownerDocument', 'ref'].includes(key) || key.startsWith('__react')) return;
    const clean = sanitizeLogForSave(item, seen);
    if (clean !== undefined) output[key] = clean;
  });
  return output;
}

export function assertSerializable(value) {
  JSON.stringify(value);
  return true;
}

export function supabaseErrorDetails(error) {
  if (!error) return null;
  return {
    message: error.message || String(error),
    details: error.details || '',
    hint: error.hint || '',
    code: error.code || '',
    status: error.status || '',
    stack: error.stack || '',
  };
}

export async function clearAppCachesAndReload(pathname = window.location.pathname) {
  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.includes('diet-app') || name.includes('workbox')).map((name) => caches.delete(name)));
  }
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister().catch(() => undefined)));
  }
  window.location.href = `${pathname}?v=${Date.now()}`;
}

export function buildDiagnosticText(info) {
  return JSON.stringify({
    appVersion: APP_CACHE_VERSION,
    route: window.location.pathname,
    href: window.location.href,
    userAgent: navigator.userAgent,
    serviceWorker: Boolean(navigator.serviceWorker?.controller),
    ...info,
  }, null, 2);
}
