import type { OpportunityType } from "../../projects/domain/projectTypes";

export type PortfolioSkill = {
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
  description: string;
  projectUrl?: string;
};
