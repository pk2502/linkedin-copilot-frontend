import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installBrowserStubs, jsonResponse } from "@/lib/test-utils";
import {
  SessionExpiredError,
  __resetTokenStateForTests,
  clearTokens,
  endSession,
  ensureSessionCookie,
  handleSessionExpired,
  refreshAccessToken,
  setTokens,
  startSession,
} from "@/lib/tokens";

let env: ReturnType<typeof installBrowserStubs>;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  env = installBrowserStubs();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  __resetTokenStateForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("token storage", () => {
  it("stores tokens and sets a presence-only session cookie", () => {
    setTokens("access-1", "refresh-1");

    expect(env.store.get("access_token")).toBe("access-1");
    expect(env.store.get("refresh_token")).toBe("refresh-1");
    expect(env.cookies.get("ac_session")).toBe("1");
    expect(document.cookie).not.toContain("access-1");
  });

  it("removes the legacy cookie that held the raw access token", () => {
    env.cookies.set("access_token", "old-raw-token");

    ensureSessionCookie();

    expect(env.cookies.has("access_token")).toBe(false);
    expect(env.cookies.get("ac_session")).toBe("1");
  });

  it("clears tokens and cookies", () => {
    setTokens("access-1", "refresh-1");

    clearTokens();

    expect(env.store.size).toBe(0);
    expect(env.cookies.size).toBe(0);
  });
});

describe("startSession", () => {
  it("drops a stale refresh token when the login response has none", () => {
    env.store.set("refresh_token", "token-from-an-old-backend");

    startSession("new-access", "");

    expect(env.store.get("access_token")).toBe("new-access");
    expect(env.store.has("refresh_token")).toBe(false);
    expect(env.cookies.get("ac_session")).toBe("1");
  });

  it("stores the refresh token when the login response includes one", () => {
    env.store.set("refresh_token", "old");

    startSession("new-access", "new-refresh");

    expect(env.store.get("refresh_token")).toBe("new-refresh");
  });
});

describe("refreshAccessToken", () => {
  it("rotates tokens on success", async () => {
    setTokens("old-access", "old-refresh");
    fetchMock.mockResolvedValue(jsonResponse(200, { access: "new-access", refresh: "new-refresh" }));

    await expect(refreshAccessToken()).resolves.toBe("new-access");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8001/api/auth/refresh/");
    expect(JSON.parse(init.body)).toEqual({ refresh: "old-refresh" });
    expect(env.store.get("access_token")).toBe("new-access");
    expect(env.store.get("refresh_token")).toBe("new-refresh");
  });

  it("shares one request between concurrent callers", async () => {
    setTokens("old-access", "old-refresh");
    let resolveFetch!: (response: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => (resolveFetch = resolve)));

    const results = Promise.all([refreshAccessToken(), refreshAccessToken(), refreshAccessToken()]);
    resolveFetch(jsonResponse(200, { access: "new-access", refresh: "new-refresh" }));

    await expect(results).resolves.toEqual(["new-access", "new-access", "new-access"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("starts a fresh request after the previous one settles", async () => {
    setTokens("a", "r1");
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { access: "a2", refresh: "r2" }))
      .mockResolvedValueOnce(jsonResponse(200, { access: "a3", refresh: "r3" }));

    await refreshAccessToken();
    await refreshAccessToken();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ refresh: "r2" });
  });

  it("reports an expired session when the refresh token is rejected", async () => {
    setTokens("a", "blacklisted");
    fetchMock.mockResolvedValue(jsonResponse(401, { detail: "Token is blacklisted" }));

    await expect(refreshAccessToken()).rejects.toBeInstanceOf(SessionExpiredError);
  });

  it("reports an expired session when no refresh token is stored", async () => {
    await expect(refreshAccessToken()).rejects.toBeInstanceOf(SessionExpiredError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not treat throttling or network failures as an expired session", async () => {
    setTokens("a", "r");
    fetchMock.mockResolvedValueOnce(jsonResponse(429, { detail: "throttled" }));
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const throttled = await refreshAccessToken().catch((e) => e);
    const offline = await refreshAccessToken().catch((e) => e);

    expect(throttled).not.toBeInstanceOf(SessionExpiredError);
    expect(offline).not.toBeInstanceOf(SessionExpiredError);
    expect(env.store.get("refresh_token")).toBe("r");
  });
});

describe("handleSessionExpired", () => {
  it("clears the session and redirects to /login only once", () => {
    setTokens("a", "r");
    const hrefs: string[] = [];
    Object.defineProperty(env.location, "href", {
      get: () => "https://li-copilot.vercel.app/dashboard",
      set: (value: string) => hrefs.push(value),
    });

    handleSessionExpired();
    handleSessionExpired();

    expect(env.store.size).toBe(0);
    expect(hrefs).toEqual(["/login"]);
  });
});

describe("endSession", () => {
  const LOGOUT_URL = "http://localhost:8001/api/auth/logout/";

  it("clears tokens immediately and revokes the refresh token", () => {
    setTokens("access-1", "refresh-1");
    fetchMock.mockResolvedValue(jsonResponse(200, {}));

    endSession();

    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("refresh_token")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(LOGOUT_URL);
    expect(JSON.parse(init.body)).toEqual({ refresh: "refresh-1" });
    expect(init.keepalive).toBe(true);
  });

  it("still signs out when the logout request fails", async () => {
    setTokens("access-1", "refresh-1");
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    expect(() => endSession()).not.toThrow();
    await Promise.resolve();

    expect(localStorage.getItem("refresh_token")).toBeNull();
  });

  it("skips the request when there is no refresh token", () => {
    setTokens("access-1");

    endSession();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
