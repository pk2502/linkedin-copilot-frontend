import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import api from "@/lib/axios";
import { mergeParsedProfile, parseErrorMessage, profileService, type ProfileFields } from "@/lib/profile";
import { installBrowserStubs } from "@/lib/test-utils";
import { __resetTokenStateForTests, setTokens } from "@/lib/tokens";

const EMPTY: ProfileFields = {
  headline: "",
  summary: "",
  skills: "",
  target_roles: "",
  experience: "",
  writing_sample: "",
};

const PARSED = {
  headline: "Senior Frontend Engineer at Acme",
  summary: "I build accessible React apps.",
  skills: "React, TypeScript",
  target_roles: "",
  experience: "Senior Frontend Engineer, Acme (2021-present)",
};

let configs: InternalAxiosRequestConfig[];

const ok: AxiosAdapter = async (config) => {
  configs.push(config);
  return { data: PARSED, status: 200, statusText: "OK", headers: {}, config };
};

beforeEach(() => {
  installBrowserStubs();
  __resetTokenStateForTests();
  setTokens("access-1", "refresh-1");
  configs = [];
});

afterEach(() => {
  api.defaults.adapter = undefined;
});

describe("profileService.parse", () => {
  it("posts pasted text as JSON", async () => {
    api.defaults.adapter = ok;

    const result = await profileService.parse({ text: "My resume text" });

    expect(result).toEqual(PARSED);
    expect(configs[0].url).toBe("/api/profile/parse/");
    expect(JSON.parse(configs[0].data)).toEqual({ text: "My resume text" });
  });

  it("uploads a PDF as multipart form data, not JSON", async () => {
    api.defaults.adapter = ok;
    const file = new File([new Uint8Array([37, 80, 68, 70])], "cv.pdf", { type: "application/pdf" });

    await profileService.parse({ file });

    expect(configs[0].data).toBeInstanceOf(FormData);
    expect((configs[0].data as FormData).get("file")).toBeInstanceOf(File);
  });
});

describe("mergeParsedProfile", () => {
  it("fills empty fields and leaves the writing sample alone", () => {
    const { form, changed, kept } = mergeParsedProfile({ ...EMPTY, writing_sample: "Hi!" }, PARSED, false);

    expect(form).toEqual({ ...PARSED, writing_sample: "Hi!" });
    expect(changed).toEqual(["headline", "summary", "skills", "experience"]);
    expect(kept).toEqual([]);
  });

  it("keeps fields the user wrote unless replace is on", () => {
    const start = { ...EMPTY, headline: "My own headline" };

    const keep = mergeParsedProfile(start, PARSED, false);
    expect(keep.form.headline).toBe("My own headline");
    expect(keep.kept).toEqual(["headline"]);

    const swap = mergeParsedProfile(start, PARSED, true);
    expect(swap.form.headline).toBe(PARSED.headline);
    expect(swap.changed).toContain("headline");
  });

  it("trims suggestions to the field limits", () => {
    const { form } = mergeParsedProfile(EMPTY, { headline: "H".repeat(400) }, false);
    expect(form.headline).toHaveLength(150);
  });
});

describe("parseErrorMessage", () => {
  function errorWith(status: number, data: unknown = {}) {
    const config = { headers: {} } as InternalAxiosRequestConfig;
    return new AxiosError("failed", "ERR", config, null, { data, status, statusText: "", headers: {}, config });
  }

  it("shows the backend's reason for a bad file or text", () => {
    expect(parseErrorMessage(errorWith(400, { file: ["Upload a PDF file."] }))).toBe("Upload a PDF file.");
    expect(parseErrorMessage(errorWith(400, { text: ["Paste your resume."] }))).toBe("Paste your resume.");
  });

  it("falls back to the shared messages", () => {
    expect(parseErrorMessage(errorWith(429))).toBe("Daily limit reached. Try again tomorrow.");
  });
});
