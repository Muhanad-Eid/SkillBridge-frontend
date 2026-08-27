import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Copy,
  Eye,
  EyeOff,
  FileCheck2,
  Image,
  ListChecks,
  Pencil,
  Pin,
  Search,
  Share2,
  ShieldCheck,
  Star,
  Unlink,
  X,
} from "lucide-react";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import {
  getOpportunityTypeLabel,
  OpportunityTypes,
} from "../../projects/domain/projectTypes";
import type { PublicShareSummary } from "../../evidence/domain/evidenceTypes";
import {
  createPublicEvidenceShareAsync,
  disablePublicEvidenceShareAsync,
  getCriterionEvidenceCoverageAsync,
  getPublicEvidenceSharesAsync,
} from "../../evidence/infrastructure/evidenceApi";
import type { CriterionEvidenceCoverage } from "../../evidence/domain/evidenceTypes";
import { getProjectsAsync } from "../../projects/infrastructure/projectApi";
import { ProjectStatuses, type Project } from "../../projects/domain/projectTypes";
import type { PortfolioItem } from "../domain/portfolioTypes";
import {
  getMyPortfolioAsync,
  updatePortfolioItemAsync,
} from "../infrastructure/portfolioApi";
import EvidenceDetailsDialog from "./EvidenceDetailsDialog";
import CriterionCoveragePanel from "../../evidence/presentation/CriterionCoveragePanel";

const visibilityOptions = [
  { label: "All evidence", value: "all" },
  { label: "Shared", value: "shared" },
  { label: "Private", value: "private" },
];

function sortPortfolio(items: PortfolioItem[]) {
  return [...items].sort((left, right) => {
    if (left.isFeatured !== right.isFeatured) {
      return Number(right.isFeatured) - Number(left.isFeatured);
    }

    const leftDate = left.approvedAt
      ? new Date(left.approvedAt).getTime()
      : left.id;
    const rightDate = right.approvedAt
      ? new Date(right.approvedAt).getTime()
      : right.id;

    return rightDate - leftDate;
  });
}

