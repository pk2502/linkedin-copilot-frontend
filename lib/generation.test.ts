import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installBrowserStubs, jsonResponse, sseResponse } from "@/lib/test-utils";
import { __resetTokenStateForTests, setTokens } from "@/lib/tokens";
import { GenerationError, generationErrorMessage, streamingService } from "@/lib/generation";

const STREAM_URL = "http://localhost:8001/api/generate/stream/connection-request/";
const REFRESH_URL = "http://localhost:8001/api/auth/refresh/";
const payload = { name: "Priya", company: "Acme", role: "EM" };

const okStream = () =>
  sseResponse(['data: {"chunk": "Hi "}\n\ndata: {"chu', 'nk": "Priya"}\n\n', "data: [DONE]\n\n"]);

let env: ReturnType<typeof installBrowserStubs>;
let fetchMock: ReturnType<typeof vi.fn>;
let redirects: string[];

beforeEach(() => {
  env = installBrowserStubs();
  redirects = [];
  Object.defineProperty(env.location, "href", {
    get: () => "https://li-copilot.vercel.app/dashboard",
    set: (value: string) => redirects.push(value),
  });
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  __resetTokenStateForTests();
  setTokens("access-1", "refresh-1");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function run() {
  const chunks: string[] = [];
  await streamingService.connectionRequest(payload, (chunk) => chunks.push(chunk));
  return chunks.join("");
}

const authHeader = (callIndex: number) => fetchMock.mock.calls[callIndex][1].headers.Authorization;

describe("streamingService", () => {
  it("streams chunks split across network reads", async () => {
    fetchMock.mockResolvedValue(okStream());

    await expect(run()).resolves.toBe("Hi Priya");
    expect(fetchMock.mock.calls[0][0]).toBe(STREAM_URL);
    expect(authHeader(0)).toBe("Bearer access-1");
  });

  it("refreshes an expired access token and retries once", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { detail: "Token is invalid or expired" }))
      .mockResolvedValueOnce(jsonResponse(200, { access: "access-2", refresh: "refresh-2" }))
      .mockResolvedValueOnce(okStream());

    await expect(run()).resolves.toBe("Hi Priya");

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([STREAM_URL, REFRESH_URL, STREAM_URL]);
    expect(authHeader(2)).toBe("Bearer access-2");
    expect(env.store.get("refresh_token")).toBe("refresh-2");
    expect(redirects).toEqual([]);
  });

  it("redirects to /login when the refresh token is also expired", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(jsonResponse(401, { detail: "Token is blacklisted" }));

    const error = await run().catch((e) => e);

    expect(error).toBeInstanceOf(GenerationError);
    expect(error.status).toBe(401);
    expect(generationErrorMessage(error)).toBeNull();
    expect(redirects).toEqual(["/login"]);
    expect(env.store.size).toBe(0);
  });

  it("does not loop when the retried request is rejected again", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(jsonResponse(200, { access: "access-2", refresh: "refresh-2" }))
      .mockResolvedValueOnce(jsonResponse(401, {}));

    const error = await run().catch((e) => e);

    expect(error.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(redirects).toEqual(["/login"]);
  });

  it("keeps the session when refresh fails for network reasons", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const error = await run().catch((e) => e);

    expect(generationErrorMessage(error)).toBe("Failed to generate. Try again.");
    expect(redirects).toEqual([]);
    expect(env.store.get("refresh_token")).toBe("refresh-1");
  });

  it("shares one refresh between concurrent streams", async () => {
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url === REFRESH_URL) return jsonResponse(200, { access: "access-2", refresh: "refresh-2" });
      const auth = (init.headers as Record<string, string>).Authorization;
      return auth === "Bearer access-1" ? jsonResponse(401, {}) : okStream();
    });

    await expect(Promise.all([run(), run()])).resolves.toEqual(["Hi Priya", "Hi Priya"]);
    expect(fetchMock.mock.calls.filter(([url]) => url === REFRESH_URL)).toHaveLength(1);
  });

  it("reports the daily limit on 429", async () => {
    fetchMock.mockResolvedValue(jsonResponse(429, { detail: "Request was throttled." }));

    const error = await run().catch((e) => e);

    expect(error.status).toBe(429);
    expect(generationErrorMessage(error)).toBe(
      "Daily limit reached (20 messages per day). Try again tomorrow."
    );
  });

  it("fails when the stream closes without DONE", async () => {
    fetchMock.mockResolvedValue(sseResponse(['data: {"chunk": "Hi "}\n\n']));
    const chunks: string[] = [];

    const error = await streamingService
      .connectionRequest(payload, (chunk) => chunks.push(chunk))
      .catch((e) => e);

    expect(chunks).toEqual(["Hi "]);
    expect(error).toBeInstanceOf(GenerationError);
    expect(error.status).toBe(0);
    expect(generationErrorMessage(error)).toBe("Failed to generate. Try again.");
  });

  it("reports a provider failure sent as an error event", async () => {
    fetchMock.mockResolvedValue(
      sseResponse(['data: {"chunk": "Hi "}\n\n', 'data: {"error": "AI service unavailable. Try again."}\n\n'])
    );

    const error = await run().catch((e) => e);

    expect(error).toBeInstanceOf(GenerationError);
    expect(error.status).toBe(502);
    expect(generationErrorMessage(error)).toBe("AI service is busy. Try again in a moment.");
  });

  it("maps validation and provider errors to clear messages", async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { name: ["This field may not be blank."] }));
    const invalid = await run().catch((e) => e);
    fetchMock.mockResolvedValue(jsonResponse(502, { error: "AI service unavailable. Try again." }));
    const unavailable = await run().catch((e) => e);

    expect(generationErrorMessage(invalid)).toBe("Check the fields and try again.");
    expect(generationErrorMessage(unavailable)).toBe("AI service is busy. Try again in a moment.");
  });

  it("shows the generic message for other failures", () => {
    expect(generationErrorMessage(new GenerationError(500, "x"))).toBe("Failed to generate. Try again.");
    expect(generationErrorMessage(new Error("boom"))).toBe("Failed to generate. Try again.");
  });
});
