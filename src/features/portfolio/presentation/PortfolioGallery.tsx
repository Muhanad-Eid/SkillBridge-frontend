import { useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  FileCheck2,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import Button from "../../../shared/components/Button";
import EmptyState from "../../../shared/components/EmptyState";
import StatusBadge from "../../../shared/components/StatusBadge";
import { getOpportunityTypeLabel } from "../../projects/domain/projectTypes";
import type { PortfolioItem } from "../domain/portfolioTypes";
import EvidenceDetailsDialog from "./EvidenceDetailsDialog";

type PortfolioGalleryProps = {
  items: PortfolioItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  onEdit?: (item: PortfolioItem) => void;
  onDelete?: (item: PortfolioItem) => void;
};

export default function PortfolioGallery({
  items,
  emptyTitle = "No shared evidence",
  emptyDescription = "Approved work shared by this person will appear here.",
  onEdit,
  onDelete,
}: PortfolioGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      <div className="portfolio-gallery evidence-portfolio-grid">
        {items.map((item) => (
          <article
            className={`portfolio-evidence-card${
              item.isFeatured ? " featured" : ""
            }`}
            key={item.id}
          >
            {item.coverImageUrl ? (
              <button
                type="button"
                className="portfolio-evidence-cover"
                aria-label={`View evidence for ${item.projectTitle}`}
                onClick={() => setSelectedItem(item)}
              >
                <img src={item.coverImageUrl} alt="" loading="lazy" />
              </button>
            ) : (
              <button
                type="button"
                className="portfolio-evidence-cover placeholder"
                aria-label={`View evidence for ${item.projectTitle}`}
                onClick={() => setSelectedItem(item)}
              >
                <FileCheck2 size={30} aria-hidden="true" />
              </button>
            )}

            <div className="portfolio-evidence-body">
              <header>
                <div>
                  <StatusBadge tone={item.isFeatured ? "blue" : "neutral"}>
                    {item.isFeatured
                      ? "Featured"
                      : getOpportunityTypeLabel(item.opportunityType)}
                  </StatusBadge>
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
                        title="Edit presentation"
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
                {item.ownerSummary ??
                  item.description ??
                  "Approved completed work."}
              </p>

              {item.skills.length > 0 ? (
                <div className="portfolio-skill-list" aria-label="Skills">
                  {item.skills.slice(0, 4).map((skill) => (
                    <span key={skill.id}>{skill.name}</span>
                  ))}
                  {item.skills.length > 4 ? (
                    <span>+{item.skills.length - 4}</span>
                  ) : null}
                </div>
              ) : null}

              <footer>
                <span>
                  <CalendarDays size={14} aria-hidden="true" />
                  {item.approvedAt
                    ? new Date(item.approvedAt).toLocaleDateString()
                    : "Approved"}
                </span>
                {item.reviewRating !== null ? (
                  <span>
                    <Star size={14} fill="currentColor" aria-hidden="true" />
                    {item.reviewRating}/5
                  </span>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setSelectedItem(item)}
                >
                  View evidence
                </Button>
              </footer>
            </div>
          </article>
        ))}
      </div>

      {selectedItem ? (
        <EvidenceDetailsDialog
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      ) : null}
    </>
  );
}
