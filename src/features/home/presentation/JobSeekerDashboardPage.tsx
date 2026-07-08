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
import { getMyPortfolioAsync } from "../../portfolio/infrastructure/portfolioApi";
import type { PortfolioItem } from "../../portfolio/domain/portfolioTypes";
import { getMySkillsAsync } from "../../skills/infrastructure/skillApi";
import type { Skill } from "../../skills/domain/skillTypes";

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

  const activeApplications = useMemo(() => {
    return applications.filter(
      (application) =>
        application.status === ApplicationStatuses.Pending ||
        application.status === ApplicationStatuses.Accepted,
    );
  }, [applications]);

  const profileScore = Math.min(
    100,
    skills.length * 12 + portfolioItems.length * 20 + applications.length * 8,
  );

  const recentApplications = applications.slice(0, 4);

  return (
    <section className="page career-hub-page">
      <PageHeader
        eyebrow="Career hub"
        title="Build proof while you apply."
        description="Your job seeker portal focuses on opportunities, applications, skills, and portfolio evidence."
        actions={
          <Button to="/job-seeker/opportunities" variant="primary">
            Browse opportunities
          </Button>
        }
      />

      {error ? <div className="notice notice-error">{error}</div> : null}

      <div className="career-progress-card">
        <div>
          <span>Profile strength</span>
          <strong>{isLoading ? "-" : `${profileScore}%`}</strong>
          <p>Skills, applications, and portfolio items improve your visibility.</p>
        </div>
        <div className="career-progress-bar" aria-hidden="true">
          <span style={{ width: `${profileScore}%` }} />
        </div>
      </div>

      <div className="career-metric-grid">
        <article>
          <span>Applications</span>
          <strong>{isLoading ? "-" : applications.length}</strong>
        </article>
        <article>
          <span>Active</span>
          <strong>{isLoading ? "-" : activeApplications.length}</strong>
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

      <div className="career-hub-grid">
        <Card
          eyebrow="Next move"
          title="Find your next opportunity"
          description="Browse open internships, training, and paid projects that match your profile."
          actions={
            <Button to="/job-seeker/opportunities" variant="secondary">
              Browse now
            </Button>
          }
        />

        <Card
          eyebrow="Proof"
          title="Improve your evidence"
          description="Add skills and portfolio work before companies review your application."
          actions={
            <Button to="/job-seeker/portfolio" variant="ghost">
              Update proof
            </Button>
          }
        />
      </div>

      <Card title="Recent applications" className="career-applications-card">
        {recentApplications.length === 0 ? (
          <p>No applications yet. Start by browsing opportunities.</p>
        ) : (
          <div className="mini-list">
            {recentApplications.map((application) => (
              <div key={application.id}>
                <strong>{application.projectTitle}</strong>
                <span>{application.coverLetter ?? "No cover letter"}</span>
                <StatusBadge>
                  {getApplicationStatusLabel(application.status)}
                </StatusBadge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
