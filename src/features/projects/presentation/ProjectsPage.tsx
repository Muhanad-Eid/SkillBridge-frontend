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
import { useAuth } from "../../../shared/auth/AuthContext";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import Pagination from "../../../shared/components/Pagination";
import StatusBadge from "../../../shared/components/StatusBadge";
import {
  ApplicationStatuses,
  getApplicationStatusLabel,
  type Application,
  type ApplicationStatus,
} from "../../applications/domain/applicationTypes";
import { getMyApplicationsAsync } from "../../applications/infrastructure/applicationApi";
import {
  ExperienceLevels,
  FreelancePricingTypes,
  getExperienceLevelLabel,
  getFreelancePricingLabel,
  getOpportunityTypeLabel,
  getWorkModeLabel,
  OpportunityTypes,
  ProjectStatuses,
  WorkModes,
  type OpportunityType,
  type Project,
} from "../domain/projectTypes";
import { getProjectsAsync } from "../infrastructure/projectApi";
import FreelanceWorkspaceNav from "./FreelanceWorkspaceNav";

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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;
  const [typeFilter, setTypeFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [applicationFilter, setApplicationFilter] = useState("all");
  const [workModeFilter, setWorkModeFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [skillFilter, setSkillFilter] = useState("all");
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
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  function updatePageResetting<T>(setter: (value: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

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
      setIsLoading(true);
      setError("");

      try {
        const [projectData, applicationData] = await Promise.all([
          getProjectsAsync({
            page,
            pageSize,
            search: debouncedSearch,
            type: isFreelanceView
              ? OpportunityTypes.FreelanceTask
              : typeFilter === "all"
                ? null
                : (Number(typeFilter) as OpportunityType),
            workMode: workModeFilter === "all" ? null : Number(workModeFilter),
            experienceLevel:
              experienceFilter === "all" ? null : Number(experienceFilter),
            excludeFreelance: !isFreelanceView,
            sort:
              sort === "deadline"
                ? "deadline"
                : sort === "budget"
                  ? "budget-desc"
                  : "newest",
          }),
          isJobSeeker ? getMyApplicationsAsync() : Promise.resolve(null),
        ]);

        if (isMounted) {
          setProjects(projectData.items);
          setTotalCount(projectData.totalCount);
          setTotalPages(Math.max(1, projectData.totalPages));
          setApplications(applicationData?.items ?? []);
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
  }, [
    debouncedSearch,
    experienceFilter,
    isFreelanceView,
    isJobSeeker,
    page,
    sort,
    typeFilter,
    workModeFilter,
  ]);

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

  const availableProjectSkills = useMemo(() => {
    const skills = new Map<number, string>();
    scopedProjects.forEach((project) => {
      project.skills.forEach((skill) => skills.set(skill.id, skill.name));
    });
    return [...skills.entries()].sort((left, right) => left[1].localeCompare(right[1]));
  }, [scopedProjects]);

  const filteredProjects = useMemo(() => {
    // Search, opportunity type, work mode, experience, and ordering are
    // applied server-side; these refinements narrow the current page.
    return scopedProjects.filter((project) => {
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
      const matchesApplication =
        applicationFilter === "all" ||
        (applicationFilter === "new" && !hasApplied) ||
        (applicationFilter === "applied" && hasApplied);
      const matchesSkill =
        skillFilter === "all" ||
        project.skills.some((skill) => skill.id === Number(skillFilter));
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

      return matchesDuration && matchesApplication && matchesSkill &&
        matchesPricing && matchesBudget;
    }).sort((left, right) => {
      if (isFreelanceView && sort === "delivery") {
        return (
          (left.freelanceDeliveryDays ?? left.durationWeeks * 7) -
          (right.freelanceDeliveryDays ?? right.durationWeeks * 7)
        );
      }
      return 0;
    });
  }, [
    applicationByProject,
    applicationFilter,
    budgetFilter,
    durationFilter,
    isFreelanceView,
    pricingFilter,
    scopedProjects,
    skillFilter,
    sort,
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
        title={isFreelanceView ? "Industry micro-tasks" : "Opportunities"}
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
        <FreelanceWorkspaceNav />
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

      <div className="jobseeker-discovery-filter-area" ref={filterControlRef}>
        <div className="jobseeker-discovery-toolbar">
          <label className="jobseeker-search-field">
          <Search size={18} aria-hidden="true" />
          <input
            aria-label={isFreelanceView ? "Search industry micro-tasks" : "Search opportunities"}
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
            aria-label="Sort industry micro-tasks"
            value={sort}
            onChange={(event) => updatePageResetting(setSort, event.target.value)}
          >
            <option value="recommended">Available tasks</option>
            <option value="budget">Highest budget</option>
            <option value="delivery">Fastest delivery</option>
          </select>
          ) : null}
          <div className="jobseeker-filter-control">
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

          </div>
        </div>

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
                      onChange={(event) => updatePageResetting(setTypeFilter, event.target.value)}
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
                    onChange={(event) => updatePageResetting(setWorkModeFilter, event.target.value)}
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
                    onChange={(event) => updatePageResetting(setExperienceFilter, event.target.value)}
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
                  Show {totalCount} result{totalCount === 1 ? "" : "s"}
                </Button>
              </footer>
          </section>
        ) : null}
      </div>

      <div className="jobseeker-results-heading">
        <div>
          <strong>{totalCount} result{totalCount === 1 ? "" : "s"}</strong>
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
        emptyTitle={isFreelanceView ? "No industry micro-tasks found" : "No opportunities found"}
        emptyDescription={
          isFreelanceView
            ? "Change a filter or check back when verified clients publish new tasks."
            : "Change a filter or check back when companies publish new work."
        }
      />

      <div className="jobseeker-opportunity-list">
        {filteredProjects.map((project) => {
          const application = applicationByProject.get(project.id);

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

      <Pagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        isLoading={isLoading}
        itemLabel={isFreelanceView ? "tasks" : "opportunities"}
        onPageChange={(nextPage) => {
          setPage(nextPage);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
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

