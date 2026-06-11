import api from "@/lib/axios";

export interface GenerateConnectionRequestPayload {
  name: string;
  company: string;
  role: string;
}

export interface GenerateReferralRequestPayload {
  name: string;
  company: string;
  role: string;
  job_title: string;
  your_background: string;
}

export interface GenerateRecruiterReplyPayload {
  recruiter_name: string;
  company: string;
  job_title: string;
  your_background: string;
  interest_level: string;
}

export interface GenerateFollowupPayload {
  name: string;
  company: string;
  role: string;
  context: string;
  days_since: string;
}

export interface GenerateResponse {
  message: string;
}

export const generationService = {
  connectionRequest: async (payload: GenerateConnectionRequestPayload): Promise<GenerateResponse> => {
    const { data } = await api.post<GenerateResponse>("/api/generate/connection-request/", payload);
    return data;
  },

  referralRequest: async (payload: GenerateReferralRequestPayload): Promise<GenerateResponse> => {
    const { data } = await api.post<GenerateResponse>("/api/generate/referral-request/", payload);
    return data;
  },

  recruiterReply: async (payload: GenerateRecruiterReplyPayload): Promise<GenerateResponse> => {
    const { data } = await api.post<GenerateResponse>("/api/generate/recruiter-reply/", payload);
    return data;
  },

  followup: async (payload: GenerateFollowupPayload): Promise<GenerateResponse> => {
    const { data } = await api.post<GenerateResponse>("/api/generate/followup/", payload);
    return data;
  },
};
