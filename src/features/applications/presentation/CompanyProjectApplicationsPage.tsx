import { type FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import type { JobSeekerProfile } from "../../profiles/domain/profileTypes";
import { getPublicJobSeekerProfileAsync } from "../../profiles/infrastructure/profileApi";
import { createReviewAsync } from "../../reviews/infrastructure/reviewApi";
import ApplicantProfilePanel from "./ApplicantProfilePanel";
import {
  ApplicationStatuses,
  getApplicationStatusLabel,
  type Application,
  type ApplicationStatus,
} from "../domain/applicationTypes";
import {
  getProjectApplicationsAsync,
  updateApplicationStatusAsync,
} from "../infrastructure/applicationApi";

export default function CompanyProjectApplicationsPage() {
  const { projectId } = useParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [selectedProfile, setSelectedProfile] =
    useState<JobSeekerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [reviewingApplication, setReviewingApplication] =
    useState<Application | null>(null);
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [isReviewSaving, setIsReviewSaving] = useState(false);
  const [error, setError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");

  async function loadApplications() {
    setIsLoading(true);
    try {
      setApplications(await getProjectApplicationsAsync(Number(projectId)));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load applications.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, [projectId]);

  async function changeStatus(applicationId: number, status: ApplicationStatus) {
    await updateApplicationStatusAsync(applicationId, { status });
    setSelectedApplication((current) =>
      current?.id === applicationId ? { ...current, status } : current,
    );
    await loadApplications();
  }

  async function openApplicantProfile(application: Application) {
    setSelectedApplication(application);
    setSelectedProfile(null);
    setProfileError("");
    setIsProfileLoading(true);

    try {
      setSelectedProfile(
        await getPublicJobSeekerProfileAsync(application.jobSeekerId),
      );
    } catch (caughtError) {
      setProfileError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load applicant profile.",
      );
    } finally {
      setIsProfileLoading(false);
    }
  }

  function startReview(application: Application) {
    setReviewingApplication(application);
    setReviewRating("5");
    setReviewComment("");
    setReviewError("");
    setReviewMessage("");
  }

  async function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reviewingApplication) {
      return;
    }

    setIsReviewSaving(true);
    setReviewError("");
    setReviewMessage("");

    try {
      await createReviewAsync({
        jobSeekerId: reviewingApplication.jobSeekerId,
        projectId: reviewingApplication.projectId,
        rating: Number(reviewRating),
        comment: reviewComment.trim() || undefined,
      });

      setReviewMessage(
        `Review submitted for ${reviewingApplication.jobSeekerName}.`,
      );
      setReviewingApplication(null);
      setReviewRating("5");
      setReviewComment("");
    } catch (caughtError) {
      setReviewError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create review.",
      );
    } finally {
      setIsReviewSaving(false);
    }
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Company"
        title="Project applications"
        description="Review applicants and move them through the pipeline."
      />

      <DataState
        isLoading={isLoading}
        error={error}
        empty={applications.length === 0}
        emptyTitle="No applications yet"
        emptyDescription="Applications will appear here after job seekers apply."
      />

      {selectedApplication ? (
        <ApplicantProfilePanel
          application={selectedApplication}
          error={profileError}
          isLoading={isProfileLoading}
          onClose={() => {
            setSelectedApplication(null);
            setSelectedProfile(null);
            setProfileError("");
          }}
          profile={selectedProfile}
        />
      ) : null}

      {reviewMessage ? <div className="notice">{reviewMessage}</div> : null}

      {reviewingApplication ? (
        <Card
          className="worker-review-panel"
          eyebrow="Worker review"
          title={`Review ${reviewingApplication.jobSeekerName}`}
          description={reviewingApplication.projectTitle}
          actions={
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReviewingApplication(null)}
            >
              Cancel
            </Button>
          }
        >
          <form className="stack" onSubmit={handleReviewSubmit}>
            <label className="field">
              <span>Rating</span>
              <select
                value={reviewRating}
                onChange={(event) => setReviewRating(event.target.value)}
              >
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Very good</option>
                <option value="3">3 - Good</option>
                <option value="2">2 - Needs improvement</option>
                <option value="1">1 - Not ready</option>
              </select>
            </label>
            <label className="field">
              <span>Review comment</span>
              <textarea
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder="Write clear feedback about the work, communication, and skills."
              />
            </label>
            {reviewError ? (
              <div className="notice notice-error">{reviewError}</div>
            ) : null}
            <Button type="submit" isLoading={isReviewSaving}>
              Submit review
            </Button>
          </form>
        </Card>
      ) : null}

      <div className="stack">
        {applications.map((application) => (
          <Card
            key={application.id}
            description={application.projectTitle}
            actions={
              <StatusBadge>
                {getApplicationStatusLabel(application.status)}
              </StatusBadge>
            }
          >
            <button
              className="text-link-button applicant-title-button"
              type="button"
              onClick={() => openApplicantProfile(application)}
            >
              {application.jobSeekerName}
            </button>
            <p>{application.coverLetter ?? "No cover letter provided."}</p>
            <div className="actions-row">
              <Button
                variant="secondary"
                onClick={() =>
                  changeStatus(application.id, ApplicationStatuses.Accepted)
                }
              >
                Accept
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  changeStatus(application.id, ApplicationStatuses.Rejected)
                }
              >
                Reject
              </Button>
              {application.status === ApplicationStatuses.Accepted ? (
                <Button variant="primary" onClick={() => startReview(application)}>
                  Review worker
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
