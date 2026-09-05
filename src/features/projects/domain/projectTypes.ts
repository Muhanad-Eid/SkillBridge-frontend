export const OpportunityTypes = {
  ProfessionalProject: 0,
  UniversityTraining: 1,
  IndustryMicroTask: 2,
  // Compatibility alias for existing API consumers and saved client state.
  FreelanceTask: 2,
  SkillDevelopmentChallenge: 3,
  TeamProject: 4,
} as const;

export type OpportunityType =
  (typeof OpportunityTypes)[keyof typeof OpportunityTypes];

export const FreelancePricingTypes = {
  FixedPrice: 1,
  Hourly: 2,
} as const;

export type FreelancePricingType =
  (typeof FreelancePricingTypes)[keyof typeof FreelancePricingTypes];

export const WorkModes = {
  Remote: 0,
  Hybrid: 1,
  OnSite: 2,
} as const;

export type WorkMode = (typeof WorkModes)[keyof typeof WorkModes];

export const ExperienceLevels = {
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
} as const;

export type ExperienceLevel =
  (typeof ExperienceLevels)[keyof typeof ExperienceLevels];

export const ProjectStatuses = {
  Open: 0,
  InProgress: 1,
  Completed: 2,
  Cancelled: 3,
  Draft: 4,
} as const;

export type ProjectStatus =
  (typeof ProjectStatuses)[keyof typeof ProjectStatuses];

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export const CriterionEvaluationTypes = {
  Rating: 0,
  PassFail: 1,
} as const;

export type CriterionEvaluationType =
  (typeof CriterionEvaluationTypes)[keyof typeof CriterionEvaluationTypes];

export type EvidenceCriterion = {
  id: number;
  title: string;
  description: string | null;
  evaluationType: CriterionEvaluationType;
  minimumRating: 1 | 2 | 3;
  isRequired: boolean;
  sortOrder: number;
};

export type EvidenceCriterionInput = Omit<EvidenceCriterion, "id"> & {
  id?: number | null;
};

export type EvidenceContractVersion = {
  id: number;
  projectId: number;
  versionNumber: number;
  status: number;
  createdAt: string;
  publishedAt: string | null;
  requirements: string;
  deliverables: string;
  milestonePlan: string;
  evaluationCriteria: string;
  confidentialitySummary: string | null;
  requiresProviderApproval: boolean;
  requiresUniversityApproval: boolean;
  requiredTrainingHours: number | null;
  applicationDeadline: string | null;
  criteria: EvidenceCriterion[];
};

export type Project = {
  id: number;
  title: string;
  description: string;
  requirements: string;
  deliverables: string;
  evaluationCriteria: string;
  milestonePlan: string;
  applicationTask: string;
  requiredTrainingHours: number | null;
  academicRequirements: string | null;
  location: string | null;
  workMode: WorkMode;
  experienceLevel: ExperienceLevel;
  positionsAvailable: number;
  applicationDeadline: string | null;
  budget: number | null;
  freelancePricingType: FreelancePricingType | null;
  freelanceDeliveryDays: number | null;
  includedRevisions: number | null;
  durationWeeks: number;
  type: OpportunityType;
  status: ProjectStatus;
  companyProfileId: number;
  companyName: string;
  applicationsCount: number;
  currentEvidenceContractVersionId: number | null;
  currentEvidenceContractVersionNumber: number | null;
  confidentialitySummary: string | null;
  evidenceCriteria: EvidenceCriterion[];
  proofBrief?: import("../../proof-briefs/domain/proofBriefTypes").ProofBriefSummary | null;
  skills: ProjectSkill[];
  milestones: ProjectMilestone[];
};

type ProjectSkill = {
  id: number;
  name: string;
  isRequired: boolean;
};

export type ProjectMilestone = {
  id: number;
  title: string;
  description: string | null;
  dueAfterDays: number;
  sortOrder: number;
};

export type ProjectMilestoneInput = {
  title: string;
  description?: string | null;
  dueAfterDays: number;
};

