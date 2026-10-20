import { describe, expect, it } from "vitest";
import { daysFromToday, followUpHref, statusLine, tabParams, type Contact } from "@/lib/contacts";

const base: Contact = {
  id: 1,
  name: "Priya Shah",
  company: "Acme",
  role: "EM",
  linkedin_url: "",
  status: "sent",
  outcome: "",
  notes: "",
  sent_at: "2026-10-14T10:00:00Z",
  replied_at: null,
  follow_up_on: "2026-10-19",
  follow_up_due: true,
  days_since_sent: 6,
  last_draft_id: 3,
  created_at: "2026-10-14T10:00:00Z",
  updated_at: "2026-10-14T10:00:00Z",
};

describe("tabParams", () => {
  it("maps tabs to API filters", () => {
    expect(tabParams("due")).toEqual({ due: "1" });
    expect(tabParams("replied", " acme ")).toEqual({ status: "replied", search: "acme" });
    expect(tabParams("all")).toEqual({});
  });
});

describe("statusLine", () => {
  it("describes where things stand", () => {
    expect(statusLine(base)).toBe("Sent 6 days ago · follow-up due");
    expect(statusLine({ ...base, follow_up_due: false, days_since_sent: 1 })).toBe("Sent yesterday · waiting for a reply");
    expect(statusLine({ ...base, status: "done", outcome: "positive" })).toBe("Done · worked out");
    expect(statusLine({ ...base, status: "drafted" })).toBe("Drafted, not sent yet");
  });
});

describe("followUpHref", () => {
  it("opens the composer as a follow-up with their details", () => {
    expect(followUpHref(base)).toBe("/dashboard?type=followup&name=Priya+Shah&company=Acme&role=EM");
    expect(followUpHref({ ...base, company: "", role: "" })).toBe("/dashboard?type=followup&name=Priya+Shah");
  });
});

describe("daysFromToday", () => {
  it("adds days across month ends in local time", () => {
    expect(daysFromToday(3, new Date(2026, 9, 30))).toBe("2026-11-02");
  });
});
