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
  jobSeekerId: number;
  jobSeekerName: string;
  coverLetter: string | null;
  status: ApplicationStatus;
};

export type CreateApplicationRequest = {
  coverLetter?: string;
};

export type UpdateApplicationStatusRequest = {
  status: ApplicationStatus;
};

export function getApplicationStatusLabel(status: ApplicationStatus) {
  if (status === ApplicationStatuses.Accepted) return "Accepted";
  if (status === ApplicationStatuses.Rejected) return "Rejected";
  if (status === ApplicationStatuses.Withdrawn) return "Withdrawn";
  return "Pending";
}
