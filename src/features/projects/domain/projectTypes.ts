export const OpportunityTypes = {
  PaidProject: 0,
  Training: 1,
} as const;

export type OpportunityType =
  (typeof OpportunityTypes)[keyof typeof OpportunityTypes];

export const ProjectStatuses = {
  Open: 0,
  InProgress: 1,
  Completed: 2,
  Cancelled: 3,
} as const;

export type ProjectStatus =
  (typeof ProjectStatuses)[keyof typeof ProjectStatuses];

export type Project = {
  id: number;
  title: string;
  description: string;
  budget: number | null;
  durationWeeks: number;
  type: OpportunityType;
  status: ProjectStatus;
  companyProfileId: number;
  companyName: string;
  applicationsCount: number;
};

export type CreateProjectRequest = {
  title: string;
  description: string;
  budget?: number | null;
  durationWeeks: number;
  type: OpportunityType;
};

export type UpdateProjectRequest = CreateProjectRequest & {
  status: ProjectStatus;
};

export function getOpportunityTypeLabel(type: OpportunityType) {
  return type === OpportunityTypes.Training ? "Training" : "Paid project";
}

export function getProjectStatusLabel(status: ProjectStatus) {
  if (status === ProjectStatuses.InProgress) return "In progress";
  if (status === ProjectStatuses.Completed) return "Completed";
  if (status === ProjectStatuses.Cancelled) return "Cancelled";
  return "Open";
}
