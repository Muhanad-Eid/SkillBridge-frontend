import { httpClient } from "../../../shared/api/httpClient";
import type {
  CreatePortfolioItemRequest,
  EligiblePortfolioProject,
  UpdatePortfolioItemRequest,
} from "../domain/portfolioTypes";
import {
  normalizePortfolioItem,
  normalizePortfolioItems,
  type PortfolioItemPayload,
} from "../domain/portfolioNormalization";

export async function getMyPortfolioAsync() {
  const items = await httpClient<PortfolioItemPayload[] | null>(
    "/api/portfolio/my",
  );

  return normalizePortfolioItems(items);
}

export function getEligiblePortfolioProjectsAsync() {
  return httpClient<EligiblePortfolioProject[]>(
    "/api/portfolio/eligible-projects",
  );
}

export async function getPublicPortfolioAsync(jobSeekerId: number) {
  const items = await httpClient<PortfolioItemPayload[] | null>(
    `/api/portfolio/job-seekers/${jobSeekerId}`,
    { skipAuth: true },
  );

  return normalizePortfolioItems(items);
}

export async function createPortfolioItemAsync(
  request: CreatePortfolioItemRequest,
) {
  const item = await httpClient<PortfolioItemPayload>("/api/portfolio", {
    method: "POST",
    body: JSON.stringify(request),
  });

  return normalizePortfolioItem(item);
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
