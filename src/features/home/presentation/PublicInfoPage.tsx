import { Mail, ShieldCheck, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "./PublicInfoPage.module.scss";

type PublicInfoPageProps = {
  type: "contact" | "privacy" | "terms";
};

const content = {
  contact: {
    eyebrow: "Contact SkillBridge",
    title: "Talk to the right team.",
    description:
      "Questions about opportunities, provider verification, university training, or evidence records can be sent to the SkillBridge team.",
    icon: Mail,
  },
  privacy: {
    eyebrow: "Privacy",
    title: "Evidence should remain under control.",
    description:
      "SkillBridge limits public evidence to explicitly shared fields. Protected submissions, confidential files, account information, and source records remain access controlled.",
    icon: ShieldCheck,
  },
  terms: {
    eyebrow: "Terms of use",
    title: "Clear responsibilities for every role.",
    description:
      "Participants, providers, university supervisors, and administrators are responsible for the information and decisions they submit. SkillBridge preserves the process and provenance but does not guarantee universal mastery or evaluator honesty.",
    icon: FileText,
  },
} as const;

export default function PublicInfoPage({ type }: PublicInfoPageProps) {
  const page = content[type];
  const Icon = page.icon;

  return (
    <section className={styles.page}>
      <div className={styles.inner}>
        <span className={styles.icon}><Icon size={24} aria-hidden="true" /></span>
        <p className={styles.eyebrow}>{page.eyebrow}</p>
        <h1>{page.title}</h1>
        <p className={styles.description}>{page.description}</p>

        {type === "contact" ? (
          <a className={styles.primary} href="mailto:contact@skillbridge.com">
            <Mail size={17} aria-hidden="true" />contact@skillbridge.com
          </a>
        ) : (
          <p className={styles.note}>
            This project-scale policy summary will be expanded before public
            deployment.
          </p>
        )}

        <Link className={styles.back} to="/">Return to SkillBridge</Link>
      </div>
    </section>
  );
}
