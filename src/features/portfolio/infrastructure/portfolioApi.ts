import { httpClient } from "../../../shared/api/httpClient";
import type {
  CreatePortfolioItemRequest,
  PortfolioItem,
  UpdatePortfolioItemRequest,
} from "../domain/portfolioTypes";

export function getMyPortfolioAsync() {
  return httpClient<PortfolioItem[]>("/api/portfolio/my");
}

export function createPortfolioItemAsync(request: CreatePortfolioItemRequest) {
  return httpClient<PortfolioItem>("/api/portfolio", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function updatePortfolioItemAsync(
  portfolioItemId: number,
  request: UpdatePortfolioItemRequest,
) {
  return httpClient<void>(`/api/portfolio/${portfolioItemId}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function deletePortfolioItemAsync(portfolioItemId: number) {
  return httpClient<void>(`/api/portfolio/${portfolioItemId}`, {
    method: "DELETE",
  });
}
