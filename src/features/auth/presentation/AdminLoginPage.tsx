import { type FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import Button from "../../../shared/components/Button";
import BrandIcon from "../../../shared/components/BrandIcon";
import Input from "../../../shared/components/Input";
import ThemeToggle from "../../../shared/components/ThemeToggle";
import { loginAsync } from "../infrastructure/authApi";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
    <section className="auth-page auth-simple">
      <ThemeToggle className="auth-theme-toggle" />
      <form className="auth-card" onSubmit={handleSubmit}>
        <Link className="portal-brand auth-register-brand" to="/">
          <BrandIcon />
          <span>
            <strong>SkillBridge</strong>
            <small>Admin portal</small>
          </span>
        </Link>

        <div>
          <h2>Admin login</h2>
          <p>Enter your admin email and password.</p>
        </div>

        {error ? <div className="auth-error">{error}</div> : null}
        {searchParams.get("passwordChanged") === "1" ? (
          <div className="auth-success">
            Password changed successfully. Log in with your new password.
          </div>
        ) : null}

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
          Log in
        </Button>

        <p className="auth-switch">
          Not an admin? <Link to="/login">Use normal login</Link>
        </p>
      </form>
    </section>
  );
}