function evidenceReference(id: number) {
  return `SB-EV-${String(id).padStart(6, "0")}`;
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Some desktop browser shells expose Clipboard but reject the permission request.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [shares, setShares] = useState<PublicShareSummary[]>([]);
  const [publicPath, setPublicPath] = useState("");
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [ownerSummary, setOwnerSummary] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [editVisible, setEditVisible] = useState(false);
  const [editFeatured, setEditFeatured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState<number | null>(null);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [comparisonProjects, setComparisonProjects] = useState<Project[]>([]);
  const [comparisonProjectId, setComparisonProjectId] = useState("");
  const [criterionCoverage, setCriterionCoverage] =
    useState<CriterionEvidenceCoverage | null>(null);
  const [isLoadingCoverage, setIsLoadingCoverage] = useState(false);
  const [coverageError, setCoverageError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadPortfolio() {
    setIsLoading(true);
    setError("");
    try {
      const [portfolio, publicShares] = await Promise.all([
        getMyPortfolioAsync(),
        getPublicEvidenceSharesAsync(),
      ]);
      setItems(portfolio);
      setShares(publicShares);
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

  useEffect(() => {
    let active = true;

    void getProjectsAsync({ pageSize: 50 })
      .then((result) => {
        if (!active) return;
        setComparisonProjects(
          result.items.filter((project) => project.status === ProjectStatuses.Open),
        );
      })
      .catch(() => {
        if (active) setComparisonProjects([]);
      });

    return () => {
      active = false;
    };
  }, []);

  async function selectComparisonProject(value: string) {
    setComparisonProjectId(value);
    setCriterionCoverage(null);
    setCoverageError("");

    const projectId = Number(value);
    if (!projectId) return;

    setIsLoadingCoverage(true);
    try {
      setCriterionCoverage(await getCriterionEvidenceCoverageAsync(projectId));
    } catch (caughtError) {
      setCoverageError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to compare evidence for this opportunity.",
      );
    } finally {
      setIsLoadingCoverage(false);
    }
  }

  useEffect(() => {
    if (!editingItem) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeEditor();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingItem]);

  const stats = useMemo(
    () => ({
      total: items.length,
      shared: items.filter((item) => item.isVisible).length,
      featured: items.filter((item) => item.isFeatured).length,
    }),
    [items],
  );

  const shareableCardIds = useMemo(
    () =>
      items
        .filter((item) => item.isVisible && item.isEvidenceCard && item.evidenceStatus === 0)
        .map((item) => item.id),
    [items],
  );

  const filteredItems = useMemo(() => {
    const value = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesVisibility =
        visibility === "all" ||
        (visibility === "shared" ? item.isVisible : !item.isVisible);
      const matchesType =
        typeFilter === "all" || item.opportunityType === Number(typeFilter);
      const matchesSearch =
        !value ||
        item.projectTitle.toLowerCase().includes(value) ||
        item.companyName.toLowerCase().includes(value) ||
        item.ownerSummary?.toLowerCase().includes(value) ||
        item.description?.toLowerCase().includes(value) ||
        item.skills.some((skill) => skill.name.toLowerCase().includes(value));

      return matchesVisibility && matchesType && matchesSearch;
    });
  }, [items, search, typeFilter, visibility]);

  function openEditor(item: PortfolioItem) {
    setEditingItem(item);
    setOwnerSummary(item.ownerSummary ?? "");
    setCoverImageUrl(item.coverImageUrl ?? "");
    setEditVisible(item.isVisible);
    setEditFeatured(item.isFeatured);
    setError("");
  }

  function closeEditor() {
    setEditingItem(null);
    setOwnerSummary("");
    setCoverImageUrl("");
  }

  async function saveItem(
    item: PortfolioItem,
    changes: {
      ownerSummary: string;
      coverImageUrl: string;
      isVisible: boolean;
      isFeatured: boolean;
    },
  ) {
    setBusyItemId(item.id);
    setError("");
    setMessage("");
    try {
      await updatePortfolioItemAsync(item.id, {
        description: item.description ?? undefined,
        projectUrl: item.projectUrl ?? undefined,
        ownerSummary: changes.ownerSummary.trim() || undefined,
        coverImageUrl: changes.coverImageUrl.trim() || undefined,
        isVisible: changes.isVisible,
        isFeatured: changes.isFeatured,
      });
      const isVisible = changes.isVisible || changes.isFeatured;
      setItems((currentItems) =>
        sortPortfolio(
          currentItems.map((currentItem) =>
            currentItem.id === item.id
              ? {
                  ...currentItem,
                  ownerSummary: changes.ownerSummary.trim() || null,
                  coverImageUrl: changes.coverImageUrl.trim() || null,
                  isVisible,
                  isFeatured: changes.isFeatured && isVisible,
                  updatedAt: new Date().toISOString(),
                }
              : currentItem,
          ),
        ),
      );
      return true;
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update evidence.",
      );
      return false;
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingItem) return;

    const saved = await saveItem(editingItem, {
      ownerSummary,
      coverImageUrl,
      isVisible: editVisible || editFeatured,
      isFeatured: editFeatured,
    });

    if (saved) {
      setMessage("Portfolio presentation updated.");
      closeEditor();
    }
  }

  async function toggleVisibility(item: PortfolioItem) {
    const nextVisible = !item.isVisible;
    const saved = await saveItem(item, {
      ownerSummary: item.ownerSummary ?? "",
      coverImageUrl: item.coverImageUrl ?? "",
      isVisible: nextVisible,
      isFeatured: nextVisible && item.isFeatured,
    });

    if (saved) {
      setMessage(nextVisible ? "Evidence shared." : "Evidence made private.");
    }
  }

  async function toggleFeatured(item: PortfolioItem) {
    const nextFeatured = !item.isFeatured;
    const saved = await saveItem(item, {
      ownerSummary: item.ownerSummary ?? "",
      coverImageUrl: item.coverImageUrl ?? "",
      isVisible: item.isVisible || nextFeatured,
      isFeatured: nextFeatured,
    });

    if (saved) {
      setMessage(nextFeatured ? "Evidence featured." : "Evidence unfeatured.");
    }
  }

  async function copyPortfolioLink() {
    if (shareableCardIds.length === 0) {
      setError("Share at least one active evidence card before creating a public link.");
      return;
    }

    setIsCreatingShare(true);
    setError("");
    setMessage("");
    try {
      const share = await createPublicEvidenceShareAsync(shareableCardIds);
      const publicUrl = new URL(share.publicPath, window.location.origin).toString();
      setPublicPath(share.publicPath);
      setShares((current) => [
        {
          id: share.id,
          tokenPrefix: share.token.slice(0, 8),
          isEnabled: true,
          createdAt: share.createdAt,
          expiresAt: share.expiresAt,
          disabledAt: null,
          cardCount: shareableCardIds.length,
        },
        ...current,
      ]);
      const copied = await copyText(publicUrl);
      setMessage(
        copied
          ? "A new public evidence link was created and copied."
          : "A new public evidence link was created. Copy the URL shown below.",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create a public evidence link.",
      );
    } finally {
      setIsCreatingShare(false);
    }
  }

  async function copyCurrentPublicLink() {
    if (!publicPath) return;
    const copied = await copyText(new URL(publicPath, window.location.origin).toString());
    setMessage(copied ? "Public evidence link copied." : "Select and copy the public URL below.");
  }

  async function disableShare(shareId: number) {
    setBusyItemId(-shareId);
    setError("");
    setMessage("");
    try {
      await disablePublicEvidenceShareAsync(shareId);
      setShares((current) =>
        current.map((share) =>
          share.id === shareId
            ? { ...share, isEnabled: false, disabledAt: new Date().toISOString() }
            : share,
        ),
      );
      setMessage("The public evidence link was disabled.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to disable the evidence link.",
      );
    } finally {
      setBusyItemId(null);
    }
  }

  return (
    <section className="page portfolio-page portfolio-manager-page">
      <PageHeader
        title="Evidence Portfolio"
        actions={
          <div className="portfolio-header-actions">
            {publicPath ? (
              <Button to={publicPath} variant="secondary">
                <Eye size={16} aria-hidden="true" />
                Preview
              </Button>
            ) : null}
            <Button
              type="button"
              disabled={shareableCardIds.length === 0}
              title={
                shareableCardIds.length === 0
                  ? "Mark an active evidence card as shared before creating a public link."
                  : "Create and copy a public evidence link"
              }
              isLoading={isCreatingShare}
              onClick={() => void copyPortfolioLink()}
            >
              <Copy size={16} aria-hidden="true" />
              Copy link
            </Button>
          </div>
        }
      />

      <div className="portfolio-summary-grid">
        <article>
          <span>Portfolio records</span>
          <strong>{stats.total}</strong>
        </article>
        <article>
          <span>Shared presentation</span>
          <strong>{stats.shared}</strong>
        </article>
        <article>
          <span>Featured</span>
          <strong>{stats.featured}</strong>
        </article>
      </div>

      {items.length > 0 && shareableCardIds.length === 0 ? (
        <section className="portfolio-share-guidance" aria-label="How to create a public evidence link">
          <Share2 size={18} aria-hidden="true" />
          <div>
            <strong>Public links are available only for active evidence cards.</strong>
            <p>Use the share icon on an active card below to mark it shared, then create the reviewer link here. Private, revoked, and superseded cards are never included.</p>
          </div>
        </section>
      ) : null}

      {publicPath ? (
        <section className="portfolio-new-share" aria-label="New public evidence link">
          <div>
            <span>New public link</span>
            <strong>Share this reviewer-safe evidence URL</strong>
            <code>{new URL(publicPath, window.location.origin).toString()}</code>
          </div>
          <div>
            <Button type="button" variant="secondary" onClick={() => void copyCurrentPublicLink()}>
              <Copy size={16} aria-hidden="true" />
              Copy link
            </Button>
            <Button to={publicPath} variant="ghost">
              <Eye size={16} aria-hidden="true" />
              Preview
            </Button>
          </div>
        </section>
      ) : null}

      {shares.length > 0 ? (
        <section className="portfolio-share-manager" aria-labelledby="share-manager-title">
          <header>
            <div>
              <span>External access</span>
              <h2 id="share-manager-title">Evidence links</h2>
            </div>
            <small>Full access tokens are shown only when a link is created.</small>
          </header>
          <div>
            {shares.slice(0, 5).map((share) => (
              <article key={share.id}>
                <div>
                  <strong>Link {share.tokenPrefix}...</strong>
                  <span>
                    {share.cardCount} {share.cardCount === 1 ? "card" : "cards"} · Created{" "}
                    {new Date(share.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <StatusBadge tone={share.isEnabled ? "green" : "neutral"}>
                  {share.isEnabled ? "Active" : "Disabled"}
                </StatusBadge>
                {share.isEnabled ? (
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={`Disable evidence link ${share.tokenPrefix}`}
                    title="Disable link"
                    isLoading={busyItemId === -share.id}
                    onClick={() => void disableShare(share.id)}
                  >
                    <Unlink size={17} aria-hidden="true" />
                  </Button>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="portfolio-gap-view" aria-labelledby="portfolio-gap-title">
        <header>
          <div>
            <span>Evidence Gap View</span>
            <h2 id="portfolio-gap-title">Compare one opportunity with your evidence</h2>
            <p>
              This is a criterion-by-criterion comparison, not a score, ranking, or recommendation.
            </p>
          </div>
          <label>
            <span>Target opportunity</span>
            <select
              value={comparisonProjectId}
              onChange={(event) => void selectComparisonProject(event.target.value)}
            >
              <option value="">Choose an available opportunity</option>
              {comparisonProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title} · {project.companyName}
                </option>
              ))}
            </select>
          </label>
        </header>
        {isLoadingCoverage ? <p className="portfolio-gap-state">Comparing your active evidence…</p> : null}
        {coverageError ? <p className="portfolio-gap-state portfolio-gap-error">{coverageError}</p> : null}
        {criterionCoverage ? <CriterionCoveragePanel coverage={criterionCoverage} /> : null}
      </section>

      <div className="portfolio-toolbar">
        <label>
          <Search size={17} aria-hidden="true" />
          <input
            aria-label="Search portfolio evidence"
            placeholder="Search work, provider, or skill"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <select
          aria-label="Filter evidence by visibility"
          value={visibility}
          onChange={(event) => setVisibility(event.target.value)}
        >
          {visibilityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter evidence by opportunity type"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="all">All opportunity types</option>
          <option value={OpportunityTypes.ProfessionalProject}>
            Professional projects
          </option>
          <option value={OpportunityTypes.UniversityTraining}>
            University training
          </option>
          <option value={OpportunityTypes.FreelanceTask}>
            Industry micro-tasks
          </option>
          <option value={OpportunityTypes.SkillDevelopmentChallenge}>
            Skill-development challenges
          </option>
          <option value={OpportunityTypes.TeamProject}>Team projects</option>
        </select>
      </div>

      {message ? <div className="notice notice-success">{message}</div> : null}
      {error && items.length > 0 ? (
        <div className="notice notice-error">{error}</div>
      ) : null}

      <DataState
        isLoading={isLoading}
        error={items.length === 0 ? error : ""}
        empty={!isLoading && !error && items.length === 0}
        emptyTitle="No approved evidence yet"
        emptyDescription="Approved completed work will appear here automatically."
      />

      {!isLoading && items.length > 0 && filteredItems.length === 0 ? (
        <DataState
          isLoading={false}
          error=""
          empty
          emptyTitle="No matching evidence"
          emptyDescription="Change the search or filters."
        />
      ) : null}

      <div className="portfolio-manager-list">
        {filteredItems.map((item) => (
          <article className={item.isFeatured ? "featured" : ""} key={item.id}>
            {item.coverImageUrl ? (
              <button
                type="button"
                className="portfolio-manager-cover"
                aria-label={`View evidence for ${item.projectTitle}`}
                onClick={() => setSelectedItem(item)}
              >
                <img src={item.coverImageUrl} alt="" loading="lazy" />
              </button>
            ) : (
              <button
                type="button"
                className="portfolio-manager-cover placeholder"
                aria-label={`View evidence for ${item.projectTitle}`}
                onClick={() => setSelectedItem(item)}
              >
                <FileCheck2 size={28} aria-hidden="true" />
              </button>
            )}

            <div className="portfolio-manager-content">
              <header>
                <div>
                  <div className="portfolio-manager-eyebrow">
                    <span>{getOpportunityTypeLabel(item.opportunityType)}</span>
                    <span>{item.isEvidenceCard ? evidenceReference(item.id) : "Portfolio presentation"}</span>
                  </div>
                  <h2>{item.projectTitle}</h2>
                  <p>{item.companyName}</p>
                </div>
                <div>
                  {item.isFeatured ? (
                    <StatusBadge tone="blue">Featured</StatusBadge>
                  ) : null}
                  <StatusBadge tone={item.isVisible ? "green" : "neutral"}>
                    {item.isEvidenceCard
                      ? item.isVisible ? "Shared evidence" : "Private evidence"
                      : item.isVisible ? "Visible presentation" : "Private presentation"}
                  </StatusBadge>
                </div>
              </header>

              <p>
                {item.ownerSummary ??
                  item.description ??
                  "Approved completed work."}
              </p>

              <div className="portfolio-manager-meta">
                <span title="System-generated evidence">
                  <ShieldCheck size={14} aria-hidden="true" />
                  {item.isEvidenceCard ? "Issued evidence" : "Portfolio record"}
                </span>
                <span>
                  <CalendarDays size={14} aria-hidden="true" />
                  {item.approvedAt
                    ? new Date(item.approvedAt).toLocaleDateString()
                    : "Approved"}
                </span>
                {item.reviewRating ? (
                  <span>
                    <Star size={14} fill="currentColor" aria-hidden="true" />
                    {item.reviewRating}/5
                  </span>
                ) : null}
                {item.criterionEvaluations.length > 0 ? (
                  <span>
                    <ListChecks size={14} aria-hidden="true" />
                    {item.criterionEvaluations.length} criteria
                  </span>
                ) : null}
                {item.skills.slice(0, 4).map((skill) => (
                  <span className="skill" key={skill.id}>
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="portfolio-manager-actions">
              <Button
                type="button"
                variant="ghost"
                aria-label={`View ${item.projectTitle}`}
                title="View evidence"
                onClick={() => setSelectedItem(item)}
              >
                <Eye size={17} aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                aria-label={`Edit presentation for ${item.projectTitle}`}
                title="Edit presentation"
                onClick={() => openEditor(item)}
              >
                <Pencil size={17} aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                aria-label={
                  item.isFeatured
                    ? `Unfeature ${item.projectTitle}`
                    : `Feature ${item.projectTitle}`
                }
                title={item.isFeatured ? "Unfeature" : "Feature"}
                isLoading={busyItemId === item.id}
                onClick={() => void toggleFeatured(item)}
              >
                <Pin
                  size={17}
                  fill={item.isFeatured ? "currentColor" : "none"}
                  aria-hidden="true"
                />
              </Button>
              <Button
                type="button"
                variant="ghost"
                aria-label={
                  item.isVisible
                    ? `Make ${item.projectTitle} private`
                    : item.isEvidenceCard
                      ? `Share evidence for ${item.projectTitle}`
                      : `Show ${item.projectTitle} in the portfolio`
                }
                title={
                  item.isVisible
                    ? "Make private"
                    : item.isEvidenceCard
                      ? "Share evidence"
                      : "Show in portfolio"
                }
                isLoading={busyItemId === item.id}
                onClick={() => void toggleVisibility(item)}
              >
                {item.isVisible ? (
                  <EyeOff size={17} aria-hidden="true" />
                ) : (
                  <Share2 size={17} aria-hidden="true" />
                )}
              </Button>
            </div>
          </article>
        ))}
      </div>

      {editingItem ? (
        <div
          className="evidence-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditor();
          }}
        >
          <form
            className="portfolio-edit-dialog"
            aria-labelledby="portfolio-edit-title"
            aria-modal="true"
            role="dialog"
            onSubmit={handleSave}
          >
            <header>
              <div>
                <span>Portfolio presentation</span>
                <h2 id="portfolio-edit-title">{editingItem.projectTitle}</h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                autoFocus
                aria-label="Close portfolio editor"
                title="Close"
                onClick={closeEditor}
              >
                <X size={19} aria-hidden="true" />
              </Button>
            </header>
            <label className="field">
              <span>Your portfolio overview</span>
              <textarea
                value={ownerSummary}
                maxLength={1000}
                placeholder="Explain the problem, your approach, and the result."
                onChange={(event) => setOwnerSummary(event.target.value)}
              />
              <small>{ownerSummary.length}/1000</small>
            </label>
            <div className="portfolio-record-lock">
              <ShieldCheck size={18} aria-hidden="true" />
              <span>
                You can change the presentation and sharing. The approved work,
                evaluation, evaluator, and dates remain locked.
              </span>
            </div>
            <label className="field">
              <span>Cover image link (optional)</span>
              <div className="portfolio-cover-input">
                <Image size={17} aria-hidden="true" />
                <input
                  type="url"
                  value={coverImageUrl}
                  maxLength={500}
                  placeholder="https://example.com/project-cover.jpg"
                  onChange={(event) => setCoverImageUrl(event.target.value)}
                />
              </div>
            </label>
            <div className="portfolio-edit-toggles">
              <label>
                <input
                  type="checkbox"
                  checked={editVisible || editFeatured}
                  disabled={editFeatured}
                  onChange={(event) => setEditVisible(event.target.checked)}
                />
                <span>Show in shared portfolio</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editFeatured}
                  onChange={(event) => {
                    setEditFeatured(event.target.checked);
                    if (event.target.checked) setEditVisible(true);
                  }}
                />
                <span>Feature this evidence</span>
              </label>
            </div>
            <footer>
              <Button type="submit" isLoading={busyItemId === editingItem.id}>
                Save
              </Button>
              <Button type="button" variant="secondary" onClick={closeEditor}>
                Cancel
              </Button>
            </footer>
          </form>
        </div>
      ) : null}

      {selectedItem ? (
        <EvidenceDetailsDialog
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      ) : null}
    </section>
  );
}
