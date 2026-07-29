export type TalentSkill = {
  id: number;
  name: string;
  sharedEvidenceCount: number;
  isEvidenceSupported: boolean;
};

export type TalentSearchResult = {
  id: number;
  fullName: string;
  bio: string | null;
  city: string | null;
  sharedEvidenceCount: number;
  reviewsCount: number;
  averageRating: number | null;
  skills: TalentSkill[];
};

export type TalentSearchFilters = {
  query?: string;
  skillId?: number;
  evidenceOnly?: boolean;
};
