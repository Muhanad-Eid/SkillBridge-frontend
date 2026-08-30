import { type FormEvent, useState } from "react";
import { Check, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getRoleHomePath, useAuth } from "../../../shared/auth/AuthContext";
import ThemeToggle from "../../../shared/components/ThemeToggle";
import styles from "./AuthPage.module.scss";
import { loginAsync } from "../infrastructure/authApi";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logout, setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const user = await loginAsync({ email: email.trim(), password });
      if (user.role === "Admin") {
        logout();
        setError("Admin accounts must use the admin portal login.");
        return;
      }
      setAuth(user);
      navigate(getRoleHomePath(user.role), { replace: true });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.page}>
      <ThemeToggle className={styles.themeToggle} />
      <form className={styles.card} onSubmit={handleSubmit}>
        <header className={styles.header}>
          <span className={styles.mark}><Check size={27} strokeWidth={2.5} aria-hidden="true" /></span>
          <h1>Welcome back</h1>
          <p>Sign in to your SkillBridge account to continue.</p>
        </header>

        {error ? <div className={`${styles.message} ${styles.error}`}>{error}</div> : null}
        {searchParams.get("passwordChanged") === "1" ? <div className={`${styles.message} ${styles.success}`}>Password changed successfully. Log in with your new password.</div> : null}

        <label className={styles.field}>
          <input name="email" type="email" autoComplete="email" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Mail className={styles.fieldIcon} size={18} aria-hidden="true" />
        </label>
        <label className={styles.field}>
          <input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <LockKeyhole className={styles.fieldIcon} size={18} aria-hidden="true" />
          <button className={styles.eye} type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}</button>
        </label>
        <div className={styles.forgot}><Link to="/forgot-password">Forgot password?</Link></div>
        <button className={styles.submit} type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in..." : "Sign in"}</button>
        <p className={styles.footer}>Don&apos;t have an account?<Link to="/register">Get started</Link></p>
        <p className={styles.adminLink}>
          Administrator? <Link to="/admin/login">Use the admin portal</Link>
        </p>
      </form>
    </section>
  );
}
