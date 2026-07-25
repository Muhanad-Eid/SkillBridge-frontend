import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  LayoutDashboard,
  Search,
  UserPlus,
} from "lucide-react";
import {
  getRoleHomePath,
  useAuth,
} from "../../../shared/auth/AuthContext";
import Button from "../../../shared/components/Button";
import BrandIcon from "../../../shared/components/BrandIcon";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-copy">
          <BrandIcon className="about-brand-icon" />
          <span className="about-eyebrow">Opportunity marketplace</span>
          <h1>SkillBridge</h1>
          <p>
            A focused place for companies to post real opportunities and for
            job seekers to apply, complete work, and build their portfolio.
          </p>
          <div className="about-actions">
            <Button to="/opportunities" variant="primary">
              <Search size={17} aria-hidden="true" />
              Browse opportunities
            </Button>
            {user ? (
              <Button to={getRoleHomePath(user.role)} variant="secondary">
                <LayoutDashboard size={17} aria-hidden="true" />
                Open portal
              </Button>
            ) : (
              <Button to="/register" variant="secondary">
                <UserPlus size={17} aria-hidden="true" />
                Register
              </Button>
            )}
          </div>
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
              <li><b>1</b><div><strong>Post</strong><span>Create an internship, training offer, or project.</span></div></li>
              <li><b>2</b><div><strong>Select</strong><span>Review profiles and accept applicants.</span></div></li>
              <li><b>3</b><div><strong>Complete</strong><span>Manage the work and submit a review.</span></div></li>
            </ol>
          </article>

          <article>
            <div className="about-audience">
              <BriefcaseBusiness size={24} aria-hidden="true" />
              <h3>Job seekers</h3>
            </div>
            <ol>
              <li><b>1</b><div><strong>Prepare</strong><span>Add profile details and skills.</span></div></li>
              <li><b>2</b><div><strong>Apply</strong><span>Find opportunities and send an application.</span></div></li>
              <li><b>3</b><div><strong>Build</strong><span>Add completed work to the portfolio.</span></div></li>
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
