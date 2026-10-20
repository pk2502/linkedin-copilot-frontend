/**
 * Sign in with LinkedIn (OpenID Connect), authorization code flow with a
 * redirect. LinkedIn has no popup mode, so we leave the page, come back to
 * /auth/linkedin/callback, check the state we stored, and hand the code to
 * the backend.
 */

export const LINKEDIN_CLIENT_ID = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID ?? "";
export const LINKEDIN_AUTHORIZE_URL = "https://www.linkedin.com/oauth/v2/authorization";
export const LINKEDIN_CALLBACK_PATH = "/auth/linkedin/callback";
const STORAGE_KEY = "linkedin_oauth";

export interface PendingLinkedInLogin {
  state: string;
  next: string;
}

export function linkedInEnabled(clientId = LINKEDIN_CLIENT_ID): boolean {
  return clientId.trim().length > 0;
}

export function callbackUrl(origin: string): string {
  return `${origin}${LINKEDIN_CALLBACK_PATH}`;
}

/** Unguessable value tying LinkedIn's redirect back to this browser tab. */
export function createState(random: (bytes: Uint8Array) => Uint8Array = (b) => crypto.getRandomValues(b)): string {
  return Array.from(random(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function authorizeUrl(state: string, redirectUri: string, clientId = LINKEDIN_CLIENT_ID): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "openid profile email",
  });
  return `${LINKEDIN_AUTHORIZE_URL}?${params.toString()}`;
}

export function savePending(pending: PendingLinkedInLogin, storage: Storage = sessionStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(pending));
}

/** The pending login, removed so a callback URL can only be used once. */
export function takePending(storage: Storage = sessionStorage): PendingLinkedInLogin | null {
  const raw = storage.getItem(STORAGE_KEY);
  storage.removeItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.state === "string" && typeof parsed?.next === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export type CallbackCheck = { ok: true; code: string } | { ok: false; message: string };

/** Validate LinkedIn's redirect parameters against the stored state. */
export function checkCallback(params: URLSearchParams, pending: PendingLinkedInLogin | null): CallbackCheck {
  if (params.get("error")) {
    return {
      ok: false,
      message:
        params.get("error") === "user_cancelled_login" || params.get("error") === "user_cancelled_authorize"
          ? "LinkedIn sign-in was cancelled."
          : "LinkedIn sign-in failed. Try again.",
    };
  }
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) return { ok: false, message: "LinkedIn sign-in failed. Try again." };
  if (!pending || pending.state !== state) {
    return { ok: false, message: "This sign-in link has expired. Start again from the sign-in page." };
  }
  return { ok: true, code };
}
