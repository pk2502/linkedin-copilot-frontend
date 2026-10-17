import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/navigation";

describe("safeNextPath", () => {
  it("allows same-site paths", () => {
    expect(safeNextPath("/connect-extension")).toBe("/connect-extension");
    expect(safeNextPath("/dashboard/history?search=x")).toBe("/dashboard/history?search=x");
  });

  it("falls back to the dashboard for missing or empty values", () => {
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath(undefined)).toBe("/dashboard");
    expect(safeNextPath("")).toBe("/dashboard");
  });

  it("rejects anything that could leave the site", () => {
    for (const value of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "\\\\evil.example",
      "javascript:alert(1)",
      "evil.example/path",
    ]) {
      expect(safeNextPath(value), value).toBe("/dashboard");
    }
  });
});
