import EmptyState from "./EmptyState";

type DataStateProps = {
  isLoading: boolean;
  error: string;
  empty: boolean;
  emptyTitle: string;
  emptyDescription: string;
};

export default function DataState({
  isLoading,
  error,
  empty,
  emptyTitle,
  emptyDescription,
}: DataStateProps) {
  if (isLoading) {
    return <div className="notice">Loading...</div>;
  }

  if (error) {
    return <div className="notice notice-error">{error}</div>;
  }

  if (empty) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  return null;
}
