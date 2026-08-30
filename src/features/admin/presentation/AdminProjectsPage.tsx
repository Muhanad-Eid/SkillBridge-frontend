import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../../../shared/components/Button";
import { useConfirmation } from "../../../shared/components/ConfirmationContext";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import Pagination from "../../../shared/components/Pagination";
import StatusBadge from "../../../shared/components/StatusBadge";
import {
  getOpportunityTypeLabel,
  getProjectStatusLabel,
  FreelancePricingTypes,
  OpportunityTypes,
  ProjectStatuses,
  type OpportunityType,
  type FreelancePricingType,
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
  freelancePricingType: FreelancePricingType;
  freelanceDeliveryDays: string;
  includedRevisions: string;
  durationWeeks: string;
  applicationTask: string;
  requiredTrainingHours: string;
  academicRequirements: string;
  type: OpportunityType;
  status: ProjectStatus;
};

const emptyProjectForm: ProjectForm = {
  companyId: "",
  title: "",
  description: "",
  budget: "",
  freelancePricingType: FreelancePricingTypes.FixedPrice,
  freelanceDeliveryDays: "14",
  includedRevisions: "1",
  durationWeeks: "1",
  applicationTask: "",
  requiredTrainingHours: "",
  academicRequirements: "",
  type: OpportunityTypes.ProfessionalProject,
  status: ProjectStatuses.Open,
};

export default function AdminProjectsPage() {
  const confirmAction = useConfirmation();
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
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [projectData, companyData] = await Promise.all([
        getAdminProjectsAsync(page, pageSize, debouncedSearch),
        getAdminCompaniesAsync(1, 50),
      ]);

      setProjects(projectData.items);
      setTotalCount(projectData.totalCount);
      setTotalPages(Math.max(1, projectData.totalPages));
      setCompanies(companyData.items);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load projects.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadProjects, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadProjects]);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

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
      freelancePricingType:
        project.freelancePricingType ?? FreelancePricingTypes.FixedPrice,
      freelanceDeliveryDays:
        project.freelanceDeliveryDays?.toString() ?? "14",
      includedRevisions:
        project.includedRevisions?.toString() ?? "1",
      durationWeeks: project.durationWeeks.toString(),
      applicationTask: project.applicationTask,
      requiredTrainingHours: project.requiredTrainingHours?.toString() ?? "",
      academicRequirements: project.academicRequirements ?? "",
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
      const requiredTrainingHours = form.requiredTrainingHours.trim()
        ? Number(form.requiredTrainingHours)
        : null;

      if (
        form.type === OpportunityTypes.UniversityTraining &&
        (!requiredTrainingHours ||
          requiredTrainingHours < 1 ||
          !form.academicRequirements.trim())
      ) {
        setError(
          "University Training requires training hours and academic requirements.",
        );
        return;
      }

      const budget = form.budget.trim() ? Number(form.budget) : null;
      const freelanceDeliveryDays = Number(form.freelanceDeliveryDays);
      const includedRevisions = Number(form.includedRevisions);
      if (
        form.type === OpportunityTypes.FreelanceTask &&
        (budget === null ||
          budget <= 0 ||
          !Number.isInteger(freelanceDeliveryDays) ||
          freelanceDeliveryDays < 1 ||
          !Number.isInteger(includedRevisions) ||
          includedRevisions < 0)
      ) {
        setError(
          "Industry Micro-Tasks require a budget, delivery time, and included revisions.",
        );
        return;
      }

      const request = {
        title: form.title.trim(),
        description: form.description.trim(),
        budget,
        freelancePricingType:
          form.type === OpportunityTypes.FreelanceTask
            ? form.freelancePricingType
            : null,
        freelanceDeliveryDays:
          form.type === OpportunityTypes.FreelanceTask
            ? freelanceDeliveryDays
            : null,
        includedRevisions:
          form.type === OpportunityTypes.FreelanceTask
            ? includedRevisions
            : null,
        durationWeeks: Number(form.durationWeeks),
        applicationTask: form.applicationTask.trim() || null,
        requiredTrainingHours:
          form.type === OpportunityTypes.UniversityTraining
            ? requiredTrainingHours
            : null,
        academicRequirements:
          form.type === OpportunityTypes.UniversityTraining
            ? form.academicRequirements.trim()
            : null,
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
    const confirmed = await confirmAction({
      title: "Delete this opportunity?",
      description: `"${project.title}" and its dependent workflow records will be permanently removed where permitted.`,
      confirmLabel: "Delete opportunity",
      variant: "danger",
    });

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
        eyebrow="Lifecycle administration"
        title="Projects"
        description="Inspect opportunity records, ownership, participation, and delivery state across the platform."
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
                ? "Create a provider opportunity"
                : editingProject?.title}
            </strong>
          </div>
          <div className="form-grid">
            {mode === "create" ? (
              <label className="field">
                <span>Provider</span>
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
                    <option value="">No providers available</option>
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
              <span>
                {form.type === OpportunityTypes.FreelanceTask &&
                form.freelancePricingType === FreelancePricingTypes.Hourly
                  ? "Hourly rate"
                  : "Budget"}
              </span>
              <input
                min="0"
                step="1"
                type="number"
                value={form.budget}
                required={form.type === OpportunityTypes.FreelanceTask}
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
                <option value={OpportunityTypes.ProfessionalProject}>
                  Professional project
                </option>
                <option value={OpportunityTypes.UniversityTraining}>
                  University training
                </option>
                <option value={OpportunityTypes.FreelanceTask}>
                  Industry micro-task
                </option>
                <option value={OpportunityTypes.SkillDevelopmentChallenge}>
                  Skill-development challenge
                </option>
                <option value={OpportunityTypes.TeamProject}>Team project</option>
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
            {form.type === OpportunityTypes.UniversityTraining ? (
              <>
                <label className="field">
                  <span>Required training hours</span>
                  <input
                    min="1"
                    max="2000"
                    type="number"
                    value={form.requiredTrainingHours}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        requiredTrainingHours: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="field">
                  <span>Academic requirements</span>
                  <textarea
                    value={form.academicRequirements}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        academicRequirements: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
              </>
            ) : null}
            {form.type === OpportunityTypes.FreelanceTask ? (
              <>
                <label className="field">
                  <span>Pricing</span>
                  <select
                    value={form.freelancePricingType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        freelancePricingType: Number(
                          event.target.value,
                        ) as FreelancePricingType,
                      }))
                    }
                  >
                    <option value={FreelancePricingTypes.FixedPrice}>
                      Fixed price
                    </option>
                    <option value={FreelancePricingTypes.Hourly}>
                      Hourly
                    </option>
                  </select>
                </label>
                <label className="field">
                  <span>Delivery days</span>
                  <input
                    min="1"
                    max="365"
                    type="number"
                    value={form.freelanceDeliveryDays}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        freelanceDeliveryDays: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="field">
                  <span>Included revisions</span>
                  <input
                    min="0"
                    max="20"
                    type="number"
                    value={form.includedRevisions}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        includedRevisions: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
              </>
            ) : null}
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
          <label className="field">
            <span>Short application task</span>
            <textarea
              value={form.applicationTask}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  applicationTask: event.target.value,
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

      <Pagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        isLoading={isLoading}
        onPageChange={setPage}
      />
    </section>
  );
}




