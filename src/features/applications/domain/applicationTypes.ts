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
  isIdentityHidden: boolean;
  submittedAt: string;
  workStatus: WorkSubmissionStatus;
  status: ApplicationStatus;
  
};

export type CreateApplicationRequest = {
  coverLetter?: string;
  workSampleUrl?: string;
  shortTaskResponse?: string;
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
};

export function getApplicationStatusLabel(status: ApplicationStatus) {
  if (status === ApplicationStatuses.Accepted) return "Accepted";
  if (status === ApplicationStatuses.Rejected) return "Rejected";
  if (status === ApplicationStatuses.Withdrawn) return "Withdrawn";
  return "Pending";
}
