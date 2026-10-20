import { beforeEach, describe, expect, it } from "vitest";
import {
  authorizeUrl,
  callbackUrl,
  checkCallback,
  createState,
  linkedInEnabled,
  savePending,
  takePending,
} from "@/lib/linkedin";

class MemoryStorage {
  data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

let storage: Storage;
beforeEach(() => {
  storage = new MemoryStorage() as unknown as Storage;
});

describe("linkedin sign-in", () => {
  it("is off without a client ID", () => {
    expect(linkedInEnabled("")).toBe(false);
    expect(linkedInEnabled("abc")).toBe(true);
  });

  it("builds the OpenID Connect authorize URL", () => {
    const url = new URL(authorizeUrl("s1", callbackUrl("https://connect-pilot.vercel.app"), "client-1"));
    expect(url.origin + url.pathname).toBe("https://www.linkedin.com/oauth/v2/authorization");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      response_type: "code",
      client_id: "client-1",
      redirect_uri: "https://connect-pilot.vercel.app/auth/linkedin/callback",
      state: "s1",
      scope: "openid profile email",
    });
  });

  it("creates a 32-character hex state", () => {
    expect(createState()).toMatch(/^[0-9a-f]{32}$/);
    expect(createState()).not.toBe(createState());
  });

  it("stores the pending login once", () => {
    savePending({ state: "s1", next: "/dashboard/tracker" }, storage);
    expect(takePending(storage)).toEqual({ state: "s1", next: "/dashboard/tracker" });
    expect(takePending(storage)).toBeNull();
  });

  it("accepts the callback only with the stored state", () => {
    const pending = { state: "s1", next: "/dashboard" };
    expect(checkCallback(new URLSearchParams("code=c1&state=s1"), pending)).toEqual({ ok: true, code: "c1" });
    expect(checkCallback(new URLSearchParams("code=c1&state=forged"), pending).ok).toBe(false);
    expect(checkCallback(new URLSearchParams("code=c1&state=s1"), null).ok).toBe(false);
    expect(checkCallback(new URLSearchParams("state=s1"), pending).ok).toBe(false);
  });

  it("explains a cancelled sign-in", () => {
    const result = checkCallback(new URLSearchParams("error=user_cancelled_login&state=s1"), { state: "s1", next: "/" });
    expect(result).toEqual({ ok: false, message: "LinkedIn sign-in was cancelled." });
  });
});
