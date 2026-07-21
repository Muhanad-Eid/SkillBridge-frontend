import { type FormEvent, useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import Button from "../../../shared/components/Button";
import Input from "../../../shared/components/Input";
import PageHeader from "../../../shared/components/PageHeader";
import { changePasswordAsync } from "../infrastructure/authApi";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("The new password must be different from the current password.");
      return;
    }

    setIsSubmitting(true);

    try {
      await changePasswordAsync({ currentPassword, newPassword });
      const loginPath = user?.role === "Admin" ? "/admin/login" : "/login";
      logout();
      navigate(`${loginPath}?passwordChanged=1`, { replace: true });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to change your password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page account-security-page">
      <PageHeader
        title="Password and security"
      />

      <div className="account-security-layout">
        <aside className="account-security-summary">
          <span className="account-security-icon" aria-hidden="true">
            <ShieldCheck size={24} />
          </span>
          <div>
            <h2>Keep your account secure</h2>
            <p>Use a password you do not use for another account.</p>
          </div>
          <ul>
            <li>At least 8 characters</li>
            <li>Different from your current password</li>
            <li>You will log in again after saving</li>
          </ul>
        </aside>

        <form className="account-security-form" onSubmit={handleSubmit}>
          <header>
            <KeyRound size={20} aria-hidden="true" />
            <div>
              <h2>Change password</h2>
              <p>Enter your current password before choosing a new one.</p>
            </div>
          </header>

          {error ? <div className="auth-error">{error}</div> : null}

          <Input
            label="Current password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            minLength={8}
            maxLength={128}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
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

          <div className="account-security-actions">
            <Button type="submit" isLoading={isSubmitting}>
              Change password
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
