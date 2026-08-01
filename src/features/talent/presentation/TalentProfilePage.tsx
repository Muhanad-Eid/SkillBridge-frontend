import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Code2,
  Eye,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  Link2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useParams } from "react-router-dom";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import type { PortfolioItem } from "../../portfolio/domain/portfolioTypes";
import { getPublicPortfolioAsync } from "../../portfolio/infrastructure/portfolioApi";
import EvidenceDetailsDialog from "../../portfolio/presentation/EvidenceDetailsDialog";
import type { JobSeekerProfile } from "../../profiles/domain/profileTypes";
import {
  getMyJobSeekerProfileAsync,
  getPublicJobSeekerProfileAsync,
} from "../../profiles/infrastructure/profileApi";
import { getOpportunityTypeLabel } from "../../projects/domain/projectTypes";

type TalentProfilePageProps = {
  mode?: "company" | "self-preview";
};

function evidenceReference(id: number) {
  return `SB-EV-${String(id).padStart(6, "0")}`;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Date unavailable";
}

export default function TalentProfilePage({
  mode = "company",
}: TalentProfilePageProps) {
  const isSelfPreview = mode === "self-preview";
  const { jobSeekerId } = useParams();
  const numericJobSeekerId = Number(jobSeekerId);
  const hasValidJobSeekerId =
    Number.isInteger(numericJobSeekerId) && numericJobSeekerId > 0;
  const canLoadProfile = isSelfPreview || hasValidJobSeekerId;
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [evidence, setEvidence] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(canLoadProfile);
  const [error, setError] = useState("");
  const [selectedEvidence, setSelectedEvidence] =
    useState<PortfolioItem | null>(null);

  useEffect(() => {
    if (!canLoadProfile) return;

    let isMounted = true;

    async function loadProfile() {
      if (isMounted) {
        setIsLoading(true);
        setError("");
      }

      try {
        const profileResult = isSelfPreview
          ? await getMyJobSeekerProfileAsync()
          : await getPublicJobSeekerProfileAsync(numericJobSeekerId);
        const portfolioResult = await getPublicPortfolioAsync(profileResult.id);

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
  }, [canLoadProfile, isSelfPreview, numericJobSeekerId]);

  const supportedSkills = useMemo(() => {
    const counts = new Map<string, number>();

    evidence.forEach((item) => {
      item.skills.forEach((skill) => {
        counts.set(skill.name, (counts.get(skill.name) ?? 0) + 1);
      });
    });

    return counts;
  }, [evidence]);

  const supportedSkillEntries = useMemo(
    () =>
      [...supportedSkills.entries()].sort(
        (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
      ),
    [supportedSkills],
  );

  const listedSkills = useMemo(
    () =>
      (profile?.skills ?? [])
        .filter((skill) => !supportedSkills.has(skill))
        .sort((left, right) => left.localeCompare(right)),
    [profile?.skills, supportedSkills],
  );

  return (
    <section className="page company-talent-profile-page">
      <PageHeader
        title={isSelfPreview ? "Profile preview" : "Talent profile"}
        actions={
          <Button
            to={isSelfPreview ? "/job-seeker/profile" : "/company/talent"}
            variant="ghost"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            {isSelfPreview ? "Back to profile" : "Back to search"}
          </Button>
        }
      />

      {isSelfPreview ? (
        <div className="profile-preview-notice" role="status">
          <Eye size={19} aria-hidden="true" />
          <div>
            <strong>This is how organizations see your profile</strong>
            <span>Only evidence you marked as shared appears in this preview.</span>
          </div>
        </div>
      ) : null}

      <DataState
        isLoading={isLoading}
        error={
          canLoadProfile
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
            <div className="company-talent-profile-identity">
              <span className="company-talent-profile-kicker">
                <ShieldCheck size={14} aria-hidden="true" />
                Evidence-backed professional profile
              </span>
              <h1>{profile.fullName}</h1>
              <div className="company-talent-profile-meta">
                <span>
                  <MapPin size={15} aria-hidden="true" />
                  {profile.city || "Location not provided"}
                </span>
                {profile.universityName ? (
                  <span>
                    <GraduationCap size={15} aria-hidden="true" />
                    {profile.universityName}
                  </span>
                ) : null}
              </div>
            </div>
            <dl className="company-talent-profile-metrics">
              <div>
                <dt>Approved evidence</dt>
                <dd>{evidence.length}</dd>
              </div>
              <div>
                <dt>Supported skills</dt>
                <dd>{supportedSkillEntries.length}</dd>
              </div>
              <div>
                <dt>Reviews</dt>
                <dd>
                  {profile.averageRating
                    ? profile.averageRating.toFixed(1)
                    : profile.reviewsCount}
                </dd>
              </div>
            </dl>
          </header>

          <div className="company-talent-profile-body">
            <aside>
              <section className="company-talent-profile-section">
                <div className="company-talent-section-heading">
                  <h2>Professional summary</h2>
                </div>
                <p>
                  {profile.bio ||
                    "This individual has not added a professional summary yet."}
                </p>
              </section>

              <section className="company-talent-profile-section">
                <div className="company-talent-section-heading">
                  <div>
                    <h2>Skills</h2>
                    <span>Evidence coverage</span>
                  </div>
                  <strong>{profile.skills?.length ?? 0}</strong>
                </div>

                {supportedSkillEntries.length > 0 ? (
                  <div className="company-talent-skill-group">
                    <span className="company-talent-skill-label">
                      <BadgeCheck size={14} aria-hidden="true" />
                      Supported by approved work
                    </span>
                    <div className="company-talent-profile-skills">
                      {supportedSkillEntries.map(([skill, count]) => (
                        <span key={skill} className="is-supported">
                          <CheckCircle2 size={14} aria-hidden="true" />
                          {skill}
                          <small>{count}</small>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {listedSkills.length > 0 ? (
                  <div className="company-talent-skill-group">
                    <span className="company-talent-skill-label">
                      Listed skills
                    </span>
                    <div className="company-talent-profile-skills">
                      {listedSkills.map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {supportedSkillEntries.length === 0 &&
                listedSkills.length === 0 ? (
                  <p>No skills have been added yet.</p>
                ) : null}
              </section>

              {profile.linkedInUrl || profile.gitHubUrl ? (
                <section className="company-talent-profile-section">
                  <div className="company-talent-section-heading">
                    <h2>Professional links</h2>
                  </div>
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
                  <span>Provider-approved work</span>
                  <h2>Evidence Portfolio</h2>
                  <p>
                    Completed work connected to contribution, evaluation, and
                    approval records.
                  </p>
                </div>
                <span className="company-talent-evidence-total">
                  <FileCheck2 size={16} aria-hidden="true" />
                  {evidence.length} {evidence.length === 1 ? "record" : "records"}
                </span>
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
                          <div className="company-talent-evidence-labels">
                            <span>
                              {getOpportunityTypeLabel(item.opportunityType)}
                            </span>
                            <small>{evidenceReference(item.id)}</small>
                          </div>
                          <h3>{item.projectTitle}</h3>
                          <p>
                            <BriefcaseBusiness size={14} aria-hidden="true" />
                            {item.companyName}
                            <span aria-hidden="true">·</span>
                            <CalendarDays size={14} aria-hidden="true" />
                            {formatDate(item.approvedAt)}
                          </p>
                        </div>
                        <span className="company-talent-approved-label">
                          <ShieldCheck size={16} aria-hidden="true" />
                          Provider approved
                        </span>
                      </header>

                      <div className="company-talent-evidence-summary">
                        <span>Completed work</span>
                        <p>
                          {item.ownerSummary ??
                            item.description ??
                            item.deliverables ??
                            "Approved completed work."}
                        </p>
                      </div>

                      <dl className="company-talent-evidence-details">
                        <div>
                          <dt>Individual contribution</dt>
                          <dd>
                            {item.contribution ??
                              "Contribution recorded in the approved work record."}
                          </dd>
                        </div>
                        <div>
                          <dt>Evaluation</dt>
                          <dd>
                            {item.evaluationResult ??
                              (item.criterionEvaluations.length > 0
                                ? `${item.criterionEvaluations.length} criteria evaluated`
                                : "Final approval recorded.")}
                          </dd>
                        </div>
                        <div>
                          <dt>Approved by</dt>
                          <dd>{item.evaluatorName ?? item.companyName}</dd>
                        </div>
                      </dl>

                      <div
                        className="company-talent-evidence-chain"
                        aria-label="Evidence process"
                      >
                        <span>
                          <CheckCircle2 size={14} aria-hidden="true" />
                          Work completed
                        </span>
                        <span>
                          <CheckCircle2 size={14} aria-hidden="true" />
                          Evaluated
                        </span>
                        <span>
                          <CheckCircle2 size={14} aria-hidden="true" />
                          Final approval
                        </span>
                      </div>

                      <footer>
                        <div>
                          {item.skills.map((skill) => (
                            <span key={skill.id}>{skill.name}</span>
                          ))}
                        </div>
                        <div className="company-talent-evidence-actions">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setSelectedEvidence(item)}
                          >
                            View evidence
                          </Button>
                          {item.projectUrl ? (
                            <a
                              href={item.projectUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open deliverable
                              <ExternalLink size={14} aria-hidden="true" />
                            </a>
                          ) : null}
                        </div>
                      </footer>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      ) : null}

      {selectedEvidence ? (
        <EvidenceDetailsDialog
          item={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
        />
      ) : null}
    </section>
  );
}
