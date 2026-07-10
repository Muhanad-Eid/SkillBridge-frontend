import { type FormEvent, useEffect, useMemo, useState } from "react";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import DataState from "../../../shared/components/DataState";
import Input from "../../../shared/components/Input";
import PageHeader from "../../../shared/components/PageHeader";
import {
  ApplicationStatuses,
  type Application,
} from "../../applications/domain/applicationTypes";
import { getMyApplicationsAsync } from "../../applications/infrastructure/applicationApi";
import type { PortfolioItem } from "../domain/portfolioTypes";
import {
  createPortfolioItemAsync,
  deletePortfolioItemAsync,
  getMyPortfolioAsync,
  updatePortfolioItemAsync,
} from "../infrastructure/portfolioApi";

type FormMode = "create" | "edit";

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
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [mode, setMode] = useState<FormMode>("create");
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [form, setForm] = useState<PortfolioForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadPortfolio() {
    setIsLoading(true);
    setError("");

    try {
      const [portfolioItems, myApplications] = await Promise.all([
        getMyPortfolioAsync(),
        getMyApplicationsAsync(),
      ]);

      setItems(portfolioItems);
      setApplications(myApplications);
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
    loadPortfolio();
  }, []);

  const acceptedApplications = useMemo(() => {
    const portfolioProjectIds = new Set(items.map((item) => item.projectId));

    return applications.filter(
      (application) =>
        application.status === ApplicationStatuses.Accepted &&
        !portfolioProjectIds.has(application.projectId),
    );
  }, [applications, items]);

  useEffect(() => {
    if (mode !== "create" || form.projectId || acceptedApplications.length === 0) {
      return;
    }

    setForm((current) => ({
      ...current,
      projectId: acceptedApplications[0].projectId.toString(),
    }));
  }, [acceptedApplications, form.projectId, mode]);

  const portfolioStats = useMemo(() => {
    return {
      total: items.length,
      withLinks: items.filter((item) => item.projectUrl).length,
      acceptedReady: acceptedApplications.length,
    };
  }, [acceptedApplications.length, items]);

  function resetForm() {
    setMode("create");
    setEditingItem(null);
    setForm({
      ...emptyForm,
      projectId: acceptedApplications[0]?.projectId.toString() ?? "",
    });
  }

  function startEdit(item: PortfolioItem) {
    setMode("edit");
    setEditingItem(item);
    setForm({
      projectId: item.projectId.toString(),
      description: item.description ?? "",
      projectUrl: item.projectUrl ?? "",
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
        await createPortfolioItemAsync({
          projectId: Number(form.projectId),
          description: form.description.trim() || undefined,
          projectUrl: form.projectUrl.trim() || undefined,
        });

        setMessage("Portfolio item added.");
      } else if (editingItem) {
        await updatePortfolioItemAsync(editingItem.id, {
          description: form.description.trim() || undefined,
          projectUrl: form.projectUrl.trim() || undefined,
        });

        setMessage("Portfolio item updated.");
      }

      resetForm();
      await loadPortfolio();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save portfolio item.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(item: PortfolioItem) {
    const confirmed = window.confirm(
      `Delete portfolio evidence for "${item.projectTitle}"?`,
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await deletePortfolioItemAsync(item.id);

      if (editingItem?.id === item.id) {
        resetForm();
      }

      setMessage("Portfolio item deleted.");
      await loadPortfolio();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete portfolio item.",
      );
    }
  }

  return (
    <section className="page portfolio-page">
      <PageHeader
        eyebrow="Portfolio"
        title="Work proof"
        description="Turn accepted project work into evidence companies can understand quickly."
        actions={
          mode === "edit" ? (
            <Button type="button" variant="secondary" onClick={resetForm}>
              Add new proof
            </Button>
          ) : null
        }
      />

      <div className="portal-list-stats jobseeker-list-stats">
        <article>
          <span>Portfolio items</span>
          <strong>{portfolioStats.total}</strong>
        </article>
        <article>
          <span>With links</span>
          <strong>{portfolioStats.withLinks}</strong>
        </article>
        <article>
          <span>Accepted ready</span>
          <strong>{portfolioStats.acceptedReady}</strong>
        </article>
      </div>

      {acceptedApplications.length === 0 && mode === "create" ? (
        <div className="notice">
          Portfolio proof starts after a company accepts your application. Keep
          applying, then come back here to document the work.
        </div>
      ) : null}

      <div className="two-column">
        <Card
          title={mode === "create" ? "Add portfolio proof" : "Edit portfolio proof"}
          description={
            mode === "create"
              ? "Choose an accepted project, explain what you built, and add a link if you have one."
              : "Update the description or project link for this portfolio item."
          }
        >
          <form className="stack" onSubmit={handleSave}>
            <label className="field">
              <span>Accepted project</span>
              <select
                value={form.projectId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    projectId: event.target.value,
                  }))
                }
                disabled={mode === "edit"}
                required
              >
                {mode === "edit" && editingItem ? (
                  <option value={editingItem.projectId}>
                    {editingItem.projectTitle}
                  </option>
                ) : null}
                {mode === "create" && acceptedApplications.length === 0 ? (
                  <option value="">No accepted projects ready</option>
                ) : null}
                {mode === "create"
                  ? acceptedApplications.map((application) => (
                      <option
                        key={application.id}
                        value={application.projectId}
                      >
                        {application.projectTitle}
                      </option>
                    ))
                  : null}
              </select>
            </label>
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
                placeholder="What did you build, learn, fix, or deliver?"
              />
            </label>
            <Input
              label="Project URL"
              placeholder="https://github.com/you/project or live demo link"
              value={form.projectUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  projectUrl: event.target.value,
                }))
              }
            />
            {message ? <div className="notice">{message}</div> : null}
            <div className="admin-edit-actions">
              <Button
                type="submit"
                isLoading={isSaving}
                disabled={mode === "create" && acceptedApplications.length === 0}
              >
                {mode === "create" ? "Add item" : "Save changes"}
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
          <DataState
            isLoading={isLoading}
            error={error}
            empty={items.length === 0}
            emptyTitle="No portfolio items yet"
            emptyDescription="Accepted project work can become portfolio proof here."
          />
          {items.map((item) => (
            <Card
              key={item.id}
              title={item.projectTitle}
              description={item.description ?? "No description"}
              actions={
                <div className="admin-row-actions">
                  <Button variant="secondary" onClick={() => startEdit(item)}>
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    className="button-danger"
                    onClick={() => handleDelete(item)}
                  >
                    Delete
                  </Button>
                </div>
              }
            >
              <div className="detail-list compact-detail-list">
                <span>Portfolio ID</span>
                <strong>{item.id}</strong>
                <span>Project ID</span>
                <strong>{item.projectId}</strong>
              </div>
              <div className="actions-row">
                <Button
                  to={`/job-seeker/opportunities/${item.projectId}`}
                  variant="secondary"
                >
                  View opportunity
                </Button>
                {item.projectUrl ? (
                  <a className="button button-primary" href={item.projectUrl}>
                    Open project
                  </a>
                ) : (
                  <p>Add a project link when you have one.</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
