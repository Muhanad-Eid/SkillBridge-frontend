import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Code2,
  ExternalLink,
  FileCheck2,
  Link2,
  MapPin,
  Star,
} from "lucide-react";
import { useParams } from "react-router-dom";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import type { PortfolioItem } from "../../portfolio/domain/portfolioTypes";
import { getPublicPortfolioAsync } from "../../portfolio/infrastructure/portfolioApi";
import type { JobSeekerProfile } from "../../profiles/domain/profileTypes";
import { getPublicJobSeekerProfileAsync } from "../../profiles/infrastructure/profileApi";
import { getOpportunityTypeLabel } from "../../projects/domain/projectTypes";

export default function TalentProfilePage() {
  const { jobSeekerId } = useParams();
  const numericJobSeekerId = Number(jobSeekerId);
  const hasValidJobSeekerId =
    Number.isInteger(numericJobSeekerId) && numericJobSeekerId > 0;
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [evidence, setEvidence] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(hasValidJobSeekerId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasValidJobSeekerId) return;

    let isMounted = true;

    async function loadProfile() {
      if (isMounted) {
        setIsLoading(true);
        setError("");
      }

      try {
        const [profileResult, portfolioResult] = await Promise.all([
          getPublicJobSeekerProfileAsync(numericJobSeekerId),
          getPublicPortfolioAsync(numericJobSeekerId),
        ]);

        if (isMounted) {
          setProfile(profileResult);
          setEvidence(portfolioResult);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load this profile.",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    const timeoutId = window.setTimeout(() => void loadProfile(), 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [hasValidJobSeekerId, numericJobSeekerId]);

  const supportedSkills = useMemo(() => {
    const counts = new Map<string, number>();

    evidence.forEach((item) => {
      item.skills.forEach((skill) => {
        counts.set(skill.name, (counts.get(skill.name) ?? 0) + 1);
      });
    });

    return counts;
  }, [evidence]);

  return (
    <section className="page company-talent-profile-page">
      <PageHeader
        title="Talent profile"
        actions={
          <Button to="/company/talent" variant="ghost">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to search
          </Button>
        }
      />

      <DataState
        isLoading={isLoading}
        error={
          hasValidJobSeekerId
            ? error
            : "This talent profile link is invalid."
        }
        empty={!isLoading && !error && !profile}
        emptyTitle="Profile not found"
        emptyDescription="This profile may no longer be available."
      />

      {profile ? (
        <>
          <header className="company-talent-profile-intro">
            <span className="company-talent-profile-avatar" aria-hidden="true">
              {profile.fullName.trim().charAt(0).toUpperCase()}
            </span>
            <div>
              <h1>{profile.fullName}</h1>
              <p><MapPin size={15} aria-hidden="true" />{profile.city}</p>
            </div>
            <dl>
              <div>
                <dt><FileCheck2 size={15} aria-hidden="true" />Shared evidence</dt>
                <dd>{evidence.length}</dd>
              </div>
              <div>
                <dt><Star size={15} aria-hidden="true" />Reviews</dt>
                <dd>
                  {profile.averageRating
                    ? `${profile.averageRating.toFixed(1)} / 5`
                    : profile.reviewsCount}
                </dd>
              </div>
            </dl>
          </header>

          <div className="company-talent-profile-body">
            <aside>
              <section>
                <h2>About</h2>
                <p>{profile.bio}</p>
              </section>

              <section>
                <h2>Skills</h2>
                <div className="company-talent-profile-skills">
                  {profile.skills.map((skill) => {
                    const count = supportedSkills.get(skill) ?? 0;
                    return (
                      <span key={skill} className={count > 0 ? "is-supported" : ""}>
                        {count > 0 ? (
                          <CheckCircle2 size={14} aria-hidden="true" />
                        ) : null}
                        {skill}
                        {count > 0 ? <small>{count}</small> : null}
                      </span>
                    );
                  })}
                </div>
              </section>

              {profile.linkedInUrl || profile.gitHubUrl ? (
                <section>
                  <h2>Links</h2>
                  <div className="company-talent-profile-links">
                    {profile.linkedInUrl ? (
                      <a href={profile.linkedInUrl} target="_blank" rel="noreferrer">
                        <Link2 size={16} aria-hidden="true" />
                        LinkedIn
                        <ExternalLink size={13} aria-hidden="true" />
                      </a>
                    ) : null}
                    {profile.gitHubUrl ? (
                      <a href={profile.gitHubUrl} target="_blank" rel="noreferrer">
                        <Code2 size={16} aria-hidden="true" />
                        GitHub
                        <ExternalLink size={13} aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                </section>
              ) : null}
            </aside>

            <section className="company-talent-evidence">
              <header>
                <div>
                  <span>Approved work</span>
                  <h2>Shared Evidence Portfolio</h2>
                </div>
                <strong>{evidence.length}</strong>
              </header>

              {evidence.length === 0 ? (
                <div className="company-talent-no-evidence">
                  <FileCheck2 size={22} aria-hidden="true" />
                  <div>
                    <strong>No evidence has been shared</strong>
                    <p>This individual has not made an approved evidence card visible.</p>
                  </div>
                </div>
              ) : (
                <div>
                  {evidence.map((item) => (
                    <article key={item.id}>
                      <header>
                        <div>
                          <span>{getOpportunityTypeLabel(item.opportunityType)}</span>
                          <h3>{item.projectTitle}</h3>
                          <p>{item.companyName}</p>
                        </div>
                        <CheckCircle2 size={20} aria-label="Approved evidence" />
                      </header>
                      <dl>
                        <div>
                          <dt>Completed work</dt>
                          <dd>{item.description ?? "Approved completed work."}</dd>
                        </div>
                        <div>
                          <dt>Individual contribution</dt>
                          <dd>{item.contribution ?? item.description}</dd>
                        </div>
                        <div>
                          <dt>Evaluation</dt>
                          <dd>{item.evaluationResult ?? "Final approval recorded."}</dd>
                        </div>
                        <div>
                          <dt>Approved by</dt>
                          <dd>{item.evaluatorName ?? item.companyName}</dd>
                        </div>
                      </dl>
                      <footer>
                        <div>
                          {item.skills.map((skill) => (
                            <span key={skill.id}>{skill.name}</span>
                          ))}
                        </div>
                        {item.projectUrl ? (
                          <a href={item.projectUrl} target="_blank" rel="noreferrer">
                            Open deliverable
                            <ExternalLink size={14} aria-hidden="true" />
                          </a>
                        ) : null}
                      </footer>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      ) : null}
    </section>
  );
}
