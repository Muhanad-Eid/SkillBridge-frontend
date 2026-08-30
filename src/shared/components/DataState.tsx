import type { ReactNode } from "react";
import EmptyState from "./EmptyState";

type DataStateProps = {
  isLoading: boolean;
  error: string;
  empty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: ReactNode;
};

export default function DataState({
  isLoading,
  error,
  empty,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: DataStateProps) {
  if (isLoading) {
    return <div className="notice">Loading...</div>;
  }

  if (error) {
    return <div className="notice notice-error">{error}</div>;
  }

  if (empty) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return null;
}
