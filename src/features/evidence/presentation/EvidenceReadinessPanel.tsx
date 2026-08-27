import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  ShieldAlert,
} from "lucide-react";
import Button from "../../../shared/components/Button";
import SbBadge from "../../../shared/components/primitives/SbBadge/SbBadge";
import type { EvidenceReadiness } from "../domain/evidenceTypes";
import styles from "./EvidenceViews.module.scss";

const conditionPresentation: Record<
  string,
  { phase: string; title: string }
> = {
  ProviderVerified: { phase: "Foundation", title: "Provider verified" },
  ParticipationEligible: { phase: "Foundation", title: "Participation accepted" },
  ContractVersionPinned: {
    phase: "Evidence Contract",
    title: "Accepted contract version pinned",
  },
  FinalSubmissionMissing: { phase: "Work record", title: "Final work submitted" },
  WorkIncomplete: { phase: "Work record", title: "Required work complete" },
  ContributionUnresolved: {
    phase: "Attribution",
    title: "Contribution attribution resolved",
  },
  CriterionEvaluationMissing: {
    phase: "Evaluation",
    title: "Every criterion evaluated",
  },
  RequiredCriterionUnsatisfied: {
    phase: "Evaluation",
    title: "Required criteria satisfied",
  },
  CompanyApprovalMissing: {
    phase: "Approval",
    title: "Company approval recorded",
  },
  UniversityApprovalMissing: {
    phase: "Approval",
    title: "University approval recorded",
  },
  InconsistentLineage: {
    phase: "Integrity",
    title: "Same-lineage invariant verified",
  },
  ActiveCardExists: { phase: "Issuance", title: "One active card rule checked" },
};

function getConditionPresentation(code: string) {
  return (
    conditionPresentation[code] ?? {
      phase: "Issuance gate",
      title: code.replace(/([A-Z])/g, " $1").trim(),
    }
  );
}

const conditionOrder: Record<string, number> = {
  ProviderVerified: 10,
  ParticipationEligible: 20,
  ContractVersionPinned: 30,
  FinalSubmissionMissing: 40,
  WorkIncomplete: 50,
  ContributionUnresolved: 60,
  CriterionEvaluationMissing: 70,
  RequiredCriterionUnsatisfied: 80,
  CompanyApprovalMissing: 90,
  UniversityApprovalMissing: 100,
  InconsistentLineage: 110,
  ActiveCardExists: 120,
};

export default function EvidenceReadinessPanel({
  readiness,
  onResolveCondition,
}: {
  readiness: EvidenceReadiness;
  onResolveCondition?: (code: string) => void;
}) {
  const blockerCount = readiness.conditions.filter(
    (condition) => condition.state !== "Complete",
  ).length;
  const completedCount = readiness.conditions.length - blockerCount;
  const totalConditions = readiness.conditions.length;
  const orderedConditions = [...readiness.conditions].sort(
    (left, right) =>
      (conditionOrder[left.code] ?? Number.MAX_SAFE_INTEGER) -
        (conditionOrder[right.code] ?? Number.MAX_SAFE_INTEGER) ||
      left.code.localeCompare(right.code),
  );

  return (
    <section
      className={`${styles.panel} ${styles.readinessPanel}`}
      aria-labelledby="evidence-readiness-title"
      data-ready={readiness.ready ? "true" : "false"}
    >
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.readinessKicker}>Evidence issuance gate</span>
          <h3 id="evidence-readiness-title">Readiness timeline</h3>
          <p>
            Contract version {readiness.acceptedContractVersionNumber ?? "not pinned"}
            {readiness.submissionRevision > 0
              ? ` · submission revision ${readiness.submissionRevision}`
              : ""}
          </p>
          <small className={styles.readinessSummary}>
            {readiness.ready
              ? "Every required integrity condition is satisfied."
              : `${blockerCount} ${blockerCount === 1 ? "condition needs" : "conditions need"} attention before a card can be issued.`}
          </small>
        </div>
        <SbBadge tone={readiness.ready ? "approved" : "blocked"}>
          {readiness.ready ? "Ready to issue" : "Issuance blocked"}
        </SbBadge>
      </header>
      <div className={styles.readinessTimelineIntro}>
        <div>
          <span className={styles.timelineEyebrow}>Integrity progress</span>
          <strong>
            {completedCount} of {totalConditions} checks verified
          </strong>
          <p>
            SkillBridge checks the complete evidence lineage before it creates
            an active evidence card.
          </p>
        </div>
        <div
          className={styles.readinessProgress}
          aria-label={`${completedCount} of ${totalConditions} evidence issuance checks verified`}
        >
          <span aria-hidden="true">
            <i
              style={{
                width: `${totalConditions > 0 ? (completedCount / totalConditions) * 100 : 0}%`,
              }}
            />
          </span>
          <small>{readiness.ready ? "Gate open" : "Gate protected"}</small>
        </div>
      </div>

      <ol className={styles.readinessTimeline} aria-label="Evidence issuance checkpoints">
        {orderedConditions.map((condition, index) => {
          const stateLabel = condition.state === "Complete"
            ? "SATISFIED"
            : condition.state.toUpperCase();
          const presentation = getConditionPresentation(condition.code);
          const Icon = condition.state === "Complete"
            ? CheckCircle2
            : condition.state === "Missing"
              ? CircleDashed
              : condition.state === "Inconsistent"
                ? ShieldAlert
                : AlertTriangle;
          return (
            <li
              className={`${styles.timelineStep} ${styles[condition.state.toLowerCase()]}`}
              key={`${condition.code}-${condition.criterionId ?? "general"}`}
            >
              <span className={styles.timelineMarker} aria-hidden="true">
                <Icon size={17} />
              </span>
              <div className={styles.timelineContent}>
                <div className={styles.timelineMeta}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <small>{presentation.phase}</small>
                </div>
                <div className={styles.conditionTitle}>
                  <strong>{presentation.title}</strong>
                  <span>{stateLabel}</span>
                </div>
                <p>{condition.message}</p>
                {condition.state !== "Complete" && onResolveCondition ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className={styles.resolveButton}
                    onClick={() => onResolveCondition(condition.code)}
                  >
                    Review next step
                    <ArrowRight size={14} aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      {readiness.criteria.length > 0 ? (
        <section className={styles.criteriaPreview} aria-label="Criterion claim preview">
          <header>
            <div>
              <span>Claim preview</span>
              <strong>What the current evaluation can support</strong>
            </div>
            <small>Every defined criterion is shown here.</small>
          </header>
          <div>
            {readiness.criteria.map((criterion) => (
              <article key={criterion.criterionId}>
                {criterion.isSupported ? (
                  <CheckCircle2 size={17} aria-hidden="true" />
                ) : (
                  <AlertTriangle size={17} aria-hidden="true" />
                )}
                <div>
                  <strong>{criterion.title}</strong>
                  <span>
                    {criterion.isRequired ? "Required" : "Optional"} · {criterion.isSupported
                      ? "Supported by this evidence"
                      : criterion.isRequired
                        ? "Required criterion is not satisfied"
                        : "Not supported by this evidence"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
