import { describe, expect, it } from "vitest";
import { checklistSteps } from "@/lib/onboarding";

describe("checklistSteps", () => {
  it("marks each step from the backend state", () => {
    const steps = checklistSteps({ profile_completeness: 30, has_draft: true, used_extension: false });
    expect(steps.map((s) => [s.id, s.done])).toEqual([
      ["profile", false],
      ["extension", false],
      ["draft", true],
    ]);
  });

  it("counts the profile as done from 50%", () => {
    const [profile] = checklistSteps({ profile_completeness: 50, has_draft: false, used_extension: false });
    expect(profile.done).toBe(true);
  });

  it("links the extension step outside the app", () => {
    const extension = checklistSteps({ profile_completeness: 0, has_draft: false, used_extension: false })[1];
    expect(extension.external).toBe(true);
    expect(extension.href).toMatch(/^https:\/\//);
  });
});
