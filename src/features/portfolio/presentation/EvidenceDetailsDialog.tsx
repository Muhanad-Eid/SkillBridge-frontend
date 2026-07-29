import { useEffect } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  ExternalLink,
  FileCheck2,
  ShieldCheck,
  Star,
  UserRoundCheck,
  X,
} from "lucide-react";
import Button from "../../../shared/components/Button";
import StatusBadge from "../../../shared/components/StatusBadge";
import { getOpportunityTypeLabel } from "../../projects/domain/projectTypes";
import type { PortfolioItem } from "../domain/portfolioTypes";

type EvidenceDetailsDialogProps = {
  item: PortfolioItem;
  onClose: () => void;
};

export default function EvidenceDetailsDialog({
  item,
  onClose,
}: EvidenceDetailsDialogProps) {
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
        className="evidence-dialog"
        role="dialog"
      >
        <header>
          <div>
            <StatusBadge tone="blue">
              {getOpportunityTypeLabel(item.opportunityType)}
            </StatusBadge>
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

        {item.ownerSummary ? (
          <section className="evidence-dialog-owner-summary">
            <span>Overview</span>
            <p>{item.ownerSummary}</p>
          </section>
        ) : null}

        <div className="evidence-dialog-verification">
          <ShieldCheck size={20} aria-hidden="true" />
          <div>
            <strong>Approved SkillBridge work</strong>
            <span>
              The contribution and evaluation below come from the completed
              opportunity record.
            </span>
          </div>
        </div>

        <div className="evidence-dialog-grid">
          <section>
            <span>Completed work</span>
            <p>{item.description ?? "Approved completed work."}</p>
          </section>
          <section>
            <span>Individual contribution</span>
            <p>{item.contribution ?? "No contribution summary recorded."}</p>
          </section>
          <section>
            <span>Evaluation</span>
            <p>{item.evaluationResult ?? "Final approval recorded."}</p>
          </section>
          <section>
            <span>Approval</span>
            <p>
              <UserRoundCheck size={16} aria-hidden="true" />
              {item.evaluatorName ?? item.companyName}
            </p>
            {item.approvedAt ? (
              <p>
                <CalendarDays size={16} aria-hidden="true" />
                {new Date(item.approvedAt).toLocaleDateString()}
              </p>
            ) : null}
          </section>
        </div>

        {item.skills.length > 0 ? (
          <div className="evidence-dialog-skills">
            {item.skills.map((skill) => (
              <span key={skill.id}>{skill.name}</span>
            ))}
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
          {item.projectUrl ? (
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
