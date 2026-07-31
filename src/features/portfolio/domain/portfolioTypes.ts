import type { OpportunityType } from "../../projects/domain/projectTypes";

type PortfolioSkill = {
  id: number;
  name: string;
};

export type PortfolioCriterionEvaluation = {
  criterion: string;
  rating: 1 | 2 | 3;
  note: string;
};

export type PortfolioItem = {
  id: number;
  jobSeekerId: number;
  projectId: number;
  projectTitle: string;
  companyName: string;
  opportunityType: OpportunityType;
  skills: PortfolioSkill[];
  deliverables: string;
  evaluationCriteria: string;
  criterionEvaluations: PortfolioCriterionEvaluation[];
  description: string | null;
  projectUrl: string | null;
  ownerSummary: string | null;
  coverImageUrl: string | null;
  contribution: string | null;
  evaluationResult: string | null;
  evaluatorName: string | null;
  approvedAt: string | null;
  isVisible: boolean;
  isFeatured: boolean;
  updatedAt: string;
  isEvidenceCard: boolean;
  providerVerifiedAtApproval: boolean;
  applicationSubmittedAt: string | null;
  finalSubmittedAt: string | null;
  companyApprovedAt: string | null;
  universityApprovedAt: string | null;
  milestoneCount: number;
  approvedMilestoneCount: number;
  trainingReportCount: number;
  approvedTrainingReportCount: number;
  reviewRating: number | null;
  reviewComment: string | null;
};

export type EligiblePortfolioProject = {
  projectId: number;
  projectTitle: string;
  companyName: string;
  skills: PortfolioSkill[];
};

export type CreatePortfolioItemRequest = {
  projectId: number;
  description: string;
  projectUrl?: string;
};

export type UpdatePortfolioItemRequest = {
  description?: string;
  projectUrl?: string;
  ownerSummary?: string;
  coverImageUrl?: string;
  isVisible: boolean;
  isFeatured: boolean;
};
