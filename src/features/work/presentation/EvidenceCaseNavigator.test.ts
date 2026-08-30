import { describe, expect, it } from "vitest";
import type { EvidenceReadiness } from "../../evidence/domain/evidenceTypes";
import { OpportunityTypes } from "../../projects/domain/projectTypes";
import {
  ContributionResolutionStatuses,
  type WorkRecord,
} from "../domain/workTypes";
import { buildEvidenceCaseStages } from "../domain/evidenceCaseStages";

function createRecord(overrides: Partial<WorkRecord> = {}): WorkRecord {
  return {
    acceptedEvidenceContractVersionNumber: 2,
    finalSubmittedAt: "2026-08-30T10:00:00Z",
    finalSubmissionRevision: 1,
    opportunityType: OpportunityTypes.ProfessionalProject,
    contributionRecord: null,
    evidenceCriteria: [{
      id: 1,
      stableKey: "delivery-quality",
      title: "Delivery quality",
      isRequired: true,
      minimumRating: 2,
    }],
    criterionEvaluations: [{
      criterionId: 1,
      criterion: "Delivery quality",
      isRequired: true,
      rating: 2,
      note: "Meets the accepted standard.",
    }],
    evaluationIsStale: false,
    approvalIsStale: false,
    companyApprovedAt: "2026-08-30T11:00:00Z",
    universityApprovedAt: null,
    hasEvidenceCard: false,
    ...overrides,
  } as WorkRecord;
}

function createReadiness(
  overrides: Partial<EvidenceReadiness> = {},
): EvidenceReadiness {
  return {
    applicationId: 1,
    ready: true,
    existingCardId: null,
    acceptedContractVersionId: 2,
    acceptedContractVersionNumber: 2,
    submissionRevision: 1,
    conditions: [],
    criteria: [],
    ...overrides,
  };
}

describe("Evidence Case stages", () => {
  it("keeps University Training approvals incomplete until the university approves", () => {
    const stages = buildEvidenceCaseStages(
      createRecord({ opportunityType: OpportunityTypes.UniversityTraining }),
      createReadiness({ ready: false }),
      true,
    );

    expect(stages.find((stage) => stage.label === "Approvals")).toMatchObject({
      state: "waiting",
      detail: "University approval required",
      targetId: "training-record",
    });
  });

  it("assigns the university approval gate to the university supervisor", () => {
    const stages = buildEvidenceCaseStages(
      createRecord({ opportunityType: OpportunityTypes.UniversityTraining }),
      createReadiness({ ready: false }),
      false,
      true,
    );

    expect(stages.find((stage) => stage.label === "Approvals")).toMatchObject({
      state: "action",
      detail: "University approval required",
      targetId: "training-record",
    });
  });

  it("marks a disputed team contribution as blocked", () => {
    const stages = buildEvidenceCaseStages(
      createRecord({
        opportunityType: OpportunityTypes.TeamProject,
        contributionRecord: {
          status: ContributionResolutionStatuses.Disputed,
        } as WorkRecord["contributionRecord"],
      }),
      createReadiness({ ready: false }),
      true,
    );

    expect(stages.find((stage) => stage.label === "Attribution")).toMatchObject({
      state: "blocked",
      detail: "Dispute requires resolution",
    });
  });

  it("surfaces failed integrity conditions in the Proof stage", () => {
    const stages = buildEvidenceCaseStages(
      createRecord(),
      createReadiness({
        ready: false,
        conditions: [{
          code: "SameLineage",
          state: "Inconsistent",
          message: "The recorded sources do not share one lineage.",
          criterionId: null,
        }],
      }),
      true,
    );

    expect(stages.find((stage) => stage.label === "Proof")).toMatchObject({
      state: "blocked",
      detail: "Integrity check failed",
    });
  });
});
