import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  LogIn,
  UserPlus,
} from "lucide-react";
import Button from "../../../shared/components/Button";
import BrandIcon from "../../../shared/components/BrandIcon";

export default function HomePage() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <BrandIcon className="about-brand-icon" />
        <h1>SkillBridge</h1>
        <p>
          Companies offer internships, training, and project work. Job seekers
          apply, complete the work, and build their portfolio.
        </p>
        <div className="about-actions">
          <Button to="/login" variant="secondary">
            <LogIn size={17} aria-hidden="true" />
            Log in
          </Button>
          <Button to="/register" variant="primary">
            <UserPlus size={17} aria-hidden="true" />
            Register
          </Button>
        </div>
      </section>

      <section className="about-workflows" aria-labelledby="about-workflows-title">
        <header>
          <span>How it works</span>
          <h2 id="about-workflows-title">From opportunity to completed work</h2>
        </header>

        <div className="about-workflow-list">
          <article>
            <div className="about-audience">
              <Building2 size={24} aria-hidden="true" />
              <h3>Companies</h3>
            </div>
            <ol>
              <li><strong>Post</strong><span>Create an internship, training offer, or project.</span></li>
              <li><strong>Select</strong><span>Review profiles and accept applicants.</span></li>
              <li><strong>Complete</strong><span>Manage the work and submit a review.</span></li>
            </ol>
          </article>

          <article>
            <div className="about-audience">
              <BriefcaseBusiness size={24} aria-hidden="true" />
              <h3>Job seekers</h3>
            </div>
            <ol>
              <li><strong>Prepare</strong><span>Add profile details and skills.</span></li>
              <li><strong>Apply</strong><span>Find opportunities and send an application.</span></li>
              <li><strong>Build</strong><span>Add completed work to the portfolio.</span></li>
            </ol>
          </article>
        </div>

        <div className="about-platform-points">
          <span><CheckCircle2 size={18} aria-hidden="true" />Verified companies</span>
          <span><CheckCircle2 size={18} aria-hidden="true" />Application tracking</span>
          <span><CheckCircle2 size={18} aria-hidden="true" />Messages and reviews</span>
        </div>
      </section>
    </div>
  );
}
