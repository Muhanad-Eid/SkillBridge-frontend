export type JobSeekerProfile = {
  id: number;
  userId: string;
  fullName: string;
  bio: string | null;
  city: string | null;
  linkedInUrl: string | null;
  gitHubUrl: string | null;
  skills: string[];
  portfolioItemsCount: number;
  reviewsCount: number;
  averageRating: number | null;
};

export type UpdateJobSeekerProfileRequest = {
  bio?: string;
  city?: string;
  linkedInUrl?: string;
  gitHubUrl?: string;
};

export function isJobSeekerProfileComplete(
  profile: Pick<JobSeekerProfile, "bio" | "city"> | null | undefined,
) {
  return Boolean(profile?.bio?.trim() && profile.city?.trim());
}

export type CompanyProfile = {
  id: number;
  userId: string;
  companyName: string;
  description: string | null;
  website: string | null;
  city: string | null;
  isVerified: boolean;
  providerType: 0 | 1;
};

export function isCompanyProfileComplete(
  profile:
    | Pick<CompanyProfile, "companyName" | "description" | "city">
    | null
    | undefined,
) {
  return Boolean(
    profile?.companyName?.trim() &&
      profile.description?.trim() &&
      profile.city?.trim(),
  );
}

export type UpdateCompanyProfileRequest = {
  companyName: string;
  description?: string;
  website?: string;
  city?: string;
  providerType: 0 | 1;
};
