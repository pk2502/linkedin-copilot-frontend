import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/axios";
import { installBrowserStubs, jsonResponse } from "@/lib/test-utils";
import { __resetTokenStateForTests, setTokens } from "@/lib/tokens";

let env: ReturnType<typeof installBrowserStubs>;
let fetchMock: ReturnType<typeof vi.fn>;
let redirects: string[];
let seenAuth: string[];

/** Fake transport: 200 only for the current access token, 401 otherwise. */
function adapterAccepting(validToken: () => string): AxiosAdapter {
  return async (config: InternalAxiosRequestConfig) => {
    const auth = String(config.headers.Authorization ?? "");
    seenAuth.push(`${config.url} ${auth}`);
    const response = { data: { ok: true }, status: 200, statusText: "OK", headers: {}, config };
    if (config.url?.includes("/api/auth/login/")) {
      response.status = 401;
    } else if (auth !== `Bearer ${validToken()}`) {
      response.status = 401;
    }
    if (response.status === 401) {
      throw new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, null, {
        ...response,
        statusText: "Unauthorized",
      });
    }
    return response;
  };
}

beforeEach(() => {
  env = installBrowserStubs();
  redirects = [];
  seenAuth = [];
  Object.defineProperty(env.location, "href", {
    get: () => "https://li-copilot.vercel.app/dashboard",
    set: (value: string) => redirects.push(value),
  });
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  __resetTokenStateForTests();
  setTokens("expired-access", "refresh-1");
});

afterEach(() => {
  vi.unstubAllGlobals();
  api.defaults.adapter = undefined;
});

describe("axios 401 interceptor", () => {
  it("refreshes once for concurrent 401s and retries every request", async () => {
    api.defaults.adapter = adapterAccepting(() => "access-2");
    fetchMock.mockResolvedValue(jsonResponse(200, { access: "access-2", refresh: "refresh-2" }));

    const results = await Promise.all([
      api.get("/api/auth/me/"),
      api.get("/api/history/"),
      api.get("/api/history/", { params: { search: "x" } }),
    ]);

    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(redirects).toEqual([]);
    expect(env.store.get("refresh_token")).toBe("refresh-2");
  });

  it("redirects to /login once when the refresh token is rejected", async () => {
    api.defaults.adapter = adapterAccepting(() => "never-valid");
    fetchMock.mockResolvedValue(jsonResponse(401, { detail: "Token is blacklisted" }));

    const outcomes = await Promise.allSettled([api.get("/api/auth/me/"), api.get("/api/history/")]);

    expect(outcomes.every((o) => o.status === "rejected")).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(redirects).toEqual(["/login"]);
    expect(env.store.size).toBe(0);
  });

  it("does not retry a request more than once", async () => {
    api.defaults.adapter = adapterAccepting(() => "never-valid");
    fetchMock.mockResolvedValue(jsonResponse(200, { access: "access-2", refresh: "refresh-2" }));

    await expect(api.get("/api/history/")).rejects.toBeInstanceOf(AxiosError);

    expect(seenAuth).toEqual([
      "/api/history/ Bearer expired-access",
      "/api/history/ Bearer access-2",
    ]);
  });

  it("does not refresh or redirect on a failed login", async () => {
    api.defaults.adapter = adapterAccepting(() => "anything");

    await expect(api.post("/api/auth/login/", { username: "a", password: "wrong" })).rejects.toBeInstanceOf(
      AxiosError
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(redirects).toEqual([]);
  });
});
