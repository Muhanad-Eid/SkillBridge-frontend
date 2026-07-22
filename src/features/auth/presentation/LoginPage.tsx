import { type FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getRoleHomePath, useAuth } from "../../../shared/auth/AuthContext";
import Button from "../../../shared/components/Button";
import BrandIcon from "../../../shared/components/BrandIcon";
import Input from "../../../shared/components/Input";
import { loginAsync } from "../infrastructure/authApi";

export default function LoginPage() {
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

      if (user.role === "Admin") {
        logout();
        setError("Admin accounts must use the admin portal login.");
        return;
      }

      setAuth(user);
      navigate(getRoleHomePath(user.role), { replace: true });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Login failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page auth-simple">
      <form className="auth-card" onSubmit={handleSubmit}>
        <Link className="portal-brand auth-register-brand" to="/">
          <BrandIcon />
          <span>
            <strong>SkillBridge</strong>
            <small>Company and job seeker login</small>
          </span>
        </Link>

        <div>
          <h2>Log in</h2>
          <p>Enter your email and password.</p>
        </div>

        {error ? <div className="auth-error">{error}</div> : null}
        {searchParams.get("passwordChanged") === "1" ? (
          <div className="auth-success">
            Password changed successfully. Log in with your new password.
          </div>
        ) : null}

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

        <div className="auth-field-link">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Log in
        </Button>

        <p className="auth-switch">
          New to SkillBridge? <Link to="/register">Create account</Link>
        </p>

        <p className="auth-switch">
          Administrator? <Link to="/admin/login">Admin login</Link>
        </p>
      </form>
    </section>
  );
}
