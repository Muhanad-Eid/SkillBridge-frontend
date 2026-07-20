import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  FileCheck2,
  FolderKanban,
  Search,
  Star,
  Wrench,
} from "lucide-react";
import { useAuth } from "../../../shared/auth/AuthContext";
import Button from "../../../shared/components/Button";
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
import type { JobSeekerProfile } from "../../profiles/domain/profileTypes";
import { getMyJobSeekerProfileAsync } from "../../profiles/infrastructure/profileApi";
import {
  calculateProjectMatch,
  ProjectStatuses,
  type Project,
} from "../../projects/domain/projectTypes";
import { getProjectsAsync } from "../../projects/infrastructure/projectApi";
import type { Review } from "../../reviews/domain/reviewTypes";
import { getJobSeekerReviewsAsync } from "../../reviews/infrastructure/reviewApi";
import type { Skill } from "../../skills/domain/skillTypes";
import { getMySkillsAsync } from "../../skills/infrastructure/skillApi";

export default function JobSeekerDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspace() {
      try {
        const [profileData, applicationData, skillData, portfolioData, projectData] =
          await Promise.all([
            getMyJobSeekerProfileAsync(),
            getMyApplicationsAsync(),
            getMySkillsAsync(),
            getMyPortfolioAsync(),
            getProjectsAsync(),
          ]);
        const reviewData = await getJobSeekerReviewsAsync(profileData.id);

        if (isMounted) {
          setProfile(profileData);
          setApplications(applicationData);
          setSkills(skillData);
          setPortfolioItems(portfolioData);
          setProjects(projectData);
          setReviews(reviewData);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load your career overview.",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadWorkspace();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter(
        (application) => application.status === ApplicationStatuses.Pending,
      ).length,
      accepted: applications.filter(
        (application) => application.status === ApplicationStatuses.Accepted,
      ).length,
      reviews: reviews.length,
    }),
    [applications, reviews.length],
  );

  const readinessSteps = useMemo(
    () => [
      {
        label: "Career profile",
        detail: "Bio and location are complete",
        done: Boolean(profile?.bio?.trim() && profile.city?.trim()),
        to: "/job-seeker/profile",
        icon: CheckCircle2,
      },
      {
        label: "Skills profile",
        detail: `${skills.length}/3 recommended skills added`,
        done: skills.length >= 3,
        to: "/job-seeker/skills",
        icon: Wrench,
      },
      {
        label: "First application",
        detail: applications.length > 0 ? "Your pipeline is active" : "Start your application pipeline",
        done: applications.length > 0,
        to: "/job-seeker/opportunities",
        icon: FileCheck2,
      },
      {
        label: "Portfolio proof",
        detail: `${portfolioItems.length} work sample${portfolioItems.length === 1 ? "" : "s"}`,
        done: portfolioItems.length > 0,
        to: "/job-seeker/portfolio",
        icon: FolderKanban,
      },
    ],
    [applications.length, portfolioItems.length, profile, skills.length],
  );

  const readinessScore = Math.round(
    (readinessSteps.filter((step) => step.done).length / readinessSteps.length) * 100,
  );

  const appliedProjectIds = useMemo(
    () => new Set(applications.map((application) => application.projectId)),
    [applications],
  );

  const recommendedProjects = projects
    .filter(
      (project) =>
        project.status === ProjectStatuses.Open && !appliedProjectIds.has(project.id),
    )
    .sort(
      (left, right) =>
        calculateProjectMatch(right, skills.map((skill) => skill.id)).score -
        calculateProjectMatch(left, skills.map((skill) => skill.id)).score,
    )
    .slice(0, 3);

  const nextStep = readinessSteps.find((step) => !step.done);
  const recentApplications = applications.slice(0, 4);
  const firstName = (profile?.fullName || user?.fullName || "there").split(" ")[0];

  return (
    <section className="page jobseeker-dashboard-page">
      <PageHeader
        eyebrow="Career overview"
        title={`Welcome back, ${firstName}`}
        description="Keep your profile ready, find the right work, and follow every application from submission to portfolio proof."
        actions={
          <Button to="/job-seeker/opportunities" variant="primary">
            <Search size={17} aria-hidden="true" />
            Find opportunities
          </Button>
        }
      />

      {error ? <div className="notice notice-error">{error}</div> : null}

      <div className="jobseeker-kpi-grid" aria-label="Career summary">
        <article>
          <span>Applications</span>
          <strong>{isLoading ? "-" : stats.total}</strong>
          <small>{stats.pending} awaiting a decision</small>
        </article>
        <article>
          <span>Accepted work</span>
          <strong>{isLoading ? "-" : stats.accepted}</strong>
          <small>Projects in your active record</small>
        </article>
        <article>
          <span>Portfolio proof</span>
          <strong>{isLoading ? "-" : portfolioItems.length}</strong>
          <small>{portfolioItems.filter((item) => item.projectUrl).length} with a project link</small>
        </article>
        <article>
          <span>Reputation</span>
          <strong>{isLoading ? "-" : profile?.averageRating?.toFixed(1) ?? "New"}</strong>
          <small>{stats.reviews} company review{stats.reviews === 1 ? "" : "s"}</small>
        </article>
      </div>

      {nextStep ? (
        <div className="jobseeker-next-action">
          <span className="jobseeker-next-icon"><SparkIcon /></span>
          <div>
            <span>Best next step</span>
            <strong>{nextStep.label}</strong>
            <p>{nextStep.detail}. Complete this to strengthen what companies see.</p>
          </div>
          <Button to={nextStep.to} variant="primary">
            Continue
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      ) : null}

      <div className="jobseeker-dashboard-grid">
        <div className="jobseeker-dashboard-main">
          <section className="jobseeker-panel-card">
            <header>
              <div>
                <span>Pipeline</span>
                <h2>Recent applications</h2>
              </div>
              <Button to="/job-seeker/applications" variant="ghost">
                View all
              </Button>
            </header>

            {recentApplications.length === 0 ? (
              <div className="jobseeker-empty-panel">
                <Search size={24} aria-hidden="true" />
                <strong>Your application pipeline is empty</strong>
                <p>Browse verified company opportunities and apply when the work fits.</p>
                <Button to="/job-seeker/opportunities" variant="secondary">
                  Browse opportunities
                </Button>
              </div>
            ) : (
              <div className="jobseeker-application-list">
                {recentApplications.map((application) => (
                  <article key={application.id}>
                    <span className="jobseeker-list-icon">
                      <FileCheck2 size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <strong>{application.projectTitle}</strong>
                      <small>Application #{application.id}</small>
                    </div>
                    <StatusBadge
                      tone={
                        application.status === ApplicationStatuses.Accepted
                          ? "green"
                          : application.status === ApplicationStatuses.Rejected
                            ? "red"
                            : "amber"
                      }
                    >
                      {getApplicationStatusLabel(application.status)}
                    </StatusBadge>
                    <Button
                      to={
                        application.status === ApplicationStatuses.Accepted
                          ? `/job-seeker/work/${application.projectId}`
                          : `/job-seeker/opportunities/${application.projectId}`
                      }
                      variant="ghost"
                      aria-label={`View ${application.projectTitle}`}
                      title={
                        application.status === ApplicationStatuses.Accepted
                          ? "Open work hub"
                          : "View opportunity"
                      }
                    >
                      <ArrowRight size={17} aria-hidden="true" />
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="jobseeker-panel-card">
            <header>
              <div>
                <span>Open now</span>
                <h2>Opportunities to explore</h2>
              </div>
              <Button to="/job-seeker/opportunities" variant="ghost">Browse all</Button>
            </header>
            <div className="jobseeker-recommendation-list">
              {recommendedProjects.length === 0 ? (
                <div className="jobseeker-empty-panel compact">
                  <strong>You have reviewed the current open opportunities</strong>
                  <p>Check back as verified companies publish more work.</p>
                </div>
              ) : (
                recommendedProjects.map((project) => (
                  <article key={project.id}>
                    <div>
                      <strong>{project.title}</strong>
                      <span>{project.companyName}</span>
                    </div>
                    <span>
                      {calculateProjectMatch(
                        project,
                        skills.map((skill) => skill.id),
                      ).score}% match
                    </span>
                    <span>{project.durationWeeks} weeks</span>
                    <strong>{project.budget ? `$${project.budget}` : "Training"}</strong>
                    <Button
                      to={`/job-seeker/opportunities/${project.id}`}
                      variant="secondary"
                    >
                      View
                    </Button>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="jobseeker-readiness-panel">
          <div className="jobseeker-readiness-score">
            <div style={{ "--score": `${readinessScore * 3.6}deg` } as React.CSSProperties}>
              <strong>{readinessScore}%</strong>
            </div>
            <span>Profile readiness</span>
            <p>Complete each signal companies use when they review applicants.</p>
          </div>

          <div className="jobseeker-readiness-list">
            {readinessSteps.map((step) => {
              const Icon = step.icon;
              return (
                <Button key={step.label} to={step.to} variant="ghost">
                  <span className={step.done ? "done" : ""}>
                    {step.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </span>
                  <span>
                    <strong>{step.label}</strong>
                    <small>{step.detail}</small>
                  </span>
                  <Icon size={17} aria-hidden="true" />
                </Button>
              );
            })}
          </div>

          <Button to="/job-seeker/reviews" variant="secondary" className="jobseeker-reviews-link">
            <Star size={17} aria-hidden="true" />
            See company feedback
          </Button>
        </aside>
      </div>
    </section>
  );
}

function SparkIcon() {
  return <Star size={19} fill="currentColor" aria-hidden="true" />;
}
