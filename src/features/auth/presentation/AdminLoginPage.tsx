import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import Button from "../../../shared/components/Button";
import BrandIcon from "../../../shared/components/BrandIcon";
import Input from "../../../shared/components/Input";
import { loginAsync } from "../infrastructure/authApi";

export default function AdminLoginPage() {
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

      if (user.role !== "Admin") {
        logout();
        setError(
          `This account is not an admin account. The API returned role: ${user.role}.`,
        );
        return;
      }

      setAuth(user);
      navigate("/admin/dashboard", { replace: true });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Admin login failed.",
      );
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
              <small>Admin portal</small>
            </span>
          </Link>

          <div>
            <p className="eyebrow">Admin access only</p>
            <h1>Platform control starts here.</h1>
            <p>
              Sign in with an admin account to manage users, companies, job
              seekers, and projects.
            </p>
          </div>
        </div>

        <form className="user-login-card" onSubmit={handleSubmit}>
          <div>
            <h2>Admin login</h2>
            <p>Only accounts with the Admin role can enter this portal.</p>
          </div>

          {error ? <div className="auth-error">{error}</div> : null}

          <Input
            label="Admin email"
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
            Enter admin portal
          </Button>

          <p className="auth-switch">
            Not an admin? <Link to="/login">Use normal login</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
