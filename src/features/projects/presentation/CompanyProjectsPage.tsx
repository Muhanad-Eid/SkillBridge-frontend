import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import DataState from "../../../shared/components/DataState";
import Input from "../../../shared/components/Input";
import PageHeader from "../../../shared/components/PageHeader";
import {
  getOpportunityTypeLabel,
  OpportunityTypes,
  type OpportunityType,
  type Project,
} from "../domain/projectTypes";
import {
  createProjectAsync,
  getMyCompanyProjectsAsync,
} from "../infrastructure/projectApi";

export default function CompanyProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [durationWeeks, setDurationWeeks] = useState("6");
  const [type, setType] = useState<OpportunityType>(OpportunityTypes.PaidProject);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadProjects() {
    setIsLoading(true);
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

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      await createProjectAsync({
        title: title.trim(),
        description: description.trim(),
        budget: budget ? Number(budget) : null,
        durationWeeks: Number(durationWeeks),
        type,
      });
      setTitle("");
      setDescription("");
      setBudget("");
      setDurationWeeks("6");
      setType(OpportunityTypes.PaidProject);
      setMessage("Opportunity created.");
      await loadProjects();
    } catch (caughtError) {
      setMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create opportunity.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Company"
        title="Manage opportunities"
        description="Create internships, training offers, and paid projects."
      />

      <div className="two-column">
        <Card title="Create opportunity">
          <form className="stack" onSubmit={handleCreate}>
            <Input
              label="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
            <label className="field">
              <span>Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
            </label>
            <div className="form-grid">
              <Input
                label="Budget"
                type="number"
                min="0"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
              />
              <Input
                label="Duration weeks"
                type="number"
                min="1"
                max="52"
                value={durationWeeks}
                onChange={(event) => setDurationWeeks(event.target.value)}
                required
              />
            </div>
            <label className="field">
              <span>Type</span>
              <select
                value={type}
                onChange={(event) => setType(Number(event.target.value) as OpportunityType)}
              >
                <option value={OpportunityTypes.PaidProject}>Paid project</option>
                <option value={OpportunityTypes.Training}>Training</option>
              </select>
            </label>
            {message ? <div className="notice">{message}</div> : null}
            <Button type="submit" isLoading={isSaving}>
              Create opportunity
            </Button>
          </form>
        </Card>

        <div className="stack">
          <DataState
            isLoading={isLoading}
            error={error}
            empty={projects.length === 0}
            emptyTitle="No opportunities yet"
            emptyDescription="Create the first company opportunity from the form."
          />
          {projects.map((project) => (
            <Card
              key={project.id}
              eyebrow={getOpportunityTypeLabel(project.type)}
              title={project.title}
              description={project.companyName}
              actions={
                <Link
                  className="text-link"
                  to={`/company/projects/${project.id}/applications`}
                >
                  Applications
                </Link>
              }
            >
              <p>{project.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
