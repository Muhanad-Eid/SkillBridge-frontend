import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  ExternalLink,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import { getOpportunityTypeLabel } from "../../projects/domain/projectTypes";
import type { PortfolioItem } from "../domain/portfolioTypes";
import {
  getMyPortfolioAsync,
  updatePortfolioItemAsync,
} from "../infrastructure/portfolioApi";

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadPortfolio() {
    setIsLoading(true);
    setError("");
    try {
      setItems(await getMyPortfolioAsync());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load the Evidence Portfolio.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadPortfolio(), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const stats = useMemo(
    () => ({
      total: items.length,
      shared: items.filter((item) => item.isVisible).length,
      evaluated: items.filter((item) => item.evaluationResult).length,
    }),
    [items],
  );

  async function changeVisibility(item: PortfolioItem) {
    setBusyItemId(item.id);
    setError("");
    setMessage("");
    try {
      await updatePortfolioItemAsync(item.id, {
        description: item.description ?? undefined,
        projectUrl: item.projectUrl ?? undefined,
        isVisible: !item.isVisible,
      });
      setMessage(
        item.isVisible
          ? "Evidence card is now private."
          : "Evidence card is now visible in your shared portfolio.",
      );
      await loadPortfolio();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update sharing.",
      );
    } finally {
      setBusyItemId(null);
    }
  }

  return (
    <section className="page portfolio-page portfolio-evidence-page">
      <PageHeader title="Evidence Portfolio" />

      <div className="portfolio-summary-grid">
        <article>
          <span>Evidence cards</span>
          <strong>{stats.total}</strong>
        </article>
        <article>
          <span>Shared</span>
          <strong>{stats.shared}</strong>
        </article>
        <article>
          <span>With evaluation</span>
          <strong>{stats.evaluated}</strong>
        </article>
      </div>

      <div className="portfolio-guidance-band">
        <ShieldCheck size={22} aria-hidden="true" />
        <div>
          <strong>Evidence comes from approved SkillBridge work.</strong>
          <span>
            Cards are private when created. You decide which approved records
            appear in your shared portfolio.
          </span>
        </div>
      </div>

      {message ? <div className="notice notice-success">{message}</div> : null}
      {error ? <div className="notice notice-error">{error}</div> : null}

      <DataState
        isLoading={isLoading}
        error={items.length === 0 ? error : ""}
        empty={!isLoading && !error && items.length === 0}
        emptyTitle="No approved evidence yet"
        emptyDescription="Complete accepted work and receive final provider approval. The evidence card will appear here automatically."
      />

      <div className="evidence-card-list">
        {items.map((item) => (
          <article className="evidence-card" key={item.id}>
            <header>
              <div className="evidence-card-mark" aria-hidden="true">
                <FileCheck2 size={22} />
              </div>
              <div>
                <span>{getOpportunityTypeLabel(item.opportunityType)}</span>
                <h2>{item.projectTitle}</h2>
                <p>{item.companyName}</p>
              </div>
              <StatusBadge tone={item.isVisible ? "green" : "neutral"}>
                {item.isVisible ? "Shared" : "Private"}
              </StatusBadge>
            </header>

            <div className="evidence-card-grid">
              <section>
                <span>Approved work</span>
                <p>{item.description ?? "Approved completed work."}</p>
              </section>
              <section>
                <span>Individual contribution</span>
                <p>{item.contribution ?? item.description}</p>
              </section>
              <section>
                <span>Evaluation</span>
                <p>{item.evaluationResult ?? "Final approval recorded."}</p>
              </section>
              <section>
                <span>Approved by</span>
                <p>{item.evaluatorName ?? item.companyName}</p>
                {item.approvedAt ? (
                  <small>
                    {new Date(item.approvedAt).toLocaleDateString()}
                  </small>
                ) : null}
              </section>
            </div>

            <div className="evidence-card-skills">
              {item.skills.map((skill) => (
                <span key={skill.id}>{skill.name}</span>
              ))}
            </div>

            <footer>
              <Button
                type="button"
                variant={item.isVisible ? "secondary" : "primary"}
                isLoading={busyItemId === item.id}
                onClick={() => void changeVisibility(item)}
              >
                {item.isVisible ? (
                  <EyeOff size={16} aria-hidden="true" />
                ) : (
                  <Eye size={16} aria-hidden="true" />
                )}
                {item.isVisible ? "Make private" : "Share card"}
              </Button>
              {item.projectUrl ? (
                <a
                  className="button button-secondary"
                  href={item.projectUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={16} aria-hidden="true" />
                  Open deliverable
                </a>
              ) : null}
              {item.reviewRating ? (
                <span className="evidence-card-rating">
                  <CheckCircle2 size={16} aria-hidden="true" />
                  Company review {item.reviewRating}/5
                </span>
              ) : null}
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
