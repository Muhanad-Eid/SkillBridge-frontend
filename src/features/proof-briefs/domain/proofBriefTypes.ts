export const ProofBriefStatuses = { Draft: 0, Published: 1, Closed: 2 } as const;
export type ProofBriefStatus = (typeof ProofBriefStatuses)[keyof typeof ProofBriefStatuses];

export const ProofBriefSubmissionStatuses = { Draft: 0, Submitted: 1, ClarificationRequested: 2, Reviewed: 3, Withdrawn: 4 } as const;
export type ProofBriefSubmissionStatus = (typeof ProofBriefSubmissionStatuses)[keyof typeof ProofBriefSubmissionStatuses];

export const ProofBriefCheckpointDecisions = { NotReviewed: 0, Demonstrated: 1, NeedsClarification: 2, NotObserved: 3 } as const;
export type ProofBriefCheckpointDecision = (typeof ProofBriefCheckpointDecisions)[keyof typeof ProofBriefCheckpointDecisions];

export type ProofBriefCheckpoint = { id: number; title: string; description: string | null; evidenceCriterionStableKey: string | null; sortOrder: number };
export type ProofBrief = { id: number; projectId: number; status: ProofBriefStatus; currentVersionId: number | null; versionNumber: number | null; title: string; scenario: string; constraints: string; responseInstructions: string; timeboxMinutes: number; productionUseProhibited: boolean; publishedAt: string | null; checkpoints: ProofBriefCheckpoint[] };
export type ProofBriefSummary = { isAvailable: boolean; versionId: number | null; title: string | null; timeboxMinutes: number | null; checkpointCount: number };
export type SaveProofBriefRequest = { title: string; scenario: string; constraints: string; responseInstructions: string; timeboxMinutes: number; checkpoints: Array<{ title: string; description?: string; evidenceCriterionStableKey?: string }> };
export type ProofBriefSubmissionInput = { proofBriefVersionId: number; proofBriefApproach: string; proofBriefTradeoffs: string; proofBriefReflection: string; proofBriefArtifactUrl?: string };
export type ProofBriefCheckpointReview = { checkpointId: number; checkpointTitle: string; decision: ProofBriefCheckpointDecision; note: string | null };
export type ProofBriefSubmission = { id: number; projectApplicationId: number; proofBriefVersionId: number; revisionNumber: number; applicantName: string; approach: string; tradeoffs: string; reflection: string; artifactUrl: string | null; status: ProofBriefSubmissionStatus; submittedAt: string; reviewedAt: string | null; providerNote: string | null; checkpointReviews: ProofBriefCheckpointReview[] };
export type ReviewProofBriefRequest = { providerNote?: string; requestClarification: boolean; checkpoints: Array<{ checkpointId: number; decision: ProofBriefCheckpointDecision; note?: string }> };
