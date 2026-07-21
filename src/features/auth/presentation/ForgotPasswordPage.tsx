import { type FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Button from "../../../shared/components/Button";
import BrandIcon from "../../../shared/components/BrandIcon";
import Input from "../../../shared/components/Input";
import { forgotPasswordAsync } from "../infrastructure/authApi";

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const loginPath =
    searchParams.get("account") === "admin" ? "/admin/login" : "/login";
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await forgotPasswordAsync({ email: email.trim() });
      setMessage(response.message);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to request a password reset.",
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
            <small>Account recovery</small>
          </span>
        </Link>

        <div>
          <h2>Forgot password</h2>
          <p>Enter your account email and we will send you a reset link.</p>
        </div>

        {error ? <div className="auth-error">{error}</div> : null}
        {message ? <div className="auth-success">{message}</div> : null}

        {!message ? (
          <>
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <Button type="submit" fullWidth isLoading={isSubmitting}>
              Send reset link
            </Button>
          </>
        ) : null}

        <p className="auth-switch">
          <Link to={loginPath}>Back to login</Link>
        </p>
      </form>
    </section>
  );
}
