import { QueryClient } from "@tanstack/react-query";
import { HttpError } from "./httpClient";

function shouldRetryQuery(failureCount: number, error: unknown) {
  if (failureCount >= 2) return false;
  return !(error instanceof HttpError) || error.status >= 500;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: shouldRetryQuery,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
