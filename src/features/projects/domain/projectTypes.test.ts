import { describe, expect, it } from "vitest";
import {
  calculateProjectMatch,
  getProjectDisplayStatusLabel,
  isApplicationDeadlinePassed,
  isProjectAcceptingApplications,
  ProjectStatuses,
  type Project,
} from "./projectTypes";

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

describe("project application deadline", () => {
  const now = new Date("2026-07-23T12:00:00Z");

  it("treats a past deadline as closed", () => {
    expect(isApplicationDeadlinePassed("2026-07-22", now)).toBe(true);
  });

  it("keeps the opportunity open through its deadline date", () => {
    expect(isApplicationDeadlinePassed("2026-07-23", now)).toBe(false);
  });

  it("shows a closed application state without changing the work status", () => {
    const expiredProject = {
      status: ProjectStatuses.Open,
      applicationDeadline: "2026-07-22",
    };

    expect(isProjectAcceptingApplications(expiredProject)).toBe(false);
    expect(getProjectDisplayStatusLabel(expiredProject)).toBe(
      "Applications closed",
    );
  });
});
