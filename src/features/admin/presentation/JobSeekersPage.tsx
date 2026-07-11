import { type FormEvent, useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Plus, X } from "lucide-react";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import type { PortfolioItem } from "../../portfolio/domain/portfolioTypes";
import { getPublicPortfolioAsync } from "../../portfolio/infrastructure/portfolioApi";
import PortfolioGallery from "../../portfolio/presentation/PortfolioGallery";
import type {
  AdminJobSeeker,
  UpdateAdminJobSeekerRequest,
} from "../domain/adminTypes";
import {
  deleteJobSeekerAsync,
  getAdminJobSeekersAsync,
  updateAdminJobSeekerAsync,
} from "../infrastructure/adminApi";

export default function JobSeekersPage() {
  const [jobSeekers, setJobSeekers] = useState<AdminJobSeeker[]>([]);
  const [search, setSearch] = useState("");
  const [profileFilter, setProfileFilter] = useState("All");
  const [editingJobSeeker, setEditingJobSeeker] =
    useState<AdminJobSeeker | null>(null);
  const [portfolioJobSeeker, setPortfolioJobSeeker] =
    useState<AdminJobSeeker | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState("");
  const [form, setForm] = useState<UpdateAdminJobSeekerRequest>({
    city: "",
    bio: "",
    linkedInUrl: "",
    gitHubUrl: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadJobSeekers() {
    setIsLoading(true);
    setError("");

    try {
      setJobSeekers(await getAdminJobSeekersAsync());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load job seekers.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(loadJobSeekers, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const filteredJobSeekers = useMemo(() => {
    const value = search.trim().toLowerCase();

    return jobSeekers.filter((jobSeeker) => {
      const hasProfile = jobSeeker.id !== 0;
      const matchesProfile =
        profileFilter === "All" ||
        (profileFilter === "Ready" && hasProfile) ||
        (profileFilter === "Missing" && !hasProfile);

      const matchesSearch =
        !value ||
        jobSeeker.fullName.toLowerCase().includes(value) ||
        jobSeeker.email.toLowerCase().includes(value) ||
        (jobSeeker.city ?? "").toLowerCase().includes(value) ||
        (jobSeeker.bio ?? "").toLowerCase().includes(value);

      return matchesProfile && matchesSearch;
    });
  }, [jobSeekers, search, profileFilter]);

  const jobSeekerStats = useMemo(() => {
    const missingProfiles = jobSeekers.filter(
      (jobSeeker) => jobSeeker.id === 0,
    ).length;
    const applications = jobSeekers.reduce(
      (sum, jobSeeker) => sum + jobSeeker.applicationsCount,
      0,
    );

    return {
      total: jobSeekers.length,
      readyProfiles: jobSeekers.length - missingProfiles,
      missingProfiles,
      applications,
    };
  }, [jobSeekers]);

  function startEdit(jobSeeker: AdminJobSeeker) {
    setEditingJobSeeker(jobSeeker);
    setForm({
      city: jobSeeker.city ?? "",
      bio: jobSeeker.bio ?? "",
      linkedInUrl: jobSeeker.linkedInUrl ?? "",
      gitHubUrl: jobSeeker.gitHubUrl ?? "",
    });
    setError("");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingJobSeeker) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await updateAdminJobSeekerAsync(editingJobSeeker.userId, form);
      setEditingJobSeeker(null);
      await loadJobSeekers();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update job seeker.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(jobSeeker: AdminJobSeeker) {
    const confirmed = window.confirm(
      `Delete job seeker account for ${jobSeeker.fullName}?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await deleteJobSeekerAsync(jobSeeker.userId);
      await loadJobSeekers();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete job seeker.",
      );
    }
  }

  async function openPortfolio(jobSeeker: AdminJobSeeker) {
    if (jobSeeker.id === 0) return;

    setPortfolioJobSeeker(jobSeeker);
    setPortfolioItems([]);
    setPortfolioError("");
    setIsPortfolioLoading(true);

    try {
      setPortfolioItems(await getPublicPortfolioAsync(jobSeeker.id));
    } catch (caughtError) {
      setPortfolioError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load portfolio evidence.",
      );
    } finally {
      setIsPortfolioLoading(false);
    }
  }

  return (
    <section className="page admin-list-page">
      <PageHeader
        eyebrow="Account health"
        title="Job seeker oversight"
        description="Review profile readiness, participation, portfolio proof, and company reputation across learner accounts."
        actions={
          <Button to="/admin/users?action=create&role=JobSeeker" variant="primary">
            <Plus size={16} aria-hidden="true" />Add job seeker
          </Button>
        }
      />

      <div className="toolbar admin-toolbar">
        <input
          aria-label="Search job seekers"
          placeholder="Search by name, email, city, or bio"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Filter job seekers by profile status"
          value={profileFilter}
          onChange={(event) => setProfileFilter(event.target.value)}
        >
          <option value="All">All profiles</option>
          <option value="Ready">Profile ready</option>
          <option value="Missing">Profile missing</option>
        </select>
      </div>

      <div className="admin-list-stats">
        <article>
          <span>Job seekers</span>
          <strong>{jobSeekerStats.total}</strong>
        </article>
        <article>
          <span>Profile ready</span>
          <strong>{jobSeekerStats.readyProfiles}</strong>
        </article>
        <article>
          <span>Profile missing</span>
          <strong>{jobSeekerStats.missingProfiles}</strong>
        </article>
        <article>
          <span>Applications</span>
          <strong>{jobSeekerStats.applications}</strong>
        </article>
      </div>

      {editingJobSeeker ? (
        <form className="admin-edit-card" onSubmit={handleSave}>
          <div>
            <span>Edit job seeker</span>
            <strong>{editingJobSeeker.fullName}</strong>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>City</span>
              <input
                value={form.city ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    city: event.target.value,
                  }))
                }
              />
            </label>
            <label className="field">
              <span>LinkedIn URL</span>
              <input
                value={form.linkedInUrl ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    linkedInUrl: event.target.value,
                  }))
                }
              />
            </label>
            <label className="field">
              <span>GitHub URL</span>
              <input
                value={form.gitHubUrl ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    gitHubUrl: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <label className="field">
            <span>Bio</span>
            <textarea
              value={form.bio ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  bio: event.target.value,
                }))
              }
            />
          </label>
          <div className="admin-edit-actions">
            <Button type="submit" isLoading={isSaving}>
              Save changes
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingJobSeeker(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <DataState
        isLoading={isLoading}
        error={error}
        empty={filteredJobSeekers.length === 0}
        emptyTitle="No job seekers"
        emptyDescription="Job seeker accounts will appear here."
      />

      <div className="table-card admin-table-card">
        {filteredJobSeekers.map((jobSeeker) => (
          <div className="table-row" key={jobSeeker.userId}>
            <div>
              <strong>{jobSeeker.fullName}</strong>
              <span>{jobSeeker.email}</span>
              <span>
                {jobSeeker.city ?? "No city"} -{" "}
                {jobSeeker.bio ?? "No profile bio"}
              </span>
            </div>
            <div className="admin-status-stack">
              <StatusBadge tone={jobSeeker.id === 0 ? "amber" : "green"}>
                {jobSeeker.id === 0 ? "Profile missing" : "Profile ready"}
              </StatusBadge>
              <span>
                {jobSeeker.skillsCount} skills / {jobSeeker.applicationsCount}{" "}
                apps / {jobSeeker.portfolioItemsCount} portfolio / {jobSeeker.reviewsCount ?? 0} reviews
              </span>
              <span>
                {jobSeeker.averageRating == null
                  ? "No rating yet"
                  : `${jobSeeker.averageRating.toFixed(1)}/5 average rating`}
              </span>
            </div>
            <div className="admin-row-actions">
              <Button
                variant="secondary"
                disabled={jobSeeker.id === 0}
                onClick={() => openPortfolio(jobSeeker)}
              >
                <BriefcaseBusiness size={15} aria-hidden="true" />
                Portfolio
              </Button>
              <Button variant="secondary" onClick={() => startEdit(jobSeeker)}>
                Edit
              </Button>
              <Button
                variant="secondary"
                className="button-danger"
                onClick={() => handleDelete(jobSeeker)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {portfolioJobSeeker ? (
        <div className="portfolio-viewer-backdrop" role="presentation">
          <aside
            className="portfolio-viewer-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-portfolio-title"
          >
            <header>
              <div>
                <span>Verified work evidence</span>
                <h2 id="admin-portfolio-title">
                  {portfolioJobSeeker.fullName}'s portfolio
                </h2>
                <p>{portfolioJobSeeker.email}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                aria-label="Close portfolio"
                title="Close"
                onClick={() => setPortfolioJobSeeker(null)}
              >
                <X size={19} aria-hidden="true" />
              </Button>
            </header>
            <div className="portfolio-viewer-content">
              {isPortfolioLoading ? (
                <div className="notice">Loading portfolio...</div>
              ) : null}
              {portfolioError ? (
                <div className="notice notice-error">{portfolioError}</div>
              ) : null}
              {!isPortfolioLoading && !portfolioError ? (
                <PortfolioGallery
                  items={portfolioItems}
                  emptyDescription="This job seeker has not added completed SkillBridge work yet."
                />
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
