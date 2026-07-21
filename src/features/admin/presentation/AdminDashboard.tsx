import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  FileCheck2,
  GraduationCap,
  Plus,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import { ApplicationStatuses } from "../../applications/domain/applicationTypes";
import { ProjectStatuses } from "../../projects/domain/projectTypes";
import type {
  AdminApplication,
  AdminCompany,
  AdminJobSeeker,
  AdminProject,
  AdminReview,
  AdminSkill,
  AdminUser,
} from "../domain/adminTypes";
import {
  getAdminApplicationsAsync,
  getAdminCompaniesAsync,
  getAdminJobSeekersAsync,
  getAdminProjectsAsync,
  getAdminReviewsAsync,
  getAdminSkillsAsync,
  getAdminUsersAsync,
} from "../infrastructure/adminApi";

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [jobSeekers, setJobSeekers] = useState<AdminJobSeeker[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [skills, setSkills] = useState<AdminSkill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const data = await Promise.all([
          getAdminUsersAsync(),
          getAdminCompaniesAsync(),
          getAdminJobSeekersAsync(),
          getAdminProjectsAsync(),
          getAdminApplicationsAsync(),
          getAdminReviewsAsync(),
          getAdminSkillsAsync(),
        ]);

        if (isMounted) {
          setUsers(data[0]);
          setCompanies(data[1]);
          setJobSeekers(data[2]);
          setProjects(data[3]);
          setApplications(data[4]);
          setReviews(data[5]);
          setSkills(data[6]);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load admin control center.",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const verified = companies.filter((company) => company.isVerified).length;
    const pendingApplications = applications.filter(
      (application) => application.status === ApplicationStatuses.Pending,
    ).length;
    const openProjects = projects.filter(
      (project) => project.status === ProjectStatuses.Open,
    ).length;

    return {
      users: users.length,
      companies: companies.length,
      verified,
      jobSeekers: jobSeekers.length,
      projects: projects.length,
      openProjects,
      applications: applications.length,
      pendingApplications,
      reviews: reviews.length,
      lowReviews: reviews.filter((review) => review.rating <= 2).length,
    };
  }, [applications, companies, jobSeekers.length, projects, reviews, users.length]);

  const unverifiedCompanies = companies.filter((company) => !company.isVerified);
  const incompleteProfiles = jobSeekers.filter(
    (jobSeeker) => !jobSeeker.bio?.trim() || !jobSeeker.city?.trim(),
  );
  const unusedSkills = skills.filter(
    (skill) => skill.jobSeekersCount === 0 && skill.projectsCount === 0,
  );
  const activeProjects = [...projects]
    .sort((left, right) => right.applicationsCount - left.applicationsCount)
    .slice(0, 5);
  const recentApplications = applications.slice(0, 5);

  return (
    <section className="page admin-dashboard-page admin-dashboard-v2">
      <PageHeader
        title="Control center"
        actions={
          <>
            <Button to="/admin/users?action=create" variant="secondary">
              <Plus size={16} aria-hidden="true" />Add user
            </Button>
            <Button to="/admin/projects?action=create" variant="primary">
              <Plus size={16} aria-hidden="true" />Add project
            </Button>
          </>
        }
      />

      <DataState
        isLoading={isLoading}
        error={error}
        empty={false}
        emptyTitle="No platform data"
        emptyDescription="Platform activity will appear here."
      />

      {!isLoading && !error ? (
        <>
          <div className="admin-kpi-grid-v2">
            <article><span><Users size={17} />Total users</span><strong>{metrics.users}</strong><small>All platform accounts</small></article>
            <article><span><Building2 size={17} />Companies</span><strong>{metrics.companies}</strong><small>{metrics.verified} verified</small></article>
            <article><span><GraduationCap size={17} />Job seekers</span><strong>{metrics.jobSeekers}</strong><small>{incompleteProfiles.length} incomplete profiles</small></article>
            <article><span><BriefcaseBusiness size={17} />Projects</span><strong>{metrics.projects}</strong><small>{metrics.openProjects} open now</small></article>
            <article><span><FileCheck2 size={17} />Applications</span><strong>{metrics.applications}</strong><small>{metrics.pendingApplications} pending</small></article>
            <article><span><Star size={17} />Reviews</span><strong>{metrics.reviews}</strong><small>{metrics.lowReviews} low-rating alerts</small></article>
          </div>

          <div className="admin-attention-grid">
            <article className={unverifiedCompanies.length > 0 ? "warning" : "healthy"}>
              <span><ShieldCheck size={20} /></span>
              <div><strong>{unverifiedCompanies.length} verification requests</strong><p>Company profiles waiting for an admin decision.</p></div>
              <Button to="/admin/companies?status=unverified" variant="ghost" aria-label="Open company verification"><ArrowRight size={18} /></Button>
            </article>
            <article className={metrics.pendingApplications > 0 ? "warning" : "healthy"}>
              <span><FileCheck2 size={20} /></span>
              <div><strong>{metrics.pendingApplications} pending applications</strong><p>Applications still awaiting a company decision.</p></div>
              <Button to="/admin/applications?status=pending" variant="ghost" aria-label="Open pending applications"><ArrowRight size={18} /></Button>
            </article>
            <article className={metrics.lowReviews > 0 ? "danger" : "healthy"}>
              <span><AlertTriangle size={20} /></span>
              <div><strong>{metrics.lowReviews} review alerts</strong><p>Ratings of two stars or lower for moderation.</p></div>
              <Button to="/admin/reviews?rating=low" variant="ghost" aria-label="Open review alerts"><ArrowRight size={18} /></Button>
            </article>
          </div>

          <div className="admin-dashboard-columns">
            <section className="admin-ops-panel">
              <header><div><span>Trust queue</span><h2>Companies awaiting verification</h2></div><Button to="/admin/companies" variant="ghost">View all</Button></header>
              <div className="admin-ops-list">
                {unverifiedCompanies.slice(0, 5).map((company) => (
                  <article key={company.id}>
                    <span className="admin-entity-mark">{company.companyName.charAt(0).toUpperCase()}</span>
                    <div><strong>{company.companyName}</strong><small>{company.city || "City missing"} / {company.projectsCount ?? 0} projects</small></div>
                    <StatusBadge tone="amber">Pending</StatusBadge>
                    <Button to="/admin/companies" variant="secondary">Review</Button>
                  </article>
                ))}
                {unverifiedCompanies.length === 0 ? <div className="admin-empty-ops"><ShieldCheck size={24} /><strong>Verification queue is clear</strong><span>All companies have been reviewed.</span></div> : null}
              </div>
            </section>

            <aside className="admin-health-panel">
              <header><span>Platform health</span><h2>Operational signals</h2></header>
              <div>
                <article><span>Company verification</span><strong>{metrics.companies ? Math.round((metrics.verified / metrics.companies) * 100) : 100}%</strong><div><b style={{ width: `${metrics.companies ? (metrics.verified / metrics.companies) * 100 : 100}%` }} /></div></article>
                <article><span>Job seeker profiles ready</span><strong>{metrics.jobSeekers ? Math.round(((metrics.jobSeekers - incompleteProfiles.length) / metrics.jobSeekers) * 100) : 100}%</strong><div><b style={{ width: `${metrics.jobSeekers ? ((metrics.jobSeekers - incompleteProfiles.length) / metrics.jobSeekers) * 100 : 100}%` }} /></div></article>
                <article><span>Skills in active use</span><strong>{skills.length ? Math.round(((skills.length - unusedSkills.length) / skills.length) * 100) : 100}%</strong><div><b style={{ width: `${skills.length ? ((skills.length - unusedSkills.length) / skills.length) * 100 : 100}%` }} /></div></article>
              </div>
              <Button to="/admin/skills" variant="secondary">Review skill catalog</Button>
            </aside>
          </div>

          <div className="admin-dashboard-columns lower">
            <section className="admin-ops-panel">
              <header><div><span>Marketplace</span><h2>Highest activity projects</h2></div><Button to="/admin/projects" variant="ghost">View all</Button></header>
              <div className="admin-project-activity-list">
                {activeProjects.map((project) => (
                  <article key={project.id}>
                    <div><strong>{project.title}</strong><span>{project.companyName}</span></div>
                    <span>{project.applicationsCount} applications</span>
                    <StatusBadge tone={project.status === ProjectStatuses.Open ? "green" : "neutral"}>{project.status === ProjectStatuses.Open ? "Open" : "Managed"}</StatusBadge>
                  </article>
                ))}
              </div>
            </section>

            <section className="admin-ops-panel">
              <header><div><span>Latest pipeline</span><h2>Application oversight</h2></div><Button to="/admin/applications" variant="ghost">View all</Button></header>
              <div className="admin-project-activity-list">
                {recentApplications.map((application) => (
                  <article key={application.id}>
                    <div><strong>{application.jobSeekerName}</strong><span>{application.projectTitle}</span></div>
                    <span>{application.companyName}</span>
                    <StatusBadge tone={application.status === ApplicationStatuses.Pending ? "amber" : "green"}>{application.status === ApplicationStatuses.Pending ? "Pending" : "Updated"}</StatusBadge>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </section>
  );
}
