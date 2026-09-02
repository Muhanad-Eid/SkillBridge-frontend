import { type FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Box, Check, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getRoleHomePath, useAuth } from "../../../shared/auth/AuthContext";
import BrandIcon from "../../../shared/components/BrandIcon";
import ThemeToggle from "../../../shared/components/ThemeToggle";
import styles from "./AuthPage.module.scss";
import { ProviderTypes, RegisterRoles, type ProviderType, type RegisterRole } from "../domain/authTypes";
import { registerAsync } from "../infrastructure/authApi";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<RegisterRole>(RegisterRoles.JobSeeker);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [providerType, setProviderType] = useState<ProviderType>(ProviderTypes.Company);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCompany = role === RegisterRoles.Company;
  const errorMessageId = "register-form-error";

  function chooseRole(nextRole: RegisterRole) {
    setRole(nextRole);
    if (nextRole === RegisterRoles.JobSeeker) setCompanyName("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (isCompany && !companyName.trim()) return setError("Company name is required for company accounts.");
    setIsSubmitting(true);
    try {
      const user = await registerAsync({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password, role, companyName: isCompany ? companyName.trim() : undefined, providerType: isCompany ? providerType : undefined });
      setAuth(user);
      navigate(getRoleHomePath(user.role), { replace: true });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.page}>
      <Link className={styles.homeLink} to="/" aria-label="Return to SkillBridge home">
        <BrandIcon />
        <span>SkillBridge</span>
      </Link>
      <ThemeToggle className={styles.themeToggle} />
      <form className={styles.card} onSubmit={handleSubmit}>
        <header className={styles.header}>
          <span className={styles.mark}><Check size={27} strokeWidth={2.5} aria-hidden="true" /></span>
          <h1>Create your account</h1>
          <p>Join SkillBridge to find opportunities or post projects.</p>
        </header>

        <div className={styles.dots} aria-label={`Registration step ${step} of 2`}>
          <span className={`${styles.dot} ${step === 1 ? styles.dotActive : ""}`} />
          <span className={`${styles.dot} ${step === 2 ? styles.dotActive : ""}`} />
        </div>

        {step === 1 ? (
          <div>
            <p className={styles.stepLabel}>I am a...</p>
            <div className={styles.chips} role="radiogroup" aria-label="Account type">
              <button type="button" className={`${styles.chip} ${role === RegisterRoles.JobSeeker ? styles.chipActive : ""}`} onClick={() => chooseRole(RegisterRoles.JobSeeker)} aria-checked={role === RegisterRoles.JobSeeker} role="radio">
                {role === RegisterRoles.JobSeeker ? <span className={styles.chipCheck}><Check size={11} strokeWidth={3} aria-hidden="true" /></span> : null}
                <UserRound size={22} aria-hidden="true" />
                <span className={styles.chipTitle}>Job seeker</span><span className={styles.chipSub}>Student or freelancer</span>
              </button>
              <button type="button" className={`${styles.chip} ${isCompany ? styles.chipActive : ""}`} onClick={() => chooseRole(RegisterRoles.Company)} aria-checked={isCompany} role="radio">
                {isCompany ? <span className={styles.chipCheck}><Check size={11} strokeWidth={3} aria-hidden="true" /></span> : null}
                <Box size={22} aria-hidden="true" />
                <span className={styles.chipTitle}>Company</span><span className={styles.chipSub}>Post opportunities</span>
              </button>
            </div>
            <button className={styles.submit} type="button" onClick={() => setStep(2)}>Continue<ArrowRight size={15} aria-hidden="true" /></button>
          </div>
        ) : (
          <div>
            <button className={styles.back} type="button" onClick={() => setStep(1)}><ArrowLeft size={14} aria-hidden="true" />Back</button>
            {error ? <div id={errorMessageId} className={`${styles.message} ${styles.error}`} role="alert" aria-live="assertive">{error}</div> : null}
            <div className={styles.row}>
              <label className={styles.field} htmlFor="register-first-name">
                <span className={styles.fieldLabel}>First name</span>
                <input id="register-first-name" name="firstName" aria-invalid={Boolean(error)} aria-describedby={error ? errorMessageId : undefined} value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
              </label>
              <label className={styles.field} htmlFor="register-last-name">
                <span className={styles.fieldLabel}>Last name</span>
                <input id="register-last-name" name="lastName" aria-invalid={Boolean(error)} aria-describedby={error ? errorMessageId : undefined} value={lastName} onChange={(event) => setLastName(event.target.value)} required />
              </label>
            </div>
            {isCompany ? <div className={styles.organization}>
              <label htmlFor="providerType">Organization type</label>
              <div className={styles.field}><select id="providerType" value={providerType} onChange={(event) => setProviderType(Number(event.target.value) as ProviderType)} aria-invalid={Boolean(error)} aria-describedby={error ? errorMessageId : undefined}><option value={ProviderTypes.Company}>Company</option><option value={ProviderTypes.TrainingProvider}>Training provider</option></select></div>
              <label className={styles.field} htmlFor="register-company-name">
                <span className={styles.fieldLabel}>Organization name</span>
                <input id="register-company-name" name="companyName" aria-invalid={Boolean(error)} aria-describedby={error ? errorMessageId : undefined} value={companyName} onChange={(event) => setCompanyName(event.target.value)} required />
              </label>
            </div> : null}
            <label className={styles.field} htmlFor="register-email">
              <span className={styles.fieldLabel}>Email address</span>
              <input id="register-email" name="email" type="email" autoComplete="email" aria-invalid={Boolean(error)} aria-describedby={error ? errorMessageId : undefined} value={email} onChange={(event) => setEmail(event.target.value)} required />
              <Mail className={styles.fieldIcon} size={18} aria-hidden="true" />
            </label>
            <label className={styles.field} htmlFor="register-password">
              <span className={styles.fieldLabel}>Create password</span>
              <input id="register-password" name="password" type={showPassword ? "text" : "password"} minLength={8} autoComplete="new-password" aria-invalid={Boolean(error)} aria-describedby={error ? errorMessageId : undefined} value={password} onChange={(event) => setPassword(event.target.value)} required />
              <LockKeyhole className={styles.fieldIcon} size={18} aria-hidden="true" />
              <button className={styles.eye} type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}</button>
            </label>
            <label className={styles.field} htmlFor="register-confirm-password">
              <span className={styles.fieldLabel}>Confirm password</span>
              <input id="register-confirm-password" name="confirmPassword" type={showPassword ? "text" : "password"} minLength={8} autoComplete="new-password" aria-invalid={Boolean(error)} aria-describedby={error ? errorMessageId : undefined} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
              <LockKeyhole className={styles.fieldIcon} size={18} aria-hidden="true" />
            </label>
            <button className={styles.submit} type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating account..." : "Create account"}</button>
          </div>
        )}

        <p className={styles.footer}>Already have an account?<Link to="/login">Sign in</Link></p>
      </form>
    </section>
  );
}
