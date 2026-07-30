import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CircleDollarSign,
  ChevronDown,
  Clock3,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import {
  ApplicationStatuses,
  getApplicationStatusLabel,
  type Application,
  type ApplicationStatus,
} from "../../applications/domain/applicationTypes";
import { getMyApplicationsAsync } from "../../applications/infrastructure/applicationApi";
import type { Skill } from "../../skills/domain/skillTypes";
import { getMySkillsAsync } from "../../skills/infrastructure/skillApi";
import {
  calculateProjectMatch,
  ExperienceLevels,
  FreelancePricingTypes,
  getExperienceLevelLabel,
  getFreelancePricingLabel,
  getOpportunityTypeLabel,
  getWorkModeLabel,
  OpportunityTypes,
  ProjectStatuses,
  WorkModes,
  type Project,
} from "../domain/projectTypes";
import { getProjectsAsync } from "../infrastructure/projectApi";

type ProjectsPageProps = {
  mode?: "opportunities" | "freelance";
};

function getApplicationTone(
  status: ApplicationStatus,
): "green" | "amber" | "red" | "neutral" {
  if (status === ApplicationStatuses.Accepted) return "green";
  if (status === ApplicationStatuses.Pending) return "amber";
  if (status === ApplicationStatuses.Rejected) return "red";
  return "neutral";
}

