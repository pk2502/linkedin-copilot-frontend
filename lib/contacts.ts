import api from "@/lib/axios";

export type ContactStatus = "drafted" | "sent" | "replied" | "done";
export type ContactOutcome = "" | "positive" | "negative";

export interface Contact {
  id: number;
  name: string;
  company: string;
  role: string;
  linkedin_url: string;
  status: ContactStatus;
  outcome: ContactOutcome;
  notes: string;
  sent_at: string | null;
  replied_at: string | null;
  follow_up_on: string | null;
  follow_up_due: boolean;
  days_since_sent: number | null;
  last_draft_id: number | null;
  created_at: string;
  updated_at: string;
}

export type ContactUpdate = Partial<
  Pick<Contact, "status" | "outcome" | "notes" | "follow_up_on" | "name" | "company" | "role">
>;

export const STATUS_LABELS: Record<ContactStatus, string> = {
  drafted: "Drafted",
  sent: "Waiting",
  replied: "Replied",
  done: "Done",
};

export type TrackerTab = "due" | ContactStatus | "all";

export const TRACKER_TABS: { value: TrackerTab; label: string }[] = [
  { value: "due", label: "Follow-up due" },
  { value: "sent", label: "Waiting" },
  { value: "replied", label: "Replied" },
  { value: "drafted", label: "Drafted" },
  { value: "done", label: "Done" },
  { value: "all", label: "All" },
];

export function tabParams(tab: TrackerTab, search = ""): Record<string, string> {
  const params: Record<string, string> = {};
  if (tab === "due") params.due = "1";
  else if (tab !== "all") params.status = tab;
  if (search.trim()) params.search = search.trim();
  return params;
}

/** One line under the name: where things stand. */
export function statusLine(contact: Contact): string {
  if (contact.status === "sent") {
    const days = contact.days_since_sent ?? 0;
    const ago = days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
    return contact.follow_up_due ? `Sent ${ago} · follow-up due` : `Sent ${ago} · waiting for a reply`;
  }
  if (contact.status === "replied") return "They replied";
  if (contact.status === "done") {
    return contact.outcome === "positive" ? "Done · worked out" : contact.outcome === "negative" ? "Done · didn't work out" : "Done";
  }
  return "Drafted, not sent yet";
}

/** Composer link for a follow-up to this contact, with their details filled in. */
export function followUpHref(contact: Contact): string {
  const params = new URLSearchParams({ type: "followup", name: contact.name });
  if (contact.company) params.set("company", contact.company);
  if (contact.role) params.set("role", contact.role);
  return `/dashboard?${params.toString()}`;
}

/** ISO date (YYYY-MM-DD) `days` from today, in local time. */
export function daysFromToday(days: number, today = new Date()): string {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const contactService = {
  list: async (params: Record<string, string> = {}): Promise<Contact[]> => {
    const { data } = await api.get<Contact[]>("/api/contacts/", { params });
    return data;
  },

  update: async (id: number, changes: ContactUpdate): Promise<Contact> => {
    const { data } = await api.patch<Contact>(`/api/contacts/${id}/`, changes);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/api/contacts/${id}/`);
  },
};
