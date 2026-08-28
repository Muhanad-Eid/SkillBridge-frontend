import type {
  EvidenceCondition,
  EvidenceConditionState,
  EvidenceReadiness,
} from "../domain/evidenceTypes";

export type CircuitStage = {
  key: string;
  label: string;
  state: EvidenceConditionState;
  conditions: EvidenceCondition[];
  source: string;
};

const stages = [
  { key: "opportunity", label: "Opportunity", codes: ["ProviderVerified", "ProviderNotVerified"] },
  { key: "contract", label: "Contract", codes: ["ContractVersionPinned", "AcceptedContractVersionMissing"] },
  { key: "participation", label: "Participation", codes: ["ParticipationEligible", "ParticipationNotEligible"] },
  { key: "work", label: "Work", codes: ["FinalSubmissionCurrent", "FinalSubmissionMissing", "MilestonesComplete", "WorkIncomplete"] },
  { key: "attribution", label: "Attribution", codes: ["ContributionResolved", "ContributionUnresolved"] },
  { key: "evaluation", label: "Evaluation", codes: ["CriteriaComplete", "CriterionEvaluationMissing", "RequiredCriterionUnsatisfied", "CriterionDefinitionMissing"] },
  { key: "approvals", label: "Approvals", codes: ["ProviderApprovalComplete", "CompanyApprovalMissing", "UniversityApprovalComplete", "UniversityApprovalMissing"] },
  { key: "integrity", label: "Integrity", codes: ["SameLineageInvariant", "InconsistentLineage"] },
  { key: "card", label: "Evidence Card", codes: ["EvidenceAlreadyIssued"] },
] as const;

const stateRank: Record<EvidenceConditionState, number> = {
  Complete: 0,
  Missing: 1,
  Failed: 2,
  Inconsistent: 3,
};

function stageState(
  conditions: EvidenceCondition[],
  isCard: boolean,
  existingCardId: number | null,
) {
  if (isCard) return existingCardId ? "Complete" : "Missing";
  if (conditions.length === 0) return "Complete";
  return conditions.reduce<EvidenceConditionState>(
    (worst, condition) =>
      stateRank[condition.state] > stateRank[worst] ? condition.state : worst,
    "Complete",
  );
}

export function buildProofCircuit(readiness: EvidenceReadiness): CircuitStage[] {
  return stages.map((stage) => {
    const conditions = readiness.conditions.filter((condition) =>
      (stage.codes as readonly string[]).includes(condition.code),
    );
    return {
      key: stage.key,
      label: stage.label,
      conditions,
      state: stageState(
        conditions,
        stage.key === "card",
        readiness.existingCardId,
      ),
      source:
        stage.key === "contract"
          ? `Evidence Contract v${readiness.acceptedContractVersionNumber ?? "not pinned"}`
          : stage.key === "work"
            ? `Submission revision ${readiness.submissionRevision || "not submitted"}`
            : stage.key === "card" && readiness.existingCardId
              ? `SB-EV-${String(readiness.existingCardId).padStart(6, "0")}`
              : `Application #${readiness.applicationId}`,
    };
  });
}
