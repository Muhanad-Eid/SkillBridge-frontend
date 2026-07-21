import { type FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Button from "../../../shared/components/Button";
import BrandIcon from "../../../shared/components/BrandIcon";
import Input from "../../../shared/components/Input";
import { resetPasswordAsync } from "../infrastructure/authApi";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId") ?? "";
  const token = searchParams.get("token") ?? "";
  const loginPath =
    searchParams.get("account") === "admin" ? "/admin/login" : "/login";
  const hasValidLink = Boolean(userId && token);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!hasValidLink) {
      setError("This password reset link is incomplete.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPasswordAsync({ userId, token, newPassword });
      setIsComplete(true);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to reset your password.",
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
          <h2>Set a new password</h2>
          <p>Choose a password with at least 8 characters.</p>
        </div>

        {!hasValidLink ? (
          <div className="auth-error">
            This password reset link is incomplete. Request a new link.
          </div>
        ) : null}
        {error ? <div className="auth-error">{error}</div> : null}
        {isComplete ? (
          <div className="auth-success">
            Your password has been reset. You can now log in.
          </div>
        ) : null}

        {hasValidLink && !isComplete ? (
          <>
            <Input
              label="New password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
            <Input
              label="Confirm new password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />

            <Button type="submit" fullWidth isLoading={isSubmitting}>
              Reset password
            </Button>
          </>
        ) : null}

        <p className="auth-switch">
          <Link
            to={
              isComplete
                ? loginPath
                : `/forgot-password${
                    loginPath === "/admin/login" ? "?account=admin" : ""
                  }`
            }
          >
            {isComplete ? "Go to login" : "Request a new link"}
          </Link>
        </p>
      </form>
    </section>
  );
}