export default function ProjectsPage({
  mode = "opportunities",
}: ProjectsPageProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [mySkills, setMySkills] = useState<Skill[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [applicationFilter, setApplicationFilter] = useState("all");
  const [workModeFilter, setWorkModeFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [skillFilter, setSkillFilter] = useState("all");
  const [matchFilter, setMatchFilter] = useState("all");
  const [pricingFilter, setPricingFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [sort, setSort] = useState("recommended");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const filterControlRef = useRef<HTMLDivElement>(null);
  const isJobSeeker = user?.role === "JobSeeker";
  const isFreelanceView = mode === "freelance";

  useEffect(() => {
    if (!isFiltersOpen) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!filterControlRef.current?.contains(event.target as Node)) {
        setIsFiltersOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsFiltersOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isFiltersOpen]);

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      try {
        const [projectData, applicationData, skillData] = await Promise.all([
          getProjectsAsync(),
          isJobSeeker ? getMyApplicationsAsync() : Promise.resolve([]),
          isJobSeeker ? getMySkillsAsync() : Promise.resolve([]),
        ]);

        if (isMounted) {
          setProjects(projectData);
          setApplications(applicationData);
          setMySkills(skillData);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load opportunities.",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, [isJobSeeker]);

  const applicationByProject = useMemo(
    () => new Map(applications.map((application) => [application.projectId, application])),
    [applications],
  );

  const scopedProjects = useMemo(
    () =>
      projects.filter((project) =>
        isFreelanceView
          ? project.type === OpportunityTypes.FreelanceTask
          : project.type !== OpportunityTypes.FreelanceTask,
      ),
    [isFreelanceView, projects],
  );

  const matchByProject = useMemo(() => {
    const skillIds = mySkills.map((skill) => skill.id);
    return new Map(
      scopedProjects.map((project) => [
        project.id,
        calculateProjectMatch(project, skillIds),
      ]),
    );
  }, [mySkills, scopedProjects]);

  const availableProjectSkills = useMemo(() => {
    const skills = new Map<number, string>();
    scopedProjects.forEach((project) => {
      project.skills.forEach((skill) => skills.set(skill.id, skill.name));
    });
    return [...skills.entries()].sort((left, right) => left[1].localeCompare(right[1]));
  }, [scopedProjects]);

  const filteredProjects = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return scopedProjects.filter((project) => {
      const matchesSearch =
        !searchValue ||
        project.title.toLowerCase().includes(searchValue) ||
        project.companyName.toLowerCase().includes(searchValue) ||
        project.description.toLowerCase().includes(searchValue) ||
        project.requirements.toLowerCase().includes(searchValue) ||
        project.skills.some((skill) => skill.name.toLowerCase().includes(searchValue));
      const matchesType =
        isFreelanceView ||
        typeFilter === "all" ||
        project.type === Number(typeFilter);
      const matchesDuration =
        durationFilter === "all" ||
        (isFreelanceView
          ? (durationFilter === "short" &&
              (project.freelanceDeliveryDays ?? project.durationWeeks * 7) <= 7) ||
            (durationFilter === "medium" &&
              (project.freelanceDeliveryDays ?? project.durationWeeks * 7) > 7 &&
              (project.freelanceDeliveryDays ?? project.durationWeeks * 7) <= 30) ||
            (durationFilter === "long" &&
              (project.freelanceDeliveryDays ?? project.durationWeeks * 7) > 30)
          : (durationFilter === "short" && project.durationWeeks <= 4) ||
            (durationFilter === "medium" &&
              project.durationWeeks > 4 &&
              project.durationWeeks <= 8) ||
            (durationFilter === "long" && project.durationWeeks > 8));
      const hasApplied = applicationByProject.has(project.id);
      const match = matchByProject.get(project.id);
      const matchesApplication =
        applicationFilter === "all" ||
        (applicationFilter === "new" && !hasApplied) ||
        (applicationFilter === "applied" && hasApplied);
      const matchesWorkMode =
        workModeFilter === "all" || project.workMode === Number(workModeFilter);
      const matchesExperience =
        experienceFilter === "all" ||
        project.experienceLevel === Number(experienceFilter);
      const matchesSkill =
        skillFilter === "all" ||
        project.skills.some((skill) => skill.id === Number(skillFilter));
      const matchesFit =
        matchFilter === "all" ||
        (matchFilter === "strong" && (match?.score ?? 0) >= 70) ||
        (matchFilter === "complete" && match?.missingRequiredSkills.length === 0);
      const matchesPricing =
        !isFreelanceView ||
        pricingFilter === "all" ||
        project.freelancePricingType === Number(pricingFilter);
      const matchesBudget =
        !isFreelanceView ||
        budgetFilter === "all" ||
        (budgetFilter === "under100" && (project.budget ?? 0) < 100) ||
        (budgetFilter === "100to500" &&
          (project.budget ?? 0) >= 100 &&
          (project.budget ?? 0) <= 500) ||
        (budgetFilter === "over500" && (project.budget ?? 0) > 500);

      return matchesSearch && matchesType && matchesDuration && matchesApplication &&
        matchesWorkMode && matchesExperience && matchesSkill && matchesFit &&
        matchesPricing && matchesBudget;
    }).sort((left, right) => {
      if (isFreelanceView && sort === "budget") {
        return (right.budget ?? 0) - (left.budget ?? 0);
      }
      if (isFreelanceView && sort === "delivery") {
        return (
          (left.freelanceDeliveryDays ?? left.durationWeeks * 7) -
          (right.freelanceDeliveryDays ?? right.durationWeeks * 7)
        );
      }
      return isJobSeeker
        ? (matchByProject.get(right.id)?.score ?? 0) -
            (matchByProject.get(left.id)?.score ?? 0)
        : 0;
    });
  }, [
    applicationByProject,
    applicationFilter,
    budgetFilter,
    durationFilter,
    experienceFilter,
    isFreelanceView,
    isJobSeeker,
    matchByProject,
    matchFilter,
    pricingFilter,
    scopedProjects,
    search,
    skillFilter,
    sort,
    typeFilter,
    workModeFilter,
  ]);

  const detailsBasePath = isJobSeeker
    ? isFreelanceView
      ? "/job-seeker/freelance"
      : "/job-seeker/opportunities"
    : isFreelanceView
      ? "/freelance"
      : "/opportunities";
  const openCount = scopedProjects.filter(
    (project) => project.status === ProjectStatuses.Open,
  ).length;
  const activeFilterCount = [
    ...(isFreelanceView ? [] : [typeFilter]),
    durationFilter,
    applicationFilter,
    workModeFilter,
    experienceFilter,
    skillFilter,
    matchFilter,
    ...(isFreelanceView ? [pricingFilter] : []),
    ...(isFreelanceView ? [budgetFilter] : []),
  ].filter((value) => value !== "all").length;

  function clearFilters() {
    setTypeFilter("all");
    setDurationFilter("all");
    setApplicationFilter("all");
    setWorkModeFilter("all");
    setExperienceFilter("all");
    setSkillFilter("all");
    setMatchFilter("all");
    setPricingFilter("all");
    setBudgetFilter("all");
  }

  return (
    <section
      className={`page marketplace-page ${
        isJobSeeker ? "jobseeker-discovery-page" : ""
      } ${isFreelanceView ? "freelance-marketplace-page" : ""}`}
    >
      <PageHeader
        title={isFreelanceView ? "Freelance tasks" : "Opportunities"}
        actions={
          isJobSeeker ? (
            <Button
              to={
                isFreelanceView
                  ? "/job-seeker/freelance/proposals"
                  : "/job-seeker/applications"
              }
              variant="secondary"
            >
              {isFreelanceView ? "My proposals" : "My applications"}
            </Button>
          ) : (
            <Button to="/register" variant="primary">Create profile</Button>
          )
        }
      />

      {isFreelanceView && isJobSeeker ? (
        <nav className="freelance-section-tabs" aria-label="Freelance">
          <NavLink end to="/job-seeker/freelance">
            Browse tasks
          </NavLink>
          <NavLink to="/job-seeker/freelance/proposals">My proposals</NavLink>
        </nav>
      ) : null}

      {isJobSeeker ? (
        <div className="jobseeker-discovery-summary">
          <article>
            {isFreelanceView ? (
              <CircleDollarSign size={19} aria-hidden="true" />
            ) : (
              <BriefcaseBusiness size={19} aria-hidden="true" />
            )}
            <div>
              <strong>{openCount}</strong>
              <span>{isFreelanceView ? "Open tasks" : "Open opportunities"}</span>
            </div>
          </article>
          <article>
            <ShieldCheck size={19} aria-hidden="true" />
            <div><strong>Verified</strong><span>Providers shown here</span></div>
          </article>
          <article>
            <FileApplicationCount
              count={
                applications.filter((application) =>
                  isFreelanceView
                    ? application.opportunityType ===
                      OpportunityTypes.FreelanceTask
                    : application.opportunityType !==
                      OpportunityTypes.FreelanceTask,
                ).length
              }
            />
            <div>
              <strong>
                {
                  applications.filter((application) =>
                    isFreelanceView
                      ? application.opportunityType ===
                        OpportunityTypes.FreelanceTask
                      : application.opportunityType !==
                        OpportunityTypes.FreelanceTask,
                  ).length
                }
              </strong>
              <span>{isFreelanceView ? "Your proposals" : "Your applications"}</span>
            </div>
          </article>
        </div>
      ) : null}

      <div className="jobseeker-discovery-toolbar">
        <label className="jobseeker-search-field">
          <Search size={18} aria-hidden="true" />
          <input
            aria-label={isFreelanceView ? "Search freelance tasks" : "Search opportunities"}
            placeholder={
              isFreelanceView
                ? "Search tasks, clients, or skills"
                : "Search title, provider, or keyword"
            }
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        {isFreelanceView ? (
          <select
            className="freelance-sort-select"
            aria-label="Sort freelance tasks"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="recommended">Best match</option>
            <option value="budget">Highest budget</option>
            <option value="delivery">Fastest delivery</option>
          </select>
        ) : null}
        <div className="jobseeker-filter-control" ref={filterControlRef}>
          <Button
            type="button"
            variant="secondary"
            className={`jobseeker-filter-trigger ${isFiltersOpen ? "active" : ""}`}
            aria-expanded={isFiltersOpen}
            aria-controls="opportunity-filters"
            onClick={() => setIsFiltersOpen((isOpen) => !isOpen)}
          >
            <SlidersHorizontal size={17} aria-hidden="true" />
            Filters
            {activeFilterCount > 0 ? (
              <span className="jobseeker-filter-count">{activeFilterCount}</span>
            ) : null}
            <ChevronDown
              className="jobseeker-filter-chevron"
              size={16}
              aria-hidden="true"
            />
          </Button>

          {isFiltersOpen ? (
            <section
              id="opportunity-filters"
              className="jobseeker-filter-panel"
              aria-label="Opportunity filters"
            >
              <header>
                <strong>Filters</strong>
                <button
                  type="button"
                  aria-label="Close filters"
                  title="Close filters"
                  onClick={() => setIsFiltersOpen(false)}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </header>

              <div className="jobseeker-filter-grid">
                {!isFreelanceView ? (
                  <label>
                    <span>Opportunity type</span>
                    <select
                      value={typeFilter}
                      onChange={(event) => setTypeFilter(event.target.value)}
                    >
                      <option value="all">All types</option>
                      <option value={OpportunityTypes.ProfessionalProject}>
                        Professional projects
                      </option>
                      <option value={OpportunityTypes.UniversityTraining}>
                        University training
                      </option>
                      <option value={OpportunityTypes.SkillDevelopmentChallenge}>
                        Skill-development challenges
                      </option>
                      <option value={OpportunityTypes.TeamProject}>
                        Team projects
                      </option>
                    </select>
                  </label>
                ) : (
                  <label>
                    <span>Pricing</span>
                    <select
                      value={pricingFilter}
                      onChange={(event) => setPricingFilter(event.target.value)}
                    >
                      <option value="all">Any pricing</option>
                      <option value={FreelancePricingTypes.FixedPrice}>
                        Fixed price
                      </option>
                      <option value={FreelancePricingTypes.Hourly}>Hourly</option>
                    </select>
                  </label>
                )}
                {isFreelanceView ? (
                  <label>
                    <span>Budget</span>
                    <select
                      value={budgetFilter}
                      onChange={(event) => setBudgetFilter(event.target.value)}
                    >
                      <option value="all">Any budget</option>
                      <option value="under100">Under $100</option>
                      <option value="100to500">$100 to $500</option>
                      <option value="over500">More than $500</option>
                    </select>
                  </label>
                ) : null}
                <label>
                  <span>Work mode</span>
                  <select
                    value={workModeFilter}
                    onChange={(event) => setWorkModeFilter(event.target.value)}
                  >
                    <option value="all">Any work mode</option>
                    <option value={WorkModes.Remote}>Remote</option>
                    <option value={WorkModes.Hybrid}>Hybrid</option>
                    <option value={WorkModes.OnSite}>On-site</option>
                  </select>
                </label>
                <label>
                  <span>Experience level</span>
                  <select
                    value={experienceFilter}
                    onChange={(event) => setExperienceFilter(event.target.value)}
                  >
                    <option value="all">Any experience level</option>
                    <option value={ExperienceLevels.Beginner}>Beginner</option>
                    <option value={ExperienceLevels.Intermediate}>Intermediate</option>
                    <option value={ExperienceLevels.Advanced}>Advanced</option>
                  </select>
                </label>
                <label>
                  <span>Skill</span>
                  <select
                    value={skillFilter}
                    onChange={(event) => setSkillFilter(event.target.value)}
                  >
                    <option value="all">Any skill</option>
                    {availableProjectSkills.map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Duration</span>
                  <select
                    value={durationFilter}
                    onChange={(event) => setDurationFilter(event.target.value)}
                  >
                    <option value="all">Any duration</option>
                    <option value="short">
                      {isFreelanceView ? "Up to 7 days" : "Up to 4 weeks"}
                    </option>
                    <option value="medium">
                      {isFreelanceView ? "8 to 30 days" : "5 to 8 weeks"}
                    </option>
                    <option value="long">
                      {isFreelanceView ? "More than 30 days" : "More than 8 weeks"}
                    </option>
                  </select>
                </label>
                {isJobSeeker ? (
                  <>
                    <label>
                      <span>Skill match</span>
                      <select
                        value={matchFilter}
                        onChange={(event) => setMatchFilter(event.target.value)}
                      >
                        <option value="all">Any match score</option>
                        <option value="strong">70% match or better</option>
                        <option value="complete">All required skills</option>
                      </select>
                    </label>
                    <label>
                      <span>Application status</span>
                      <select
                        value={applicationFilter}
                        onChange={(event) => setApplicationFilter(event.target.value)}
                      >
                        <option value="all">All listings</option>
                        <option value="new">Not applied</option>
                        <option value="applied">Already applied</option>
                      </select>
                    </label>
                  </>
                ) : null}
              </div>

              <footer>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={activeFilterCount === 0}
                  onClick={clearFilters}
                >
                  Clear all
                </Button>
                <Button type="button" onClick={() => setIsFiltersOpen(false)}>
                  Show {filteredProjects.length} result{filteredProjects.length === 1 ? "" : "s"}
                </Button>
              </footer>
            </section>
          ) : null}
        </div>
      </div>

      <div className="jobseeker-results-heading">
        <div>
          <strong>{filteredProjects.length} result{filteredProjects.length === 1 ? "" : "s"}</strong>
          <span>
            {isFreelanceView
              ? "Every task is posted by a verified client."
              : "Only opportunities from verified providers are listed."}
          </span>
        </div>
      </div>

      <DataState
        isLoading={isLoading}
        error={error}
        empty={filteredProjects.length === 0}
        emptyTitle={isFreelanceView ? "No freelance tasks found" : "No opportunities found"}
        emptyDescription={
          isFreelanceView
            ? "Change a filter or check back when verified clients publish new tasks."
            : "Change a filter or check back when companies publish new work."
        }
      />

      <div className="jobseeker-opportunity-list">
        {filteredProjects.map((project) => {
          const application = applicationByProject.get(project.id);
          const match = matchByProject.get(project.id);

          return (
            <article
              className={isFreelanceView ? "freelance-task-card" : undefined}
              key={project.id}
            >
              <div className="jobseeker-opportunity-mark" aria-hidden="true">
                {project.companyName.trim().charAt(0).toUpperCase()}
              </div>
              <div className="jobseeker-opportunity-copy">
                <div className="jobseeker-opportunity-labels">
                  <StatusBadge
                    tone={
                      project.type === OpportunityTypes.UniversityTraining
                        ? "amber"
                        : "blue"
                    }
                  >
                    {getOpportunityTypeLabel(project.type)}
                  </StatusBadge>
                  {application ? (
                    <StatusBadge tone={getApplicationTone(application.status)}>
                      {getApplicationStatusLabel(application.status)}
                    </StatusBadge>
                  ) : null}
                  {isJobSeeker && match ? (
                    <StatusBadge tone={match.score >= 70 ? "green" : "neutral"}>
                      {match.score}% skill match
                    </StatusBadge>
                  ) : null}
                </div>
                <h2>{project.title}</h2>
                <strong>{project.companyName}</strong>
                <p>{project.description}</p>
                {isFreelanceView ? (
                  <div className="freelance-task-summary">
                    <span>
                      <small>Budget</small>
                      <strong>
                        {project.budget ? `$${project.budget}` : "Not listed"}
                        {project.freelancePricingType ===
                        FreelancePricingTypes.Hourly
                          ? " / hour"
                          : ""}
                      </strong>
                    </span>
                    <span>
                      <small>Delivery</small>
                      <strong>
                        {project.freelanceDeliveryDays ??
                          project.durationWeeks * 7}{" "}
                        days
                      </strong>
                    </span>
                    <span>
                      <small>Proposals</small>
                      <strong>{project.applicationsCount}</strong>
                    </span>
                  </div>
                ) : null}
                <div className="jobseeker-opportunity-meta">
                  <span>
                    <Clock3 size={15} />
                    {project.type === OpportunityTypes.FreelanceTask
                      ? `${project.freelanceDeliveryDays ?? project.durationWeeks * 7} days delivery`
                      : `${project.durationWeeks} weeks`}
                  </span>
                  <span>
                    <BriefcaseBusiness size={15} />
                    {project.budget
                      ? `$${project.budget}${
                          project.type === OpportunityTypes.FreelanceTask
                            ? ` · ${getFreelancePricingLabel(
                                project.freelancePricingType,
                              ).toLowerCase()}`
                            : ""
                        }`
                      : project.type === OpportunityTypes.UniversityTraining
                        ? "Unpaid training"
                        : "No payment listed"}
                  </span>
                  {project.type === OpportunityTypes.FreelanceTask ? (
                    <span>
                      <RotateCcw size={15} />
                      {project.includedRevisions ?? 1} included{" "}
                      {(project.includedRevisions ?? 1) === 1
                        ? "revision"
                        : "revisions"}
                    </span>
                  ) : null}
                  <span><MapPin size={15} />{getWorkModeLabel(project.workMode)}{project.location ? ` - ${project.location}` : ""}</span>
                  <span><Wrench size={15} />{getExperienceLevelLabel(project.experienceLevel)}</span>
                  <span><ShieldCheck size={15} />Verified provider</span>
                </div>
                <div className="project-skill-tags">
                  {project.skills.map((skill) => (
                    <span className={skill.isRequired ? "required" : "preferred"} key={skill.id}>
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="jobseeker-opportunity-action">
                <Button to={`${detailsBasePath}/${project.id}`} variant="secondary">
                  {isFreelanceView ? "View task" : "View details"}
                  <ArrowRight size={16} aria-hidden="true" />
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function FileApplicationCount({ count }: { count: number }) {
  return (
    <span className="jobseeker-summary-count" aria-label={`${count} applications`}>
      {count}
    </span>
  );
}
