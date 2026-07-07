export type PortfolioItem = {
  id: number;
  jobSeekerId: number;
  projectId: number;
  projectTitle: string;
  description: string | null;
  projectUrl: string | null;
};

export type CreatePortfolioItemRequest = {
  projectId: number;
  description?: string;
  projectUrl?: string;
};

export type UpdatePortfolioItemRequest = {
  description?: string;
  projectUrl?: string;
};
