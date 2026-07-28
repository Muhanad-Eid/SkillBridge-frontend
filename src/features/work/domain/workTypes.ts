import type {
  OpportunityType,
  ProjectStatus,
} from "../../projects/domain/projectTypes";
import type { WorkSubmissionStatus } from "../../applications/domain/applicationTypes";

export const MilestoneStatuses = {
  Planned: 0,
  Submitted: 1,
  ChangesRequested: 2,
  Approved: 3,
} as const;

export type MilestoneStatus =
  (typeof MilestoneStatuses)[keyof typeof MilestoneStatuses];

export type WorkMilestone = {
  id: number;
  projectApplicationId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  sortOrder: number;
  status: MilestoneStatus;
  submissionNote: string | null;
  submissionUrl: string | null;
  feedback: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
};

export type WorkRecord = {
  applicationId: number;
  projectId: number;
  projectTitle: string;
  opportunityType: OpportunityType;
  projectStatus: ProjectStatus;
  jobSeekerId: number;
  jobSeekerUserId: string;
  jobSeekerName: string;
  companyUserId: string;
  companyName: string;
  universitySupervisorId: number | null;
  universitySupervisorUserId: string | null;
  universitySupervisorName: string | null;
  universityName: string | null;
  requiredTrainingHours: number | null;
  completedTrainingHours: number;
  universityProgressNotes: string | null;
  contributionSummary: string | null;
  finalSubmissionNote: string | null;
  finalDeliverableUrl: string | null;
  workStatus: WorkSubmissionStatus;
  evaluationResult: string | null;
  companyFeedback: string | null;
  universityEvaluation: string | null;
  finalSubmittedAt: string | null;
  companyApprovedAt: string | null;
  universityApprovedAt: string | null;
  hasEvidenceCard: boolean;
  milestones: WorkMilestone[];
};

export type UniversitySupervisor = {
  id: number;
  userId: string;
  fullName: string;
  universityName: string;
  department: string | null;
};

export type CreateWorkMilestoneRequest = {
  title: string;
  description?: string;
  dueDate?: string | null;
};

export type SubmitMilestoneRequest = {
  submissionNote: string;
  submissionUrl?: string;
};

export type ReviewMilestoneRequest = {
  isApproved: boolean;
  feedback?: string;
};

export type SubmitFinalWorkRequest = {
  submissionNote: string;
  deliverableUrl?: string;
  contributionSummary?: string;
};

export type ApproveFinalWorkRequest = {
  isApproved: boolean;
  evaluationResult: string;
  feedback?: string;
};

export function getMilestoneStatusLabel(status: MilestoneStatus) {
  if (status === MilestoneStatuses.Submitted) return "Submitted";
  if (status === MilestoneStatuses.ChangesRequested) return "Needs changes";
  if (status === MilestoneStatuses.Approved) return "Approved";
  return "Planned";
}

export function getWorkSubmissionStatusLabel(status: WorkSubmissionStatus) {
  if (status === 1) return "Submitted";
  if (status === 2) return "Needs changes";
  if (status === 3) return "University approval";
  if (status === 4) return "Approved";
  return "Not submitted";
}
