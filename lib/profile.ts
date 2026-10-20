import api from "@/lib/axios";

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

/** Below this, the generators suggest filling in the profile. */
export const PROFILE_NUDGE_BELOW = 50;

export const profileService = {
  get: async (): Promise<Profile> => {
    const { data } = await api.get<Profile>("/api/profile/");
    return data;
  },

  save: async (fields: ProfileFields): Promise<Profile> => {
    const { data } = await api.put<Profile>("/api/profile/", fields);
    return data;
  },
};
