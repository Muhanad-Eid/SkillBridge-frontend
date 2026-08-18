import {
  OpportunityTypes,
  type FreelancePricingType,
  type OpportunityType,
} from "../../projects/domain/projectTypes";

export const ApplicationStatuses = {
  Pending: 0,
  Accepted: 1,
  Rejected: 2,
  Withdrawn: 3,
} as const;

export type ApplicationStatus =
  (typeof ApplicationStatuses)[keyof typeof ApplicationStatuses];

export type Application = {
  id: number;
  projectId: number;
  projectTitle: string;
  jobSeekerId: number | null;
  jobSeekerName: string;
  coverLetter: string | null;
  workSampleUrl: string | null;
  shortTaskResponse: string | null;
  hasCv: boolean;
  cvFileName: string | null;
  canViewCv: boolean;
  opportunityType: OpportunityType;
  freelancePricingType: FreelancePricingType | null;
  proposedBudget: number | null;
  proposedDeliveryDays: number | null;
  isShortlisted: boolean;
  submittedAt: string;
  decisionNote: string | null;
  decidedAt: string | null;
  workStatus: WorkSubmissionStatus;
  status: ApplicationStatus;
  acceptedEvidenceContractVersionId: number | null;
  acceptedEvidenceContractVersionNumber: number | null;
};

export type CreateApplicationRequest = {
  coverLetter?: string;
  workSampleUrl?: string;
  shortTaskResponse?: string;
  proposedBudget?: number;
  proposedDeliveryDays?: number;
};

export const WorkSubmissionStatuses = {
  NotSubmitted: 0,
  Submitted: 1,
  ChangesRequested: 2,
  AwaitingUniversityApproval: 3,
  Approved: 4,
} as const;

export type WorkSubmissionStatus =
  (typeof WorkSubmissionStatuses)[keyof typeof WorkSubmissionStatuses];

export type UpdateApplicationStatusRequest = {
  status: ApplicationStatus;
  decisionNote?: string;
};

export type UpdateApplicationShortlistRequest = {
  isShortlisted: boolean;
};

export function getApplicationStatusLabel(status: ApplicationStatus) {
  if (status === ApplicationStatuses.Accepted) return "Accepted";
  if (status === ApplicationStatuses.Rejected) return "Rejected";
  if (status === ApplicationStatuses.Withdrawn) return "Withdrawn";
  return "Pending";
}

export function getApplicationStatusLabelForOpportunity(
  status: ApplicationStatus,
  opportunityType: OpportunityType,
) {
  if (opportunityType !== OpportunityTypes.FreelanceTask) {
    return getApplicationStatusLabel(status);
  }

  if (status === ApplicationStatuses.Accepted) return "Proposal accepted";
  if (status === ApplicationStatuses.Rejected) return "Proposal declined";
  if (status === ApplicationStatuses.Withdrawn) return "Proposal withdrawn";
  return "Proposal sent";
}
