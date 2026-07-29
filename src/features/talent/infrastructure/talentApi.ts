import { httpClient } from "../../../shared/api/httpClient";
import type {
  TalentSearchFilters,
  TalentSearchResult,
} from "../domain/talentTypes";

export function searchTalentAsync(filters: TalentSearchFilters) {
  const searchParams = new URLSearchParams();

  if (filters.query?.trim()) {
    searchParams.set("query", filters.query.trim());
  }

  if (filters.skillId) {
    searchParams.set("skillId", filters.skillId.toString());
  }

  if (filters.evidenceOnly) {
    searchParams.set("evidenceOnly", "true");
  }

  const queryString = searchParams.toString();

  return httpClient<TalentSearchResult[]>(
    `/api/profiles/job-seekers/search${queryString ? `?${queryString}` : ""}`,
  );
}
