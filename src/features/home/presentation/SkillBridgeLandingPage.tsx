import { ArrowRight, BriefcaseBusiness, Building2, Check, FileCheck2, GraduationCap, Search, Sparkles, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { getRoleHomePath, useAuth } from "../../../shared/auth/AuthContext";
import styles from "./SkillBridgeLandingPage.module.scss";

const proofSteps = [
  ["01", "Evidence contract", "Requirements are accepted and versioned before work begins."],
  ["02", "Participant work", "Milestones, revisions, and contribution stay tied to one record."],
  ["03", "Human evaluation", "Stable criteria and accountable approvals determine readiness."],
  ["04", "Evidence card", "A share-safe result explains exactly what the work supports."],
] as const;

const pathways = [
  { icon: BriefcaseBusiness, label: "For participants", title: "Turn practical work into proof you can carry.", detail: "Find structured opportunities, complete real requirements, and share approved evidence without exposing private deliverables.", link: "/opportunities", action: "Find work" },
  { icon: Building2, label: "For providers", title: "See capability before a CV can explain it.", detail: "Define the contract, supervise delivery, evaluate criteria, and issue evidence through one accountable workflow.", link: "/register", action: "Create a workspace" },
  { icon: GraduationCap, label: "For universities", title: "Keep training progress and approval connected.", detail: "Monitor hours, outcomes, reports, company approval, and university approval from the same evidence lineage.", link: "/register", action: "Join SkillBridge" },
];

export default function SkillBridgeLandingPage() {
  const { user } = useAuth();
  const accountPath = user ? getRoleHomePath(user.role) : "/register";
  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="landing-title">
        <div className={styles.heroInner}>
          <div className={styles.heroCopyBlock}>
            <p className={styles.eyebrow}><Sparkles size={14} aria-hidden="true" />A better route into real work</p>
            <h1 id="landing-title"><span>Potential</span><span className={styles.coral}>meets</span><span>opportunity.</span></h1>
            <p className={styles.heroCopy}>SkillBridge is the practical marketplace where people build proof through meaningful work, and teams find capable talent before a CV says it all.</p>
            <div className={styles.heroActions}>
              <Link className={`${styles.button} ${styles.primary}`} to="/opportunities">Explore opportunities<ArrowRight size={18} aria-hidden="true" /></Link>
              <Link className={`${styles.button} ${styles.secondary}`} to={accountPath}>{user ? "Open my workspace" : "I am hiring talent"}<BriefcaseBusiness size={17} aria-hidden="true" /></Link>
            </div>
            <div className={styles.heroAssurances} aria-label="SkillBridge principles">
              <span><Check size={15} aria-hidden="true" />Work with context, not guesswork</span>
              <span><Check size={15} aria-hidden="true" />Evidence that travels with you</span>
            </div>
          </div>

          <div className={styles.boardWrap} aria-label="SkillBridge opportunity preview">
            <span className={styles.accentRing} aria-hidden="true" />
            <section className={styles.board}>
              <header className={styles.boardHeader}><span>Bridgeboard / 06.26</span><i aria-hidden="true" /></header>
              <div className={styles.opportunityPreview}>
                <div className={styles.previewHeading}>
                  <div><span>Structured opportunity</span><h2>Build a clearer onboarding flow</h2></div>
                  <span className={styles.peopleIcon}><UsersRound size={22} aria-hidden="true" /></span>
                </div>
                <dl className={styles.previewFacts}>
                  <div><dt>2 weeks</dt><dd>duration</dd></div><div><dt>Remote</dt><dd>location</dd></div><div><dt>Defined</dt><dd>criteria</dd></div>
                </dl>
                <Link className={styles.previewLink} to="/opportunities">View opportunities<ArrowRight size={17} aria-hidden="true" /></Link>
              </div>
              <footer className={styles.boardFooter}><FileCheck2 size={17} aria-hidden="true" /><span>Versioned requirements</span><span>Reviewed work</span><span>Bounded claims</span></footer>
            </section>
          </div>
        </div>
      </section>

      <section id="how-it-works" className={styles.proofBand} aria-labelledby="proof-title">
        <header className={styles.bandHeading}><p>From brief to proof</p><h2 id="proof-title">A visible record behind every claim.</h2><span>SkillBridge preserves the decisions that make completed work trustworthy.</span></header>
        <ol className={styles.proofSteps}>{proofSteps.map(([number, label, description]) => <li key={number}><span>{number}</span><div><h3>{label}</h3><p>{description}</p></div></li>)}</ol>
      </section>

      <section className={styles.pathways} aria-labelledby="pathways-title">
        <header className={styles.pathwaysHeading}><p>One system, clear responsibilities</p><h2 id="pathways-title">Everyone can see what moves the work forward.</h2></header>
        <div className={styles.pathwayRows}>{pathways.map(({ icon: Icon, label, title, detail, link, action }) => (
          <article key={label} className={styles.pathwayRow}>
            <span className={styles.pathwayIcon}><Icon size={23} aria-hidden="true" /></span>
            <div className={styles.pathwayTitle}><p>{label}</p><h3>{title}</h3></div><p className={styles.pathwayDetail}>{detail}</p>
            <Link to={link} aria-label={`${action}: ${label}`}>{action}<ArrowRight size={17} aria-hidden="true" /></Link>
          </article>
        ))}</div>
      </section>

      <section className={styles.finalCta}><div><p>Ready when the work is</p><h2>Find the next opportunity worth proving.</h2></div><Link className={`${styles.button} ${styles.primary}`} to="/opportunities"><Search size={17} aria-hidden="true" />Browse opportunities</Link></section>
    </div>
  );
}
