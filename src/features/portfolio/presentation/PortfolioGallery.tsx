import {
  BriefcaseBusiness,
  ExternalLink,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import Button from "../../../shared/components/Button";
import EmptyState from "../../../shared/components/EmptyState";
import { getOpportunityTypeLabel } from "../../projects/domain/projectTypes";
import type { PortfolioItem } from "../domain/portfolioTypes";

type PortfolioGalleryProps = {
  items: PortfolioItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  onEdit?: (item: PortfolioItem) => void;
  onDelete?: (item: PortfolioItem) => void;
};

function getValidWorkUrl(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export default function PortfolioGallery({
  items,
  emptyTitle = "No portfolio items yet",
  emptyDescription = "Completed work will appear here.",
  onEdit,
  onDelete,
}: PortfolioGalleryProps) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="portfolio-gallery">
      {items.map((item) => {
        const workUrl = getValidWorkUrl(item.projectUrl);

        return (
          <article className="portfolio-evidence-card" key={item.id}>
            <header>
              <div>
                <span className="portfolio-evidence-type">
                  {getOpportunityTypeLabel(item.opportunityType)}
                </span>
                <h3>{item.projectTitle}</h3>
                <p>
                  <BriefcaseBusiness size={15} aria-hidden="true" />
                  {item.companyName}
                </p>
              </div>
              {onEdit || onDelete ? (
                <div className="portfolio-card-actions">
                  {onEdit ? (
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label={`Edit ${item.projectTitle}`}
                      title="Edit portfolio item"
                      onClick={() => onEdit(item)}
                    >
                      <Pencil size={17} aria-hidden="true" />
                    </Button>
                  ) : null}
                  {onDelete ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="button-danger"
                      aria-label={`Delete ${item.projectTitle}`}
                      title="Delete portfolio item"
                      onClick={() => onDelete(item)}
                    >
                      <Trash2 size={17} aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </header>

            <p className="portfolio-evidence-description">
              {item.description ?? "No work summary was provided."}
            </p>

            {item.skills.length > 0 ? (
              <div className="portfolio-skill-list" aria-label="Project skills">
                {item.skills.map((skill) => (
                  <span key={skill.id}>{skill.name}</span>
                ))}
              </div>
            ) : null}

            {item.reviewRating !== null ? (
              <div className="portfolio-review">
                <span>
                  <Star size={16} fill="currentColor" aria-hidden="true" />
                  {item.reviewRating} / 5 company review
                </span>
                {item.reviewComment ? <p>{item.reviewComment}</p> : null}
              </div>
            ) : null}

            {item.projectUrl ? (
              <div
                className={`portfolio-work-url${workUrl ? "" : " invalid"}`}
              >
                <ExternalLink size={14} aria-hidden="true" />
                <span>{item.projectUrl}</span>
                {!workUrl ? <strong>Invalid URL</strong> : null}
              </div>
            ) : null}

            <footer>
              <Button
                to={`/opportunities/${item.projectId}`}
                variant="primary"
              >
                Open work
              </Button>
            </footer>
          </article>
        );
      })}
    </div>
  );
}
