/**
 * Hand-off of a dedicated session to the ConnectPilot browser extension.
 *
 * The extension injects a content script (connect.js) into /connect-extension
 * only. Page and script talk via window.postMessage restricted to this origin:
 *
 *   page → PING          script → READY        (extension is installed)
 *   page → TOKENS        script → CONNECTED    (tokens stored) or ERROR
 *
 * Tokens are minted by the backend for the extension alone, so the web app's
 * own refresh token is never shared.
 */
export const EXTENSION_MESSAGES = {
  PING: "CONNECTPILOT_EXTENSION_PING",
  READY: "CONNECTPILOT_EXTENSION_READY",
  TOKENS: "CONNECTPILOT_EXTENSION_TOKENS",
  CONNECTED: "CONNECTPILOT_EXTENSION_CONNECTED",
  ERROR: "CONNECTPILOT_EXTENSION_ERROR",
} as const;

export class ExtensionNotFoundError extends Error {
  constructor() {
    super("ConnectPilot extension not detected");
    this.name = "ExtensionNotFoundError";
  }
}

export class ExtensionConnectError extends Error {
  constructor(reason: string) {
    super(`Extension could not store the session: ${reason}`);
    this.name = "ExtensionConnectError";
  }
}

export interface ExtensionTokens {
  access: string;
  refresh: string;
}

type MessageWindow = Pick<Window, "postMessage" | "addEventListener" | "removeEventListener"> & {
  location: { origin: string };
};

/** Resolve with the first message of one of `types` posted by this window. */
export function waitForExtensionMessage(
  win: MessageWindow,
  types: string[],
  timeoutMs: number
): Promise<{ type: string; reason?: string } | null> {
  return new Promise((resolve) => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== win || event.origin !== win.location.origin) return;
      const data = event.data;
      if (data && typeof data.type === "string" && types.includes(data.type)) {
        cleanup();
        resolve(data);
      }
    };
    const timer = setTimeout(() => {
      cleanup();
      resolve(null);
    }, timeoutMs);
    const cleanup = () => {
      clearTimeout(timer);
      win.removeEventListener("message", onMessage as EventListener);
    };
    win.addEventListener("message", onMessage as EventListener);
  });
}

/** Resolves when the extension's content script answers, else throws ExtensionNotFoundError. */
export async function detectExtension(win: MessageWindow, timeoutMs = 2500): Promise<void> {
  const ready = waitForExtensionMessage(win, [EXTENSION_MESSAGES.READY], timeoutMs);
  win.postMessage({ type: EXTENSION_MESSAGES.PING }, win.location.origin);
  if (!(await ready)) throw new ExtensionNotFoundError();
}

/**
 * Detect the extension, mint extension tokens, and hand them over.
 * `fetchTokens` is only called once the extension is known to be listening.
 */
export async function connectExtension(
  win: MessageWindow,
  fetchTokens: () => Promise<ExtensionTokens>,
  { detectTimeoutMs = 2500, confirmTimeoutMs = 5000 } = {}
): Promise<void> {
  await detectExtension(win, detectTimeoutMs);

  const tokens = await fetchTokens();
  const reply = waitForExtensionMessage(
    win,
    [EXTENSION_MESSAGES.CONNECTED, EXTENSION_MESSAGES.ERROR],
    confirmTimeoutMs
  );
  win.postMessage(
    { type: EXTENSION_MESSAGES.TOKENS, access: tokens.access, refresh: tokens.refresh },
    win.location.origin
  );

  const result = await reply;
  if (!result) throw new ExtensionConnectError("no_response");
  if (result.type === EXTENSION_MESSAGES.ERROR) throw new ExtensionConnectError(result.reason ?? "unknown");
}
