import { describe, expect, it } from "vitest";
import type { EvidenceReadiness } from "../domain/evidenceTypes";
import { buildProofCircuit } from "./proofCircuit";

const readiness: EvidenceReadiness = {
  applicationId: 42,
  ready: false,
  existingCardId: null,
  acceptedContractVersionId: 9,
  acceptedContractVersionNumber: 3,
  submissionRevision: 2,
  criteria: [],
  conditions: [
    { code: "ProviderVerified", state: "Complete", message: "Verified", criterionId: null },
    { code: "ContractVersionPinned", state: "Complete", message: "Pinned", criterionId: null },
    { code: "ParticipationEligible", state: "Complete", message: "Accepted", criterionId: null },
    { code: "FinalSubmissionCurrent", state: "Complete", message: "Current", criterionId: null },
    { code: "CriteriaComplete", state: "Complete", message: "Evaluated", criterionId: null },
    { code: "ProviderApprovalComplete", state: "Complete", message: "Provider approved", criterionId: null },
    { code: "UniversityApprovalMissing", state: "Missing", message: "University approval required", criterionId: null },
    { code: "InconsistentLineage", state: "Inconsistent", message: "Lineage mismatch", criterionId: null },
  ],
};

describe("Proof Engine circuit", () => {
  it("keeps the complete lineage order and exact semantic blocker states", () => {
    const circuit = buildProofCircuit(readiness);

    expect(circuit.map((stage) => stage.label)).toEqual([
      "Opportunity", "Contract", "Participation", "Work", "Attribution",
      "Evaluation", "Approvals", "Integrity", "Evidence Card",
    ]);
    expect(circuit.find((stage) => stage.key === "approvals")?.state).toBe("Missing");
    expect(circuit.find((stage) => stage.key === "integrity")?.state).toBe("Inconsistent");
    expect(circuit.find((stage) => stage.key === "card")?.state).toBe("Missing");
  });

  it("marks an existing evidence card as a satisfied final checkpoint", () => {
    const circuit = buildProofCircuit({ ...readiness, existingCardId: 18 });
    expect(circuit.at(-1)?.state).toBe("Complete");
    expect(circuit.at(-1)?.source).toBe("SB-EV-000018");
  });
});
