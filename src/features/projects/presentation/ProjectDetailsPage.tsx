import { type FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageSquare,
  ShieldCheck,
  UsersRound,
  Wrench,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import StatusBadge from "../../../shared/components/StatusBadge";
import {
  getApplicationStatusLabel,
  type Application,
} from "../../applications/domain/applicationTypes";
import {
  applyToProjectAsync,
  getMyApplicationsAsync,
} from "../../applications/infrastructure/applicationApi";
import type { CompanyProfile } from "../../profiles/domain/profileTypes";
import { getPublicCompanyProfileAsync } from "../../profiles/infrastructure/profileApi";
import type { Skill } from "../../skills/domain/skillTypes";
import { getMySkillsAsync } from "../../skills/infrastructure/skillApi";
import {
  calculateProjectMatch,
  getExperienceLevelLabel,
  getOpportunityTypeLabel,
  getWorkModeLabel,
  ProjectStatuses,
  type Project,
} from "../domain/projectTypes";
import { getProjectAsync } from "../infrastructure/projectApi";

export default function ProjectDetailsPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [mySkills, setMySkills] = useState<Skill[]>([]);
  const [existingApplication, setExistingApplication] = useState<Application | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const isJobSeeker = user?.role === "JobSeeker";

  useEffect(() => {
    let isMounted = true;

    async function loadProject() {
      try {
        const projectData = await getProjectAsync(Number(projectId));
        const [companyData, applicationData, skillData] = await Promise.all([
          getPublicCompanyProfileAsync(projectData.companyProfileId),
          isJobSeeker ? getMyApplicationsAsync() : Promise.resolve([]),
          isJobSeeker ? getMySkillsAsync() : Promise.resolve([]),
        ]);

        if (isMounted) {
          setProject(projectData);
          setCompanyProfile(companyData);
          setMySkills(skillData);
          setExistingApplication(
            applicationData.find((application) => application.projectId === projectData.id) ?? null,
          );
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load opportunity.",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProject();

    return () => {
      isMounted = false;
    };
  }, [isJobSeeker, projectId]);

  const companyMessagePath =
    project && companyProfile
      ? `/job-seeker/messages?${new URLSearchParams({
          receiverId: companyProfile.userId,
          receiverName: project.companyName,
          projectId: String(project.id),
          projectTitle: project.title,
        })}`
      : "";
  const projectMatch = project && isJobSeeker && project.skills.length > 0
    ? calculateProjectMatch(project, mySkills.map((skill) => skill.id))
    : null;

  async function handleApply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || project.status !== ProjectStatuses.Open || existingApplication) return;

    setIsApplying(true);
    setMessage("");

    try {
      const application = await applyToProjectAsync(project.id, {
        coverLetter: coverLetter.trim() || undefined,
      });
      setExistingApplication(application);
      setCoverLetter("");
      setMessage("Application submitted successfully.");
    } catch (caughtError) {
      setMessage(
        caughtError instanceof Error ? caughtError.message : "Unable to apply.",
      );
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <section className="page jobseeker-opportunity-details-page">
      <DataState
        isLoading={isLoading}
        error={error}
        empty={!project}
        emptyTitle="Opportunity not found"
        emptyDescription="The opportunity may have been removed or is no longer public."
      />

      {project ? (
        <>
          <Button
            to={isJobSeeker ? "/job-seeker/opportunities" : "/opportunities"}
            variant="ghost"
            className="jobseeker-back-link"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Back to opportunities
          </Button>

          <header className="jobseeker-opportunity-header">
            <div className="jobseeker-opportunity-mark" aria-hidden="true">
              {project.companyName.trim().charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="jobseeker-opportunity-labels">
                <StatusBadge tone="blue">{getOpportunityTypeLabel(project.type)}</StatusBadge>
                <StatusBadge tone={project.status === ProjectStatuses.Open ? "green" : "neutral"}>
                  {project.status === ProjectStatuses.Open ? "Accepting applications" : "Closed"}
                </StatusBadge>
              </div>
              <h1>{project.title}</h1>
              <p>{project.companyName}</p>
            </div>
          </header>

          <div className="jobseeker-opportunity-details-grid">
            <main className="jobseeker-opportunity-main">
              <section>
                <h2>About the opportunity</h2>
                <p>{project.description}</p>
              </section>

              <section>
                <h2>Requirements and outcomes</h2>
                <p>{project.requirements}</p>
                <div className="project-requirement-groups">
                  <div>
                    <strong>Required skills</strong>
                    <div className="project-skill-tags">
                      {project.skills.filter((skill) => skill.isRequired).map((skill) => (
                        <span className="required" key={skill.id}>{skill.name}</span>
                      ))}
                    </div>
                  </div>
                  {project.skills.some((skill) => !skill.isRequired) ? (
                    <div>
                      <strong>Preferred skills</strong>
                      <div className="project-skill-tags">
                        {project.skills.filter((skill) => !skill.isRequired).map((skill) => (
                          <span className="preferred" key={skill.id}>{skill.name}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>

              <section>
                <h2>Commitment and details</h2>
                <div className="jobseeker-opportunity-facts">
                  <article><Clock3 size={19} /><span>Duration</span><strong>{project.durationWeeks} weeks</strong></article>
                  <article><BriefcaseBusiness size={19} /><span>Budget</span><strong>{project.budget ? `$${project.budget}` : "Unpaid training"}</strong></article>
                  <article><MapPin size={19} /><span>Work mode</span><strong>{getWorkModeLabel(project.workMode)}{project.location ? ` - ${project.location}` : ""}</strong></article>
                  <article><Wrench size={19} /><span>Experience</span><strong>{getExperienceLevelLabel(project.experienceLevel)}</strong></article>
                  <article><UsersRound size={19} /><span>Open positions</span><strong>{project.positionsAvailable}</strong></article>
                  <article><CalendarDays size={19} /><span>Apply by</span><strong>{project.applicationDeadline ?? "Open until filled"}</strong></article>
                </div>
              </section>

              <section className="jobseeker-company-panel">
                <div className="jobseeker-opportunity-mark" aria-hidden="true">
                  {project.companyName.trim().charAt(0).toUpperCase()}
                </div>
                <div>
                  <span>About the company</span>
                  <h2>{project.companyName}</h2>
                  <p>{companyProfile?.description ?? "The company has not added a public description."}</p>
                  <div>
                    {companyProfile?.city ? <span><MapPin size={14} />{companyProfile.city}</span> : null}
                    {companyProfile?.isVerified ? <span><ShieldCheck size={14} />Verified by SkillBridge</span> : null}
                  </div>
                </div>
              </section>
            </main>

            <aside className="jobseeker-apply-panel">
              {projectMatch ? (
                <div className="jobseeker-match-summary">
                  <span>Skill match</span>
                  <strong>{projectMatch.score}%</strong>
                  <p>
                    {projectMatch.matchedRequired}/{projectMatch.totalRequired} required skills matched
                  </p>
                  {projectMatch.missingRequiredSkills.length > 0 ? (
                    <small>
                      Skills to develop: {projectMatch.missingRequiredSkills.map((skill) => skill.name).join(", ")}
                    </small>
                  ) : (
                    <small>You match every required skill.</small>
                  )}
                </div>
              ) : null}
              {existingApplication ? (
                <div className="jobseeker-applied-state">
                  <CheckCircle2 size={30} aria-hidden="true" />
                  <span>Application submitted</span>
                  <h2>{getApplicationStatusLabel(existingApplication.status)}</h2>
                  <p>Your application is in the company pipeline. Follow updates from your tracker.</p>
                  <Button to="/job-seeker/applications" variant="primary">
                    View application
                  </Button>
                  {companyMessagePath ? (
                    <Button to={companyMessagePath} variant="secondary">
                      <MessageSquare size={16} aria-hidden="true" />
                      Message company
                    </Button>
                  ) : null}
                </div>
              ) : isJobSeeker ? (
                <form onSubmit={handleApply}>
                  <span>Apply to this opportunity</span>
                  <h2>Introduce your fit</h2>
                  <p>Write a focused note connecting your skills and interests to this work.</p>
                  <label className="field">
                    <span>Cover letter</span>
                    <textarea
                      value={coverLetter}
                      onChange={(event) => setCoverLetter(event.target.value)}
                      placeholder="What can you contribute, and what do you want to learn?"
                      maxLength={1500}
                    />
                    <small>{coverLetter.length}/1500 characters</small>
                  </label>
                  {message ? <div className="notice">{message}</div> : null}
                  <Button
                    type="submit"
                    isLoading={isApplying}
                    disabled={project.status !== ProjectStatuses.Open}
                  >
                    Submit application
                  </Button>
                  <small>Your profile, skills, and portfolio are shared with the company.</small>
                </form>
              ) : user ? (
                <div className="jobseeker-applied-state">
                  <h2>Job seeker access required</h2>
                  <p>Only job seeker accounts can apply to opportunities.</p>
                </div>
              ) : (
                <div className="jobseeker-applied-state">
                  <h2>Ready to apply?</h2>
                  <p>Log in or create a job seeker profile to submit an application.</p>
                  <Link className="button button-primary" to="/login">Log in</Link>
                  <Link className="button button-secondary" to="/register">Register</Link>
                </div>
              )}
            </aside>
          </div>
        </>
      ) : null}
    </section>
  );
}
