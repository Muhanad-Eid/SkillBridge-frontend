import {
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Edit3,
  FolderKanban,
  MapPin,
  Plus,
  Search,
  Trash2,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import Input from "../../../shared/components/Input";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import type { Skill } from "../../skills/domain/skillTypes";
import { getSkillsAsync } from "../../skills/infrastructure/skillApi";
import {
  ExperienceLevels,
  getExperienceLevelLabel,
  getOpportunityTypeLabel,
  getProjectDisplayStatusLabel,
  getProjectStatusLabel,
  getWorkModeLabel,
  isApplicationDeadlinePassed,
  isProjectAcceptingApplications,
  OpportunityTypes,
  ProjectStatuses,
  WorkModes,
  type ExperienceLevel,
  type OpportunityType,
  type Project,
  type ProjectStatus,
  type WorkMode,
} from "../domain/projectTypes";
import {
  createProjectAsync,
  deleteProjectAsync,
  getMyCompanyProjectsAsync,
  updateProjectAsync,
  updateProjectStatusAsync,
} from "../infrastructure/projectApi";

type FormMode = "create" | "edit";

type ProjectForm = {
  title: string;
  description: string;
  requirements: string;
  location: string;
  workMode: WorkMode;
  experienceLevel: ExperienceLevel;
  positionsAvailable: string;
  applicationDeadline: string;
  budget: string;
  durationWeeks: string;
  type: OpportunityType;
  requiredSkillNames: string[];
  preferredSkillNames: string[];
};

type CompanyPortalContext = {
  isCompanyVerified: boolean;
};

const emptyProjectForm: ProjectForm = {
  title: "",
  description: "",
  requirements: "",
  location: "",
  workMode: WorkModes.Remote,
  experienceLevel: ExperienceLevels.Beginner,
  positionsAvailable: "1",
  applicationDeadline: "",
  budget: "",
  durationWeeks: "6",
  type: OpportunityTypes.PaidProject,
  requiredSkillNames: [],
  preferredSkillNames: [],
};

function mergeSkillNames(...groups: string[][]) {
  const names = new Map<string, string>();

  groups.flat().forEach((rawName) => {
    rawName
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .forEach((name) => names.set(name.toLowerCase(), name));
  });

  return [...names.values()];
}

function getStatusTone(
  project: Pick<Project, "status" | "applicationDeadline">,
) {
  if (
    project.status === ProjectStatuses.Open &&
    isApplicationDeadlinePassed(project.applicationDeadline)
  ) {
    return "amber";
  }
  if (project.status === ProjectStatuses.Open) return "green";
  if (project.status === ProjectStatuses.InProgress) return "blue";
  if (project.status === ProjectStatuses.Cancelled) return "red";
  return "neutral";
}

export default function CompanyProjectsPage() {
  const { isCompanyVerified } = useOutletContext<CompanyPortalContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const createRequested = searchParams.get("create") === "1";
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [requiredSkillInput, setRequiredSkillInput] = useState("");
  const [preferredSkillInput, setPreferredSkillInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [isFormOpen, setIsFormOpen] = useState(
    createRequested && isCompanyVerified,
  );
  const [mode, setMode] = useState<FormMode>("create");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectForm>(emptyProjectForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyProjectId, setBusyProjectId] = useState<number | null>(null);
  const [error, setError] = useState(
    createRequested && !isCompanyVerified
      ? "Your company must be verified before posting opportunities."
      : "",
  );
  const [message, setMessage] = useState("");

  async function loadProjects() {
    setIsLoading(true);
    setError("");

    try {
      const [projectData, skillData] = await Promise.all([
        getMyCompanyProjectsAsync(),
        getSkillsAsync(),
      ]);
      setProjects(projectData);
      setAvailableSkills(skillData);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load opportunities.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(loadProjects, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const filteredProjects = useMemo(() => {
    const value = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "ApplicationsClosed"
          ? project.status === ProjectStatuses.Open &&
            isApplicationDeadlinePassed(project.applicationDeadline)
          : Number(statusFilter) === ProjectStatuses.Open
            ? isProjectAcceptingApplications(project)
            : project.status === Number(statusFilter));
      const matchesType = typeFilter === "All" || project.type === Number(typeFilter);
      const matchesSearch =
        !value ||
        project.title.toLowerCase().includes(value) ||
        project.description.toLowerCase().includes(value) ||
        project.requirements.toLowerCase().includes(value) ||
        project.skills.some((skill) => skill.name.toLowerCase().includes(value));

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [projects, search, statusFilter, typeFilter]);

  const stats = useMemo(
    () => ({
      total: projects.length,
      open: projects.filter(isProjectAcceptingApplications).length,
      active: projects.filter(
        (project) => project.status === ProjectStatuses.InProgress,
      ).length,
      applications: projects.reduce(
        (total, project) => total + project.applicationsCount,
        0,
      ),
    }),
    [projects],
  );

  function openCreateForm() {
    setMessage("");
    setError("");

    if (!isCompanyVerified) {
      setError("Your company must be verified before posting opportunities.");
      return;
    }

    setMode("create");
    setEditingProject(null);
    setForm(emptyProjectForm);
    setRequiredSkillInput("");
    setPreferredSkillInput("");
    setIsFormOpen(true);
  }

  function openEditForm(project: Project) {
    setMode("edit");
    setEditingProject(project);
    setForm({
      title: project.title,
      description: project.description,
      requirements: project.requirements,
      location: project.location ?? "",
      workMode: project.workMode,
      experienceLevel: project.experienceLevel,
      positionsAvailable: project.positionsAvailable.toString(),
      applicationDeadline: project.applicationDeadline ?? "",
      budget: project.budget?.toString() ?? "",
      durationWeeks: project.durationWeeks.toString(),
      type: project.type,
      requiredSkillNames: project.skills
        .filter((skill) => skill.isRequired)
        .map((skill) => skill.name),
      preferredSkillNames: project.skills
        .filter((skill) => !skill.isRequired)
        .map((skill) => skill.name),
    });
    setRequiredSkillInput("");
    setPreferredSkillInput("");
    setMessage("");
    setError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setMode("create");
    setEditingProject(null);
    setForm(emptyProjectForm);
    setRequiredSkillInput("");
    setPreferredSkillInput("");

    if (searchParams.has("create")) {
      setSearchParams({}, { replace: true });
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const durationWeeks = Number(form.durationWeeks);
    const positionsAvailable = Number(form.positionsAvailable);
    const budget = form.budget.trim() ? Number(form.budget) : null;
    const requiredSkillNames = mergeSkillNames(
      form.requiredSkillNames,
      [requiredSkillInput],
    );
    const requiredNames = new Set(
      requiredSkillNames.map((name) => name.toLowerCase()),
    );
    const preferredSkillNames = mergeSkillNames(
      form.preferredSkillNames,
      [preferredSkillInput],
    ).filter((name) => !requiredNames.has(name.toLowerCase()));

    if (!form.title.trim() || !form.description.trim() || !form.requirements.trim()) {
      setError("Title, description, and requirements are required.");
      return;
    }

    if (!Number.isInteger(positionsAvailable) || positionsAvailable < 1) {
      setError("At least one position must be available.");
      return;
    }

    if (form.workMode !== WorkModes.Remote && !form.location.trim()) {
      setError("Location is required for hybrid and on-site opportunities.");
      return;
    }

    if (requiredSkillNames.length === 0) {
      setError("Add at least one required skill.");
      return;
    }

    if (!Number.isInteger(durationWeeks) || durationWeeks < 1) {
      setError("Duration must be at least one full week.");
      return;
    }

    if (budget !== null && (!Number.isFinite(budget) || budget < 0)) {
      setError("Budget must be zero or greater.");
      return;
    }

    setIsSaving(true);

    try {
      if (mode === "create") {
        await createProjectAsync({
          title: form.title.trim(),
          description: form.description.trim(),
          requirements: form.requirements.trim(),
          location: form.location.trim() || null,
          workMode: form.workMode,
          experienceLevel: form.experienceLevel,
          positionsAvailable,
          applicationDeadline: form.applicationDeadline || null,
          budget,
          durationWeeks,
          type: form.type,
          requiredSkillNames,
          preferredSkillNames,
        });
        setMessage("Opportunity published.");
      } else if (editingProject) {
        await updateProjectAsync(editingProject.id, {
          title: form.title.trim(),
          description: form.description.trim(),
          requirements: form.requirements.trim(),
          location: form.location.trim() || null,
          workMode: form.workMode,
          experienceLevel: form.experienceLevel,
          positionsAvailable,
          applicationDeadline: form.applicationDeadline || null,
          budget,
          durationWeeks,
          type: form.type,
          requiredSkillNames,
          preferredSkillNames,
          status: editingProject.status,
        });
        setMessage("Opportunity details updated.");
      }

      closeForm();
      await loadProjects();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save opportunity.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function updateStatus(project: Project, status: ProjectStatus) {
    if (
      status === ProjectStatuses.Cancelled &&
      !window.confirm(`Cancel "${project.title}"?`)
    ) {
      return;
    }

    setBusyProjectId(project.id);
    setMessage("");
    setError("");

    try {
      await updateProjectStatusAsync(project.id, status);
      setMessage(`"${project.title}" is now ${getProjectStatusLabel(status)}.`);
      await loadProjects();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update opportunity status.",
      );
    } finally {
      setBusyProjectId(null);
    }
  }

  async function handleDelete(project: Project) {
    if (!window.confirm(`Delete "${project.title}" permanently?`)) {
      return;
    }

    setBusyProjectId(project.id);
    setMessage("");
    setError("");

    try {
      await deleteProjectAsync(project.id);
      setMessage("Opportunity deleted.");
      await loadProjects();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete opportunity.",
      );
    } finally {
      setBusyProjectId(null);
    }
  }

  function addSkillNames(
    level: "required" | "preferred",
    value: string,
  ) {
    const targetKey = level === "required"
      ? "requiredSkillNames"
      : "preferredSkillNames";
    const otherKey = level === "required"
      ? "preferredSkillNames"
      : "requiredSkillNames";
    const names = mergeSkillNames([value]);

    if (names.length === 0) return;

    const normalizedNames = new Set(names.map((name) => name.toLowerCase()));

    setForm((current) => ({
      ...current,
      [targetKey]: mergeSkillNames(current[targetKey], names),
      [otherKey]: current[otherKey].filter(
        (name) => !normalizedNames.has(name.toLowerCase()),
      ),
    }));

    if (level === "required") setRequiredSkillInput("");
    else setPreferredSkillInput("");
  }

  function removeSkillName(level: "required" | "preferred", name: string) {
    const targetKey = level === "required"
      ? "requiredSkillNames"
      : "preferredSkillNames";

    setForm((current) => ({
      ...current,
      [targetKey]: current[targetKey].filter(
        (skillName) => skillName.toLowerCase() !== name.toLowerCase(),
      ),
    }));
  }

  function handleSkillKeyDown(
    event: ReactKeyboardEvent<HTMLInputElement>,
    level: "required" | "preferred",
  ) {
    if (event.key !== "Enter" && event.key !== ",") return;

    event.preventDefault();
    addSkillNames(level, event.currentTarget.value);
  }

  return (
    <section className="page company-opportunities-page">
      <PageHeader
        title="Opportunities"
        actions={
          <Button
            type="button"
            onClick={openCreateForm}
            disabled={!isCompanyVerified}
            className="button-with-icon"
            title={isCompanyVerified ? "Create opportunity" : "Verification required"}
          >
            <Plus size={17} aria-hidden="true" />
            New opportunity
          </Button>
        }
      />

      {message ? <div className="notice notice-success">{message}</div> : null}
      {error ? <div className="notice notice-error">{error}</div> : null}

      <div className="company-kpi-grid company-opportunity-kpis">
        <article>
          <span className="company-kpi-icon kpi-neutral">
            <BriefcaseBusiness size={19} aria-hidden="true" />
          </span>
          <div><span>Total</span><strong>{stats.total}</strong></div>
        </article>
        <article>
          <span className="company-kpi-icon kpi-green">
            <BriefcaseBusiness size={19} aria-hidden="true" />
          </span>
          <div><span>Open</span><strong>{stats.open}</strong></div>
        </article>
        <article>
          <span className="company-kpi-icon kpi-blue">
            <Clock3 size={19} aria-hidden="true" />
          </span>
          <div><span>In progress</span><strong>{stats.active}</strong></div>
        </article>
        <article>
          <span className="company-kpi-icon kpi-amber">
            <UsersRound size={19} aria-hidden="true" />
          </span>
          <div><span>Applications</span><strong>{stats.applications}</strong></div>
        </article>
      </div>

      <div className="company-list-toolbar">
        <label className="company-search-field">
          <Search size={17} aria-hidden="true" />
          <input
            aria-label="Search company opportunities"
            placeholder="Search opportunities"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <select
          aria-label="Filter opportunities by status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="All">All statuses</option>
          <option value={ProjectStatuses.Open}>Open</option>
          <option value="ApplicationsClosed">Applications closed</option>
          <option value={ProjectStatuses.InProgress}>In progress</option>
          <option value={ProjectStatuses.Completed}>Completed</option>
          <option value={ProjectStatuses.Cancelled}>Cancelled</option>
        </select>
        <select
          aria-label="Filter opportunities by type"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="All">All types</option>
          <option value={OpportunityTypes.PaidProject}>Paid projects</option>
          <option value={OpportunityTypes.Training}>Training</option>
        </select>
      </div>

      <DataState
        isLoading={isLoading}
        error=""
        empty={!isLoading && filteredProjects.length === 0}
        emptyTitle="No opportunities found"
        emptyDescription={
          projects.length === 0
            ? "Create your first opportunity after company verification."
            : "Adjust the search or filters."
        }
      />

      <div className="company-opportunity-list-v2">
        {filteredProjects.map((project) => {
          const isBusy = busyProjectId === project.id;
          const isAcceptingApplications =
            isProjectAcceptingApplications(project);
          const deadlinePassed = isApplicationDeadlinePassed(
            project.applicationDeadline,
          );

          return (
            <article className="company-opportunity-row" key={project.id}>
              <div className="company-opportunity-main">
                <div className="company-opportunity-title-row">
                  <div>
                    <span>{getOpportunityTypeLabel(project.type)} · #{project.id}</span>
                    <h2>{project.title}</h2>
                  </div>
                  <StatusBadge tone={getStatusTone(project)}>
                    {getProjectDisplayStatusLabel(project)}
                  </StatusBadge>
                </div>
                <p>{project.description}</p>
                <div className="company-opportunity-facts">
                  <span><UsersRound size={16} /> {project.applicationsCount} applications</span>
                  <span><Clock3 size={16} /> {project.durationWeeks} weeks</span>
                  <span><MapPin size={16} /> {getWorkModeLabel(project.workMode)}</span>
                  <span><Wrench size={16} /> {getExperienceLevelLabel(project.experienceLevel)}</span>
                  {project.applicationDeadline ? (
                    <span>
                      <CalendarDays size={16} />
                      {deadlinePassed ? "Closed" : "Apply by"}{" "}
                      {project.applicationDeadline}
                    </span>
                  ) : null}
                  <span>
                    <CircleDollarSign size={16} />
                    {project.budget !== null ? `$${project.budget}` : "No budget"}
                  </span>
                </div>
                <div className="project-skill-tags">
                  {project.skills.slice(0, 6).map((skill) => (
                    <span className={skill.isRequired ? "required" : "preferred"} key={skill.id}>
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="company-opportunity-controls">
                {project.status !== ProjectStatuses.Cancelled ? (
                  <Button
                    to={`/company/projects/${project.id}/work`}
                    variant={
                      isAcceptingApplications ? "secondary" : "primary"
                    }
                    className="button-with-icon"
                  >
                    <FolderKanban size={17} aria-hidden="true" />
                    Work hub
                  </Button>
                ) : null}
                <Button
                  to={`/company/projects/${project.id}/applications`}
                  variant={
                    isAcceptingApplications ? "primary" : "secondary"
                  }
                  className="button-with-icon"
                >
                  <UsersRound size={17} aria-hidden="true" />
                  {project.status === ProjectStatuses.Open ? "Applicants" : "Team & applicants"}
                </Button>

                {project.status === ProjectStatuses.Open ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isBusy || !isCompanyVerified}
                      onClick={() => updateStatus(project, ProjectStatuses.InProgress)}
                    >
                      Start work
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isBusy}
                      onClick={() => updateStatus(project, ProjectStatuses.Cancelled)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : null}

                {project.status === ProjectStatuses.InProgress ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isBusy}
                      onClick={() => updateStatus(project, ProjectStatuses.Completed)}
                    >
                      Complete
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isBusy}
                      onClick={() => updateStatus(project, ProjectStatuses.Cancelled)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : null}

                {project.status === ProjectStatuses.Cancelled ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isBusy || !isCompanyVerified}
                    onClick={() => updateStatus(project, ProjectStatuses.Open)}
                  >
                    Reopen
                  </Button>
                ) : null}

                <Button
                  type="button"
                  variant="ghost"
                  className="company-icon-action"
                  aria-label={`Edit ${project.title}`}
                  title="Edit opportunity"
                  onClick={() => openEditForm(project)}
                >
                  <Edit3 size={17} aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="company-icon-action company-danger-icon"
                  aria-label={`Delete ${project.title}`}
                  title={
                    project.applicationsCount > 0
                      ? "Cancel opportunities with activity"
                      : "Delete opportunity"
                  }
                  disabled={isBusy || project.applicationsCount > 0}
                  onClick={() => handleDelete(project)}
                >
                  <Trash2 size={17} aria-hidden="true" />
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {isFormOpen ? (
        <div className="company-drawer-backdrop" role="presentation">
          <section
            className="company-opportunity-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="company-opportunity-form-title"
          >
            <header>
              <div>
                <span>{mode === "create" ? "New listing" : `Project #${editingProject?.id}`}</span>
                <h2 id="company-opportunity-form-title">
                  {mode === "create" ? "Create opportunity" : "Edit opportunity"}
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="company-icon-action"
                aria-label="Close form"
                title="Close"
                onClick={closeForm}
              >
                <X size={19} aria-hidden="true" />
              </Button>
            </header>

            <form onSubmit={handleSave}>
              <Input
                label="Title"
                value={form.title}
                maxLength={120}
                required
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
              <label className="field">
                <span>Description</span>
                <textarea
                  value={form.description}
                  maxLength={2000}
                  required
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Requirements and expected outcomes</span>
                <textarea
                  value={form.requirements}
                  maxLength={3000}
                  required
                  placeholder="Required experience, responsibilities, and what successful completion looks like"
                  onChange={(event) =>
                    setForm({ ...form, requirements: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Opportunity type</span>
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm({ ...form, type: Number(event.target.value) as OpportunityType })
                  }
                >
                  <option value={OpportunityTypes.PaidProject}>Paid project</option>
                  <option value={OpportunityTypes.Training}>Training</option>
                </select>
              </label>
              <div className="company-form-grid">
                <label className="field">
                  <span>Work mode</span>
                  <select
                    value={form.workMode}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        workMode: Number(event.target.value) as WorkMode,
                      })
                    }
                  >
                    <option value={WorkModes.Remote}>Remote</option>
                    <option value={WorkModes.Hybrid}>Hybrid</option>
                    <option value={WorkModes.OnSite}>On-site</option>
                  </select>
                </label>
                <label className="field">
                  <span>Experience level</span>
                  <select
                    value={form.experienceLevel}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        experienceLevel: Number(event.target.value) as ExperienceLevel,
                      })
                    }
                  >
                    <option value={ExperienceLevels.Beginner}>Beginner</option>
                    <option value={ExperienceLevels.Intermediate}>Intermediate</option>
                    <option value={ExperienceLevels.Advanced}>Advanced</option>
                  </select>
                </label>
              </div>
              <Input
                label={form.workMode === WorkModes.Remote ? "Location (optional)" : "Location"}
                value={form.location}
                maxLength={150}
                required={form.workMode !== WorkModes.Remote}
                placeholder="City, country, or office location"
                onChange={(event) => setForm({ ...form, location: event.target.value })}
              />
              <div className="company-form-grid">
                <Input
                  label="Duration in weeks"
                  type="number"
                  min="1"
                  max="104"
                  value={form.durationWeeks}
                  required
                  onChange={(event) =>
                    setForm({ ...form, durationWeeks: event.target.value })
                  }
                />
                <Input
                  label="Budget (optional)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.budget}
                  onChange={(event) => setForm({ ...form, budget: event.target.value })}
                />
              </div>
              <div className="company-form-grid">
                <Input
                  label="Positions available"
                  type="number"
                  min="1"
                  max="100"
                  value={form.positionsAvailable}
                  required
                  onChange={(event) =>
                    setForm({ ...form, positionsAvailable: event.target.value })
                  }
                />
                <Input
                  label="Application deadline (optional)"
                  type="date"
                  value={form.applicationDeadline}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(event) =>
                    setForm({ ...form, applicationDeadline: event.target.value })
                  }
                />
              </div>
              <fieldset className="project-skill-picker">
                <legend><Wrench size={16} /> Skills</legend>
                <p>Type a skill and press Enter or comma. Existing skills are suggested, but you can add any skill the opportunity needs.</p>
                <datalist id="company-skill-suggestions">
                  {availableSkills.map((skill) => (
                    <option key={skill.id} value={skill.name} />
                  ))}
                </datalist>

                <div className="project-skill-entry">
                  <label htmlFor="required-skill-input">Required skills</label>
                  <div>
                    <input
                      id="required-skill-input"
                      list="company-skill-suggestions"
                      value={requiredSkillInput}
                      maxLength={100}
                      placeholder="React, SQL, communication..."
                      onChange={(event) => setRequiredSkillInput(event.target.value)}
                      onKeyDown={(event) => handleSkillKeyDown(event, "required")}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!requiredSkillInput.trim()}
                      onClick={() => addSkillNames("required", requiredSkillInput)}
                    >
                      <Plus size={16} aria-hidden="true" />
                      Add
                    </Button>
                  </div>
                  <div className="project-skill-tags editable">
                    {form.requiredSkillNames.map((name) => (
                      <span className="required" key={name.toLowerCase()}>
                        {name}
                        <button
                          type="button"
                          aria-label={`Remove ${name}`}
                          onClick={() => removeSkillName("required", name)}
                        >
                          <X size={13} aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="project-skill-entry">
                  <label htmlFor="preferred-skill-input">Preferred skills</label>
                  <div>
                    <input
                      id="preferred-skill-input"
                      list="company-skill-suggestions"
                      value={preferredSkillInput}
                      maxLength={100}
                      placeholder="Testing, Figma, documentation..."
                      onChange={(event) => setPreferredSkillInput(event.target.value)}
                      onKeyDown={(event) => handleSkillKeyDown(event, "preferred")}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!preferredSkillInput.trim()}
                      onClick={() => addSkillNames("preferred", preferredSkillInput)}
                    >
                      <Plus size={16} aria-hidden="true" />
                      Add
                    </Button>
                  </div>
                  <div className="project-skill-tags editable">
                    {form.preferredSkillNames.map((name) => (
                      <span className="preferred" key={name.toLowerCase()}>
                        {name}
                        <button
                          type="button"
                          aria-label={`Remove ${name}`}
                          onClick={() => removeSkillName("preferred", name)}
                        >
                          <X size={13} aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </fieldset>
              <div className="company-drawer-actions">
                <Button type="button" variant="secondary" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSaving}>
                  {mode === "create" ? "Publish opportunity" : "Save changes"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
