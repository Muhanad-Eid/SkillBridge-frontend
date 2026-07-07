export type JobSeekerProfile = {
  id: number;
  userId: string;
  fullName: string;
  bio: string | null;
  city: string | null;
  linkedInUrl: string | null;
  gitHubUrl: string | null;
};

export type UpdateJobSeekerProfileRequest = {
  bio?: string;
  city?: string;
  linkedInUrl?: string;
  gitHubUrl?: string;
};

export type CompanyProfile = {
  id: number;
  userId: string;
  companyName: string;
  description: string | null;
  website: string | null;
  city: string | null;
  isVerified: boolean;
};

export type UpdateCompanyProfileRequest = {
  companyName: string;
  description?: string;
  website?: string;
  city?: string;
};
