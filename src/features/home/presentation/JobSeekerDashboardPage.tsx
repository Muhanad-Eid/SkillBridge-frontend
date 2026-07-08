import Card from "../../../shared/components/Card";
import PageHeader from "../../../shared/components/PageHeader";

export default function JobSeekerDashboardPage() {
  return (
    <section className="page">
      <PageHeader
        eyebrow="Job seeker workspace"
        title="Build your opportunity proof"
        description="Find internships and training, apply with your profile, and grow your portfolio from real work."
      />

      <div className="card-grid">
        <Card
          title="Find opportunities"
          description="Browse internships, training offers, and project work from companies."
        />
        <Card
          title="My applications"
          description="Track the opportunities you applied to and follow your progress."
        />
        <Card
          title="Portfolio and skills"
          description="Add skills and portfolio items that show what you can do."
        />
      </div>
    </section>
  );
}
