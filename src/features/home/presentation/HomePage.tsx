import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Check,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  GitBranch,
  LockKeyhole,
  Search,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getRoleHomePath, useAuth } from "../../../shared/auth/AuthContext";
import styles from "./HomePage.module.scss";

const roles = [
  {
    icon: BriefcaseBusiness,
    tone: "Individual",
    label: "For individuals",
    title: "Build experience through real work.",
    description: "Move from finding an opportunity to sharing approved evidence.",
    features: [
      "Find opportunities that match your skills",
      "Complete milestones and participant-specific work",
      "Share traceable evidence with clear claim limits",
    ],
  },
  {
    icon: Building2,
    tone: "Provider",
    label: "For verified providers",
    title: "Manage practical work clearly.",
    description: "Manage an opportunity from the first post to the final review.",
    features: [
      "Define versioned requirements before work begins",
      "Evaluate every criterion against accepted rules",
      "Approve evidence through accountable workflows",
    ],
  },
  {
    icon: GraduationCap,
    tone: "University",
    label: "For universities",
    title: "Follow supervised training.",
    description: "Keep academic monitoring connected to the company placement.",
    features: [
      "Monitor student progress and training hours",
      "Confirm academic requirements and outcomes",
      "Share final approval with the training provider",
    ],
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const accountPath = user ? getRoleHomePath(user.role) : "/register";

  return (
    <main className={styles.page}>
      <section className={styles.heroWrap} aria-labelledby="landing-title">
        <div className={styles.hero}>
          <div>
            <p className={styles.pill}>
              <ShieldCheck size={14} aria-hidden="true" />
              Internships, training, and project work
            </p>
            <h1 id="landing-title">
              Practical work.
              <br />
              Evidence with a trace.
            </h1>
            <p className={styles.heroCopy}>
              SkillBridge controls when completed work becomes evidence,
              preserving every requirement, submission, evaluation, and approval
              behind a protected Skill Evidence Card.
            </p>
            <div className={styles.heroActions}>
              <Link className={`${styles.button} ${styles.primary}`} to="/opportunities">
                <Search size={17} aria-hidden="true" />
                Browse opportunities
              </Link>
              <Link className={`${styles.button} ${styles.outline}`} to={accountPath}>
                <UserPlus size={17} aria-hidden="true" />
                {user ? "Open portal" : "Create account"}
              </Link>
            </div>
          </div>

          <section className={styles.heroVisual} aria-label="The SkillBridge evidence path">
            <header className={styles.circuitTop}>
              <div>
                <p>SkillBridge proof path</p>
                <h2>Work with a record that can be checked.</h2>
              </div>
              <span><GitBranch size={15} aria-hidden="true" />Traceable</span>
            </header>

            <ol className={styles.circuitFlow}>
              <li>
                <span className={`${styles.circuitIcon} ${styles.circuitBlue}`}><ClipboardCheck size={20} aria-hidden="true" /></span>
                <div><strong>Evidence Contract</strong><small>Requirements versioned</small></div>
              </li>
              <li>
                <span className={`${styles.circuitIcon} ${styles.circuitCoral}`}><BriefcaseBusiness size={20} aria-hidden="true" /></span>
                <div><strong>Participant Work</strong><small>Deliverables protected</small></div>
              </li>
              <li>
                <span className={`${styles.circuitIcon} ${styles.circuitGreen}`}><BadgeCheck size={20} aria-hidden="true" /></span>
                <div><strong>Evaluation</strong><small>Criteria and approvals</small></div>
              </li>
              <li>
                <span className={`${styles.circuitIcon} ${styles.circuitLime}`}><FileCheck2 size={20} aria-hidden="true" /></span>
                <div><strong>Evidence Card</strong><small>Claim boundary included</small></div>
              </li>
            </ol>

            <footer className={styles.circuitFooter}>
              <LockKeyhole size={18} aria-hidden="true" />
              <div><strong>Private work stays private.</strong><span>Only a controlled, reviewable evidence record can be shared.</span></div>
            </footer>
          </section>
        </div>
      </section>

      <section className={styles.trust} aria-label="Supported opportunity types">
        <p>Designed for practical learning and work</p>
        <div className={styles.trustLogos}>
          <span>University Training</span>
          <span>Professional Projects</span>
          <span>Industry Micro-Tasks</span>
          <span>Skill Challenges</span>
          <span>Team Projects</span>
        </div>
      </section>

      <section className={styles.proofPrinciples} aria-labelledby="protocol-title">
        <div className={styles.protocolLead}>
          <p>Evidence protocol</p>
          <h2 id="protocol-title">What makes a SkillBridge record trustworthy.</h2>
        </div>
        <article className={styles.principle}>
          <span>01</span>
          <h3>Versioned requirements</h3>
          <p>Work stays tied to the accepted Evidence Contract, not a later edit.</p>
        </article>
        <article className={styles.principle}>
          <span>02</span>
          <h3>Protected source work</h3>
          <p>Final deliverables remain controlled while a share-safe record can be verified.</p>
        </article>
        <article className={styles.principle}>
          <span>03</span>
          <h3>Bounded claims</h3>
          <p>Every card makes clear what its evidence supports and what it cannot claim.</p>
        </article>
      </section>

      <section className={styles.section} aria-labelledby="process-title">
        <header className={styles.sectionHeader}>
          <h2 id="process-title">One controlled path from requirement to evidence.</h2>
          <p>A card is issued only when the complete evidence lineage satisfies the defined rules.</p>
        </header>
        <ol className={styles.steps}>
          <li className={styles.step}>
            <span className={styles.stepNumber}>01</span>
            <span className={`${styles.icon} ${styles.iconBlue}`}><ClipboardCheck size={26} aria-hidden="true" /></span>
            <h3>Define the opportunity</h3>
            <p>A verified provider sets the skills, deliverables, milestones, deadline, and evaluation criteria.</p>
          </li>
          <li className={styles.step}>
            <span className={styles.stepNumber}>02</span>
            <span className={`${styles.icon} ${styles.iconGreen}`}><BriefcaseBusiness size={26} aria-hidden="true" /></span>
            <h3>Complete participant-specific work</h3>
            <p>Accepted participants complete milestones, submissions, revisions, and contribution attribution.</p>
          </li>
          <li className={styles.step}>
            <span className={styles.stepNumber}>03</span>
            <span className={`${styles.icon} ${styles.iconPurple}`}><BadgeCheck size={26} aria-hidden="true" /></span>
            <h3>Evaluate, approve, and issue</h3>
            <p>Required criteria, lineage, and approvals must pass before a protected Skill Evidence Card is created.</p>
          </li>
        </ol>
      </section>

      <section className={styles.rolesBand} aria-labelledby="roles-title">
        <div className={styles.section}>
          <header className={styles.sectionHeader}>
            <h2 id="roles-title">Clear roles from start to approval.</h2>
            <p>One connected process for every stakeholder.</p>
          </header>
          <div className={styles.roles}>
            {roles.map(({ icon: Icon, tone, label, title, description, features }) => (
              <article key={label} className={`${styles.role} ${styles[`role${tone}`]}`}>
                <span className={`${styles.icon} ${styles[`icon${tone === "Individual" ? "Blue" : tone === "Provider" ? "Green" : "Purple"}`]}`}><Icon size={27} aria-hidden="true" /></span>
                <p className={styles.roleLabel}>{label}</p>
                <h3>{title}</h3>
                <p>{description}</p>
                <ul>{features.map((feature) => <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <h2>See the opportunities available now.</h2>
          <p>Join verified providers, universities, and talented individuals building evidence-backed careers.</p>
          <Link className={`${styles.button} ${styles.primary}`} to="/opportunities">Browse opportunities<ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>
    </main>
  );
}