export type CreateProjectRequest = {
  title: string;
  description: string;
  requirements: string;
  deliverables: string;
  evaluationCriteria: string;
  confidentialitySummary?: string | null;
  evidenceCriteria: EvidenceCriterionInput[];
  milestonePlan: string;
  applicationTask: string;
  requiredTrainingHours?: number | null;
  academicRequirements?: string | null;
  location?: string | null;
  workMode: WorkMode;
  experienceLevel: ExperienceLevel;
  positionsAvailable: number;
  applicationDeadline?: string | null;
  budget?: number | null;
  freelancePricingType?: FreelancePricingType | null;
  freelanceDeliveryDays?: number | null;
  includedRevisions?: number | null;
  durationWeeks: number;
  type: OpportunityType;
  requiredSkillIds?: number[];
  preferredSkillIds?: number[];
  requiredSkillNames: string[];
  preferredSkillNames: string[];
  milestones: ProjectMilestoneInput[];
};

export type UpdateProjectRequest = CreateProjectRequest & {
  status: ProjectStatus;
};

export function getOpportunityTypeLabel(type: OpportunityType) {
  if (type === OpportunityTypes.UniversityTraining) return "University training";
  if (type === OpportunityTypes.IndustryMicroTask) return "Industry micro-task";
  if (type === OpportunityTypes.SkillDevelopmentChallenge) {
    return "Skill-development challenge";
  }
  if (type === OpportunityTypes.TeamProject) return "Team project";
  return "Professional project";
}

export function getFreelancePricingLabel(
  pricingType: FreelancePricingType | null | undefined,
) {
  return pricingType === FreelancePricingTypes.Hourly
    ? "Hourly"
    : "Fixed price";
}

export function getWorkModeLabel(workMode: WorkMode) {
  if (workMode === WorkModes.Hybrid) return "Hybrid";
  if (workMode === WorkModes.OnSite) return "On-site";
  return "Remote";
}

export function getExperienceLevelLabel(level: ExperienceLevel) {
  if (level === ExperienceLevels.Intermediate) return "Intermediate";
  if (level === ExperienceLevels.Advanced) return "Advanced";
  return "Beginner";
}

export function getProjectStatusLabel(status: ProjectStatus) {
  if (status === ProjectStatuses.Draft) return "Draft";
  if (status === ProjectStatuses.InProgress) return "In progress";
  if (status === ProjectStatuses.Completed) return "Completed";
  if (status === ProjectStatuses.Cancelled) return "Cancelled";
  return "Open";
}

export function isApplicationDeadlinePassed(
  applicationDeadline: string | null | undefined,
  now = new Date(),
) {
  if (!applicationDeadline) return false;

  const currentUtcDate = now.toISOString().slice(0, 10);
  return applicationDeadline < currentUtcDate;
}

export function isProjectAcceptingApplications(
  project: Pick<Project, "status" | "applicationDeadline">,
) {
  return (
    project.status === ProjectStatuses.Open &&
    !isApplicationDeadlinePassed(project.applicationDeadline)
  );
}

export function getProjectDisplayStatusLabel(
  project: Pick<Project, "status" | "applicationDeadline">,
) {
  if (
    project.status === ProjectStatuses.Open &&
    isApplicationDeadlinePassed(project.applicationDeadline)
  ) {
    return "Applications closed";
  }

  return getProjectStatusLabel(project.status);
}

type ProjectMatch = {
  score: number;
  matchedRequired: number;
  totalRequired: number;
  missingRequiredSkills: ProjectSkill[];
};

export function calculateProjectMatch(
  project: Project,
  skillIds: Iterable<number>,
): ProjectMatch {
  if (project.skills.length === 0) {
    return {
      score: 0,
      matchedRequired: 0,
      totalRequired: 0,
      missingRequiredSkills: [],
    };
  }

  const jobSeekerSkills = new Set(skillIds);
  const required = project.skills.filter((skill) => skill.isRequired);
  const preferred = project.skills.filter((skill) => !skill.isRequired);
  const matchedRequired = required.filter((skill) => jobSeekerSkills.has(skill.id));
  const matchedPreferred = preferred.filter((skill) => jobSeekerSkills.has(skill.id));
  const requiredWeight = preferred.length > 0 ? 80 : 100;
  const requiredScore = required.length > 0
    ? (matchedRequired.length / required.length) * requiredWeight
    : requiredWeight;
  const preferredScore = preferred.length > 0
    ? (matchedPreferred.length / preferred.length) * (100 - requiredWeight)
    : 0;

  return {
    score: Math.round(requiredScore + preferredScore),
    matchedRequired: matchedRequired.length,
    totalRequired: required.length,
    missingRequiredSkills: required.filter(
      (skill) => !jobSeekerSkills.has(skill.id),
    ),
  };
}
