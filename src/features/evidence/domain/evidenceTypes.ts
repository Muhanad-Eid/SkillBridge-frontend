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

export type EvidenceProofReceipt = {
  runId: number;
  runAt: string;
  fingerprint: string;
  verifiedCheckpoints: number;
  totalCheckpoints: number;
  contractVersionId: number | null;
  contractVersionNumber: number | null;
  submissionRevision: number;
};

export type EvidenceProofRun = {
  runId: number;
  applicationId: number;
  projectId: number;
  opportunityTitle: string;
  participantName: string;
  providerName: string;
  opportunityType: OpportunityType;
  triggeredByName: string;
  triggeredByRole: string;
  triggeredAt: string;
  ready: boolean;
  isIssuanceRun: boolean;
  cardId: number | null;
  fingerprint: string;
  readiness: EvidenceReadiness;
  claimBoundary: ClaimBoundary;
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
  actorUserId: string;
  actorName: string;
  occurredAt: string;
  replacementCardId: number | null;
};

export type EvidenceAuditEvent = {
  action: string;
  subjectType: string;
  subjectId: string;
  detail: string | null;
  actorName: string;
  occurredAt: string;
};

export type PublicEvidenceStatusEvent = Omit<
  EvidenceStatusEvent,
  "actorUserId"
>;

export type EvidenceDetails = {
  cardId: number;
  status: EvidenceCardStatus;
  contractVersionId: number | null;
  submissionRevision: number;
  claimBoundary: ClaimBoundary;
  trace: EvidenceTraceEntry[];
  statusHistory: PublicEvidenceStatusEvent[];
  proofReceipt?: EvidenceProofReceipt | null;
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
  statusHistory: EvidenceStatusEvent[];
  proofReceipt?: EvidenceProofReceipt | null;
};

export type PublicEvidenceShare = {
  ownerName: string;
  createdAt: string;
  expiresAt: string | null;
  cards: PublicEvidenceCard[];
};

export type EvidenceReviewOutcome =
  | "Verified"
  | "NeedsClarification"
  | "InsufficientEvidence";

export type EvidenceReviewCard = {
  cardId: number;
  opportunityTitle: string;
  providerName: string;
  opportunityType: OpportunityType;
  status: EvidenceCardStatus;
  issuedAt: string | null;
  claimBoundary: ClaimBoundary;
  trace: EvidenceTraceEntry[];
  proofReceipt?: EvidenceProofReceipt | null;
};

export type EvidenceReviewRequest = {
  id: number;
  cardId: number;
  opportunityTitle: string;
  token: string;
  publicPath: string;
  purpose: string;
  questions: string[];
  answers: EvidenceReviewAnswer[];
  status: "Pending" | "Completed";
  reviewerName: string | null;
  outcome: EvidenceReviewOutcome | null;
  response: string | null;
  createdAt: string;
  expiresAt: string | null;
  respondedAt: string | null;
  card: EvidenceReviewCard;
};

export type EvidenceReviewAnswer = {
  question: string;
  answer: string;
};

export type CreateEvidenceReviewRequest = {
  cardId: number;
  purpose: string;
  questions: string[];
  expiresAt?: string | null;
};

export type SubmitEvidenceReview = {
  reviewerName: string;
  outcome: EvidenceReviewOutcome;
  response: string;
  answers: EvidenceReviewAnswer[];
};

export type EvidenceActionRequest = {
  id: number;
  applicationId: number;
  projectId: number;
  opportunityTitle: string;
  participantName: string;
  requesterName: string;
  requestType: "FinalSubmission" | "EvidenceClarification" | "TrainingReport" | "ContributionDeclaration";
  title: string;
  instructions: string;
  status: "Open" | "Responded" | "Resolved";
  createdAt: string;
  dueAt: string | null;
  respondedAt: string | null;
  response: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  recipientActionPath: string;
};

export type CreateEvidenceActionRequest = {
  requestType: EvidenceActionRequest["requestType"];
  title: string;
  instructions: string;
  dueAt?: string | null;
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
