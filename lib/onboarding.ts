import api from "@/lib/axios";
import { PROFILE_NUDGE_BELOW } from "@/lib/profile";

export interface OnboardingState {
  profile_completeness: number;
  has_draft: boolean;
  used_extension: boolean;
}

export interface ChecklistStep {
  id: "profile" | "extension" | "draft";
  title: string;
  description: string;
  done: boolean;
  href: string;
  action: string;
  external?: boolean;
}

/** Where users get the extension: the Chrome Web Store once listed, the repo until then. */
export const EXTENSION_URL =
  process.env.NEXT_PUBLIC_EXTENSION_URL || "https://github.com/pk2502/linkedin-copilot-extension#install-unpacked";

export const onboardingService = {
  get: async (): Promise<OnboardingState> => {
    const { data } = await api.get<OnboardingState>("/api/onboarding/");
    return data;
  },
};

export function checklistSteps(state: OnboardingState): ChecklistStep[] {
  return [
    {
      id: "profile",
      title: "Add your background",
      description: "Upload your resume or import your LinkedIn profile, so drafts cite your real experience.",
      done: state.profile_completeness >= PROFILE_NUDGE_BELOW,
      href: "/dashboard/profile",
      action: "Fill profile",
    },
    {
      id: "extension",
      title: "Draft from LinkedIn",
      description: "Add the Chrome extension: open a profile or conversation and drafts are ready, no typing.",
      done: state.used_extension,
      href: EXTENSION_URL,
      action: "Get the extension",
      external: true,
    },
    {
      id: "draft",
      title: "Write your first message",
      description: "Pick a message type below and generate three drafts.",
      done: state.has_draft,
      href: "/dashboard?type=connection_request",
      action: "Start",
    },
  ];
}
