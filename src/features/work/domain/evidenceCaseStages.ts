import type { EvidenceReadiness } from "../../evidence/domain/evidenceTypes";
import { OpportunityTypes } from "../../projects/domain/projectTypes";
import {
  ContributionResolutionStatuses,
  type WorkRecord,
} from "./workTypes";

export type EvidenceCaseStageState =
  | "complete"
  | "action"
  | "waiting"
  | "blocked";

export type EvidenceCaseStage = {
  label: string;
  detail: string;
  state: EvidenceCaseStageState;
  targetId: string;
};

export function buildEvidenceCaseStages(
  record: WorkRecord,
  readiness: EvidenceReadiness | null,
  isCompany: boolean,
  isUniversitySupervisor = false,
): EvidenceCaseStage[] {
  const hasSubmission = Boolean(record.finalSubmittedAt);
  const isTeamProject = record.opportunityType === OpportunityTypes.TeamProject;
  const isUniversityTraining =
    record.opportunityType === OpportunityTypes.UniversityTraining;
  const contributionStatus = record.contributionRecord?.status;
  const contributionComplete =
    !isTeamProject ||
    contributionStatus === ContributionResolutionStatuses.Locked;
  const contributionBlocked =
    contributionStatus === ContributionResolutionStatuses.Disputed;
  const evaluatedCriteria = record.criterionEvaluations?.length ?? 0;
  const evaluationComplete =
    hasSubmission &&
    record.evidenceCriteria.length > 0 &&
    evaluatedCriteria >= record.evidenceCriteria.length &&
    !record.evaluationIsStale;
  const companyApprovalComplete =
    Boolean(record.companyApprovedAt) && !record.approvalIsStale;
  const universityApprovalComplete =
    !isUniversityTraining || Boolean(record.universityApprovedAt);
  const approvalComplete =
    companyApprovalComplete && universityApprovalComplete;
  const hasIntegrityFailure = readiness?.conditions.some(
    (condition) =>
      condition.state === "Failed" || condition.state === "Inconsistent",
  );

  return [
    {
      label: "Contract",
      detail: record.acceptedEvidenceContractVersionNumber
        ? `Version ${record.acceptedEvidenceContractVersionNumber} pinned`
        : "Accepted contract required",
      state: record.acceptedEvidenceContractVersionNumber
        ? "complete"
        : "blocked",
      targetId: record.acceptedEvidenceContractVersionNumber
        ? "evidence-contract"
        : "evidence-readiness",
    },
    {
      label: "Work",
      detail: hasSubmission
        ? `Submission revision ${record.finalSubmissionRevision}`
        : "Final work not submitted",
      state: hasSubmission ? "complete" : "action",
      targetId: hasSubmission ? "work-milestones" : "final-submission",
    },
    {
      label: "Attribution",
      detail: isTeamProject
        ? contributionComplete
          ? "Contribution locked"
          : contributionBlocked
            ? "Dispute requires resolution"
            : "Member confirmation required"
        : "Individual participation",
      state: contributionComplete
        ? "complete"
        : contributionBlocked
          ? "blocked"
          : "action",
      targetId: isTeamProject ? "contribution-record" : "evidence-readiness",
    },
    {
      label: "Evaluation",
      detail: evaluationComplete
        ? `${evaluatedCriteria} criteria evaluated`
        : hasSubmission
          ? isCompany
            ? "Evaluate every criterion"
            : "Provider evaluation pending"
          : "Waiting for final work",
      state: evaluationComplete
        ? "complete"
        : hasSubmission
          ? isCompany
            ? "action"
            : "waiting"
          : "waiting",
      targetId: hasSubmission ? "final-review" : "final-submission",
    },
    {
      label: "Approvals",
      detail: approvalComplete
        ? isUniversityTraining
          ? "Company and university approved"
          : "Provider approved"
        : isUniversityTraining && companyApprovalComplete
          ? "University approval required"
          : "Company approval required",
      state: approvalComplete
        ? "complete"
        : evaluationComplete && isCompany && !companyApprovalComplete
          ? "action"
          : evaluationComplete &&
              isUniversitySupervisor &&
              companyApprovalComplete &&
              !universityApprovalComplete
            ? "action"
          : "waiting",
      targetId: !hasSubmission
        ? "final-submission"
        : isUniversityTraining && companyApprovalComplete
          ? "training-record"
          : "final-review",
    },
    {
      label: "Proof",
      detail: record.hasEvidenceCard
        ? "Evidence card issued"
        : hasIntegrityFailure
          ? "Integrity check failed"
          : readiness?.ready
            ? "Ready for controlled issuance"
            : "Issuance conditions remain",
      state: record.hasEvidenceCard
        ? "complete"
        : hasIntegrityFailure
          ? "blocked"
          : readiness?.ready
            ? "action"
            : "waiting",
      targetId: "evidence-readiness",
    },
  ];
}
