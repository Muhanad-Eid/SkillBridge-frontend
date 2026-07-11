import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { useAuth } from "../../../shared/auth/AuthContext";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import {
  getApplicationStatusLabel,
  type Application,
} from "../../applications/domain/applicationTypes";
import { getMyApplicationsAsync } from "../../applications/infrastructure/applicationApi";
import type { Skill } from "../../skills/domain/skillTypes";
import { getMySkillsAsync } from "../../skills/infrastructure/skillApi";
import {
  calculateProjectMatch,
  ExperienceLevels,
  getExperienceLevelLabel,
  getOpportunityTypeLabel,
  getWorkModeLabel,
  OpportunityTypes,
  ProjectStatuses,
  WorkModes,
  type Project,
} from "../domain/projectTypes";
import { getProjectsAsync } from "../infrastructure/projectApi";

export default function ProjectsPage() {
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const isJobSeeker = user?.role === "JobSeeker";

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

  const matchByProject = useMemo(() => {
    const skillIds = mySkills.map((skill) => skill.id);
    return new Map(
      projects.map((project) => [project.id, calculateProjectMatch(project, skillIds)]),
    );
  }, [mySkills, projects]);

  const availableProjectSkills = useMemo(() => {
    const skills = new Map<number, string>();
    projects.forEach((project) => {
      project.skills.forEach((skill) => skills.set(skill.id, skill.name));
    });
    return [...skills.entries()].sort((left, right) => left[1].localeCompare(right[1]));
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !searchValue ||
        project.title.toLowerCase().includes(searchValue) ||
        project.companyName.toLowerCase().includes(searchValue) ||
        project.description.toLowerCase().includes(searchValue) ||
        project.requirements.toLowerCase().includes(searchValue) ||
        project.skills.some((skill) => skill.name.toLowerCase().includes(searchValue));
      const matchesType =
        typeFilter === "all" || project.type === Number(typeFilter);
      const matchesDuration =
        durationFilter === "all" ||
        (durationFilter === "short" && project.durationWeeks <= 4) ||
        (durationFilter === "medium" &&
          project.durationWeeks > 4 &&
          project.durationWeeks <= 8) ||
        (durationFilter === "long" && project.durationWeeks > 8);
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

      return matchesSearch && matchesType && matchesDuration && matchesApplication &&
        matchesWorkMode && matchesExperience && matchesSkill && matchesFit;
    }).sort((left, right) =>
      isJobSeeker
        ? (matchByProject.get(right.id)?.score ?? 0) -
          (matchByProject.get(left.id)?.score ?? 0)
        : 0,
    );
  }, [
    applicationByProject,
    applicationFilter,
    durationFilter,
    experienceFilter,
    isJobSeeker,
    matchByProject,
    matchFilter,
    projects,
    search,
    skillFilter,
    typeFilter,
    workModeFilter,
  ]);

  const detailsBasePath = isJobSeeker
    ? "/job-seeker/opportunities"
    : "/opportunities";
  const openCount = projects.filter(
    (project) => project.status === ProjectStatuses.Open,
  ).length;

  return (
    <section className={`page marketplace-page ${isJobSeeker ? "jobseeker-discovery-page" : ""}`}>
      <PageHeader
        eyebrow={isJobSeeker ? "Discover" : "Opportunity marketplace"}
        title={isJobSeeker ? "Find your next opportunity" : "Find work-based learning that builds proof"}
        description={
          isJobSeeker
            ? "Search verified company projects, internships, and training. Compare the commitment before you apply."
            : "Browse internships, guided training, and real projects from verified companies."
        }
        actions={
          isJobSeeker ? (
            <Button to="/job-seeker/applications" variant="secondary">
              My applications
            </Button>
          ) : (
            <Button to="/register" variant="primary">Create profile</Button>
          )
        }
      />

      {isJobSeeker ? (
        <div className="jobseeker-discovery-summary">
          <article>
            <BriefcaseBusiness size={19} aria-hidden="true" />
            <div><strong>{openCount}</strong><span>Open opportunities</span></div>
          </article>
          <article>
            <ShieldCheck size={19} aria-hidden="true" />
            <div><strong>Verified</strong><span>Companies shown here</span></div>
          </article>
          <article>
            <FileApplicationCount count={applications.length} />
            <div><strong>{applications.length}</strong><span>Your applications</span></div>
          </article>
        </div>
      ) : null}

      <div className="jobseeker-discovery-toolbar">
        <label className="jobseeker-search-field">
          <Search size={18} aria-hidden="true" />
          <input
            aria-label="Search opportunities"
            placeholder="Search title, company, or keyword"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <select
          aria-label="Filter by type"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="all">All opportunity types</option>
          <option value={OpportunityTypes.PaidProject}>Paid projects</option>
          <option value={OpportunityTypes.Training}>Training</option>
        </select>
        <select
          aria-label="Filter by work mode"
          value={workModeFilter}
          onChange={(event) => setWorkModeFilter(event.target.value)}
        >
          <option value="all">Any work mode</option>
          <option value={WorkModes.Remote}>Remote</option>
          <option value={WorkModes.Hybrid}>Hybrid</option>
          <option value={WorkModes.OnSite}>On-site</option>
        </select>
        <select
          aria-label="Filter by experience level"
          value={experienceFilter}
          onChange={(event) => setExperienceFilter(event.target.value)}
        >
          <option value="all">Any experience level</option>
          <option value={ExperienceLevels.Beginner}>Beginner</option>
          <option value={ExperienceLevels.Intermediate}>Intermediate</option>
          <option value={ExperienceLevels.Advanced}>Advanced</option>
        </select>
        <select
          aria-label="Filter by skill"
          value={skillFilter}
          onChange={(event) => setSkillFilter(event.target.value)}
        >
          <option value="all">Any skill</option>
          {availableProjectSkills.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        <select
          aria-label="Filter by duration"
          value={durationFilter}
          onChange={(event) => setDurationFilter(event.target.value)}
        >
          <option value="all">Any duration</option>
          <option value="short">Up to 4 weeks</option>
          <option value="medium">5 to 8 weeks</option>
          <option value="long">More than 8 weeks</option>
        </select>
        {isJobSeeker ? (
          <>
            <select
              aria-label="Filter by skill match"
              value={matchFilter}
              onChange={(event) => setMatchFilter(event.target.value)}
            >
              <option value="all">Any match score</option>
              <option value="strong">70% match or better</option>
              <option value="complete">All required skills</option>
            </select>
            <select
              aria-label="Filter by application status"
              value={applicationFilter}
              onChange={(event) => setApplicationFilter(event.target.value)}
            >
              <option value="all">All listings</option>
              <option value="new">Not applied</option>
              <option value="applied">Already applied</option>
            </select>
          </>
        ) : null}
      </div>

      <div className="jobseeker-results-heading">
        <div>
          <strong>{filteredProjects.length} result{filteredProjects.length === 1 ? "" : "s"}</strong>
          <span>Only opportunities from verified companies are listed.</span>
        </div>
        {search || typeFilter !== "all" || durationFilter !== "all" ||
        applicationFilter !== "all" || workModeFilter !== "all" ||
        experienceFilter !== "all" || skillFilter !== "all" || matchFilter !== "all" ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearch("");
              setTypeFilter("all");
              setDurationFilter("all");
              setApplicationFilter("all");
              setWorkModeFilter("all");
              setExperienceFilter("all");
              setSkillFilter("all");
              setMatchFilter("all");
            }}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      <DataState
        isLoading={isLoading}
        error={error}
        empty={filteredProjects.length === 0}
        emptyTitle="No opportunities found"
        emptyDescription="Change a filter or check back when companies publish new work."
      />

      <div className="jobseeker-opportunity-list">
        {filteredProjects.map((project) => {
          const application = applicationByProject.get(project.id);
          const match = matchByProject.get(project.id);

          return (
            <article key={project.id}>
              <div className="jobseeker-opportunity-mark" aria-hidden="true">
                {project.companyName.trim().charAt(0).toUpperCase()}
              </div>
              <div className="jobseeker-opportunity-copy">
                <div className="jobseeker-opportunity-labels">
                  <StatusBadge tone={project.type === OpportunityTypes.Training ? "amber" : "blue"}>
                    {getOpportunityTypeLabel(project.type)}
                  </StatusBadge>
                  {application ? (
                    <StatusBadge tone="green">
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
                <div className="jobseeker-opportunity-meta">
                  <span><Clock3 size={15} />{project.durationWeeks} weeks</span>
                  <span><BriefcaseBusiness size={15} />{project.budget ? `$${project.budget}` : "Unpaid training"}</span>
                  <span><MapPin size={15} />{getWorkModeLabel(project.workMode)}{project.location ? ` - ${project.location}` : ""}</span>
                  <span><Wrench size={15} />{getExperienceLevelLabel(project.experienceLevel)}</span>
                  <span><ShieldCheck size={15} />Verified company</span>
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
                  {application ? "View application" : "View opportunity"}
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
