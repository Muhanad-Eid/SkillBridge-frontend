import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Edit3, Search, Star, Trash2 } from "lucide-react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import type { AdminPortalOutletContext } from "../../../app/layouts/AdminPortalLayout";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import Pagination from "../../../shared/components/Pagination";
import StatusBadge from "../../../shared/components/StatusBadge";
import type { AdminReview } from "../domain/adminTypes";
import {
  deleteReviewAsync,
  getAdminReviewsAsync,
  updateAdminReviewAsync,
} from "../infrastructure/adminApi";

export default function AdminReviewsPage() {
  const { refreshQueues } = useOutletContext<AdminPortalOutletContext>();
  const [searchParams] = useSearchParams();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState(
    searchParams.get("rating") === "low" ? "Low" : "All",
  );
  const [editingReview, setEditingReview] = useState<AdminReview | null>(null);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadReviews() {
    setIsLoading(true);
    setError("");

    try {
      const result = await getAdminReviewsAsync(page, pageSize, debouncedSearch);
      setReviews(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(Math.max(1, result.totalPages));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to load reviews.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(loadReviews, 0);
    return () => window.clearTimeout(timeoutId);
  }, [page, debouncedSearch]);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const filteredReviews = useMemo(() => {
    const value = search.trim().toLowerCase();

    return reviews.filter((review) => {
      const matchesRating =
        ratingFilter === "All" ||
        (ratingFilter === "Low" && review.rating <= 2) ||
        review.rating === Number(ratingFilter);
      const matchesSearch =
        !value ||
        review.companyName.toLowerCase().includes(value) ||
        review.jobSeekerName.toLowerCase().includes(value) ||
        review.projectTitle.toLowerCase().includes(value) ||
        (review.comment ?? "").toLowerCase().includes(value);

      return matchesRating && matchesSearch;
    });
  }, [ratingFilter, reviews, search]);

  const stats = useMemo(() => {
    const ratingTotal = reviews.reduce((total, review) => total + review.rating, 0);
    return {
      total: reviews.length,
      average: reviews.length ? (ratingTotal / reviews.length).toFixed(1) : "0.0",
      fiveStar: reviews.filter((review) => review.rating === 5).length,
      low: reviews.filter((review) => review.rating <= 2).length,
    };
  }, [reviews]);

  function startEdit(review: AdminReview) {
    setEditingReview(review);
    setRating(String(review.rating));
    setComment(review.comment ?? "");
    setError("");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingReview) return;

    setIsSaving(true);
    setError("");

    try {
      await updateAdminReviewAsync(editingReview.id, {
        rating: Number(rating),
        comment: comment.trim() || null,
      });
      setEditingReview(null);
      await loadReviews();
      await refreshQueues();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to update review.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(review: AdminReview) {
    if (!window.confirm(`Delete review for "${review.projectTitle}" by ${review.companyName}?`)) {
      return;
    }

    setError("");
    try {
      await deleteReviewAsync(review.id);
      await loadReviews();
      await refreshQueues();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to delete review.",
      );
    }
  }

  return (
    <section className="page admin-list-page admin-reviews-v2">
      <PageHeader
        title="Reviews"
      />

      <div className="admin-list-stats">
        <article><span>Total reviews</span><strong>{stats.total}</strong></article>
        <article><span>Average rating</span><strong>{stats.average}</strong></article>
        <article><span>Five star</span><strong>{stats.fiveStar}</strong></article>
        <article className={stats.low > 0 ? "needs-attention" : ""}><span>Needs review</span><strong>{stats.low}</strong></article>
      </div>

      <div className="admin-toolbar-v2">
        <label><Search size={17} /><input aria-label="Search reviews" placeholder="Search company, job seeker, project, or comment" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <select aria-label="Filter reviews by rating" value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)}>
          <option value="All">All ratings</option>
          <option value="Low">Needs review (1-2)</option>
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>
      </div>

      {editingReview ? (
        <form className="admin-edit-card admin-moderation-form" onSubmit={handleSave}>
          <div><span>Edit review #{editingReview.id}</span><strong>{editingReview.projectTitle}</strong><small>{editingReview.companyName} reviewed {editingReview.jobSeekerName}</small></div>
          <div className="form-grid">
            <label className="field"><span>Rating</span><select value={rating} onChange={(event) => setRating(event.target.value)}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}</select></label>
          </div>
          <label className="field"><span>Comment</span><textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1500} /></label>
          {error ? <div className="notice notice-error">{error}</div> : null}
          <div className="admin-edit-actions"><Button type="submit" isLoading={isSaving}>Save review</Button><Button type="button" variant="secondary" onClick={() => setEditingReview(null)}>Cancel</Button></div>
        </form>
      ) : null}

      <DataState isLoading={isLoading} error={!editingReview ? error : ""} empty={filteredReviews.length === 0} emptyTitle="No reviews" emptyDescription="Company reviews will appear here." />

      <div className="admin-review-table-v2">
        <div className="admin-review-head"><span>Review</span><span>Parties</span><span>Rating</span><span>Date</span><span>Actions</span></div>
        {filteredReviews.map((review) => (
          <article key={review.id}>
            <div><strong>{review.projectTitle}</strong><p>{review.comment ?? "No written comment"}</p><small>Review #{review.id} / Project #{review.projectId}</small></div>
            <div><strong>{review.companyName}</strong><span>for {review.jobSeekerName}</span></div>
            <StatusBadge tone={review.rating <= 2 ? "red" : review.rating === 5 ? "green" : "amber"}><Star size={13} fill="currentColor" />{review.rating}/5</StatusBadge>
            <time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString()}</time>
            <div className="admin-icon-actions"><Button variant="secondary" title="Edit review" aria-label={`Edit review ${review.id}`} onClick={() => startEdit(review)}><Edit3 size={16} /></Button><Button variant="secondary" className="button-danger" title="Delete review" aria-label={`Delete review ${review.id}`} onClick={() => handleDelete(review)}><Trash2 size={16} /></Button></div>
          </article>
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        isLoading={isLoading}
        onPageChange={setPage}
      />
    </section>
  );
}




