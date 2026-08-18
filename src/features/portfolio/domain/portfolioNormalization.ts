import type { PortfolioItem } from "./portfolioTypes";

type RequiredPortfolioIdentity = Pick<
  PortfolioItem,
  | "id"
  | "jobSeekerId"
  | "projectId"
  | "projectTitle"
  | "companyName"
  | "opportunityType"
>;

export type PortfolioItemPayload = RequiredPortfolioIdentity &
  Partial<PortfolioItem>;

export function normalizePortfolioItem(
  item: PortfolioItemPayload,
): PortfolioItem {
  return {
    ...item,
    skills: Array.isArray(item.skills) ? item.skills : [],
    deliverables: item.deliverables ?? "",
    evaluationCriteria: item.evaluationCriteria ?? "",
    criterionEvaluations: Array.isArray(item.criterionEvaluations)
      ? item.criterionEvaluations
      : [],
    description: item.description ?? null,
    projectUrl: item.projectUrl ?? null,
    ownerSummary: item.ownerSummary ?? null,
    coverImageUrl: item.coverImageUrl ?? null,
    contribution: item.contribution ?? null,
    evaluationResult: item.evaluationResult ?? null,
    evaluatorName: item.evaluatorName ?? null,
    approvedAt: item.approvedAt ?? null,
    isVisible: item.isVisible ?? true,
    isFeatured: item.isFeatured ?? false,
    updatedAt: item.updatedAt ?? item.approvedAt ?? "",
    isEvidenceCard: item.isEvidenceCard ?? false,
    evidenceContractVersionId: item.evidenceContractVersionId ?? null,
    submissionRevision: item.submissionRevision ?? 0,
    evidenceStatus: item.evidenceStatus ?? 0,
    claimBoundarySnapshot: item.claimBoundarySnapshot ?? null,
    confidentialSummary: item.confidentialSummary ?? null,
    supersededByPortfolioItemId: item.supersededByPortfolioItemId ?? null,
    providerVerifiedAtApproval: item.providerVerifiedAtApproval ?? false,
    applicationSubmittedAt: item.applicationSubmittedAt ?? null,
    finalSubmittedAt: item.finalSubmittedAt ?? null,
    companyApprovedAt: item.companyApprovedAt ?? null,
    universityApprovedAt: item.universityApprovedAt ?? null,
    milestoneCount: item.milestoneCount ?? 0,
    approvedMilestoneCount: item.approvedMilestoneCount ?? 0,
    trainingReportCount: item.trainingReportCount ?? 0,
    approvedTrainingReportCount: item.approvedTrainingReportCount ?? 0,
    reviewRating: item.reviewRating ?? null,
    reviewComment: item.reviewComment ?? null,
  };
}

export function normalizePortfolioItems(
  items: PortfolioItemPayload[] | null | undefined,
): PortfolioItem[] {
  return Array.isArray(items) ? items.map(normalizePortfolioItem) : [];
}
