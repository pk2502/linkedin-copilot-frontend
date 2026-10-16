/**
 * Token storage and refresh shared by the axios client and the streaming
 * fetch client.
 *
 * The backend rotates refresh tokens and blacklists the previous one
 * (ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION), so two concurrent
 * refreshes with the same token would log the user out. All callers therefore
 * share a single in-flight refresh.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

/** Presence-only cookie read by middleware.ts; it never contains a token. */
export const SESSION_COOKIE = "ac_session";
/** Cookie that used to hold the raw access token; cleared on sight. */
export const LEGACY_TOKEN_COOKIE = "access_token";
/** Matches the backend REFRESH_TOKEN_LIFETIME (7 days). */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired");
    this.name = "SessionExpiredError";
  }
}

const isBrowser = () => typeof window !== "undefined";

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

export function getAccessToken(): string | null {
  return isBrowser() ? localStorage.getItem(ACCESS_KEY) : null;
}

export function getRefreshToken(): string | null {
  return isBrowser() ? localStorage.getItem(REFRESH_KEY) : null;
}

/** Mark the browser as signed in for middleware and drop the legacy token cookie. */
export function ensureSessionCookie() {
  if (!isBrowser()) return;
  writeCookie(SESSION_COOKIE, "1", SESSION_MAX_AGE_SECONDS);
  writeCookie(LEGACY_TOKEN_COOKIE, "", 0);
}

export function setTokens(access: string, refresh?: string) {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  ensureSessionCookie();
}

/**
 * Store the tokens from a fresh sign-in. Unlike setTokens (used for rotation),
 * a missing refresh token removes any stored one, so a token left over from an
 * earlier session or another backend is never sent to /api/auth/refresh/.
 */
export function startSession(access: string, refresh?: string | null) {
  if (!refresh) localStorage.removeItem(REFRESH_KEY);
  setTokens(access, refresh ?? undefined);
}

export function clearTokens() {
  if (!isBrowser()) return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  writeCookie(SESSION_COOKIE, "", 0);
  writeCookie(LEGACY_TOKEN_COOKIE, "", 0);
}

let refreshInFlight: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new SessionExpiredError();

  // Network failures propagate as-is: a flaky connection is not a logout.
  const response = await fetch(`${API_BASE}/api/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (response.status === 400 || response.status === 401) throw new SessionExpiredError();
  if (!response.ok) throw new Error(`Token refresh failed with status ${response.status}`);

  const data: { access: string; refresh?: string } = await response.json();
  setTokens(data.access, data.refresh);
  return data.access;
}

/**
 * Exchange the refresh token for a new access token. Concurrent callers share
 * one request. Rejects with SessionExpiredError when the user must sign in again.
 */
export function refreshAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

let redirecting = false;

/** Clear the session and send the user to /login (once, however many callers). */
export function handleSessionExpired() {
  clearTokens();
  if (!isBrowser() || redirecting) return;
  redirecting = true;
  // Deliberate full page load: it resets in-memory client state after the
  // session ends, and this module runs outside React (no useRouter here).
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = "/login";
}

/** Test-only: reset module state between tests. */
export function __resetTokenStateForTests() {
  refreshInFlight = null;
  redirecting = false;
}
