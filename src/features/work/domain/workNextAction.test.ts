import { describe, expect, it } from "vitest";
import { WorkSubmissionStatuses } from "../../applications/domain/applicationTypes";
import {
  OpportunityTypes,
  ProjectStatuses,
} from "../../projects/domain/projectTypes";
import {
  MilestoneStatuses,
  type WorkRecord,
} from "./workTypes";
import { getWorkNextAction } from "./workNextAction";

function workRecord(overrides: Partial<WorkRecord> = {}): WorkRecord {
  return {
    applicationId: 7,
    projectId: 12,
    projectTitle: "Evidence workflow",
    deliverables: "Completed implementation",
    evaluationCriteria: "Quality",
    opportunityType: OpportunityTypes.ProfessionalProject,
    freelancePricingType: null,
    agreedBudget: null,
    agreedDeliveryDays: null,
    agreedRevisions: null,
    revisionRequestsUsed: 0,
    projectStatus: ProjectStatuses.InProgress,
    jobSeekerId: 4,
    jobSeekerUserId: "participant-user",
    jobSeekerName: "Muhanad Eid",
    studentUniversityName: null,
    studentNumber: null,
    companyUserId: "provider-user",
    companyName: "SkillBridge Provider",
    universitySupervisorId: null,
    universitySupervisorUserId: null,
    universitySupervisorName: null,
    universityName: null,
    requiredTrainingHours: null,
    academicRequirements: null,
    completedTrainingHours: 0,
    universityProgressNotes: null,
    academicRequirementsMet: false,
    companySupervisorName: null,
    companySupervisorEmail: null,
    assignedResponsibilities: null,
    contributionSummary: null,
    finalSubmissionNote: null,
    finalDeliverableUrl: null,
    hasProtectedFinalDeliverable: false,
    protectedFinalDeliverableFileName: null,
    workStatus: WorkSubmissionStatuses.NotSubmitted,
    evaluationResult: null,
    companyFeedback: null,
    universityEvaluation: null,
    finalSubmittedAt: null,
    companyApprovedAt: null,
    universityApprovedAt: null,
    hasEvidenceCard: false,
    evidenceCardId: null,
    acceptedEvidenceContractVersionId: 3,
    acceptedEvidenceContractVersionNumber: 1,
    finalSubmissionRevision: 0,
    evaluationIsStale: false,
    approvalIsStale: false,
    contributionRecord: null,
    evidenceCriteria: [],
    availableSkills: [],
    demonstratedSkills: [],
    criterionEvaluations: [],
    milestones: [],
    trainingReports: [],
    ...overrides,
  };
}

describe("getWorkNextAction", () => {
  it("leads a participant to the first unfinished milestone", () => {
    const action = getWorkNextAction(
      workRecord({
        milestones: [
          {
            id: 21,
            projectApplicationId: 7,
            title: "Complete API integration",
            description: null,
            dueDate: null,
            sortOrder: 0,
            status: MilestoneStatuses.Planned,
            submissionNote: null,
            submissionUrl: null,
            feedback: null,
            submittedAt: null,
            reviewedAt: null,
          },
        ],
      }),
      false,
      null,
    );

    expect(action.label).toBe("Submit milestone");
    expect(action.targetId).toBe("work-milestone-21");
  });

  it("opens final submission after participant prerequisites pass", () => {
    const action = getWorkNextAction(workRecord(), false, null);

    expect(action.label).toBe("Submit final work");
    expect(action.targetId).toBe("final-submission");
  });

  it("leads the provider to criterion evaluation for submitted final work", () => {
    const action = getWorkNextAction(
      workRecord({ workStatus: WorkSubmissionStatuses.Submitted }),
      true,
      null,
    );

    expect(action.label).toBe("Evaluate final work");
    expect(action.targetId).toBe("final-review");
  });

  it("prioritizes a submitted milestone requiring provider review", () => {
    const record = workRecord({
      workStatus: WorkSubmissionStatuses.Submitted,
      milestones: [
        {
          id: 33,
          projectApplicationId: 7,
          title: "Testing evidence",
          description: null,
          dueDate: null,
          sortOrder: 0,
          status: MilestoneStatuses.Submitted,
          submissionNote: "Tests are complete.",
          submissionUrl: null,
          feedback: null,
          submittedAt: "2026-08-26T00:00:00Z",
          reviewedAt: null,
        },
      ],
    });

    const action = getWorkNextAction(record, true, null);

    expect(action.label).toBe("Review submitted milestone");
    expect(action.targetId).toBe("work-milestone-33");
  });

  it("shows issuance readiness after approval and evidence after issuance", () => {
    const approved = getWorkNextAction(
      workRecord({ workStatus: WorkSubmissionStatuses.Approved }),
      false,
      null,
    );
    const issued = getWorkNextAction(
      workRecord({
        workStatus: WorkSubmissionStatuses.Approved,
        hasEvidenceCard: true,
        evidenceCardId: 44,
      }),
      false,
      null,
    );

    expect(approved.label).toBe("Approval complete");
    expect(approved.targetId).toBe("evidence-readiness");
    expect(issued.label).toBe("Evidence issued");
    expect(issued.targetId).toBeUndefined();
  });
});
