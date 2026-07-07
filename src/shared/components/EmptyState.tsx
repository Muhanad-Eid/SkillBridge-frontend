type EmptyStateProps = {
  title: string;
  description: string;
};

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section className="empty-state">
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}
