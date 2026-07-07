import { type FormEvent, useEffect, useState } from "react";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import DataState from "../../../shared/components/DataState";
import Input from "../../../shared/components/Input";
import PageHeader from "../../../shared/components/PageHeader";
import type { PortfolioItem } from "../domain/portfolioTypes";
import {
  createPortfolioItemAsync,
  deletePortfolioItemAsync,
  getMyPortfolioAsync,
} from "../infrastructure/portfolioApi";

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadPortfolio() {
    setIsLoading(true);
    try {
      setItems(await getMyPortfolioAsync());
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

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    await createPortfolioItemAsync({
      projectId: Number(projectId),
      description: description.trim() || undefined,
      projectUrl: projectUrl.trim() || undefined,
    });
    setProjectId("");
    setDescription("");
    setProjectUrl("");
    setMessage("Portfolio item added.");
    await loadPortfolio();
  }

  async function handleDelete(itemId: number) {
    await deletePortfolioItemAsync(itemId);
    await loadPortfolio();
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Portfolio"
        title="Work proof"
        description="Add completed project evidence that supports future applications."
      />

      <div className="two-column">
        <Card title="Add portfolio item">
          <form className="stack" onSubmit={handleCreate}>
            <Input
              label="Project ID"
              type="number"
              min="1"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              required
            />
            <label className="field">
              <span>Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <Input
              label="Project URL"
              value={projectUrl}
              onChange={(event) => setProjectUrl(event.target.value)}
            />
            {message ? <div className="notice">{message}</div> : null}
            <Button type="submit">Add item</Button>
          </form>
        </Card>

        <div className="stack">
          <DataState
            isLoading={isLoading}
            error={error}
            empty={items.length === 0}
            emptyTitle="No portfolio items yet"
            emptyDescription="Add completed project proof after finishing work."
          />
          {items.map((item) => (
            <Card
              key={item.id}
              title={item.projectTitle}
              description={item.description ?? "No description"}
              actions={
                <Button variant="secondary" onClick={() => handleDelete(item.id)}>
                  Delete
                </Button>
              }
            >
              {item.projectUrl ? (
                <a className="text-link" href={item.projectUrl}>
                  Open project
                </a>
              ) : null}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
