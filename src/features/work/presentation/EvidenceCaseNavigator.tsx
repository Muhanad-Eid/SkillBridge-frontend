import {
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  FileUp,
  Fingerprint,
  GitBranch,
  LockKeyhole,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { EvidenceReadiness } from "../../evidence/domain/evidenceTypes";
import { OpportunityTypes } from "../../projects/domain/projectTypes";
import {
  buildEvidenceCaseStages,
  type EvidenceCaseStageState,
} from "../domain/evidenceCaseStages";
import type { WorkRecord } from "../domain/workTypes";
import styles from "./EvidenceCaseNavigator.module.scss";

type EvidenceCaseNavigatorProps = {
  record: WorkRecord;
  readiness: EvidenceReadiness | null;
  isCompany: boolean;
  isUniversitySupervisor?: boolean;
  onNavigate: (targetId: string) => void;
};

const stateLabels: Record<EvidenceCaseStageState, string> = {
  complete: "Satisfied",
  action: "Action required",
  waiting: "Waiting",
  blocked: "Blocked",
};

const stageIcons: Record<string, LucideIcon> = {
  Contract: ClipboardCheck,
  Work: FileUp,
  Attribution: GitBranch,
  Evaluation: ShieldCheck,
  Approvals: BadgeCheck,
  Proof: Fingerprint,
};

export default function EvidenceCaseNavigator({
  record,
  readiness,
  isCompany,
  isUniversitySupervisor = false,
  onNavigate,
}: EvidenceCaseNavigatorProps) {
  const stages = buildEvidenceCaseStages(
    record,
    readiness,
    isCompany,
    isUniversitySupervisor,
  );
  const satisfiedCount = stages.filter(
    (stage) => stage.state === "complete",
  ).length;
  const portal = isUniversitySupervisor
    ? "university"
    : isCompany
      ? "company"
      : "job-seeker";
  const isUniversityTraining =
    record.opportunityType === OpportunityTypes.UniversityTraining;
  const companyApprovalComplete =
    Boolean(record.companyApprovedAt) && !record.approvalIsStale;
  const universityApprovalComplete =
    Boolean(record.universityApprovedAt) && !record.approvalIsStale;
  const universityApprovalAvailable =
    companyApprovalComplete && !universityApprovalComplete;

  return (
    <section className={styles.caseNavigator} aria-labelledby="evidence-case-title">
      <header>
        <div>
          <span>Evidence case</span>
          <h3 id="evidence-case-title">Evidence route</h3>
        </div>
        <strong>
          {satisfiedCount}/{stages.length} stages satisfied
        </strong>
      </header>
      <ol className={styles.stageList}>
        {stages.map((stage, index) => {
          const Icon = stageIcons[stage.label] ?? ShieldCheck;
          return (
            <li
              className={styles.stageItem}
              key={stage.label}
              data-state={stage.state}
            >
              <button type="button" onClick={() => onNavigate(stage.targetId)}>
                <span className={styles.index}>{index + 1}</span>
                <Icon size={18} aria-hidden="true" />
                <span className={styles.copy}>
                  <strong>{stage.label}</strong>
                  <small>{stage.detail}</small>
                </span>
                <span className={styles.state}>
                  {stateLabels[stage.state]}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {isUniversityTraining && (
        <section
          className={styles.approvalRail}
          aria-labelledby="training-approval-gates"
        >
          <div className={styles.approvalIntro}>
            <span>Mandatory sequence</span>
            <strong id="training-approval-gates">
              University Training approvals
            </strong>
          </div>
          <ol>
            <li data-complete={companyApprovalComplete}>
              <button type="button" onClick={() => onNavigate("final-review")}>
                <span>01</span>
                <span>
                  <strong>Company approval</strong>
                  <small>Provider supervision and work review</small>
                </span>
                {companyApprovalComplete ? (
                  <CheckCircle2 aria-hidden="true" size={18} />
                ) : (
                  <BadgeCheck aria-hidden="true" size={18} />
                )}
                <em>{companyApprovalComplete ? "Approved" : "Required"}</em>
              </button>
            </li>
            <li data-complete={universityApprovalComplete}>
              <button
                type="button"
                onClick={() =>
                  onNavigate(
                    universityApprovalAvailable
                      ? "university-approval"
                      : universityApprovalComplete
                        ? "evidence-readiness"
                        : "academic-monitoring",
                  )
                }
              >
                <span>02</span>
                <span>
                  <strong>University approval</strong>
                  <small>Academic monitoring and outcome review</small>
                </span>
                {universityApprovalComplete ? (
                  <CheckCircle2 aria-hidden="true" size={18} />
                ) : (
                  <BadgeCheck aria-hidden="true" size={18} />
                )}
                <em>
                  {universityApprovalComplete
                    ? "Approved"
                    : universityApprovalAvailable
                      ? "Ready for review"
                      : "Locked until step 01"}
                </em>
              </button>
            </li>
          </ol>
          <div className={styles.issuanceGate}>
            <LockKeyhole aria-hidden="true" size={17} />
            <span>
              <strong>Issuance gate</strong>
              <small>
                {companyApprovalComplete && universityApprovalComplete
                  ? "Both approvals recorded"
                  : "Locked until both approvals are recorded"}
              </small>
            </span>
          </div>
        </section>
      )}
      <footer>
        <nav aria-label="Evidence case actions">
          <Link
            to={`/${portal}/evidence-requests?applicationId=${record.applicationId}`}
          >
            Evidence requests
          </Link>
          <Link to={`/${portal}/proof-engine/${record.applicationId}`}>
            Open evidence checks
          </Link>
        </nav>
      </footer>
    </section>
  );
}
