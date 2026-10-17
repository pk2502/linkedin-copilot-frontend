import { describe, expect, it, vi } from "vitest";
import {
  EXTENSION_MESSAGES as M,
  ExtensionConnectError,
  ExtensionNotFoundError,
  connectExtension,
  detectExtension,
} from "@/lib/extension-connect";

const ORIGIN = "https://li-copilot.vercel.app";

type Listener = (event: MessageEvent) => void;

/**
 * Fake page window. `extension` simulates the content script: it receives what
 * the page posts and may answer via `reply`.
 */
function fakeWindow(
  extension?: (data: { type: string; access?: string; refresh?: string }, reply: (d: object) => void) => void
) {
  const listeners = new Set<Listener>();
  const posted: { data: unknown; targetOrigin: string }[] = [];
  const win = {
    location: { origin: ORIGIN },
    addEventListener: (_type: string, fn: Listener) => listeners.add(fn),
    removeEventListener: (_type: string, fn: Listener) => listeners.delete(fn),
    postMessage: (data: { type: string }, targetOrigin: string) => {
      posted.push({ data, targetOrigin });
      queueMicrotask(() => extension?.(data, (reply) => emit(reply)));
    },
  };
  const emit = (data: object, source: unknown = win, origin = ORIGIN) => {
    for (const fn of [...listeners]) fn({ data, source, origin } as MessageEvent);
  };
  return { win: win as unknown as Window, posted, emit, listeners };
}

const respondingExtension = (data: { type: string }, reply: (d: object) => void) => {
  if (data.type === M.PING) reply({ type: M.READY });
  if (data.type === M.TOKENS) reply({ type: M.CONNECTED });
};

describe("detectExtension", () => {
  it("resolves when the content script answers the ping", async () => {
    const { win, posted } = fakeWindow(respondingExtension);

    await expect(detectExtension(win, 200)).resolves.toBeUndefined();
    expect(posted[0]).toEqual({ data: { type: M.PING }, targetOrigin: ORIGIN });
  });

  it("throws ExtensionNotFoundError when nothing answers", async () => {
    const { win } = fakeWindow();

    await expect(detectExtension(win, 30)).rejects.toBeInstanceOf(ExtensionNotFoundError);
  });

  it("ignores READY messages from another origin or frame", async () => {
    const { win, emit } = fakeWindow();
    const pending = detectExtension(win, 50);

    emit({ type: M.READY }, win, "https://evil.example");
    emit({ type: M.READY }, { frame: true });

    await expect(pending).rejects.toBeInstanceOf(ExtensionNotFoundError);
  });

  it("removes its message listener afterwards", async () => {
    const { win, listeners } = fakeWindow(respondingExtension);

    await detectExtension(win, 200);

    expect(listeners.size).toBe(0);
  });
});

describe("connectExtension", () => {
  it("mints tokens only after detection and hands them over to this origin", async () => {
    const received: object[] = [];
    const { win, posted } = fakeWindow((data, reply) => {
      received.push(data);
      respondingExtension(data, reply);
    });
    const fetchTokens = vi.fn().mockResolvedValue({ access: "a.b.c", refresh: "d.e.f" });

    await connectExtension(win, fetchTokens, { detectTimeoutMs: 200, confirmTimeoutMs: 200 });

    expect(fetchTokens).toHaveBeenCalledTimes(1);
    expect(received).toEqual([{ type: M.PING }, { type: M.TOKENS, access: "a.b.c", refresh: "d.e.f" }]);
    expect(posted.every((p) => p.targetOrigin === ORIGIN)).toBe(true);
  });

  it("does not mint tokens when the extension is missing", async () => {
    const { win } = fakeWindow();
    const fetchTokens = vi.fn();

    await expect(connectExtension(win, fetchTokens, { detectTimeoutMs: 30 })).rejects.toBeInstanceOf(
      ExtensionNotFoundError
    );
    expect(fetchTokens).not.toHaveBeenCalled();
  });

  it("reports an error the content script sends back", async () => {
    const { win } = fakeWindow((data, reply) => {
      if (data.type === M.PING) reply({ type: M.READY });
      if (data.type === M.TOKENS) reply({ type: M.ERROR, reason: "storage_failed" });
    });

    const error = await connectExtension(win, async () => ({ access: "a.b.c", refresh: "d.e.f" }), {
      detectTimeoutMs: 200,
      confirmTimeoutMs: 200,
    }).catch((e) => e);

    expect(error).toBeInstanceOf(ExtensionConnectError);
    expect(error.message).toContain("storage_failed");
  });

  it("fails when the extension never confirms", async () => {
    const { win } = fakeWindow((data, reply) => {
      if (data.type === M.PING) reply({ type: M.READY });
    });

    await expect(
      connectExtension(win, async () => ({ access: "a.b.c", refresh: "d.e.f" }), {
        detectTimeoutMs: 200,
        confirmTimeoutMs: 30,
      })
    ).rejects.toBeInstanceOf(ExtensionConnectError);
  });

  it("propagates token minting failures", async () => {
    const { win } = fakeWindow(respondingExtension);

    await expect(
      connectExtension(win, async () => Promise.reject(new Error("401")), { detectTimeoutMs: 200 })
    ).rejects.toThrow("401");
  });
});
