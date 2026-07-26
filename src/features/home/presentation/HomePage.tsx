import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  LayoutDashboard,
  MessageSquare,
  Search,
  UserPlus,
} from "lucide-react";
import {
  getRoleHomePath,
  useAuth,
} from "../../../shared/auth/AuthContext";
import Button from "../../../shared/components/Button";

const companyFeatures = [
  "Post internships, training, and project work",
  "Review applications and choose the right person",
  "Follow the work and leave a final review",
];

const jobSeekerFeatures = [
  "Find opportunities that match your skills",
  "Track applications and speak with companies",
  "Turn completed work into portfolio experience",
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-copy">
            <p className="landing-context">
              <BriefcaseBusiness size={18} aria-hidden="true" />
              Internships, training, and project work
            </p>
            <h1>SkillBridge</h1>
            <p className="landing-lead">
              Real opportunities. Experience you can prove.
            </p>
            <p className="landing-description">
              Companies post work they need. Job seekers apply, complete it,
              and build experience they can show.
            </p>

            <div className="landing-actions">
              <Button to="/opportunities" variant="primary">
                <Search size={18} aria-hidden="true" />
                Browse opportunities
              </Button>
              {user ? (
                <Button to={getRoleHomePath(user.role)} variant="secondary">
                  <LayoutDashboard size={18} aria-hidden="true" />
                  Open portal
                </Button>
              ) : (
                <Button to="/register" variant="secondary">
                  <UserPlus size={18} aria-hidden="true" />
                  Create account
                </Button>
              )}
            </div>

            <ul className="landing-proof" aria-label="Platform benefits">
              <li>
                <BadgeCheck size={18} aria-hidden="true" />
                Clear opportunities
              </li>
              <li>
                <ClipboardCheck size={18} aria-hidden="true" />
                Application tracking
              </li>
              <li>
                <MessageSquare size={18} aria-hidden="true" />
                Direct communication
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="landing-process" aria-labelledby="process-title">
        <div className="landing-section-inner">
          <header className="landing-section-heading">
            <p>How it works</p>
            <h2 id="process-title">
              One clear path from posting to completed work.
            </h2>
            <span>
              SkillBridge keeps the opportunity, application, communication,
              and result connected.
            </span>
          </header>

          <ol className="landing-process-list">
            <li>
              <span className="landing-step-number">01</span>
              <Building2 size={28} aria-hidden="true" />
              <h3>Post the work</h3>
              <p>
                A company adds the role, required skills, and deadline.
              </p>
            </li>
            <li>
              <span className="landing-step-number">02</span>
              <BriefcaseBusiness size={28} aria-hidden="true" />
              <h3>Apply and connect</h3>
              <p>
                Job seekers apply with their profile, skills, and portfolio.
              </p>
            </li>
            <li>
              <span className="landing-step-number">03</span>
              <BadgeCheck size={28} aria-hidden="true" />
              <h3>Complete and keep it</h3>
              <p>
                Finished work becomes a review and visible experience.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="landing-audience" aria-labelledby="audience-title">
        <div className="landing-section-inner">
          <header className="landing-section-heading">
            <p>Built for both sides</p>
            <h2 id="audience-title">The tools each person needs.</h2>
          </header>

          <div className="landing-audience-grid">
            <article>
              <div className="landing-audience-icon landing-audience-icon-company">
                <Building2 size={26} aria-hidden="true" />
              </div>
              <span>For companies</span>
              <h3>Find people ready to contribute.</h3>
              <p>
                Manage an opportunity from the first post to the final review.
              </p>
              <ul>
                {companyFeatures.map((feature) => (
                  <li key={feature}>
                    <CheckCircle2 size={18} aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>

            <article>
              <div className="landing-audience-icon landing-audience-icon-jobseeker">
                <BriefcaseBusiness size={26} aria-hidden="true" />
              </div>
              <span>For job seekers</span>
              <h3>Build experience through real work.</h3>
              <p>
                Move from finding an opportunity to showing what you completed.
              </p>
              <ul>
                {jobSeekerFeatures.map((feature) => (
                  <li key={feature}>
                    <CheckCircle2 size={18} aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div>
          <span>Start here</span>
          <h2>See the opportunities available now.</h2>
        </div>
        <Button to="/opportunities" variant="primary">
          Browse opportunities
          <ArrowRight size={18} aria-hidden="true" />
        </Button>
      </section>
    </div>
  );
}
