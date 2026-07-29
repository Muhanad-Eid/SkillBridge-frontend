import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Copy,
  Eye,
  EyeOff,
  FileCheck2,
  Image,
  Pencil,
  Pin,
  Search,
  Share2,
  Star,
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
import type { JobSeekerProfile } from "../../profiles/domain/profileTypes";
import { getMyJobSeekerProfileAsync } from "../../profiles/infrastructure/profileApi";
import type { PortfolioItem } from "../domain/portfolioTypes";
import {
  getMyPortfolioAsync,
  updatePortfolioItemAsync,
} from "../infrastructure/portfolioApi";
import EvidenceDetailsDialog from "./EvidenceDetailsDialog";

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

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
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
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadPortfolio() {
    setIsLoading(true);
    setError("");
    try {
      const [portfolio, profileData] = await Promise.all([
        getMyPortfolioAsync(),
        getMyJobSeekerProfileAsync(),
      ]);
      setItems(portfolio);
      setProfile(profileData);
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

  const publicPath = profile ? `/portfolio/${profile.id}` : "";

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
    if (!publicPath) return;

    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${publicPath}`,
      );
      setMessage("Portfolio link copied.");
    } catch {
      setError("Unable to copy the portfolio link.");
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
              disabled={!publicPath || stats.shared === 0}
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
          <span>Approved evidence</span>
          <strong>{stats.total}</strong>
        </article>
        <article>
          <span>Shared</span>
          <strong>{stats.shared}</strong>
        </article>
        <article>
          <span>Featured</span>
          <strong>{stats.featured}</strong>
        </article>
      </div>

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
            Freelance tasks
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
                  <span>{getOpportunityTypeLabel(item.opportunityType)}</span>
                  <h2>{item.projectTitle}</h2>
                  <p>{item.companyName}</p>
                </div>
                <div>
                  {item.isFeatured ? (
                    <StatusBadge tone="blue">Featured</StatusBadge>
                  ) : null}
                  <StatusBadge tone={item.isVisible ? "green" : "neutral"}>
                    {item.isVisible ? "Shared" : "Private"}
                  </StatusBadge>
                </div>
              </header>

              <p>
                {item.ownerSummary ??
                  item.description ??
                  "Approved completed work."}
              </p>

              <div className="portfolio-manager-meta">
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
                    : `Share ${item.projectTitle}`
                }
                title={item.isVisible ? "Make private" : "Share"}
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
              <span>Your overview</span>
              <textarea
                value={ownerSummary}
                maxLength={1000}
                placeholder="Explain the problem, your approach, and the result."
                onChange={(event) => setOwnerSummary(event.target.value)}
              />
              <small>{ownerSummary.length}/1000</small>
            </label>
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
