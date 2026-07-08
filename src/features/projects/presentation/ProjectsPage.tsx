import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../../shared/components/Card";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import {
  getOpportunityTypeLabel,
  getProjectStatusLabel,
  OpportunityTypes,
  ProjectStatuses,
  type Project,
} from "../domain/projectTypes";
import { getProjectsAsync } from "../infrastructure/projectApi";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      try {
        const data = await getProjectsAsync();
        if (isMounted) setProjects(data);
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
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.title.toLowerCase().includes(search.toLowerCase()) ||
        project.companyName.toLowerCase().includes(search.toLowerCase());
      const matchesType =
        typeFilter === "all" || project.type === Number(typeFilter);

      return matchesSearch && matchesType;
    });
  }, [projects, search, typeFilter]);

  return (
    <section className="page marketplace-page">
      <div className="marketplace-hero">
        <PageHeader
          eyebrow="Marketplace"
          title="Find work-based learning that builds proof."
          description="Browse internships, guided training, and real projects from companies. Filter quickly, compare fit, then apply with your SkillBridge profile."
          actions={
            <Link className="button button-primary" to="/register">
              Create profile
            </Link>
          }
        />
        <div className="marketplace-stats" aria-label="Marketplace summary">
          <article>
            <strong>{projects.length}</strong>
            <span>Open listings</span>
          </article>
          <article>
            <strong>{projects.filter((project) => project.type === OpportunityTypes.Training).length}</strong>
            <span>Training paths</span>
          </article>
          <article>
            <strong>{projects.filter((project) => project.status === ProjectStatuses.Open).length}</strong>
            <span>Accepting applicants</span>
          </article>
        </div>
      </div>

      <div className="toolbar">
        <input
          aria-label="Search opportunities"
          placeholder="Search by title or company"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Filter by type"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="all">All types</option>
          <option value={OpportunityTypes.PaidProject}>Paid projects</option>
          <option value={OpportunityTypes.Training}>Training</option>
        </select>
      </div>

      <DataState
        isLoading={isLoading}
        error={error}
        empty={filteredProjects.length === 0}
        emptyTitle="No opportunities found"
        emptyDescription="Try another search or check back when companies post new opportunities."
      />

      <div className="card-grid">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className="project-card"
            eyebrow={getOpportunityTypeLabel(project.type)}
            title={project.title}
            description={project.companyName}
            actions={
              <StatusBadge
                tone={project.status === ProjectStatuses.Open ? "green" : "neutral"}
              >
                {getProjectStatusLabel(project.status)}
              </StatusBadge>
            }
          >
            <p>{project.description}</p>
            <div className="meta-row">
              <span>{project.durationWeeks} weeks</span>
              <span>{project.budget ? `$${project.budget}` : "No budget listed"}</span>
            </div>
            <Link className="text-link" to={`/opportunities/${project.id}`}>
              View details
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
