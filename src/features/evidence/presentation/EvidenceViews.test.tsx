import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type {
  ClaimBoundary,
  CriterionEvidenceCoverage,
  EvidenceReadiness,
  EvidenceTraceEntry,
} from "../domain/evidenceTypes";
import ClaimBoundaryPanel from "./ClaimBoundaryPanel";
import CriterionCoveragePanel from "./CriterionCoveragePanel";
import EvidenceReadinessPanel from "./EvidenceReadinessPanel";
import EvidenceTrace from "./EvidenceTrace";

describe("evidence views", () => {
  it("renders precise readiness blocking states", () => {
    const readiness: EvidenceReadiness = {
      applicationId: 42,
      ready: false,
      existingCardId: null,
      acceptedContractVersionId: 7,
      acceptedContractVersionNumber: 2,
      submissionRevision: 3,
      conditions: [
        {
          code: "UniversityApprovalMissing",
          state: "Missing",
          message: "University approval is still required.",
          criterionId: null,
        },
        {
          code: "RequiredCriterionUnsatisfied",
          state: "Failed",
          message: 'Required criterion "API Security" did not meet its satisfaction rule.',
          criterionId: 9,
        },
      ],
      criteria: [],
    };

    const html = renderToStaticMarkup(
      <EvidenceReadinessPanel readiness={readiness} />,
    );

    expect(html).toContain("Issuance blocked");
    expect(html).toContain("Contract version 2");
    expect(html).toContain("University approval is still required.");
    expect(html).toContain("API Security");
    expect(html).toContain("2 conditions need attention");
    expect(html).toContain("Integrity progress");
    expect(html).toContain("University approval recorded");
    expect(html).toContain("MISSING");
  });

  it("keeps unsupported optional criteria inside the Claim Boundary", () => {
    const boundary: ClaimBoundary = {
      context: "Customer API under Evidence Contract version 1.",
      contribution: "Implemented request validation and integration tests.",
      supportedCriteria: ["API correctness"],
      unsupportedOptionalCriteria: ["Visual polish"],
      evaluatedBy: "Northstar Labs",
      approvalContext: "Approved by the verified provider.",
      limitation: "This record does not establish general mastery.",
    };

    const html = renderToStaticMarkup(
      <ClaimBoundaryPanel boundary={boundary} />,
    );

    expect(html).toContain("Supported by this evidence");
    expect(html).toContain("API correctness");
    expect(html).toContain("Evaluated but not supported");
    expect(html).toContain("Visual polish");
    expect(html).toContain("does not establish general mastery");
  });

  it("renders the ordered permitted evidence trace", () => {
    const trace: EvidenceTraceEntry[] = [
      {
        sourceType: "Evidence Contract",
        sourceReference: "Version 1",
        actorRole: "Provider",
        status: "Accepted",
        occurredAt: "2026-06-01T00:00:00Z",
        sortOrder: 0,
      },
      {
        sourceType: "Skill Evidence Card",
        sourceReference: "System-issued evidence",
        actorRole: "SkillBridge",
        status: "Active",
        occurredAt: "2026-06-10T00:00:00Z",
        sortOrder: 1,
      },
    ];

    const html = renderToStaticMarkup(<EvidenceTrace trace={trace} />);

    expect(html).toContain("Evidence Contract");
    expect(html).toContain("Version 1");
    expect(html).toContain("Skill Evidence Card");
    expect(html).toContain("System-issued evidence");
    expect(html).toContain("2 recorded steps");
  });

  it("renders contextual criterion coverage without a score", () => {
    const coverage: CriterionEvidenceCoverage = {
      projectId: 7,
      opportunityTitle: "Customer API",
      contractVersionNumber: 2,
      comparisonMethod:
        "Exact criterion-title matches from active Skill Evidence Cards; no score or ranking is produced.",
      criteria: [
        {
          criterionId: 1,
          title: "API correctness",
          isRequired: true,
          isSupported: true,
          supportingEvidenceCardIds: [12],
        },
        {
          criterionId: 2,
          title: "Deployment",
          isRequired: false,
          isSupported: false,
          supportingEvidenceCardIds: [],
        },
      ],
    };

    const html = renderToStaticMarkup(
      <CriterionCoveragePanel coverage={coverage} />,
    );

    expect(html).toContain("Context only");
    expect(html).toContain("API correctness");
    expect(html).toContain("Supported");
    expect(html).toContain("Deployment");
    expect(html).toContain("Not supported");
    expect(html).toContain("no score or ranking");
    expect(html).toContain("Comparison boundary");
  });
});
