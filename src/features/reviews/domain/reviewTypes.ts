export type Review = {
  id: number;
  companyId: number;
  companyName: string;
  jobSeekerId: number;
  jobSeekerName: string;
  projectId: number;
  projectTitle: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type CreateReviewRequest = {
  jobSeekerId: number;
  projectId: number;
  rating: number;
  comment?: string;
};
