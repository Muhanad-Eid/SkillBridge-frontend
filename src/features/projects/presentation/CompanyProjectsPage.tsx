import { type FormEvent, useEffect, useMemo, useState } from "react";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import DataState from "../../../shared/components/DataState";
import Input from "../../../shared/components/Input";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
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
  status: ProjectStatus;
};

const emptyProjectForm: ProjectForm = {
  title: "",
  description: "",
  budget: "",
  durationWeeks: "6",
  type: OpportunityTypes.PaidProject,
  status: ProjectStatuses.Open,
};

function getProjectStatusTone(status: ProjectStatus) {
  if (status === ProjectStatuses.Open) return "green";
  if (status === ProjectStatuses.InProgress) return "blue";
  if (status === ProjectStatuses.Cancelled) return "red";
  return "neutral";
}

function toUpdateRequest(project: Project, status = project.status): UpdateProjectRequest {
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [mode, setMode] = useState<FormMode>("create");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectForm>(emptyProjectForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
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
    loadProjects();
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
        project.description.toLowerCase().includes(value) ||
        getOpportunityTypeLabel(project.type).toLowerCase().includes(value);

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [projects, search, statusFilter, typeFilter]);

  const projectStats = useMemo(() => {
    return {
      total: projects.length,
      open: projects.filter((project) => project.status === ProjectStatuses.Open)
        .length,
      inProgress: projects.filter(
        (project) => project.status === ProjectStatuses.InProgress,
      ).length,
      applications: projects.reduce(
        (total, project) => total + project.applicationsCount,
        0,
      ),
      training: projects.filter((project) => project.type === OpportunityTypes.Training)
        .length,
      paid: projects.filter((project) => project.type === OpportunityTypes.PaidProject)
        .length,
    };
  }, [projects]);

  function resetForm() {
    setMode("create");
    setEditingProject(null);
    setForm(emptyProjectForm);
  }

  function startEdit(project: Project) {
    setMode("edit");
    setEditingProject(project);
    setForm({
      title: project.title,
      description: project.description,
      budget: project.budget?.toString() ?? "",
      durationWeeks: project.durationWeeks.toString(),
      type: project.type,
      status: project.status,
    });
    setMessage("");
    setError("");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      if (mode === "create") {
        await createProjectAsync({
          title: form.title.trim(),
          description: form.description.trim(),
          budget: form.budget.trim() ? Number(form.budget) : null,
          durationWeeks: Number(form.durationWeeks),
          type: form.type,
        });

        setMessage("Opportunity created.");
      } else if (editingProject) {
        await updateProjectAsync(editingProject.id, {
          title: form.title.trim(),
          description: form.description.trim(),
          budget: form.budget.trim() ? Number(form.budget) : null,
          durationWeeks: Number(form.durationWeeks),
          type: form.type,
          status: form.status,
        });

        setMessage("Opportunity updated.");
      }

      resetForm();
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
    setMessage("");
    setError("");

    try {
      await updateProjectAsync(project.id, toUpdateRequest(project, status));
      setMessage(`"${project.title}" moved to ${getProjectStatusLabel(status)}.`);
      await loadProjects();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update opportunity status.",
      );
    }
  }

  async function handleDelete(project: Project) {
    const confirmed = window.confirm(`Delete opportunity "${project.title}"?`);

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await deleteProjectAsync(project.id);

      if (editingProject?.id === project.id) {
        resetForm();
      }

      setMessage("Opportunity deleted.");
      await loadProjects();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete opportunity.",
      );
    }
  }

  return (
    <section className="page company-projects-page">
      <PageHeader
        eyebrow="Company"
        title="Opportunities"
        description="Create, edit, pause, complete, and review internships, training offers, and paid projects."
        actions={
          mode === "edit" ? (
            <Button type="button" variant="secondary" onClick={resetForm}>
              New opportunity
            </Button>
          ) : null
        }
      />

      <div className="portal-list-stats company-list-stats company-opportunity-stats">
        <article>
          <span>Total</span>
          <strong>{projectStats.total}</strong>
        </article>
        <article>
          <span>Open</span>
          <strong>{projectStats.open}</strong>
        </article>
        <article>
          <span>In progress</span>
          <strong>{projectStats.inProgress}</strong>
        </article>
        <article>
          <span>Applications</span>
          <strong>{projectStats.applications}</strong>
        </article>
        <article>
          <span>Training</span>
          <strong>{projectStats.training}</strong>
        </article>
        <article>
          <span>Paid projects</span>
          <strong>{projectStats.paid}</strong>
        </article>
      </div>

      <div className="company-opportunity-workspace">
        <Card
          title={mode === "create" ? "Create opportunity" : "Edit opportunity"}
          description={
            mode === "create"
              ? "Post a new internship, training offer, or paid project."
              : "Update the details applicants see and control the project status."
          }
        >
          <form className="stack" onSubmit={handleSave}>
            <Input
              label="Title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              required
            />
            <label className="field">
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                required
              />
            </label>
            <div className="form-grid">
              <Input
                label="Budget"
                type="number"
                min="0"
                value={form.budget}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    budget: event.target.value,
                  }))
                }
              />
              <Input
                label="Duration weeks"
                type="number"
                min="1"
                max="52"
                value={form.durationWeeks}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    durationWeeks: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Type</span>
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      type: Number(event.target.value) as OpportunityType,
                    }))
                  }
                >
                  <option value={OpportunityTypes.PaidProject}>Paid project</option>
                  <option value={OpportunityTypes.Training}>Training</option>
                </select>
              </label>
              {mode === "edit" ? (
                <label className="field">
                  <span>Status</span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: Number(event.target.value) as ProjectStatus,
                      }))
                    }
                  >
                    <option value={ProjectStatuses.Open}>Open</option>
                    <option value={ProjectStatuses.InProgress}>In progress</option>
                    <option value={ProjectStatuses.Completed}>Completed</option>
                    <option value={ProjectStatuses.Cancelled}>Cancelled</option>
                  </select>
                </label>
              ) : null}
            </div>
            {message ? <div className="notice">{message}</div> : null}
            <div className="admin-edit-actions">
              <Button type="submit" isLoading={isSaving}>
                {mode === "create" ? "Create opportunity" : "Save changes"}
              </Button>
              {mode === "edit" ? (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </Card>

        <div className="stack">
          <div className="toolbar company-opportunity-toolbar">
            <input
              aria-label="Search company opportunities"
              placeholder="Search by title, description, or type"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
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
            error={error}
            empty={filteredProjects.length === 0}
            emptyTitle="No opportunities"
            emptyDescription="Create an opportunity, or adjust your filters."
          />

          <div className="company-opportunity-list">
            {filteredProjects.map((project) => (
              <article className="company-opportunity-card" key={project.id}>
                <header>
                  <div>
                    <span>{getOpportunityTypeLabel(project.type)}</span>
                    <h2>{project.title}</h2>
                  </div>
                  <StatusBadge tone={getProjectStatusTone(project.status)}>
                    {getProjectStatusLabel(project.status)}
                  </StatusBadge>
                </header>

                <p>{project.description}</p>

                <div className="company-opportunity-meta">
                  <article>
                    <span>Applications</span>
                    <strong>{project.applicationsCount}</strong>
                  </article>
                  <article>
                    <span>Duration</span>
                    <strong>{project.durationWeeks} wk</strong>
                  </article>
                  <article>
                    <span>Budget</span>
                    <strong>{project.budget ? `$${project.budget}` : "None"}</strong>
                  </article>
                </div>

                <div className="company-status-actions">
                  {project.status !== ProjectStatuses.Open ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => updateStatus(project, ProjectStatuses.Open)}
                    >
                      Reopen
                    </Button>
                  ) : null}
                  {project.status !== ProjectStatuses.InProgress ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        updateStatus(project, ProjectStatuses.InProgress)
                      }
                    >
                      Start
                    </Button>
                  ) : null}
                  {project.status !== ProjectStatuses.Completed ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        updateStatus(project, ProjectStatuses.Completed)
                      }
                    >
                      Complete
                    </Button>
                  ) : null}
                  {project.status !== ProjectStatuses.Cancelled ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        updateStatus(project, ProjectStatuses.Cancelled)
                      }
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>

                <footer>
                  <Button
                    to={`/company/projects/${project.id}/applications`}
                    variant="primary"
                  >
                    Workers & applicants
                  </Button>
                  <Button variant="secondary" onClick={() => startEdit(project)}>
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    className="button-danger"
                    disabled={project.applicationsCount > 0}
                    onClick={() => handleDelete(project)}
                  >
                    Delete
                  </Button>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
