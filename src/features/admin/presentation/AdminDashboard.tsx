import { useEffect, useMemo, useState } from "react";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import { ProjectStatuses } from "../../projects/domain/projectTypes";
import type {
  AdminCompany,
  AdminJobSeeker,
  AdminProject,
  AdminUser,
} from "../domain/adminTypes";
import {
  getAdminCompaniesAsync,
  getAdminJobSeekersAsync,
  getAdminProjectsAsync,
  getAdminUsersAsync,
} from "../infrastructure/adminApi";

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [jobSeekers, setJobSeekers] = useState<AdminJobSeeker[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      setError("");

      try {
        const [usersData, companiesData, jobSeekersData, projectsData] =
          await Promise.all([
            getAdminUsersAsync(),
            getAdminCompaniesAsync(),
            getAdminJobSeekersAsync(),
            getAdminProjectsAsync(),
          ]);

        setUsers(usersData);
        setCompanies(companiesData);
        setJobSeekers(jobSeekersData);
        setProjects(projectsData);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load admin dashboard.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const metrics = useMemo(() => {
    const verifiedCompanies = companies.filter((company) => company.isVerified);
    const openProjects = projects.filter(
      (project) => project.status === ProjectStatuses.Open,
    );
    const missingProfiles = jobSeekers.filter((jobSeeker) => jobSeeker.id === 0);

    return {
      users: users.length,
      companies: companies.length,
      verifiedCompanies: verifiedCompanies.length,
      jobSeekers: jobSeekers.length,
      missingProfiles: missingProfiles.length,
      projects: projects.length,
      openProjects: openProjects.length,
    };
  }, [companies, jobSeekers, projects, users]);

  const unverifiedCompanies = companies.filter((company) => !company.isVerified);
  const incompleteJobSeekers = jobSeekers.filter((jobSeeker) => jobSeeker.id === 0);
  const busyProjects = [...projects]
    .sort((first, second) => second.applicationsCount - first.applicationsCount)
    .slice(0, 4);

  return (
    <section className="page admin-dashboard-page">
      <PageHeader
        eyebrow="Admin console"
        title="Platform control center"
        description="Watch accounts, company trust, job seeker profile health, and project activity from one place."
        actions={
          <Button to="/admin/projects" variant="primary">
            Review projects
          </Button>
        }
      />

      <DataState
        isLoading={isLoading}
        error={error}
        empty={false}
        emptyTitle="No admin data"
        emptyDescription="Platform data will appear here."
      />

      {!isLoading && !error ? (
        <>
          <div className="admin-metric-grid">
            <article>
              <span>Total users</span>
              <strong>{metrics.users}</strong>
            </article>
            <article>
              <span>Companies</span>
              <strong>{metrics.companies}</strong>
            </article>
            <article>
              <span>Job seekers</span>
              <strong>{metrics.jobSeekers}</strong>
            </article>
            <article>
              <span>Projects</span>
              <strong>{metrics.projects}</strong>
            </article>
          </div>

          <div className="admin-dashboard-grid">
            <Card
              eyebrow="Trust queue"
              title="Companies waiting for verification"
              description={`${unverifiedCompanies.length} company profiles are not verified.`}
              actions={
                <Button to="/admin/companies" variant="secondary">
                  Open companies
                </Button>
              }
            >
              <div className="admin-watch-list">
                {unverifiedCompanies.slice(0, 4).map((company) => (
                  <div key={company.id}>
                    <strong>{company.companyName}</strong>
                    <span>{company.city ?? "No city"}</span>
                  </div>
                ))}
                {unverifiedCompanies.length === 0 ? (
                  <p>All listed companies are verified.</p>
                ) : null}
              </div>
            </Card>

            <Card
              eyebrow="Profile health"
              title="Job seekers missing profiles"
              description={`${metrics.missingProfiles} job seeker accounts need profile data.`}
              actions={
                <Button to="/admin/job-seekers" variant="secondary">
                  Fix profiles
                </Button>
              }
            >
              <div className="admin-watch-list">
                {incompleteJobSeekers.slice(0, 4).map((jobSeeker) => (
                  <div key={jobSeeker.userId}>
                    <strong>{jobSeeker.fullName}</strong>
                    <span>{jobSeeker.email}</span>
                  </div>
                ))}
                {incompleteJobSeekers.length === 0 ? (
                  <p>All job seeker accounts have profile rows.</p>
                ) : null}
              </div>
            </Card>

            <Card
              eyebrow="Marketplace"
              title="High activity projects"
              description={`${metrics.openProjects} open opportunities are visible to job seekers.`}
              actions={
                <Button to="/admin/projects" variant="secondary">
                  Open projects
                </Button>
              }
            >
              <div className="admin-watch-list">
                {busyProjects.map((project) => (
                  <div key={project.id}>
                    <strong>{project.title}</strong>
                    <span>
                      {project.companyName} / {project.applicationsCount} applications
                    </span>
                  </div>
                ))}
                {busyProjects.length === 0 ? <p>No projects yet.</p> : null}
              </div>
            </Card>

            <Card
              eyebrow="Quick actions"
              title="Admin management"
              description="Jump straight into the list you need and edit or delete records from there."
            >
              <div className="admin-quick-actions">
                <Button to="/admin/users" variant="secondary">
                  Users
                </Button>
                <Button to="/admin/companies" variant="secondary">
                  Companies
                </Button>
                <Button to="/admin/job-seekers" variant="secondary">
                  Job seekers
                </Button>
                <Button to="/admin/projects" variant="secondary">
                  Projects
                </Button>
              </div>
              <div className="admin-status-summary">
                <StatusBadge tone="green">
                  {metrics.verifiedCompanies} verified companies
                </StatusBadge>
                <StatusBadge tone={metrics.missingProfiles > 0 ? "amber" : "green"}>
                  {metrics.missingProfiles} missing profiles
                </StatusBadge>
              </div>
            </Card>
          </div>
        </>
      ) : null}
    </section>
  );
}
