import { useAuth } from "../../../shared/auth/AuthContext";
import Card from "../../../shared/components/Card";
import PageHeader from "../../../shared/components/PageHeader";

export default function DashboardHomePage() {
  const { user } = useAuth();

  return (
    <section className="page">
      <PageHeader
        eyebrow={user?.role ?? "Workspace"}
        title={`Welcome, ${user?.fullName ?? "there"}`}
        description="Your SkillBridge workspace is ready. Use the navigation to continue."
      />
      <div className="card-grid">
        <Card title="Opportunities" description="Browse or manage real work opportunities." />
        <Card title="Applications" description="Track applicants and application progress." />
        <Card title="Profile" description="Keep your public information current." />
      </div>
    </section>
  );
}
