import { useEffect, useMemo, useState } from "react";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import {
  ApplicationStatuses,
  getApplicationStatusLabel,
  type Application,
} from "../../applications/domain/applicationTypes";
import { getMyApplicationsAsync } from "../../applications/infrastructure/applicationApi";
import type { PortfolioItem } from "../../portfolio/domain/portfolioTypes";
import { getMyPortfolioAsync } from "../../portfolio/infrastructure/portfolioApi";
import type { Skill } from "../../skills/domain/skillTypes";
import { getMySkillsAsync } from "../../skills/infrastructure/skillApi";

export default function JobSeekerDashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCareerWorkspace() {
      try {
        const [applicationData, skillData, portfolioData] = await Promise.all([
          getMyApplicationsAsync(),
          getMySkillsAsync(),
          getMyPortfolioAsync(),
        ]);

        if (isMounted) {
          setApplications(applicationData);
          setSkills(skillData);
          setPortfolioItems(portfolioData);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load career workspace.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCareerWorkspace();

    return () => {
      isMounted = false;
    };
  }, []);

  const applicationStats = useMemo(() => {
    return {
      pending: applications.filter(
        (application) => application.status === ApplicationStatuses.Pending,
      ).length,
      accepted: applications.filter(
        (application) => application.status === ApplicationStatuses.Accepted,
      ).length,
      rejected: applications.filter(
        (application) => application.status === ApplicationStatuses.Rejected,
      ).length,
    };
  }, [applications]);

  const acceptedReadyApplications = useMemo(() => {
    const portfolioProjectIds = new Set(
      portfolioItems.map((item) => item.projectId),
    );

    return applications.filter(
      (application) =>
        application.status === ApplicationStatuses.Accepted &&
        !portfolioProjectIds.has(application.projectId),
    );
  }, [applications, portfolioItems]);

  const profileScore = Math.min(
    100,
    25 +
      Math.min(skills.length, 5) * 7 +
      Math.min(applications.length, 3) * 8 +
      Math.min(portfolioItems.length, 2) * 8,
  );

  const readinessSteps = [
    {
      label: "Profile completed",
      done: true,
      action: "/job-seeker/profile",
    },
    {
      label: "Add at least 3 skills",
      done: skills.length >= 3,
      action: "/job-seeker/skills",
    },
    {
      label: "Apply to an opportunity",
      done: applications.length > 0,
      action: "/job-seeker/opportunities",
    },
    {
      label: "Add portfolio proof",
      done: portfolioItems.length > 0,
      action: "/job-seeker/portfolio",
    },
  ];

  const recentApplications = applications.slice(0, 4);

  return (
    <section className="page career-hub-page">
      <PageHeader
        eyebrow="Career hub"
        title="Your job seeker workspace"
        description="Track applications, improve your profile proof, and move accepted work into a portfolio companies can trust."
        actions={
          <Button to="/job-seeker/opportunities" variant="primary">
            Browse opportunities
          </Button>
        }
      />

      {error ? <div className="notice notice-error">{error}</div> : null}

      <div className="career-progress-card">
        <div>
          <span>Profile readiness</span>
          <strong>{isLoading ? "-" : `${profileScore}%`}</strong>
          <p>
            Add skills, apply to work, and turn accepted projects into portfolio
            proof.
          </p>
        </div>
        <div className="career-progress-bar" aria-hidden="true">
          <span style={{ width: `${profileScore}%` }} />
        </div>
        <div className="career-checklist">
          {readinessSteps.map((step) => (
            <Button
              key={step.label}
              to={step.action}
              variant={step.done ? "secondary" : "primary"}
            >
              {step.done ? "Done: " : "Next: "}
              {step.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="career-metric-grid">
        <article>
          <span>Applications</span>
          <strong>{isLoading ? "-" : applications.length}</strong>
        </article>
        <article>
          <span>Pending</span>
          <strong>{isLoading ? "-" : applicationStats.pending}</strong>
        </article>
        <article>
          <span>Skills</span>
          <strong>{isLoading ? "-" : skills.length}</strong>
        </article>
        <article>
          <span>Portfolio</span>
          <strong>{isLoading ? "-" : portfolioItems.length}</strong>
        </article>
      </div>

      <div className="career-action-grid">
        <Card
          eyebrow="Applications"
          title={`${applicationStats.pending} waiting, ${applicationStats.accepted} accepted`}
          description="Keep watching company decisions and open the opportunity when you need the details."
          actions={
            <Button to="/job-seeker/applications" variant="secondary">
              View pipeline
            </Button>
          }
        />

        <Card
          eyebrow="Skills"
          title={skills.length > 0 ? `${skills.length} skills listed` : "Add your first skills"}
          description="Skills help companies understand what you can actually do."
          actions={
            <Button to="/job-seeker/skills" variant="secondary">
              Manage skills
            </Button>
          }
        />

        <Card
          eyebrow="Portfolio"
          title={
            acceptedReadyApplications.length > 0
              ? `${acceptedReadyApplications.length} accepted project ready`
              : "Build proof from accepted work"
          }
          description="When a company accepts you, turn that project into visible portfolio evidence."
          actions={
            <Button to="/job-seeker/portfolio" variant="secondary">
              Update portfolio
            </Button>
          }
        />
      </div>

      <Card title="Recent applications" className="career-applications-card">
        {recentApplications.length === 0 ? (
          <div className="empty-inline">
            <p>No applications yet. Start by browsing opportunities.</p>
            <Button to="/job-seeker/opportunities" variant="secondary">
              Browse opportunities
            </Button>
          </div>
        ) : (
          <div className="mini-list">
            {recentApplications.map((application) => (
              <div key={application.id}>
                <strong>{application.projectTitle}</strong>
                <span>{application.coverLetter ?? "No cover letter"}</span>
                <div className="admin-row-actions">
                  <StatusBadge>
                    {getApplicationStatusLabel(application.status)}
                  </StatusBadge>
                  <Button
                    to={`/job-seeker/opportunities/${application.projectId}`}
                    variant="secondary"
                  >
                    View opportunity
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
