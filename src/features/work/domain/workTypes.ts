import type {
  FreelancePricingType,
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

export type WorkSkill = {
  id: number;
  name: string;
};

export const CriterionRatings = {
  NeedsImprovement: 1,
  MeetsStandard: 2,
  ExceedsStandard: 3,
} as const;

export type CriterionRating =
  (typeof CriterionRatings)[keyof typeof CriterionRatings];

export type CriterionEvaluation = {
  criterion: string;
  rating: CriterionRating;
  note: string;
};

export const TrainingReportStatuses = {
  Submitted: 0,
  ChangesRequested: 1,
  Approved: 2,
} as const;

export type TrainingReportStatus =
  (typeof TrainingReportStatuses)[keyof typeof TrainingReportStatuses];

export type TrainingReport = {
  id: number;
  projectApplicationId: number;
  periodStart: string;
  periodEnd: string;
  hours: number;
  tasksCompleted: string;
  learningOutcomes: string;
  challenges: string | null;
  evidenceUrl: string | null;
  status: TrainingReportStatus;
  companyFeedback: string | null;
  submittedAt: string;
  reviewedAt: string | null;
};

export type WorkRecord = {
  applicationId: number;
  projectId: number;
  projectTitle: string;
  deliverables: string;
  evaluationCriteria: string;
  opportunityType: OpportunityType;
  freelancePricingType: FreelancePricingType | null;
  agreedBudget: number | null;
  agreedDeliveryDays: number | null;
  agreedRevisions: number | null;
  revisionRequestsUsed: number;
  projectStatus: ProjectStatus;
  jobSeekerId: number;
  jobSeekerUserId: string;
  jobSeekerName: string;
  studentUniversityName: string | null;
  studentNumber: string | null;
  companyUserId: string;
  companyName: string;
  universitySupervisorId: number | null;
  universitySupervisorUserId: string | null;
  universitySupervisorName: string | null;
  universityName: string | null;
  requiredTrainingHours: number | null;
  academicRequirements: string | null;
  completedTrainingHours: number;
  universityProgressNotes: string | null;
  academicRequirementsMet: boolean;
  companySupervisorName: string | null;
  companySupervisorEmail: string | null;
  assignedResponsibilities: string | null;
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
  availableSkills: WorkSkill[];
  demonstratedSkills: WorkSkill[];
  criterionEvaluations: CriterionEvaluation[];
  milestones: WorkMilestone[];
  trainingReports: TrainingReport[];
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
  demonstratedSkillIds?: number[];
  criterionEvaluations?: CriterionEvaluation[];
};

export type UpdateContributionResponsibilitiesRequest = {
  responsibilities: string;
};

export type SubmitTrainingReportRequest = {
  periodStart: string;
  periodEnd: string;
  hours: number;
  tasksCompleted: string;
  learningOutcomes: string;
  challenges?: string;
  evidenceUrl?: string;
};

export type ReviewTrainingReportRequest = {
  isApproved: boolean;
  feedback?: string;
};

export type UpdateTrainingSupervisionRequest = {
  supervisorName: string;
  supervisorEmail?: string;
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

export function getTrainingReportStatusLabel(status: TrainingReportStatus) {
  if (status === TrainingReportStatuses.Approved) return "Approved";
  if (status === TrainingReportStatuses.ChangesRequested) {
    return "Needs changes";
  }
  return "Awaiting company review";
}
