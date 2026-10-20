import { isAxiosError } from "axios";
import api from "@/lib/axios";
import type { Tone } from "@/lib/generation";

export type DraftType = "connection_request" | "referral_request" | "recruiter_reply" | "followup";
export type TweakInstruction = "shorter" | "warmer" | "more_specific" | "more_formal";

export const TWEAKS: { value: TweakInstruction; label: string }[] = [
  { value: "shorter", label: "Shorter" },
  { value: "warmer", label: "Warmer" },
  { value: "more_specific", label: "More specific" },
  { value: "more_formal", label: "More formal" },
];

export interface DraftResult {
  id: number;
  variants: string[];
  /** The tracker contact this draft was filed under, if any. */
  contact_id?: number | null;
}

export interface TweakResult {
  id: number;
  text: string;
}

export const draftService = {
  create: async (type: DraftType, fields: Record<string, string>, tone: Tone): Promise<DraftResult> => {
    const { data } = await api.post<DraftResult>("/api/drafts/", { type, tone, ...fields });
    return data;
  },

  tweak: async (id: number, variant: number, instruction: TweakInstruction): Promise<TweakResult> => {
    const { data } = await api.post<TweakResult>(`/api/drafts/${id}/tweak/`, { variant, instruction });
    return data;
  },
};

/** User-facing message for a failed draft or tweak, or null when no message should be shown. */
export function draftErrorMessage(error: unknown): string | null {
  if (!isAxiosError(error)) return "Something went wrong. Try again.";
  const status = error.response?.status;
  if (status === 401) return null; // Session expired: the interceptor redirects to /login.
  if (status === 429) return "Daily limit reached. Try again tomorrow.";
  if (status === 502) return "AI service is busy. Try again in a moment.";
  if (status === 400) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    const background = data?.your_background;
    if (Array.isArray(background) && typeof background[0] === "string") return background[0];
    return "Check the fields and try again.";
  }
  if (!error.response) return "Network error. Check your connection.";
  return "Something went wrong. Try again.";
}
