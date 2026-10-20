import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import api from "@/lib/axios";
import { draftErrorMessage, draftService } from "@/lib/drafts";
import { profileService } from "@/lib/profile";
import { installBrowserStubs } from "@/lib/test-utils";
import { __resetTokenStateForTests, setTokens } from "@/lib/tokens";

let requests: { method?: string; url?: string; body: unknown }[];

function adapter(status: number, data: unknown): AxiosAdapter {
  return async (config: InternalAxiosRequestConfig) => {
    requests.push({ method: config.method, url: config.url, body: config.data ? JSON.parse(config.data) : undefined });
    const response = { data, status, statusText: String(status), headers: {}, config };
    if (status >= 400) throw new AxiosError("failed", "ERR_BAD_RESPONSE", config, null, response);
    return response;
  };
}

function errorWith(status: number, data: unknown = {}) {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  return new AxiosError("failed", "ERR", config, null, { data, status, statusText: "", headers: {}, config });
}

beforeEach(() => {
  installBrowserStubs();
  __resetTokenStateForTests();
  setTokens("access-1", "refresh-1");
  requests = [];
});

afterEach(() => {
  api.defaults.adapter = undefined;
});

describe("draftService", () => {
  it("passes an optional job description through for referrals", async () => {
    api.defaults.adapter = adapter(201, { id: 8, variants: ["a", "b", "c"] });

    await draftService.create("referral_request", { name: "Rahul", job_description: "7+ years React" }, "friendly");

    expect(requests[0].body).toEqual({
      type: "referral_request",
      tone: "friendly",
      name: "Rahul",
      job_description: "7+ years React",
    });
  });

  it("posts the type, tone and fields and returns the variants", async () => {
    api.defaults.adapter = adapter(201, { id: 7, variants: ["a", "b", "c"] });

    const result = await draftService.create("connection_request", { name: "Priya" }, "concise");

    expect(result).toEqual({ id: 7, variants: ["a", "b", "c"] });
    expect(requests).toEqual([
      { method: "post", url: "/api/drafts/", body: { type: "connection_request", tone: "concise", name: "Priya" } },
    ]);
  });

  it("tweaks one variant of a draft", async () => {
    api.defaults.adapter = adapter(201, { id: 8, text: "Shorter." });

    const result = await draftService.tweak(7, 2, "shorter");

    expect(result.text).toBe("Shorter.");
    expect(requests[0]).toEqual({
      method: "post",
      url: "/api/drafts/7/tweak/",
      body: { variant: 2, instruction: "shorter" },
    });
  });
});

describe("profileService", () => {
  it("loads and saves the profile", async () => {
    api.defaults.adapter = adapter(200, { headline: "Lead", completeness: 15 });

    await profileService.get();
    await profileService.save({
      headline: "Lead",
      summary: "",
      skills: "",
      target_roles: "",
      experience: "",
      writing_sample: "",
    });

    expect(requests.map((r) => `${r.method} ${r.url}`)).toEqual(["get /api/profile/", "put /api/profile/"]);
    expect(requests[1].body).toMatchObject({ headline: "Lead" });
  });
});

describe("draftErrorMessage", () => {
  it("maps statuses to clear messages", () => {
    expect(draftErrorMessage(errorWith(429))).toBe("Daily limit reached. Try again tomorrow.");
    expect(draftErrorMessage(errorWith(502))).toBe("AI service is busy. Try again in a moment.");
    expect(draftErrorMessage(errorWith(400, { name: ["required"] }))).toBe("Check the fields and try again.");
    expect(draftErrorMessage(errorWith(500))).toBe("Something went wrong. Try again.");
  });

  it("shows the backend's hint when a background is missing", () => {
    const error = errorWith(400, { your_background: ["Add your background here or fill in your profile first."] });

    expect(draftErrorMessage(error)).toBe("Add your background here or fill in your profile first.");
  });

  it("stays silent on 401 because the session handler redirects", () => {
    expect(draftErrorMessage(errorWith(401))).toBeNull();
  });

  it("reports network failures", () => {
    const config = { headers: {} } as InternalAxiosRequestConfig;
    expect(draftErrorMessage(new AxiosError("Network Error", "ERR_NETWORK", config))).toBe(
      "Network error. Check your connection."
    );
    expect(draftErrorMessage(new Error("boom"))).toBe("Something went wrong. Try again.");
  });
});
