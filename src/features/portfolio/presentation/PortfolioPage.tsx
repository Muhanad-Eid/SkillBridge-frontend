import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckCircle2, Plus, X } from "lucide-react";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import Input from "../../../shared/components/Input";
import PageHeader from "../../../shared/components/PageHeader";
import type {
  EligiblePortfolioProject,
  PortfolioItem,
} from "../domain/portfolioTypes";
import {
  createPortfolioItemAsync,
  deletePortfolioItemAsync,
  getEligiblePortfolioProjectsAsync,
  getMyPortfolioAsync,
  updatePortfolioItemAsync,
} from "../infrastructure/portfolioApi";
import PortfolioGallery from "./PortfolioGallery";

type PortfolioForm = {
  projectId: string;
  description: string;
  projectUrl: string;
};

const emptyForm: PortfolioForm = {
  projectId: "",
  description: "",
  projectUrl: "",
};

export default function PortfolioPage() {
  const requestedProjectIdRef = useRef(
    new URLSearchParams(window.location.search).get("projectId"),
  );
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [eligibleProjects, setEligibleProjects] = useState<
    EligiblePortfolioProject[]
  >([]);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [form, setForm] = useState<PortfolioForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadPortfolio() {
    setIsLoading(true);
    setError("");

    try {
      const [portfolioItems, projects] = await Promise.all([
        getMyPortfolioAsync(),
        getEligiblePortfolioProjectsAsync(),
      ]);

      setItems(portfolioItems);
      setEligibleProjects(projects);

      const requestedProjectId = Number(requestedProjectIdRef.current);
      const requestedProject = projects.find(
        (project) => project.projectId === requestedProjectId,
      );

      if (requestedProject) {
        setEditingItem(null);
        setForm({
          ...emptyForm,
          projectId: requestedProject.projectId.toString(),
        });
        setIsEditorOpen(true);
      }

      requestedProjectIdRef.current = null;
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load portfolio.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(loadPortfolio, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const portfolioStats = useMemo(
    () => ({
      total: items.length,
      reviewed: items.filter((item) => item.reviewRating !== null).length,
      ready: eligibleProjects.length,
    }),
    [eligibleProjects.length, items],
  );

  const selectedProject = eligibleProjects.find(
    (project) => project.projectId === Number(form.projectId),
  );

  function closeEditor() {
    setEditingItem(null);
    setIsEditorOpen(false);
    setForm(emptyForm);
  }

  function startCreate() {
    if (eligibleProjects.length === 0) {
      return;
    }

    setEditingItem(null);
    setForm({
      ...emptyForm,
      projectId: eligibleProjects[0].projectId.toString(),
    });
    setMessage("");
    setError("");
    setIsEditorOpen(true);
  }

  function startEdit(item: PortfolioItem) {
    setEditingItem(item);
    setForm({
      projectId: item.projectId.toString(),
      description: item.description ?? "",
      projectUrl: item.projectUrl ?? "",
    });
    setMessage("");
    setError("");
    setIsEditorOpen(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const request = {
        description: form.description.trim(),
        projectUrl: form.projectUrl.trim() || undefined,
      };

      if (editingItem) {
        await updatePortfolioItemAsync(editingItem.id, request);
        setMessage("Portfolio evidence updated.");
      } else {
        await createPortfolioItemAsync({
          projectId: Number(form.projectId),
          ...request,
        });
        setMessage("Completed work added to your portfolio.");
      }

      closeEditor();
      await loadPortfolio();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save portfolio evidence.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(item: PortfolioItem) {
    const confirmed = window.confirm(
      `Delete portfolio evidence for "${item.projectTitle}"?`,
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await deletePortfolioItemAsync(item.id);
      if (editingItem?.id === item.id) closeEditor();
      setMessage("Portfolio evidence deleted.");
      await loadPortfolio();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete portfolio evidence.",
      );
    }
  }

  return (
    <section className="page portfolio-page portfolio-page-v2">
      <PageHeader
        title="Portfolio"
        actions={
          <Button
            type="button"
            onClick={startCreate}
            disabled={eligibleProjects.length === 0 || isLoading}
          >
            <Plus size={17} aria-hidden="true" />
            Add completed work
          </Button>
        }
      />

      <div className="portfolio-summary-grid">
        <article><span>Completed work</span><strong>{portfolioStats.total}</strong></article>
        <article><span>Company reviews</span><strong>{portfolioStats.reviewed}</strong></article>
        <article><span>Ready to add</span><strong>{portfolioStats.ready}</strong></article>
      </div>

      {message ? <div className="notice notice-success">{message}</div> : null}
      {error && !isLoading ? <div className="notice notice-error">{error}</div> : null}

      {!isLoading && eligibleProjects.length === 0 ? (
        <div className="portfolio-guidance-band">
          <CheckCircle2 size={21} aria-hidden="true" />
          <div>
            <strong>Portfolio items come from completed opportunities</strong>
            <p>
              After a company accepts you and marks the opportunity complete,
              you can document that work here. This keeps every item verified.
            </p>
          </div>
        </div>
      ) : null}

      {isEditorOpen ? (
        <section className="portfolio-editor-panel" aria-labelledby="portfolio-editor-title">
          <header>
            <div>
              <span>{editingItem ? "Update evidence" : "New evidence"}</span>
              <h2 id="portfolio-editor-title">
                {editingItem ? editingItem.projectTitle : "Add completed work"}
              </h2>
            </div>
            <Button
              type="button"
              variant="ghost"
              aria-label="Close portfolio editor"
              title="Close"
              onClick={closeEditor}
            >
              <X size={19} aria-hidden="true" />
            </Button>
          </header>

          <form onSubmit={handleSave}>
            <label className="field">
              <span>Completed opportunity</span>
              <select
                value={form.projectId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    projectId: event.target.value,
                  }))
                }
                disabled={Boolean(editingItem)}
                required
              >
                {editingItem ? (
                  <option value={editingItem.projectId}>
                    {editingItem.projectTitle} - {editingItem.companyName}
                  </option>
                ) : (
                  eligibleProjects.map((project) => (
                    <option key={project.projectId} value={project.projectId}>
                      {project.projectTitle} - {project.companyName}
                    </option>
                  ))
                )}
              </select>
            </label>

            {selectedProject && selectedProject.skills.length > 0 ? (
              <div className="portfolio-editor-skills">
                <span>Skills from this opportunity</span>
                <div className="portfolio-skill-list">
                  {selectedProject.skills.map((skill) => (
                    <span key={skill.id}>{skill.name}</span>
                  ))}
                </div>
              </div>
            ) : null}

            <label className="field portfolio-description-field">
              <span>What did you deliver?</span>
              <textarea
                value={form.description}
                minLength={30}
                maxLength={1000}
                required
                placeholder="Describe your contribution, the result, and what you learned."
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
              <small>{form.description.length}/1000 characters</small>
            </label>

            <Input
              label="Completed work URL"
              type="url"
              placeholder="https://github.com/you/project or live demo"
              value={form.projectUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  projectUrl: event.target.value,
                }))
              }
            />

            <div className="portfolio-editor-actions">
              <Button type="submit" isLoading={isSaving}>
                {editingItem ? "Save changes" : "Add to portfolio"}
              </Button>
              <Button type="button" variant="secondary" onClick={closeEditor}>
                Cancel
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="portfolio-work-section">
        <div className="portfolio-section-heading">
          <div>
            <span>Evidence gallery</span>
            <h2>Your completed work</h2>
          </div>
          <p>Companies see this same evidence when they review your profile.</p>
        </div>

        <DataState
          isLoading={isLoading}
          error=""
          empty={false}
          emptyTitle=""
          emptyDescription=""
        />
        {!isLoading ? (
          <PortfolioGallery
            items={items}
            emptyDescription="Complete an accepted opportunity, then add a clear summary of what you delivered."
            onEdit={startEdit}
            onDelete={handleDelete}
          />
        ) : null}
      </section>
    </section>
  );
}
