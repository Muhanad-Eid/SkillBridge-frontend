import { describe, expect, it } from "vitest";
import { normalizeAuthRole } from "./authTypes";

describe("normalizeAuthRole", () => {
  it.each([
    [1, "Admin"],
    ["admin", "Admin"],
    [2, "Company"],
    ["company", "Company"],
    [3, "JobSeeker"],
    ["job-seeker", "JobSeeker"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeAuthRole(input)).toBe(expected);
  });

  it("rejects an unknown role", () => {
    expect(normalizeAuthRole("manager")).toBeNull();
  });
});
