import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRoleHomePath, useAuth } from "../../../shared/auth/AuthContext";
import Button from "../../../shared/components/Button";
import BrandIcon from "../../../shared/components/BrandIcon";
import Input from "../../../shared/components/Input";
import { loginAsync } from "../infrastructure/authApi";

export default function LoginPage() {
  const navigate = useNavigate();
  const { logout, setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user = await loginAsync({
        email: email.trim(),
        password,
      });

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
    <main className="user-login-shell">
      <section className="user-login-panel">
        <div className="user-login-copy">
          <Link className="portal-brand" to="/">
            <BrandIcon />
            <span>
              <strong>SkillBridge</strong>
              <small>User portal</small>
            </span>
          </Link>

          <div>
            <p className="eyebrow">Company and job seeker access</p>
            <h1>Enter your SkillBridge workspace.</h1>
            <p>
              Companies manage opportunities and applicants. Job seekers browse
              openings, track applications, and build portfolio proof.
            </p>
          </div>

          <div className="user-login-options">
            <article>
              <strong>Company portal</strong>
              <span>Post work, review applicants, and manage profile trust.</span>
            </article>
            <article>
              <strong>Job seeker portal</strong>
              <span>Apply to opportunities and build visible skill proof.</span>
            </article>
          </div>
        </div>

        <form className="user-login-card" onSubmit={handleSubmit}>
          <div>
            <h2>User login</h2>
            <p>Use a company or job seeker account.</p>
          </div>

          {error ? <div className="auth-error">{error}</div> : null}

          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <Button type="submit" fullWidth isLoading={isSubmitting}>
            Enter user portal
          </Button>

          <Button to="/admin/login" variant="ghost" fullWidth>
            Login as admin
          </Button>

          <p className="auth-switch">
            New to SkillBridge? <Link to="/register">Create account</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
