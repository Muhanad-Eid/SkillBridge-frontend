import { httpClient } from "../../../shared/api/httpClient";
import type { ProofBrief, ProofBriefSubmission, ProofBriefSubmissionInput, ReviewProofBriefRequest, SaveProofBriefRequest } from "../domain/proofBriefTypes";

export const getProofBriefAsync = (projectId: number) => httpClient<ProofBrief>(`/api/proof-briefs/projects/${projectId}`);
export const saveProofBriefAsync = (projectId: number, request: SaveProofBriefRequest) => httpClient<ProofBrief>(`/api/proof-briefs/projects/${projectId}`, { method: "PUT", body: JSON.stringify(request) });
export const publishProofBriefAsync = (projectId: number) => httpClient<ProofBrief>(`/api/proof-briefs/projects/${projectId}/publish`, { method: "POST" });
export const closeProofBriefAsync = (projectId: number) => httpClient<ProofBrief>(`/api/proof-briefs/projects/${projectId}/close`, { method: "POST" });
export const getProofBriefSubmissionsAsync = (projectId: number) => httpClient<ProofBriefSubmission[]>(`/api/proof-briefs/projects/${projectId}/submissions`);
export const submitProofBriefRevisionAsync = (applicationId: number, request: ProofBriefSubmissionInput) => httpClient<ProofBriefSubmission>(`/api/proof-briefs/applications/${applicationId}/revisions`, { method: "POST", body: JSON.stringify(request) });
export const reviewProofBriefAsync = (submissionId: number, request: ReviewProofBriefRequest) => httpClient<ProofBriefSubmission>(`/api/proof-briefs/submissions/${submissionId}/review`, { method: "POST", body: JSON.stringify(request) });
