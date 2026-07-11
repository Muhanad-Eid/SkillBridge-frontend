import { describe, expect, it } from "vitest";
import { calculateProjectMatch, type Project } from "./projectTypes";

const project = {
  skills: [
    { id: 1, name: "React", isRequired: true },
    { id: 2, name: "TypeScript", isRequired: true },
    { id: 3, name: "Testing", isRequired: false },
  ],
} as Project;

describe("calculateProjectMatch", () => {
  it("weights required skills more heavily than preferred skills", () => {
    expect(calculateProjectMatch(project, [1, 3]).score).toBe(60);
  });

  it("reports missing required skills", () => {
    const match = calculateProjectMatch(project, [1]);

    expect(match.matchedRequired).toBe(1);
    expect(match.totalRequired).toBe(2);
    expect(match.missingRequiredSkills.map((skill) => skill.name)).toEqual([
      "TypeScript",
    ]);
  });

  it("returns a complete match when every project skill is present", () => {
    expect(calculateProjectMatch(project, [1, 2, 3]).score).toBe(100);
  });

  it("does not claim a match when an older project has no skill data", () => {
    expect(calculateProjectMatch({ ...project, skills: [] }, [1, 2]).score).toBe(0);
  });
});
