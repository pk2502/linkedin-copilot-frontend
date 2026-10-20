import { describe, expect, it } from "vitest";
import { EMPTY_FORM, TYPE_SPECS, buildPayload, isRequired, parseType, specFor } from "@/lib/composer";

const filled = {
  ...EMPTY_FORM,
  name: " Priya Shah ",
  company: "Acme",
  role: "Engineering Manager",
  job_title: "Frontend Engineer",
  context: "Met at React Conf",
  days_since: "7",
};

describe("parseType", () => {
  it("accepts the four types and falls back to a connection request", () => {
    for (const spec of TYPE_SPECS) expect(parseType(spec.type)).toBe(spec.type);
    expect(parseType("nope")).toBe("connection_request");
    expect(parseType(null)).toBe("connection_request");
  });
});

describe("buildPayload", () => {
  it("sends only this type's fields, trimmed", () => {
    expect(buildPayload("connection_request", filled)).toEqual({
      name: "Priya Shah",
      company: "Acme",
      role: "Engineering Manager",
    });
  });

  it("leaves out empty optional fields", () => {
    expect(buildPayload("referral_request", filled)).toEqual({
      name: "Priya Shah",
      company: "Acme",
      role: "Engineering Manager",
      job_title: "Frontend Engineer",
    });
  });

  it("sends the name as recruiter_name for recruiter replies", () => {
    const payload = buildPayload("recruiter_reply", { ...filled, interest_level: "not interested" });
    expect(payload).toMatchObject({ recruiter_name: "Priya Shah", interest_level: "not interested" });
    expect(payload).not.toHaveProperty("name");
  });

  it("with a conversation, needs only the name", () => {
    const form = { ...EMPTY_FORM, name: "Sam", conversation: "Sam (them): Free Thursday?" };
    expect(buildPayload("followup", form)).toEqual({ name: "Sam", conversation: "Sam (them): Free Thursday?" });
    expect(buildPayload("recruiter_reply", form)).toEqual({
      recruiter_name: "Sam",
      interest_level: "very interested",
      conversation: "Sam (them): Free Thursday?",
    });
  });
});

describe("isRequired", () => {
  const company = specFor("followup").fields.find((f) => f.key === "company")!;

  it("relaxes conversation-dependent fields only when a conversation is pasted", () => {
    expect(isRequired(company, EMPTY_FORM)).toBe(true);
    expect(isRequired(company, { ...EMPTY_FORM, conversation: "hi" })).toBe(false);
    expect(isRequired(company, { ...EMPTY_FORM, conversation: "   " })).toBe(true);
  });
});
