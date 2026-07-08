import { useEffect, useMemo, useState } from "react";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import type { AdminReview } from "../domain/adminTypes";
import { deleteReviewAsync, getAdminReviewsAsync } from "../infrastructure/adminApi";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReviews() {
    setIsLoading(true);
    setError("");

    try {
      setReviews(await getAdminReviewsAsync());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to load reviews.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    const value = search.trim().toLowerCase();

    return reviews.filter((review) => {
      const matchesRating =
        ratingFilter === "All" || review.rating === Number(ratingFilter);
      const matchesSearch =
        !value ||
        review.companyName.toLowerCase().includes(value) ||
        review.jobSeekerName.toLowerCase().includes(value) ||
        review.projectTitle.toLowerCase().includes(value) ||
        (review.comment ?? "").toLowerCase().includes(value);

      return matchesRating && matchesSearch;
    });
  }, [ratingFilter, reviews, search]);

  const reviewStats = useMemo(() => {
    const ratingTotal = reviews.reduce((total, review) => total + review.rating, 0);

    return {
      total: reviews.length,
      average: reviews.length === 0 ? "0.0" : (ratingTotal / reviews.length).toFixed(1),
      fiveStar: reviews.filter((review) => review.rating === 5).length,
      low: reviews.filter((review) => review.rating <= 2).length,
    };
  }, [reviews]);

  async function handleDelete(review: AdminReview) {
    const confirmed = window.confirm(
      `Delete review for "${review.projectTitle}" by ${review.companyName}?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await deleteReviewAsync(review.id);
      await loadReviews();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to delete review.",
      );
    }
  }

  return (
    <section className="page admin-list-page">
      <PageHeader
        eyebrow="Admin"
        title="Reviews"
        description="Audit company feedback, ratings, and remove reviews that should not stay on the platform."
      />

      <div className="toolbar admin-toolbar">
        <input
          aria-label="Search reviews"
          placeholder="Search by company, job seeker, project, or comment"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Filter reviews by rating"
          value={ratingFilter}
          onChange={(event) => setRatingFilter(event.target.value)}
        >
          <option value="All">All ratings</option>
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>
      </div>

      <div className="admin-list-stats">
        <article>
          <span>Total reviews</span>
          <strong>{reviewStats.total}</strong>
        </article>
        <article>
          <span>Average rating</span>
          <strong>{reviewStats.average}</strong>
        </article>
        <article>
          <span>5 star</span>
          <strong>{reviewStats.fiveStar}</strong>
        </article>
        <article>
          <span>Low ratings</span>
          <strong>{reviewStats.low}</strong>
        </article>
      </div>

      <DataState
        isLoading={isLoading}
        error={error}
        empty={filteredReviews.length === 0}
        emptyTitle="No reviews"
        emptyDescription="Company reviews for completed project work will appear here."
      />

      <div className="table-card admin-table-card">
        {filteredReviews.map((review) => (
          <div className="table-row" key={review.id}>
            <div>
              <strong>{review.projectTitle}</strong>
              <span>
                {review.companyName} reviewed {review.jobSeekerName}
              </span>
              <span>{review.comment ?? "No comment"}</span>
            </div>
            <div className="admin-status-stack">
              <strong>{review.rating}/5</strong>
              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="admin-row-actions">
              <Button
                variant="secondary"
                className="button-danger"
                onClick={() => handleDelete(review)}
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
