import { useEffect, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  FileCheck2,
  History,
  LockKeyhole,
  Route,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import Button from "../../../shared/components/Button";
import StatusBadge from "../../../shared/components/StatusBadge";
import {
  EvidenceCardStatuses,
  getEvidenceCardStatusLabel,
  type EvidenceDetails,
} from "../../evidence/domain/evidenceTypes";
import { getEvidenceDetailsAsync } from "../../evidence/infrastructure/evidenceApi";
import ClaimBoundaryPanel from "../../evidence/presentation/ClaimBoundaryPanel";
import EvidenceTrace from "../../evidence/presentation/EvidenceTrace";
import {
  getOpportunityTypeLabel,
  OpportunityTypes,
} from "../../projects/domain/projectTypes";
import type {
  PortfolioCriterionEvaluation,
  PortfolioItem,
} from "../domain/portfolioTypes";

type EvidenceDetailsDialogProps = {
  item: PortfolioItem;
  onClose: () => void;
};

function evidenceReference(id: number) {
  return `SB-EV-${String(id).padStart(6, "0")}`;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Not recorded";
}

function evidenceAge(value: string | null) {
  if (!value) return "Approval date unavailable";

  const approvedAt = new Date(value);
  const days = Math.max(
    0,
    Math.floor((Date.now() - approvedAt.getTime()) / 86_400_000),
  );

  if (days < 30) return "Approved this month";
  if (days < 365) {
    const months = Math.max(1, Math.floor(days / 30));
    return `Approved ${months} month${months === 1 ? "" : "s"} ago`;
  }

  const years = Math.max(1, Math.floor(days / 365));
  return `Approved ${years} year${years === 1 ? "" : "s"} ago`;
}

function ratingLabel(rating: PortfolioCriterionEvaluation["rating"]) {
  if (rating === 3) return "Exceeds standard";
  if (rating === 2) return "Meets standard";
  return "Needs improvement";
}

export default function EvidenceDetailsDialog({
  item,
  onClose,
}: EvidenceDetailsDialogProps) {
  const [details, setDetails] = useState<EvidenceDetails | null>(null);
  const [detailsError, setDetailsError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!item.isEvidenceCard) return;
    void getEvidenceDetailsAsync(item.id)
      .then((result) => {
        if (!cancelled) setDetails(result);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setDetailsError(
            error instanceof Error ? error.message : "Unable to load evidence trace.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [item.id, item.isEvidenceCard]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const isTraining =
    item.opportunityType === OpportunityTypes.UniversityTraining;
  const approvalRoute = isTraining
    ? "Company and university"
    : "Verified provider";
  const completedChecks =
    2 +
    Number(item.providerVerifiedAtApproval) +
    Number(
      item.milestoneCount === 0 ||
        item.approvedMilestoneCount === item.milestoneCount,
    ) +
    Number(!isTraining || Boolean(item.universityApprovedAt));

  const timeline = [
    {
      label: "Application received",
      date: item.applicationSubmittedAt,
    },
    {
      label: "Final work submitted",
      date: item.finalSubmittedAt,
    },
    {
      label: "Provider approval",
      date: item.companyApprovedAt,
    },
    ...(isTraining
      ? [
          {
            label: "University approval",
            date: item.universityApprovedAt,
          },
        ]
      : []),
    {
      label: "Evidence Card generated",
      date: item.approvedAt,
    },
  ].filter((event) => event.date);

  return (
    <div
      className="evidence-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="evidence-dialog-title"
        aria-modal="true"
        className="evidence-dialog evidence-chain-dialog"
        role="dialog"
      >
        <header>
          <div>
            <div className="evidence-dialog-kicker">
              <StatusBadge tone="blue">
                {getOpportunityTypeLabel(item.opportunityType)}
              </StatusBadge>
              <span>{evidenceReference(item.id)}</span>
              <StatusBadge
                tone={
                  item.evidenceStatus === EvidenceCardStatuses.Active
                    ? "green"
                    : "red"
                }
              >
                {getEvidenceCardStatusLabel(item.evidenceStatus)}
              </StatusBadge>
            </div>
            <h2 id="evidence-dialog-title">{item.projectTitle}</h2>
            <p>
              <BriefcaseBusiness size={15} aria-hidden="true" />
              {item.companyName}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            autoFocus
            aria-label="Close evidence details"
            title="Close"
            onClick={onClose}
          >
            <X size={19} aria-hidden="true" />
          </Button>
        </header>

        {item.coverImageUrl ? (
          <img
            className="evidence-dialog-cover"
            src={item.coverImageUrl}
            alt=""
          />
        ) : null}

        <div className="evidence-dialog-verification">
          <ShieldCheck size={21} aria-hidden="true" />
          <div>
            <strong>System-generated evidence</strong>
            <span>
              This record was created from completed work after the required
              approval. The owner can control sharing and presentation, but
              cannot rewrite the source work, evaluation, evaluator, or dates.
            </span>
          </div>
          <strong>{completedChecks}/5 checks</strong>
        </div>

        <section className="evidence-chain-summary">
          <header>
            <div>
              <span>Evidence Chain</span>
              <h3>Why this record can be checked</h3>
            </div>
            <span>{evidenceAge(item.approvedAt)}</span>
          </header>
          <dl>
            <div>
              <BadgeCheck size={18} aria-hidden="true" />
              <dt>Provider</dt>
              <dd>
                {item.providerVerifiedAtApproval
                  ? "Verified at approval"
                  : "Verification unavailable"}
              </dd>
            </div>
            <div>
              <CheckCircle2 size={18} aria-hidden="true" />
              <dt>Milestones</dt>
              <dd>
                {item.milestoneCount > 0
                  ? `${item.approvedMilestoneCount}/${item.milestoneCount} approved`
                  : "No milestones required"}
              </dd>
            </div>
            <div>
              <Route size={18} aria-hidden="true" />
              <dt>Approval route</dt>
              <dd>{approvalRoute}</dd>
            </div>
            <div>
              <LockKeyhole size={18} aria-hidden="true" />
              <dt>Core record</dt>
              <dd>Locked after approval</dd>
            </div>
          </dl>
        </section>

        {detailsError ? (
          <div className="notice notice-error">{detailsError}</div>
        ) : null}
        {details ? (
          <div className="evidence-protocol-details">
            <ClaimBoundaryPanel boundary={details.claimBoundary} />
            <EvidenceTrace trace={details.trace} />
            {details.statusHistory.length > 1 ? (
              <section className="evidence-record-section">
                <header><span>History</span><h3>Correction history</h3></header>
                <ul>
                  {details.statusHistory.map((event) => (
                    <li key={`${event.occurredAt}-${event.newStatus}`}>
                      {getEvidenceCardStatusLabel(event.previousStatus)} to {" "}
                      {getEvidenceCardStatusLabel(event.newStatus)}: {event.reason}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : null}

        {item.ownerSummary ? (
          <section className="evidence-dialog-owner-summary">
            <span>Owner's overview</span>
            <p>{item.ownerSummary}</p>
          </section>
        ) : null}

        <div className="evidence-dialog-layout">
          <main>
            <section className="evidence-record-section">
              <header>
                <span>01</span>
                <h3>Approved work record</h3>
              </header>
              <dl className="evidence-dialog-grid">
                <section>
                  <dt>Required deliverable</dt>
                  <dd>{item.deliverables || "Not recorded."}</dd>
                </section>
                <section>
                  <dt>Completed work</dt>
                  <dd>{item.description ?? "Approved completed work."}</dd>
                </section>
                <section>
                  <dt>Individual contribution</dt>
                  <dd>
                    {item.contribution ?? "No contribution summary recorded."}
                  </dd>
                </section>
                <section>
                  <dt>Overall evaluation</dt>
                  <dd>{item.evaluationResult ?? "Final approval recorded."}</dd>
                </section>
              </dl>
            </section>

            <section className="evidence-record-section">
              <header>
                <span>02</span>
                <h3>Evaluation breakdown</h3>
              </header>
              {item.criterionEvaluations.length > 0 ? (
                <div className="evidence-criterion-results">
                  {item.criterionEvaluations.map((evaluation) => (
                    <article key={evaluation.criterion}>
                      <div>
                        <strong>{evaluation.criterion}</strong>
                        <StatusBadge
                          tone={evaluation.rating === 1 ? "red" : "green"}
                        >
                          {ratingLabel(evaluation.rating)}
                        </StatusBadge>
                      </div>
                      <p>{evaluation.note}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="evidence-legacy-evaluation">
                  <span>Evaluation criteria</span>
                  <p>{item.evaluationCriteria || "Final approval recorded."}</p>
                  <small>
                    This evidence was approved before structured criterion
                    results were introduced.
                  </small>
                </div>
              )}
            </section>
          </main>

          <aside className="evidence-provenance">
            <header>
              <History size={18} aria-hidden="true" />
              <div>
                <span>Provenance</span>
                <h3>Record history</h3>
              </div>
            </header>
            <ol>
              {timeline.map((event) => (
                <li key={event.label}>
                  <CircleDot size={15} aria-hidden="true" />
                  <div>
                    <strong>{event.label}</strong>
                    <span>{formatDate(event.date)}</span>
                  </div>
                </li>
              ))}
            </ol>
            <div className="evidence-approval-source">
              <span>Approved by</span>
              <strong>{item.evaluatorName ?? item.companyName}</strong>
              <small>{formatDate(item.approvedAt)}</small>
            </div>
            {isTraining && item.trainingReportCount > 0 ? (
              <div className="evidence-approval-source">
                <span>Training reports</span>
                <strong>
                  {item.approvedTrainingReportCount}/{item.trainingReportCount}{" "}
                  approved
                </strong>
              </div>
            ) : null}
          </aside>
        </div>

        {item.skills.length > 0 ? (
          <div className="evidence-dialog-skills">
            <span>Skills demonstrated</span>
            <div>
              {item.skills.map((skill) => (
                <span key={skill.id}>{skill.name}</span>
              ))}
            </div>
          </div>
        ) : null}

        {item.reviewRating !== null ? (
          <section className="evidence-dialog-review">
            <strong>
              <Star size={17} fill="currentColor" aria-hidden="true" />
              {item.reviewRating} / 5 provider review
            </strong>
            {item.reviewComment ? <p>{item.reviewComment}</p> : null}
          </section>
        ) : null}

        <footer>
          {item.projectUrl && !item.confidentialSummary ? (
            <a
              className="button button-primary"
              href={item.projectUrl}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={16} aria-hidden="true" />
              Open deliverable
            </a>
          ) : null}
          <Button type="button" variant="secondary" onClick={onClose}>
            <FileCheck2 size={16} aria-hidden="true" />
            Close
          </Button>
        </footer>
      </section>
    </div>
  );
}
