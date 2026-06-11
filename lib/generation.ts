import api from "@/lib/axios";

export type Tone = "formal" | "friendly" | "concise";

export interface GenerateConnectionRequestPayload {
  name: string;
  company: string;
  role: string;
  tone?: Tone;
}

export interface GenerateReferralRequestPayload {
  name: string;
  company: string;
  role: string;
  job_title: string;
  your_background: string;
  tone?: Tone;
}

export interface GenerateRecruiterReplyPayload {
  recruiter_name: string;
  company: string;
  job_title: string;
  your_background: string;
  interest_level: string;
  tone?: Tone;
}

export interface GenerateFollowupPayload {
  name: string;
  company: string;
  role: string;
  context: string;
  days_since: string;
  tone?: Tone;
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

async function streamGenerate(
  endpoint: string,
  payload: object,
  onChunk: (chunk: string) => void,
): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const response = await fetch(`${API_BASE}/api/generate/stream/${endpoint}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error("Stream request failed");

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) throw new Error("No response body");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    const lines = text.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.chunk) onChunk(parsed.chunk);
        } catch {}
      }
    }
  }
}

export const streamingService = {
  connectionRequest: (payload: GenerateConnectionRequestPayload, onChunk: (chunk: string) => void) =>
    streamGenerate("connection-request", payload, onChunk),

  referralRequest: (payload: GenerateReferralRequestPayload, onChunk: (chunk: string) => void) =>
    streamGenerate("referral-request", payload, onChunk),

  recruiterReply: (payload: GenerateRecruiterReplyPayload, onChunk: (chunk: string) => void) =>
    streamGenerate("recruiter-reply", payload, onChunk),

  followup: (payload: GenerateFollowupPayload, onChunk: (chunk: string) => void) =>
    streamGenerate("followup", payload, onChunk),
};
