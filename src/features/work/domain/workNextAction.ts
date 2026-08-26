import { WorkSubmissionStatuses } from "../../applications/domain/applicationTypes";
import type { EvidenceReadiness } from "../../evidence/domain/evidenceTypes";
import { OpportunityTypes, ProjectStatuses } from "../../projects/domain/projectTypes";
import {
  ContributionResolutionStatuses,
  MilestoneStatuses,
  TrainingReportStatuses,
  type WorkRecord,
} from "./workTypes";

export type WorkNextAction = {
  label: string;
  detail: string;
  targetId?: string;
  actionLabel?: string;
};

export function getWorkNextAction(
  record: WorkRecord,
  isCompany: boolean,
  readiness: EvidenceReadiness | null,
): WorkNextAction {
  const canEditFinalWork =
    record.workStatus === WorkSubmissionStatuses.NotSubmitted ||
    record.workStatus === WorkSubmissionStatuses.ChangesRequested;
  const isWorkActive =
    record.projectStatus === ProjectStatuses.InProgress ||
    (record.projectStatus === ProjectStatuses.Completed && canEditFinalWork);
  const milestonesApproved = record.milestones.every(
    (milestone) => milestone.status === MilestoneStatuses.Approved,
  );
  const trainingReportsApproved = record.trainingReports.every(
    (report) => report.status === TrainingReportStatuses.Approved,
  );
  const trainingHoursComplete =
    record.completedTrainingHours >= (record.requiredTrainingHours ?? 0);
  const canSubmitFinal =
    !isCompany &&
    isWorkActive &&
    canEditFinalWork &&
    milestonesApproved &&
    (record.opportunityType !== OpportunityTypes.UniversityTraining ||
      (trainingReportsApproved && trainingHoursComplete));
  const submittedMilestone = record.milestones.find(
    (milestone) => milestone.status === MilestoneStatuses.Submitted,
  );
  const participantMilestone = record.milestones.find(
    (milestone) =>
      milestone.status === MilestoneStatuses.Planned ||
      milestone.status === MilestoneStatuses.ChangesRequested,
  );
  const submittedTrainingReport = record.trainingReports.find(
    (report) => report.status === TrainingReportStatuses.Submitted,
  );
  const returnedTrainingReport = record.trainingReports.find(
    (report) => report.status === TrainingReportStatuses.ChangesRequested,
  );

  if (record.hasEvidenceCard) {
    return {
      label: "Evidence issued",
      detail:
        "The approved Skill Evidence Card is available in the participant's Evidence Portfolio.",
    };
  }

  if (isCompany && submittedMilestone) {
    return {
      label: "Review submitted milestone",
      detail: `${record.jobSeekerName} submitted “${submittedMilestone.title}”. Approve it or return it with feedback.`,
      targetId: `work-milestone-${submittedMilestone.id}`,
      actionLabel: "Review milestone",
    };
  }

  if (isCompany && submittedTrainingReport) {
    return {
      label: "Review training report",
      detail:
        "Approve the submitted hours and learning outcomes, or request a correction.",
      targetId: "training-record",
      actionLabel: "Review report",
    };
  }

  if (
    isCompany &&
    record.opportunityType === OpportunityTypes.TeamProject &&
    !record.assignedResponsibilities
  ) {
    return {
      label: "Define participant responsibilities",
      detail:
        "Record this participant's responsibilities before the team contribution can be evaluated.",
      targetId: "contribution-record",
      actionLabel: "Define responsibilities",
    };
  }

  if (
    isCompany &&
    record.opportunityType === OpportunityTypes.TeamProject &&
    record.contributionRecord &&
    record.contributionRecord.status !== ContributionResolutionStatuses.Locked
  ) {
    return {
      label: "Resolve contribution attribution",
      detail:
        "Member review, dispute, or non-response must be resolved before evidence can issue.",
      targetId: "contribution-record",
      actionLabel: "Resolve attribution",
    };
  }

  if (
    isCompany &&
    record.opportunityType === OpportunityTypes.UniversityTraining &&
    (!record.companySupervisorName || !record.universitySupervisorId)
  ) {
    return {
      label: "Complete training supervision",
      detail:
        "Assign both company and university supervision before final training approval.",
      targetId: "training-record",
      actionLabel: "Complete supervision",
    };
  }

  if (isCompany && record.workStatus === WorkSubmissionStatuses.Submitted) {
    return {
      label: "Evaluate final work",
      detail:
        "Evaluate every criterion against the accepted Evidence Contract, then approve or request changes.",
      targetId: "final-review",
      actionLabel: "Open evaluation",
    };
  }

  if (
    isCompany &&
    record.workStatus === WorkSubmissionStatuses.AwaitingUniversityApproval
  ) {
    return {
      label: "University approval pending",
      detail:
        "Company approval is complete. The assigned university supervisor must complete the academic review.",
    };
  }

  if (isCompany && record.workStatus === WorkSubmissionStatuses.Approved) {
    return {
      label: readiness?.ready ? "Issuing evidence" : "Resolve issuance blockers",
      detail: readiness?.ready
        ? "All conditions are satisfied. The evidence card is being created through the issuance protocol."
        : "Review the readiness checklist and resolve every missing, failed, or inconsistent condition.",
      targetId: "evidence-readiness",
      actionLabel: "Review readiness",
    };
  }

  if (!isCompany && !isWorkActive) {
    return {
      label: "Waiting for work to start",
      detail:
        "The provider must start the accepted opportunity before milestones or final work can be submitted.",
    };
  }

  if (!isCompany && participantMilestone) {
    const revision =
      participantMilestone.status === MilestoneStatuses.ChangesRequested;
    return {
      label: revision ? "Revise milestone" : "Submit milestone",
      detail: revision
        ? `Address the provider feedback for “${participantMilestone.title}” and submit it again.`
        : `Complete “${participantMilestone.title}” before the final submission.`,
      targetId: `work-milestone-${participantMilestone.id}`,
      actionLabel: revision ? "Open revision" : "Open milestone",
    };
  }

  if (!isCompany && returnedTrainingReport) {
    return {
      label: "Revise training report",
      detail:
        "The company requested changes to a training report. Correct it before final submission.",
      targetId: "training-record",
      actionLabel: "Revise report",
    };
  }

  if (
    !isCompany &&
    record.opportunityType === OpportunityTypes.UniversityTraining &&
    (!trainingReportsApproved || !trainingHoursComplete)
  ) {
    return {
      label: "Complete training records",
      detail:
        "Submit the required reports and obtain approval for all required training hours.",
      targetId: "training-record",
      actionLabel: "Open training record",
    };
  }

  if (!isCompany && canSubmitFinal) {
    const revision =
      record.workStatus === WorkSubmissionStatuses.ChangesRequested;
    return {
      label: revision ? "Submit the requested revision" : "Submit final work",
      detail:
        "All participant prerequisites are complete. Send the final work for criterion-level evaluation.",
      targetId: "final-submission",
      actionLabel: revision ? "Open revision form" : "Open submission form",
    };
  }

  if (
    !isCompany &&
    (record.workStatus === WorkSubmissionStatuses.Submitted ||
      record.workStatus === WorkSubmissionStatuses.AwaitingUniversityApproval)
  ) {
    return {
      label: "Review in progress",
      detail:
        record.workStatus === WorkSubmissionStatuses.AwaitingUniversityApproval
          ? "The provider approved the work. University approval is still required."
          : "The final submission is saved and waiting for provider evaluation.",
    };
  }

  if (!isCompany && record.workStatus === WorkSubmissionStatuses.Approved) {
    return {
      label: "Approval complete",
      detail:
        "The final work is approved. Any remaining issuance blocker is shown in the readiness checklist.",
      targetId: "evidence-readiness",
      actionLabel: "Review readiness",
    };
  }

  return {
    label: isCompany ? "Waiting for participant work" : "Continue the work",
    detail: isCompany
      ? "No submitted milestone or final delivery currently needs provider review."
      : "Complete the remaining work requirements shown below.",
  };
}
