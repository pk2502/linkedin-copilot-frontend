import api from "@/lib/axios";
import { createSSEParser } from "@/lib/sse";
import {
  API_BASE,
  SessionExpiredError,
  getAccessToken,
  handleSessionExpired,
  refreshAccessToken,
} from "@/lib/tokens";

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

/** Error raised by streaming generation; `status` is the HTTP status (0 = stream broke mid-way). */
export class GenerationError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "GenerationError";
  }
}

/** User-facing message for a failed generation, or null when no message should be shown. */
export function generationErrorMessage(error: unknown): string | null {
  if (error instanceof GenerationError) {
    if (error.status === 401) return null; // Session expired: already redirecting to /login.
    if (error.status === 429) return "Daily limit reached (20 messages per day). Try again tomorrow.";
  }
  return "Failed to generate. Try again.";
}

function openStream(endpoint: string, payload: object, token: string | null): Promise<Response> {
  return fetch(`${API_BASE}/api/generate/stream/${endpoint}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
}

async function streamGenerate(
  endpoint: string,
  payload: object,
  onChunk: (chunk: string) => void,
): Promise<void> {
  let response = await openStream(endpoint, payload, getAccessToken());

  // The backend authenticates before generating anything, so retrying once
  // after a refresh cannot produce a duplicate message.
  if (response.status === 401) {
    let access: string;
    try {
      access = await refreshAccessToken();
    } catch (refreshError) {
      if (refreshError instanceof SessionExpiredError) {
        handleSessionExpired();
        throw new GenerationError(401, "Session expired");
      }
      throw refreshError;
    }
    response = await openStream(endpoint, payload, access);
    if (response.status === 401) {
      handleSessionExpired();
      throw new GenerationError(401, "Session expired");
    }
  }

  if (!response.ok) throw new GenerationError(response.status, "Stream request failed");

  const reader = response.body?.getReader();
  if (!reader) throw new GenerationError(response.status, "No response body");

  const decoder = new TextDecoder();
  const parser = createSSEParser(onChunk);

  while (!parser.done) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.push(decoder.decode(value, { stream: true }));
  }
  parser.push(decoder.decode());
  parser.end();

  if (!parser.done) {
    // The server closed the stream without [DONE] (e.g. the AI provider failed).
    throw new GenerationError(0, "Stream ended unexpectedly");
  }
  await reader.cancel().catch(() => {});
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
