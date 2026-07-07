import Card from "../../../shared/components/Card";
import PageHeader from "../../../shared/components/PageHeader";

export default function AdminDashboard() {
  return (
    <section className="page">
      <PageHeader
        eyebrow="Admin"
        title="Platform control"
        description="Manage users, verify companies, and keep the marketplace healthy."
      />
      <div className="card-grid">
        <Card title="Users" description="View and remove user accounts." />
        <Card title="Companies" description="Verify or unverify company profiles." />
        <Card title="Moderation" description="Review platform data as the admin surface grows." />
      </div>
    </section>
  );
}
