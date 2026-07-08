import Card from "../../../shared/components/Card";
import PageHeader from "../../../shared/components/PageHeader";

export default function CompanyDashboardPage() {
  return (
    <section className="page">
      <PageHeader
        eyebrow="Company workspace"
        title="Manage opportunities"
        description="Post internships, training offers, and project work, then review the people who apply."
      />

      <div className="card-grid">
        <Card
          title="Post opportunities"
          description="Create internships, training offers, or project work for job seekers."
        />
        <Card
          title="Review applicants"
          description="Open each opportunity to see applications and applicant details."
        />
        <Card
          title="Company profile"
          description="Keep your company information ready for people who want to apply."
        />
      </div>
    </section>
  );
}
