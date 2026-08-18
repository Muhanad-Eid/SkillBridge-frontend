import type { OpportunityType } from "../../projects/domain/projectTypes";
import type { CriterionRating } from "../../work/domain/workTypes";

export const EvidenceCardStatuses = {
  Active: 0,
  Revoked: 1,
  Superseded: 2,
} as const;

export type EvidenceCardStatus =
  (typeof EvidenceCardStatuses)[keyof typeof EvidenceCardStatuses];

export type EvidenceConditionState =
  | "Complete"
  | "Missing"
  | "Failed"
  | "Inconsistent";

export type EvidenceCondition = {
  code: string;
  state: EvidenceConditionState;
  message: string;
  criterionId: number | null;
};

export type EvidenceCriterionOutcome = {
  criterionId: number;
  title: string;
  isRequired: boolean;
  rating: CriterionRating;
  minimumRating: CriterionRating;
  isSupported: boolean;
  note: string;
};

export type EvidenceReadiness = {
  applicationId: number;
  ready: boolean;
  existingCardId: number | null;
  acceptedContractVersionId: number | null;
  acceptedContractVersionNumber: number | null;
  submissionRevision: number;
  conditions: EvidenceCondition[];
  criteria: EvidenceCriterionOutcome[];
};

export type EvidenceTraceEntry = {
  sourceType: string;
  sourceReference: string;
  actorRole: string;
  status: string;
  occurredAt: string;
  sortOrder: number;
};

export type ClaimBoundary = {
  context: string;
  contribution: string;
  supportedCriteria: string[];
  unsupportedOptionalCriteria: string[];
  evaluatedBy: string;
  approvalContext: string;
  limitation: string;
};

export type EvidenceStatusEvent = {
  previousStatus: EvidenceCardStatus;
  newStatus: EvidenceCardStatus;
  reason: string;
  occurredAt: string;
  replacementCardId: number | null;
};

export type EvidenceDetails = {
  cardId: number;
  status: EvidenceCardStatus;
  contractVersionId: number | null;
  submissionRevision: number;
  claimBoundary: ClaimBoundary;
  trace: EvidenceTraceEntry[];
  statusHistory: EvidenceStatusEvent[];
};

export type EvidenceCardSummary = {
  cardId: number;
  applicationId: number;
  participantName: string;
  opportunityTitle: string;
  providerName: string;
  status: EvidenceCardStatus;
  issuedAt: string | null;
  contractVersionId: number | null;
  submissionRevision: number;
  replacementCardId: number | null;
};

export type PublicShareCreated = {
  id: number;
  token: string;
  publicPath: string;
  createdAt: string;
  expiresAt: string | null;
};

export type PublicShareSummary = {
  id: number;
  tokenPrefix: string;
  isEnabled: boolean;
  createdAt: string;
  expiresAt: string | null;
  disabledAt: string | null;
  cardCount: number;
};

export type PublicEvidenceCard = {
  cardId: number;
  participantName: string;
  opportunityTitle: string;
  providerName: string;
  opportunityType: OpportunityType;
  status: EvidenceCardStatus;
  issuedAt: string | null;
  claimBoundary: ClaimBoundary;
  trace: EvidenceTraceEntry[];
};

export type PublicEvidenceShare = {
  ownerName: string;
  createdAt: string;
  expiresAt: string | null;
  cards: PublicEvidenceCard[];
};

export type CriterionCoverageItem = {
  criterionId: number;
  title: string;
  isRequired: boolean;
  isSupported: boolean;
  supportingEvidenceCardIds: number[];
};

export type CriterionEvidenceCoverage = {
  projectId: number;
  opportunityTitle: string;
  contractVersionNumber: number | null;
  comparisonMethod: string;
  criteria: CriterionCoverageItem[];
};

export function getEvidenceCardStatusLabel(status: EvidenceCardStatus) {
  if (status === EvidenceCardStatuses.Revoked) return "Revoked";
  if (status === EvidenceCardStatuses.Superseded) return "Superseded";
  return "Active";
}
