import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import {
  getOpportunityTypeLabel,
  getProjectStatusLabel,
  OpportunityTypes,
  ProjectStatuses,
  type OpportunityType,
  type ProjectStatus,
} from "../../projects/domain/projectTypes";
import type { AdminCompany, AdminProject } from "../domain/adminTypes";
import {
  createAdminProjectAsync,
  deleteProjectAsync,
  getAdminCompaniesAsync,
  getAdminProjectsAsync,
  updateAdminProjectAsync,
} from "../infrastructure/adminApi";

type FormMode = "create" | "edit";

type ProjectForm = {
  companyId: string;
  title: string;
  description: string;
  budget: string;
  durationWeeks: string;
  type: OpportunityType;
  status: ProjectStatus;
};

const emptyProjectForm: ProjectForm = {
  companyId: "",
  title: "",
  description: "",
  budget: "",
  durationWeeks: "1",
  type: OpportunityTypes.PaidProject,
  status: ProjectStatuses.Open,
};

export default function AdminProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [mode, setMode] = useState<FormMode | null>(null);
  const [editingProject, setEditingProject] = useState<AdminProject | null>(
    null,
  );
  const [form, setForm] = useState<ProjectForm>(emptyProjectForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadProjects() {
    setIsLoading(true);
    setError("");

    try {
      const [projectData, companyData] = await Promise.all([
        getAdminProjectsAsync(),
        getAdminCompaniesAsync(),
      ]);

      setProjects(projectData);
      setCompanies(companyData);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load projects.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(loadProjects, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (searchParams.get("action") !== "create") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMode("create");
      setEditingProject(null);
      setForm({
        ...emptyProjectForm,
        companyId: companies[0]?.id.toString() ?? "",
      });
      setError("");
      setSearchParams({}, { replace: true });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [companies, searchParams, setSearchParams]);

  useEffect(() => {
    if (mode !== "create" || form.companyId || companies.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setForm((current) => ({
        ...current,
        companyId: companies[0].id.toString(),
      }));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [companies, form.companyId, mode]);

  const filteredProjects = useMemo(() => {
    const value = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesStatus =
        statusFilter === "All" || project.status === Number(statusFilter);
      const matchesSearch =
        !value ||
        project.title.toLowerCase().includes(value) ||
        project.companyName.toLowerCase().includes(value) ||
        project.description.toLowerCase().includes(value);

      return matchesStatus && matchesSearch;
    });
  }, [projects, search, statusFilter]);

  const projectStats = useMemo(() => {
    return {
      total: projects.length,
      open: projects.filter((project) => project.status === ProjectStatuses.Open)
        .length,
      inProgress: projects.filter(
        (project) => project.status === ProjectStatuses.InProgress,
      ).length,
      completed: projects.filter(
        (project) => project.status === ProjectStatuses.Completed,
      ).length,
    };
  }, [projects]);

  function startCreate() {
    setMode("create");
    setEditingProject(null);
    setForm({
      ...emptyProjectForm,
      companyId: companies[0]?.id.toString() ?? "",
    });
    setError("");
  }

  function startEdit(project: AdminProject) {
    setMode("edit");
    setEditingProject(project);
    setForm({
      companyId: project.companyId.toString(),
      title: project.title,
      description: project.description,
      budget: project.budget?.toString() ?? "",
      durationWeeks: project.durationWeeks.toString(),
      type: project.type,
      status: project.status,
    });
    setError("");
  }

  function closeForm() {
    setMode(null);
    setEditingProject(null);
    setForm(emptyProjectForm);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setError("");

    try {
      const request = {
        title: form.title.trim(),
        description: form.description.trim(),
        budget: form.budget.trim() ? Number(form.budget) : null,
        durationWeeks: Number(form.durationWeeks),
        type: form.type,
        status: form.status,
      };

      if (mode === "create") {
        await createAdminProjectAsync({
          ...request,
          companyId: Number(form.companyId),
        });
      } else if (mode === "edit" && editingProject) {
        await updateAdminProjectAsync(editingProject.id, request);
      }

      closeForm();
      await loadProjects();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save project.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(project: AdminProject) {
    const confirmed = window.confirm(`Delete project "${project.title}"?`);

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await deleteProjectAsync(project.id);
      await loadProjects();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete project.",
      );
    }
  }

  return (
    <section className="page admin-list-page">
      <PageHeader
        title="Project oversight"
        actions={
          <Button type="button" onClick={startCreate}>
            Add project
          </Button>
        }
      />

      <div className="toolbar admin-toolbar">
        <input
          aria-label="Search projects"
          placeholder="Search by project title, company, or description"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Filter projects by status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="All">All statuses</option>
          <option value={ProjectStatuses.Open}>Open</option>
          <option value={ProjectStatuses.InProgress}>In progress</option>
          <option value={ProjectStatuses.Completed}>Completed</option>
          <option value={ProjectStatuses.Cancelled}>Cancelled</option>
        </select>
      </div>

      <div className="admin-list-stats">
        <article>
          <span>Total projects</span>
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
          <span>Completed</span>
          <strong>{projectStats.completed}</strong>
        </article>
      </div>

      {mode ? (
        <form className="admin-edit-card" onSubmit={handleSave}>
          <div>
            <span>{mode === "create" ? "Add project" : "Edit project"}</span>
            <strong>
              {mode === "create"
                ? "Create a company opportunity"
                : editingProject?.title}
            </strong>
          </div>
          <div className="form-grid">
            {mode === "create" ? (
              <label className="field">
                <span>Company</span>
                <select
                  value={form.companyId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      companyId: event.target.value,
                    }))
                  }
                  required
                >
                  {companies.length === 0 ? (
                    <option value="">No companies available</option>
                  ) : null}
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.companyName}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="field">
              <span>Title</span>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="field">
              <span>Budget</span>
              <input
                min="0"
                step="1"
                type="number"
                value={form.budget}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    budget: event.target.value,
                  }))
                }
              />
            </label>
            <label className="field">
              <span>Duration weeks</span>
              <input
                max="52"
                min="1"
                type="number"
                value={form.durationWeeks}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    durationWeeks: event.target.value,
                  }))
                }
                required
              />
            </label>
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
          </div>
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
          <div className="admin-edit-actions">
            <Button
              type="submit"
              isLoading={isSaving}
              disabled={mode === "create" && companies.length === 0}
            >
              {mode === "create" ? "Create project" : "Save changes"}
            </Button>
            <Button type="button" variant="secondary" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <DataState
        isLoading={isLoading}
        error={error}
        empty={filteredProjects.length === 0}
        emptyTitle="No projects"
        emptyDescription="Projects posted by companies will appear here."
      />

      <div className="table-card admin-table-card">
        {filteredProjects.map((project) => (
          <div className="table-row" key={project.id}>
            <div>
              <strong>{project.title}</strong>
              <span>{project.companyName}</span>
              <span>
                {getOpportunityTypeLabel(project.type)} / {project.durationWeeks}{" "}
                weeks / {project.budget ? `$${project.budget}` : "No budget"}
              </span>
              <span>{project.description}</span>
            </div>
            <div className="admin-status-stack">
              <StatusBadge
                tone={project.status === ProjectStatuses.Open ? "green" : "neutral"}
              >
                {getProjectStatusLabel(project.status)}
              </StatusBadge>
              <span>{project.applicationsCount} applications</span>
            </div>
            <div className="admin-row-actions">
              <Button variant="secondary" onClick={() => startEdit(project)}>
                Edit
              </Button>
              <Button
                variant="secondary"
                className="button-danger"
                onClick={() => handleDelete(project)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
