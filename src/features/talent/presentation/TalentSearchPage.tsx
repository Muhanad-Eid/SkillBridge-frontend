import {
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  CheckCircle2,
  FileCheck2,
  MapPin,
  Search,
  Star,
  UserRoundSearch,
  X,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import type { Skill } from "../../skills/domain/skillTypes";
import { getSkillsAsync } from "../../skills/infrastructure/skillApi";
import type { TalentSearchResult } from "../domain/talentTypes";
import { searchTalentAsync } from "../infrastructure/talentApi";

type CompanyPortalContext = {
  isCompanyVerified: boolean;
};

export default function TalentSearchPage() {
  const { isCompanyVerified } = useOutletContext<CompanyPortalContext>();
  const [results, setResults] = useState<TalentSearchResult[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [query, setQuery] = useState("");
  const [skillId, setSkillId] = useState("");
  const [evidenceOnly, setEvidenceOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTalent = useCallback(
    async (
      nextQuery: string,
      nextSkillId: string,
      nextEvidenceOnly: boolean,
    ) => {
      if (!isCompanyVerified) {
        setResults([]);
        setError("");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        setResults(
          await searchTalentAsync({
            query: nextQuery,
            skillId: nextSkillId ? Number(nextSkillId) : undefined,
            evidenceOnly: nextEvidenceOnly,
          }),
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to search talent.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isCompanyVerified],
  );

  useEffect(() => {
    if (!isCompanyVerified) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void Promise.all([
        loadTalent("", "", false),
        getSkillsAsync().then(setSkills),
      ]).catch(() => undefined);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isCompanyVerified, loadTalent]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadTalent(query, skillId, evidenceOnly);
  }

  function clearFilters() {
    setQuery("");
    setSkillId("");
    setEvidenceOnly(false);
    void loadTalent("", "", false);
  }

  const hasFilters = Boolean(query.trim() || skillId || evidenceOnly);

  if (!isCompanyVerified) {
    return (
      <section className="page company-talent-page">
        <PageHeader title="Find talent" />
        <DataState
          isLoading={false}
          error=""
          empty
          emptyTitle="Company verification required"
          emptyDescription="Talent search will become available after an administrator verifies your company."
        />
      </section>
    );
  }

  return (
    <section className="page company-talent-page">
      <PageHeader title="Find talent" />

      <form className="company-talent-toolbar" onSubmit={handleSearch}>
        <label className="company-talent-search">
          <span>Search profiles and skills</span>
          <div>
            <Search size={18} aria-hidden="true" />
            <input
              value={query}
              placeholder="Name, skill, city, or experience"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </label>

        <label className="field">
          <span>Skill</span>
          <select
            value={skillId}
            onChange={(event) => setSkillId(event.target.value)}
          >
            <option value="">All skills</option>
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </select>
        </label>

        <label className="company-talent-evidence-filter">
          <input
            type="checkbox"
            checked={evidenceOnly}
            onChange={(event) => setEvidenceOnly(event.target.checked)}
          />
          <span>
            <strong>Shared evidence only</strong>
            <small>Show profiles with approved work</small>
          </span>
        </label>

        <div className="company-talent-filter-actions">
          <Button type="submit" isLoading={isLoading}>
            <Search size={16} aria-hidden="true" />
            Search
          </Button>
          {hasFilters ? (
            <Button type="button" variant="ghost" onClick={clearFilters}>
              <X size={16} aria-hidden="true" />
              Clear
            </Button>
          ) : null}
        </div>
      </form>

      {!isLoading && !error ? (
        <div className="company-talent-result-count" role="status">
          <UserRoundSearch size={18} aria-hidden="true" />
          <strong>{results.length}</strong>
          <span>profile{results.length === 1 ? "" : "s"} found</span>
        </div>
      ) : null}

      <DataState
        isLoading={isLoading}
        error={error}
        empty={!isLoading && !error && results.length === 0}
        emptyTitle="No matching profiles"
        emptyDescription="Try a broader skill or remove the shared-evidence filter."
      />

      {!isLoading && !error && results.length > 0 ? (
        <div className="company-talent-list">
          {results.map((talent) => (
            <article className="company-talent-row" key={talent.id}>
              <div className="company-talent-identity">
                <span aria-hidden="true">
                  {talent.fullName.trim().charAt(0).toUpperCase()}
                </span>
                <div>
                  <h2>{talent.fullName}</h2>
                  <p>
                    <MapPin size={14} aria-hidden="true" />
                    {talent.city}
                  </p>
                </div>
              </div>

              <p className="company-talent-bio">{talent.bio}</p>

              <div className="company-talent-skills">
                {talent.skills.slice(0, 6).map((skill) => (
                  <span
                    key={skill.id}
                    className={skill.isEvidenceSupported ? "is-supported" : ""}
                    title={
                      skill.isEvidenceSupported
                        ? `${skill.sharedEvidenceCount} shared evidence card${skill.sharedEvidenceCount === 1 ? "" : "s"}`
                        : "Listed profile skill"
                    }
                  >
                    {skill.isEvidenceSupported ? (
                      <CheckCircle2 size={13} aria-hidden="true" />
                    ) : null}
                    {skill.name}
                  </span>
                ))}
                {talent.skills.length > 6 ? (
                  <span>+{talent.skills.length - 6}</span>
                ) : null}
              </div>

              <dl className="company-talent-signals">
                <div>
                  <dt><FileCheck2 size={15} aria-hidden="true" />Evidence</dt>
                  <dd>{talent.sharedEvidenceCount}</dd>
                </div>
                <div>
                  <dt><Star size={15} aria-hidden="true" />Reviews</dt>
                  <dd>
                    {talent.averageRating
                      ? `${talent.averageRating.toFixed(1)} (${talent.reviewsCount})`
                      : talent.reviewsCount}
                  </dd>
                </div>
              </dl>

              <Button
                to={`/company/talent/${talent.id}`}
                variant="secondary"
              >
                View profile
              </Button>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
