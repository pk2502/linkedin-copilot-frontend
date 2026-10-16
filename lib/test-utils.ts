import { vi } from "vitest";

/**
 * Minimal browser globals for the token and streaming modules, so tests can
 * run in Node without a DOM library.
 */
export function installBrowserStubs() {
  const store = new Map<string, string>();
  const cookies = new Map<string, string>();

  const localStorageStub = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };

  const documentStub = {
    get cookie() {
      return [...cookies].map(([name, value]) => `${name}=${value}`).join("; ");
    },
    set cookie(raw: string) {
      const [pair, ...attributes] = raw.split(";").map((part) => part.trim());
      const [name, value] = pair.split("=");
      const expired = attributes.some((attr) => attr.toLowerCase() === "max-age=0");
      if (expired) cookies.delete(name);
      else cookies.set(name, value);
    },
  };

  const location = { protocol: "https:", href: "https://li-copilot.vercel.app/dashboard" };

  vi.stubGlobal("window", { location });
  vi.stubGlobal("localStorage", localStorageStub);
  vi.stubGlobal("document", documentStub);

  return { store, cookies, location };
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** A streaming Response whose body yields the given text pieces in order. */
export function sseResponse(pieces: string[], status = 200): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const piece of pieces) controller.enqueue(encoder.encode(piece));
      controller.close();
    },
  });
  return new Response(body, { status, headers: { "Content-Type": "text/event-stream" } });
}
