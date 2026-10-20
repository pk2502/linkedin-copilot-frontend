import { isAxiosError } from "axios";
import api from "@/lib/axios";
import { draftErrorMessage } from "@/lib/drafts";

export interface Profile {
  headline: string;
  summary: string;
  skills: string;
  target_roles: string;
  experience: string;
  writing_sample: string;
  completeness: number;
  updated_at: string;
}

export type ProfileFields = Omit<Profile, "completeness" | "updated_at">;

export const PROFILE_LIMITS: Record<keyof ProfileFields, number> = {
  headline: 150,
  summary: 1500,
  skills: 500,
  target_roles: 300,
  experience: 4000,
  writing_sample: 1500,
};

/** Fields the resume import can suggest (never the writing sample). */
export type ParsedProfile = Pick<ProfileFields, "headline" | "summary" | "skills" | "target_roles" | "experience">;

export const PARSED_FIELDS: (keyof ParsedProfile)[] = ["headline", "summary", "skills", "target_roles", "experience"];

export const RESUME_PDF_MAX_BYTES = 2 * 1024 * 1024;

/**
 * Apply suggested fields to the form. Empty form fields are always filled;
 * fields the user already wrote are only replaced when `replace` is true.
 * Returns the new form, the keys that changed and the keys kept because the
 * user had already filled them.
 */
export function mergeParsedProfile(
  form: ProfileFields,
  parsed: Partial<ParsedProfile>,
  replace: boolean,
): { form: ProfileFields; changed: (keyof ParsedProfile)[]; kept: (keyof ParsedProfile)[] } {
  const next = { ...form };
  const changed: (keyof ParsedProfile)[] = [];
  const kept: (keyof ParsedProfile)[] = [];
  for (const key of PARSED_FIELDS) {
    const value = (parsed[key] ?? "").trim().slice(0, PROFILE_LIMITS[key]);
    if (!value || value === form[key].trim()) continue;
    if (form[key].trim() && !replace) {
      kept.push(key);
      continue;
    }
    next[key] = value;
    changed.push(key);
  }
  return { form: next, changed, kept };
}

/** User-facing message for a failed resume import. */
export function parseErrorMessage(error: unknown): string | null {
  if (isAxiosError(error) && error.response?.status === 400) {
    const data = error.response.data as Record<string, unknown> | undefined;
    for (const key of ["file", "text"]) {
      const messages = data?.[key];
      if (Array.isArray(messages) && typeof messages[0] === "string") return messages[0];
    }
  }
  return draftErrorMessage(error);
}

/** Below this, the generators suggest filling in the profile. */
export const PROFILE_NUDGE_BELOW = 50;

export const profileService = {
  get: async (): Promise<Profile> => {
    const { data } = await api.get<Profile>("/api/profile/");
    return data;
  },

  /** Suggest profile fields from resume text or a PDF. Nothing is saved. */
  parse: async (input: { text: string } | { file: File }): Promise<ParsedProfile> => {
    if ("file" in input) {
      const body = new FormData();
      body.append("file", input.file);
      // Without an explicit multipart type, axios would turn the FormData into
      // JSON because the shared instance defaults to application/json.
      const { data } = await api.post<ParsedProfile>("/api/profile/parse/", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    }
    const { data } = await api.post<ParsedProfile>("/api/profile/parse/", { text: input.text });
    return data;
  },

  save: async (fields: ProfileFields): Promise<Profile> => {
    const { data } = await api.put<Profile>("/api/profile/", fields);
    return data;
  },
};
