import { describe, expect, it } from "vitest";

import {
  normalizePortfolioItem,
  normalizePortfolioItems,
  type PortfolioItemPayload,
} from "./portfolioNormalization";
import { OpportunityTypes } from "../../projects/domain/projectTypes";

const legacyEvidence: PortfolioItemPayload = {
  id: 17,
  jobSeekerId: 4,
  projectId: 9,
  projectTitle: "Legacy evidence",
  companyName: "Verified Provider",
  opportunityType: OpportunityTypes.ProfessionalProject,
};

describe("portfolio normalization", () => {
  it("adds safe defaults to legacy evidence records", () => {
    const result = normalizePortfolioItem(legacyEvidence);

    expect(result.skills).toEqual([]);
    expect(result.criterionEvaluations).toEqual([]);
    expect(result.deliverables).toBe("");
    expect(result.evaluationCriteria).toBe("");
    expect(result.milestoneCount).toBe(0);
    expect(result.trainingReportCount).toBe(0);
    expect(result.isVisible).toBe(true);
  });

  it("preserves arrays and evidence progress returned by the API", () => {
    const result = normalizePortfolioItem({
      ...legacyEvidence,
      skills: [{ id: 2, name: "React" }],
      criterionEvaluations: [
        { criterion: "Quality", rating: 3, note: "Strong result" },
      ],
      milestoneCount: 3,
      approvedMilestoneCount: 2,
    });

    expect(result.skills).toEqual([{ id: 2, name: "React" }]);
    expect(result.criterionEvaluations).toHaveLength(1);
    expect(result.milestoneCount).toBe(3);
    expect(result.approvedMilestoneCount).toBe(2);
  });

  it("turns an absent portfolio response into an empty list", () => {
    expect(normalizePortfolioItems(undefined)).toEqual([]);
    expect(normalizePortfolioItems(null)).toEqual([]);
  });
});
