import { type FormEvent, useEffect, useState } from "react";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import DataState from "../../../shared/components/DataState";
import Input from "../../../shared/components/Input";
import PageHeader from "../../../shared/components/PageHeader";
import type { Review } from "../domain/reviewTypes";
import {
  createReviewAsync,
  deleteReviewAsync,
  getMyCompanyReviewsAsync,
} from "../infrastructure/reviewApi";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [jobSeekerId, setJobSeekerId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReviews() {
    setIsLoading(true);
    try {
      setReviews(await getMyCompanyReviewsAsync());
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

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createReviewAsync({
      jobSeekerId: Number(jobSeekerId),
      projectId: Number(projectId),
      rating: Number(rating),
      comment: comment.trim() || undefined,
    });
    setJobSeekerId("");
    setProjectId("");
    setRating("5");
    setComment("");
    await loadReviews();
  }

  async function handleDelete(reviewId: number) {
    await deleteReviewAsync(reviewId);
    await loadReviews();
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Reviews"
        title="Company reviews"
        description="Leave feedback for job seekers after completed project work."
      />

      <div className="two-column">
        <Card title="Create review">
          <form className="stack" onSubmit={handleCreate}>
            <Input
              label="Job seeker ID"
              type="number"
              min="1"
              value={jobSeekerId}
              onChange={(event) => setJobSeekerId(event.target.value)}
              required
            />
            <Input
              label="Project ID"
              type="number"
              min="1"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              required
            />
            <Input
              label="Rating"
              type="number"
              min="1"
              max="5"
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              required
            />
            <label className="field">
              <span>Comment</span>
              <textarea value={comment} onChange={(event) => setComment(event.target.value)} />
            </label>
            <Button type="submit">Create review</Button>
          </form>
        </Card>

        <div className="stack">
          <DataState
            isLoading={isLoading}
            error={error}
            empty={reviews.length === 0}
            emptyTitle="No reviews yet"
            emptyDescription="Reviews you create will appear here."
          />
          {reviews.map((review) => (
            <Card
              key={review.id}
              title={review.jobSeekerName}
              description={`${review.projectTitle} · ${review.rating}/5`}
              actions={
                <Button
                  variant="secondary"
                  onClick={() => handleDelete(review.id)}
                >
                  Delete
                </Button>
              }
            >
              <p>{review.comment ?? "No comment provided."}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
