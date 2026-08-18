import { httpClient } from "../../../shared/api/httpClient";
import type {
  EvidenceCardSummary,
  CriterionEvidenceCoverage,
  EvidenceDetails,
  EvidenceReadiness,
  PublicEvidenceShare,
  PublicShareCreated,
  PublicShareSummary,
} from "../domain/evidenceTypes";

export function getEvidenceReadinessAsync(applicationId: number) {
  return httpClient<EvidenceReadiness>(
    `/api/evidence/applications/${applicationId}/readiness`,
  );
}

export function issueEvidenceAsync(applicationId: number) {
  return httpClient<{ cardId: number }>(
    `/api/evidence/applications/${applicationId}/issue`,
    { method: "POST" },
  );
}

export function getEvidenceDetailsAsync(cardId: number) {
  return httpClient<EvidenceDetails>(`/api/evidence/cards/${cardId}`);
}

export function getEvidenceCardsAsync() {
  return httpClient<EvidenceCardSummary[]>("/api/evidence/cards");
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
  replacementCardId: number,
) {
  return httpClient<void>(`/api/evidence/cards/${cardId}/supersede`, {
    method: "POST",
    body: JSON.stringify({ reason, replacementCardId }),
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
