import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
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

const providerFeatures = [
  "Post internships, training, and project work",
  "Review submitted evidence before profile details",
  "Track milestones and approve completed results",
];

const individualFeatures = [
  "Find opportunities that match your skills",
  "Apply with previous work or a short task",
  "Choose which approved Evidence Cards to share",
];

const universityFeatures = [
  "Monitor student progress and training hours",
  "Confirm academic requirements and outcomes",
  "Share final approval with the training provider",
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
              Verified providers offer practical work. Individuals complete it
              and build approved evidence they can choose to share.
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
              <h3>Define the opportunity</h3>
              <p>
                A verified provider sets the skills, deliverables, milestones,
                deadline, and evaluation criteria.
              </p>
            </li>
            <li>
              <span className="landing-step-number">02</span>
              <BriefcaseBusiness size={28} aria-hidden="true" />
              <h3>Apply with evidence</h3>
              <p>
                Individuals provide previous work or complete a short task.
                Selected personal details stay hidden during the first review.
              </p>
            </li>
            <li>
              <span className="landing-step-number">03</span>
              <BadgeCheck size={28} aria-hidden="true" />
              <h3>Complete and approve</h3>
              <p>
                Approved work creates a private Skill Evidence Card that the
                individual can share from their portfolio.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="landing-audience" aria-labelledby="audience-title">
        <div className="landing-section-inner">
          <header className="landing-section-heading">
            <p>One connected process</p>
            <h2 id="audience-title">Clear roles from start to approval.</h2>
          </header>

          <div className="landing-audience-grid">
            <article>
              <div className="landing-audience-icon landing-audience-icon-company">
                <Building2 size={26} aria-hidden="true" />
              </div>
              <span>For verified providers</span>
              <h3>Manage practical work clearly.</h3>
              <p>
                Manage an opportunity from the first post to the final review.
              </p>
              <ul>
                {providerFeatures.map((feature) => (
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
              <span>For individuals</span>
              <h3>Build experience through real work.</h3>
              <p>
                Move from finding an opportunity to sharing approved evidence.
              </p>
              <ul>
                {individualFeatures.map((feature) => (
                  <li key={feature}>
                    <CheckCircle2 size={18} aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>

            <article>
              <div className="landing-audience-icon landing-audience-icon-university">
                <GraduationCap size={26} aria-hidden="true" />
              </div>
              <span>For universities</span>
              <h3>Follow supervised training.</h3>
              <p>
                Keep academic monitoring connected to the company placement.
              </p>
              <ul>
                {universityFeatures.map((feature) => (
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
