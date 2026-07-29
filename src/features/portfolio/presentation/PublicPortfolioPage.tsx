import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Code2,
  GraduationCap,
  MapPin,
  Search,
  Star,
} from "lucide-react";
import { useParams } from "react-router-dom";
import DataState from "../../../shared/components/DataState";
import {
  getOpportunityTypeLabel,
  OpportunityTypes,
} from "../../projects/domain/projectTypes";
import type { JobSeekerProfile } from "../../profiles/domain/profileTypes";
import { getPublicJobSeekerProfileAsync } from "../../profiles/infrastructure/profileApi";
import type { PortfolioItem } from "../domain/portfolioTypes";
import { getPublicPortfolioAsync } from "../infrastructure/portfolioApi";
import PortfolioGallery from "./PortfolioGallery";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function PublicPortfolioPage() {
  const { jobSeekerId } = useParams();
  const parsedJobSeekerId = Number(jobSeekerId);
  const hasValidJobSeekerId =
    Number.isInteger(parsedJobSeekerId) && parsedJobSeekerId > 0;
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(hasValidJobSeekerId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasValidJobSeekerId) return;

    let isCurrent = true;

    async function loadPortfolio() {
      setIsLoading(true);
      setError("");

      try {
        const [profileData, portfolioData] = await Promise.all([
          getPublicJobSeekerProfileAsync(parsedJobSeekerId),
          getPublicPortfolioAsync(parsedJobSeekerId),
        ]);

        if (!isCurrent) return;
        setProfile(profileData);
        setItems(portfolioData);
      } catch (caughtError) {
        if (!isCurrent) return;
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load this portfolio.",
        );
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadPortfolio();
    return () => {
      isCurrent = false;
    };
  }, [hasValidJobSeekerId, parsedJobSeekerId]);

  const filteredItems = useMemo(() => {
    const value = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesType =
        typeFilter === "all" || item.opportunityType === Number(typeFilter);
      const matchesSearch =
        !value ||
        item.projectTitle.toLowerCase().includes(value) ||
        item.companyName.toLowerCase().includes(value) ||
        item.ownerSummary?.toLowerCase().includes(value) ||
        item.description?.toLowerCase().includes(value) ||
        item.skills.some((skill) => skill.name.toLowerCase().includes(value));

      return matchesType && matchesSearch;
    });
  }, [items, search, typeFilter]);

  const featuredItems = items.filter((item) => item.isFeatured);
  const isFiltering = Boolean(search.trim()) || typeFilter !== "all";
  const otherItems = isFiltering
    ? filteredItems
    : items.filter((item) => !item.isFeatured);

  return (
    <section className="public-portfolio-page">
      <DataState
        isLoading={isLoading}
        error={
          hasValidJobSeekerId
            ? error
            : "This portfolio link is not valid."
        }
        empty={!isLoading && !error && !profile}
        emptyTitle="Portfolio not found"
        emptyDescription="This portfolio may no longer be available."
      />

      {!isLoading && !error && profile ? (
        <div className="public-portfolio-shell">
          <header className="public-portfolio-profile">
            <div className="public-portfolio-avatar" aria-hidden="true">
              {getInitials(profile.fullName)}
            </div>
            <div className="public-portfolio-identity">
              <span>Evidence Portfolio</span>
              <h1>{profile.fullName}</h1>
              {profile.bio ? <p>{profile.bio}</p> : null}
              <div className="public-portfolio-profile-meta">
                {profile.city ? (
                  <span>
                    <MapPin size={15} aria-hidden="true" />
                    {profile.city}
                  </span>
                ) : null}
                {profile.universityName ? (
                  <span>
                    <GraduationCap size={16} aria-hidden="true" />
                    {profile.universityName}
                  </span>
                ) : null}
                <span>
                  <BriefcaseBusiness size={15} aria-hidden="true" />
                  {items.length} shared evidence
                </span>
                {profile.averageRating !== null ? (
                  <span>
                    <Star size={15} fill="currentColor" aria-hidden="true" />
                    {profile.averageRating.toFixed(1)} average rating
                  </span>
                ) : null}
              </div>
            </div>
            <div className="public-portfolio-links">
              {profile.linkedInUrl ? (
                <a
                  href={profile.linkedInUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open LinkedIn profile"
                  title="LinkedIn"
                >
                  <BriefcaseBusiness size={18} aria-hidden="true" />
                </a>
              ) : null}
              {profile.gitHubUrl ? (
                <a
                  href={profile.gitHubUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open GitHub profile"
                  title="GitHub"
                >
                  <Code2 size={18} aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </header>

          {profile.skills.length > 0 ? (
            <div className="public-portfolio-skill-strip">
              {profile.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          ) : null}

          {items.length > 0 ? (
            <div className="public-portfolio-toolbar">
              <label>
                <Search size={17} aria-hidden="true" />
                <input
                  aria-label="Search shared evidence"
                  placeholder="Search work, provider, or skill"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <select
                aria-label="Filter shared evidence by opportunity type"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <option value="all">All opportunity types</option>
                {Object.values(OpportunityTypes).map((type) => (
                  <option key={type} value={type}>
                    {getOpportunityTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {!isFiltering && featuredItems.length > 0 ? (
            <section className="public-portfolio-section">
              <header>
                <span>Selected work</span>
                <h2>Featured evidence</h2>
              </header>
              <PortfolioGallery items={featuredItems} />
            </section>
          ) : null}

          {isFiltering || otherItems.length > 0 || items.length === 0 ? (
            <section className="public-portfolio-section">
              <header>
                <span>{isFiltering ? "Search results" : "Evidence archive"}</span>
                <h2>
                  {isFiltering
                    ? `${filteredItems.length} matching record${
                        filteredItems.length === 1 ? "" : "s"
                      }`
                    : featuredItems.length > 0
                      ? "More approved work"
                      : "Approved work"}
                </h2>
              </header>
              <PortfolioGallery
                items={otherItems}
                emptyTitle={
                  items.length === 0
                    ? "No shared evidence"
                    : "No matching evidence"
                }
                emptyDescription={
                  items.length === 0
                    ? "This person has not shared portfolio evidence yet."
                    : "Change the search or opportunity type."
                }
              />
            </section>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
