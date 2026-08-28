import { httpClient } from "../../../shared/api/httpClient";
import type {
  EvidenceCardSummary,
  EvidenceAuditEvent,
  CriterionEvidenceCoverage,
  EvidenceDetails,
  EvidenceReadiness,
  EvidenceProofRun,
  PublicEvidenceShare,
  PublicShareCreated,
  PublicShareSummary,
  CreateEvidenceReviewRequest,
  EvidenceReviewRequest,
  SubmitEvidenceReview,
  EvidenceActionRequest,
  CreateEvidenceActionRequest,
} from "../domain/evidenceTypes";

export function getEvidenceReadinessAsync(applicationId: number) {
  return httpClient<EvidenceReadiness>(
    `/api/evidence/applications/${applicationId}/readiness`,
  );
}

export function createEvidenceProofRunAsync(applicationId: number) {
  return httpClient<EvidenceProofRun>(
    `/api/evidence/applications/${applicationId}/proof-runs`,
    { method: "POST" },
  );
}

export function getEvidenceProofRunsAsync(applicationId: number) {
  return httpClient<EvidenceProofRun[]>(
    `/api/evidence/applications/${applicationId}/proof-runs`,
  );
}

export function getEvidenceProofRunAsync(proofRunId: number) {
  return httpClient<EvidenceProofRun>(
    `/api/evidence/proof-runs/${proofRunId}`,
  );
}

export function getEvidenceDetailsAsync(cardId: number) {
  return httpClient<EvidenceDetails>(`/api/evidence/cards/${cardId}`);
}

export function getEvidenceCardsAsync() {
  return httpClient<EvidenceCardSummary[]>("/api/evidence/cards");
}

export function getEvidenceAuditEventsAsync(cardId: number) {
  return httpClient<EvidenceAuditEvent[]>(`/api/evidence/cards/${cardId}/audit`);
}

export function getCriterionEvidenceCoverageAsync(projectId: number) {
  return httpClient<CriterionEvidenceCoverage>(
    `/api/evidence/coverage/opportunities/${projectId}`,
  );
}

export function revokeEvidenceAsync(cardId: number, reason: string) {
  return httpClient<void>(`/api/evidence/cards/${cardId}/revoke`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function supersedeEvidenceAsync(
  cardId: number,
  reason: string,
) {
  return httpClient<void>(`/api/evidence/cards/${cardId}/supersede`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function createPublicEvidenceShareAsync(
  cardIds: number[],
  expiresAt?: string | null,
) {
  return httpClient<PublicShareCreated>("/api/evidence/shares", {
    method: "POST",
    body: JSON.stringify({ cardIds, expiresAt: expiresAt || null }),
  });
}

export function disablePublicEvidenceShareAsync(shareId: number) {
  return httpClient<void>(`/api/evidence/shares/${shareId}`, {
    method: "DELETE",
  });
}

export function getPublicEvidenceSharesAsync() {
  return httpClient<PublicShareSummary[]>("/api/evidence/shares");
}

export function getPublicEvidenceShareAsync(token: string) {
  return httpClient<PublicEvidenceShare>(`/api/evidence/public/${token}`, {
    skipAuth: true,
  });
}

export function createEvidenceReviewRequestAsync(
  input: CreateEvidenceReviewRequest,
) {
  return httpClient<EvidenceReviewRequest>("/api/evidence/review-requests", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getEvidenceReviewRequestsAsync() {
  return httpClient<EvidenceReviewRequest[]>("/api/evidence/review-requests");
}

export function getPublicEvidenceReviewRequestAsync(token: string) {
  return httpClient<EvidenceReviewRequest>(
    `/api/evidence/public/review-requests/${token}`,
    { skipAuth: true },
  );
}

export function submitPublicEvidenceReviewAsync(
  token: string,
  input: SubmitEvidenceReview,
) {
  return httpClient<EvidenceReviewRequest>(
    `/api/evidence/public/review-requests/${token}`,
    { method: "POST", body: JSON.stringify(input), skipAuth: true },
  );
}

export function getEvidenceActionRequestsAsync() {
  return httpClient<EvidenceActionRequest[]>("/api/evidence/action-requests");
}

export function createEvidenceActionRequestAsync(applicationId: number, input: CreateEvidenceActionRequest) {
  return httpClient<EvidenceActionRequest>(`/api/evidence/applications/${applicationId}/action-requests`, {
    method: "POST", body: JSON.stringify(input),
  });
}

export function respondToEvidenceActionRequestAsync(requestId: number, response: string) {
  return httpClient<EvidenceActionRequest>(`/api/evidence/action-requests/${requestId}/respond`, {
    method: "POST", body: JSON.stringify({ response }),
  });
}

export function resolveEvidenceActionRequestAsync(requestId: number, isResolved: boolean, note: string) {
  return httpClient<EvidenceActionRequest>(`/api/evidence/action-requests/${requestId}/resolve`, {
    method: "POST", body: JSON.stringify({ isResolved, note }),
  });
}
