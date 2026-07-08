import { type FormEvent, useEffect, useMemo, useState } from "react";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
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
  const [editingJobSeeker, setEditingJobSeeker] =
    useState<AdminJobSeeker | null>(null);
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
    loadJobSeekers();
  }, []);

  const filteredJobSeekers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return jobSeekers;
    }

    return jobSeekers.filter((jobSeeker) => {
      return (
        jobSeeker.fullName.toLowerCase().includes(value) ||
        jobSeeker.email.toLowerCase().includes(value) ||
        (jobSeeker.city ?? "").toLowerCase().includes(value) ||
        (jobSeeker.bio ?? "").toLowerCase().includes(value)
      );
    });
  }, [jobSeekers, search]);

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

  return (
    <section className="page admin-list-page">
      <PageHeader
        eyebrow="Admin"
        title="Job seekers"
        description="Search learner accounts, fix incomplete profiles, review activity, or remove accounts."
      />

      <div className="toolbar admin-toolbar">
        <input
          aria-label="Search job seekers"
          placeholder="Search by name, email, city, or bio"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
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
                apps / {jobSeeker.portfolioItemsCount} portfolio
              </span>
            </div>
            <div className="admin-row-actions">
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
    </section>
  );
}
