import type { OpportunityType } from "../../projects/domain/projectTypes";

type PortfolioSkill = {
  id: number;
  name: string;
};

export type PortfolioItem = {
  id: number;
  jobSeekerId: number;
  projectId: number;
  projectTitle: string;
  companyName: string;
  opportunityType: OpportunityType;
  skills: PortfolioSkill[];
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
