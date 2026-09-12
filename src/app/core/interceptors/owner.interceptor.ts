import { HttpInterceptorFn } from '@angular/common/http';

const STORAGE_KEY = 'lx-owner-key';
const HEADER = 'X-Looxdex-Owner';

/**
 * Stable per-device id, generated once and kept in localStorage.
 *
 * The API uses it to scope the closet, suitcases and saved looks, so two people
 * on the site no longer share one global state. When real accounts land this is
 * what gets linked to the user record, so nothing they saved is lost.
 */
function resolveOwnerKey(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const generated =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID().replace(/-/g, '')
        : Math.random().toString(36).slice(2) + Date.now().toString(36);

    localStorage.setItem(STORAGE_KEY, generated);
    return generated;
  } catch {
    // Private browsing: fall back to the shared demo content for this session.
    return 'demo';
  }
}

export const ownerInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ setHeaders: { [HEADER]: resolveOwnerKey() } }));
