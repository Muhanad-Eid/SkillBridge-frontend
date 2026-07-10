import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import { getMyJobSeekerProfileAsync } from "../../profiles/infrastructure/profileApi";
import type { Review } from "../domain/reviewTypes";
import { getJobSeekerReviewsAsync } from "../infrastructure/reviewApi";

export default function JobSeekerReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadReviews() {
      try {
        const profile = await getMyJobSeekerProfileAsync();
        const data = await getJobSeekerReviewsAsync(profile.id);

        if (isMounted) {
          setReviews(data);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load your reviews.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      isMounted = false;
    };
  }, []);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return null;
    return reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
  }, [reviews]);

  const ratingCounts = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((rating) => ({
        rating,
        count: reviews.filter((review) => review.rating === rating).length,
      })),
    [reviews],
  );

  return (
    <section className="page jobseeker-reviews-page">
      <PageHeader
        eyebrow="Reputation"
        title="Reviews received"
        description="Feedback from companies after accepted project work becomes part of your professional proof."
        actions={
          <Button to="/job-seeker/portfolio" variant="secondary">
            View portfolio
          </Button>
        }
      />

      <DataState
        isLoading={isLoading}
        error={error}
        empty={reviews.length === 0}
        emptyTitle="No reviews yet"
        emptyDescription="Companies can review you after you complete accepted project work."
      />

      {reviews.length > 0 ? (
        <>
          <div className="jobseeker-review-summary">
            <article className="jobseeker-rating-card">
              <span>Average rating</span>
              <strong>{averageRating?.toFixed(1)}</strong>
              <div aria-label={`${averageRating?.toFixed(1)} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    fill={star <= Math.round(averageRating ?? 0) ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <small>{reviews.length} verified project review{reviews.length === 1 ? "" : "s"}</small>
            </article>

            <div className="jobseeker-rating-breakdown">
              {ratingCounts.map(({ rating, count }) => (
                <div key={rating}>
                  <span>{rating} stars</span>
                  <div aria-hidden="true">
                    <b style={{ width: `${(count / reviews.length) * 100}%` }} />
                  </div>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="jobseeker-review-list">
            {reviews.map((review) => (
              <article key={review.id}>
                <header>
                  <div>
                    <strong>{review.companyName}</strong>
                    <span>{review.projectTitle}</span>
                  </div>
                  <div className="jobseeker-review-stars" aria-label={`${review.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        fill={star <= review.rating ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                </header>
                <p>{review.comment || "The company left a rating without a written comment."}</p>
                <footer>
                  <span>Project #{review.projectId}</span>
                  <time dateTime={review.createdAt}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </time>
                </footer>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
