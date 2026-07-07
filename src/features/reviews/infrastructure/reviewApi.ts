import { httpClient } from "../../../shared/api/httpClient";
import type { CreateReviewRequest, Review } from "../domain/reviewTypes";

export function getMyCompanyReviewsAsync() {
  return httpClient<Review[]>("/api/reviews/my-company");
}

export function createReviewAsync(request: CreateReviewRequest) {
  return httpClient<Review>("/api/reviews", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function deleteReviewAsync(reviewId: number) {
  return httpClient<void>(`/api/reviews/${reviewId}`, {
    method: "DELETE",
  });
}
