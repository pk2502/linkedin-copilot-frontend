import type { DraftType } from "@/lib/drafts";

/**
 * One form for all four message types. Fields shared between types (name,
 * company, role...) keep their values when the user switches type.
 */

export type FieldKey =
  | "name"
  | "company"
  | "role"
  | "job_title"
  | "job_description"
  | "conversation"
  | "context"
  | "days_since"
  | "interest_level"
  | "your_background";

export type ComposerForm = Record<FieldKey, string>;

export interface FieldSpec {
  key: FieldKey;
  label: string;
  placeholder?: string;
  kind: "input" | "textarea" | "number" | "interest";
  /** "always", "optional", or required only when no conversation is pasted. */
  required: "always" | "optional" | "without_conversation";
  hint?: string;
  rows?: number;
  maxLength?: number;
}

export interface TypeSpec {
  type: DraftType;
  label: string;
  description: string;
  fields: FieldSpec[];
}

export const INTEREST_LEVELS = [
  { value: "very interested", label: "Interested" },
  { value: "somewhat interested", label: "Maybe" },
  { value: "not interested", label: "Not interested" },
];

const background: FieldSpec = {
  key: "your_background",
  label: "Your background",
  kind: "textarea",
  required: "optional",
  rows: 3,
  maxLength: 2000,
  placeholder: "Leave empty to use your profile, or add details for this one",
};

const conversation: FieldSpec = {
  key: "conversation",
  label: "Conversation so far",
  kind: "textarea",
  required: "optional",
  rows: 5,
  maxLength: 4000,
  placeholder: "Paste the LinkedIn messages. The drafts answer their last message.",
  hint: "With a conversation, only the name is needed. Used to write this draft only; not saved.",
};

export const TYPE_SPECS: TypeSpec[] = [
  {
    type: "connection_request",
    label: "Connection request",
    description: "A short note (max 300 characters) with a real reason to connect.",
    fields: [
      { key: "name", label: "Their name", kind: "input", required: "always", placeholder: "Jane Smith" },
      { key: "company", label: "Company", kind: "input", required: "always", placeholder: "Acme Corp" },
      { key: "role", label: "Their role", kind: "input", required: "always", placeholder: "Engineering Manager" },
    ],
  },
  {
    type: "referral_request",
    label: "Referral request",
    description: "Ask someone to refer you for a specific job.",
    fields: [
      { key: "name", label: "Referrer's name", kind: "input", required: "always", placeholder: "Jane Smith" },
      { key: "company", label: "Company", kind: "input", required: "always", placeholder: "Acme Corp" },
      { key: "role", label: "Referrer's role", kind: "input", required: "always", placeholder: "Senior Engineer" },
      { key: "job_title", label: "Job you're applying for", kind: "input", required: "always", placeholder: "Frontend Engineer" },
      {
        key: "job_description",
        label: "Job description",
        kind: "textarea",
        required: "optional",
        rows: 4,
        maxLength: 6000,
        placeholder: "Paste the job posting. Drafts will match your strongest fits to its requirements.",
        hint: "Used to write this draft only; not saved.",
      },
      background,
    ],
  },
  {
    type: "recruiter_reply",
    label: "Recruiter reply",
    description: "Answer a recruiter, matched to how interested you are.",
    fields: [
      { key: "name", label: "Recruiter's name", kind: "input", required: "always", placeholder: "John Doe" },
      { key: "interest_level", label: "How interested are you?", kind: "interest", required: "always" },
      conversation,
      { key: "company", label: "Company", kind: "input", required: "without_conversation", placeholder: "Acme Corp" },
      { key: "job_title", label: "Job title", kind: "input", required: "without_conversation", placeholder: "Frontend Engineer" },
      background,
    ],
  },
  {
    type: "followup",
    label: "Follow-up",
    description: "Reply to their last message, or nudge after a meeting or your last message.",
    fields: [
      { key: "name", label: "Their name", kind: "input", required: "always", placeholder: "Jane Smith" },
      conversation,
      { key: "company", label: "Company", kind: "input", required: "without_conversation", placeholder: "Acme Corp" },
      { key: "role", label: "Their role", kind: "input", required: "without_conversation", placeholder: "Senior Engineer" },
      {
        key: "context",
        label: "Previous interaction",
        kind: "textarea",
        required: "without_conversation",
        rows: 3,
        maxLength: 2000,
        placeholder: "We spoke at a conference about React performance...",
      },
      { key: "days_since", label: "Days since last contact", kind: "number", required: "without_conversation", placeholder: "7" },
    ],
  },
];

export const EMPTY_FORM: ComposerForm = {
  name: "",
  company: "",
  role: "",
  job_title: "",
  job_description: "",
  conversation: "",
  context: "",
  days_since: "",
  interest_level: "very interested",
  your_background: "",
};

export function specFor(type: DraftType): TypeSpec {
  return TYPE_SPECS.find((spec) => spec.type === type) ?? TYPE_SPECS[0];
}

/** Message type from a ?type= value; unknown values fall back to a connection request. */
export function parseType(value: string | null | undefined): DraftType {
  return TYPE_SPECS.some((spec) => spec.type === value) ? (value as DraftType) : "connection_request";
}

export function isRequired(field: FieldSpec, form: ComposerForm): boolean {
  if (field.required === "always") return true;
  if (field.required === "without_conversation") return !form.conversation.trim();
  return false;
}

/**
 * Request fields for the API: only this type's fields, trimmed, empty optional
 * ones left out, and the name sent as recruiter_name for recruiter replies.
 */
export function buildPayload(type: DraftType, form: ComposerForm): Record<string, string> {
  const payload: Record<string, string> = {};
  for (const field of specFor(type).fields) {
    const value = form[field.key].trim();
    if (!value && !isRequired(field, form)) continue;
    const key = type === "recruiter_reply" && field.key === "name" ? "recruiter_name" : field.key;
    payload[key] = value;
  }
  return payload;
}
