import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CircleDollarSign,
  Clock3,
  Edit3,
  Plus,
  Search,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import Input from "../../../shared/components/Input";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import type { CompanyProfile } from "../../profiles/domain/profileTypes";
import {
  getOpportunityTypeLabel,
  getProjectStatusLabel,
  OpportunityTypes,
  ProjectStatuses,
  type OpportunityType,
  type Project,
  type ProjectStatus,
  type UpdateProjectRequest,
} from "../domain/projectTypes";
import {
  createProjectAsync,
  deleteProjectAsync,
  getMyCompanyProjectsAsync,
  updateProjectAsync,
} from "../infrastructure/projectApi";

type FormMode = "create" | "edit";

type ProjectForm = {
  title: string;
  description: string;
  budget: string;
  durationWeeks: string;
  type: OpportunityType;
};

type CompanyPortalContext = {
  profile: CompanyProfile | null;
  isCompanyVerified: boolean;
};

const emptyProjectForm: ProjectForm = {
  title: "",
  description: "",
  budget: "",
  durationWeeks: "6",
  type: OpportunityTypes.PaidProject,
};

function getStatusTone(status: ProjectStatus) {
  if (status === ProjectStatuses.Open) return "green";
  if (status === ProjectStatuses.InProgress) return "blue";
  if (status === ProjectStatuses.Cancelled) return "red";
  return "neutral";
}

function toUpdateRequest(
  project: Project,
  status = project.status,
): UpdateProjectRequest {
  return {
    title: project.title,
    description: project.description,
    budget: project.budget,
    durationWeeks: project.durationWeeks,
    type: project.type,
    status,
  };
}

export default function CompanyProjectsPage() {
  const { profile, isCompanyVerified } = useOutletContext<CompanyPortalContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const createRequested = searchParams.get("create") === "1";
  const [projects, setProjects] = useState<Project[]>([]);
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
      setProjects(await getMyCompanyProjectsAsync());
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
        statusFilter === "All" || project.status === Number(statusFilter);
      const matchesType = typeFilter === "All" || project.type === Number(typeFilter);
      const matchesSearch =
        !value ||
        project.title.toLowerCase().includes(value) ||
        project.description.toLowerCase().includes(value);

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [projects, search, statusFilter, typeFilter]);

  const stats = useMemo(
    () => ({
      total: projects.length,
      open: projects.filter((project) => project.status === ProjectStatuses.Open)
        .length,
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
    setIsFormOpen(true);
  }

  function openEditForm(project: Project) {
    setMode("edit");
    setEditingProject(project);
    setForm({
      title: project.title,
      description: project.description,
      budget: project.budget?.toString() ?? "",
      durationWeeks: project.durationWeeks.toString(),
      type: project.type,
    });
    setMessage("");
    setError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setMode("create");
    setEditingProject(null);
    setForm(emptyProjectForm);

    if (searchParams.has("create")) {
      setSearchParams({}, { replace: true });
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const durationWeeks = Number(form.durationWeeks);
    const budget = form.budget.trim() ? Number(form.budget) : null;

    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
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
          budget,
          durationWeeks,
          type: form.type,
        });
        setMessage("Opportunity published.");
      } else if (editingProject) {
        await updateProjectAsync(editingProject.id, {
          title: form.title.trim(),
          description: form.description.trim(),
          budget,
          durationWeeks,
          type: form.type,
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
      await updateProjectAsync(project.id, toUpdateRequest(project, status));
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

  return (
    <section className="page company-opportunities-page">
      <PageHeader
        eyebrow={profile?.companyName ?? "Company"}
        title="Opportunities"
        description="Publish work, manage its lifecycle, and open the applicant or worker list for each opportunity."
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

          return (
            <article className="company-opportunity-row" key={project.id}>
              <div className="company-opportunity-main">
                <div className="company-opportunity-title-row">
                  <div>
                    <span>{getOpportunityTypeLabel(project.type)} · #{project.id}</span>
                    <h2>{project.title}</h2>
                  </div>
                  <StatusBadge tone={getStatusTone(project.status)}>
                    {getProjectStatusLabel(project.status)}
                  </StatusBadge>
                </div>
                <p>{project.description}</p>
                <div className="company-opportunity-facts">
                  <span><UsersRound size={16} /> {project.applicationsCount} applications</span>
                  <span><Clock3 size={16} /> {project.durationWeeks} weeks</span>
                  <span>
                    <CircleDollarSign size={16} />
                    {project.budget !== null ? `$${project.budget}` : "No budget"}
                  </span>
                </div>
              </div>

              <div className="company-opportunity-controls">
                <Button
                  to={`/company/projects/${project.id}/applications`}
                  variant="primary"
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
