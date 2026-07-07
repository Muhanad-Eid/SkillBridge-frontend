import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRoleHomePath, useAuth } from "../../../shared/auth/AuthContext";
import Button from "../../../shared/components/Button";
import Input from "../../../shared/components/Input";
import { RegisterRoles, type RegisterRole } from "../domain/authTypes";
import { registerAsync } from "../infrastructure/authApi";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [role, setRole] = useState<RegisterRole>(RegisterRoles.JobSeeker);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCompany = role === RegisterRoles.Company;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (isCompany && !companyName.trim()) {
      setError("Company name is required for company accounts.");
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await registerAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        role,
        companyName: isCompany ? companyName.trim() : undefined,
      });

      setAuth(user);
      navigate(getRoleHomePath(user.role), { replace: true });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Registration failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-copy">
        <p className="eyebrow">Join SkillBridge</p>
        <h1>Create the right account.</h1>
        <p>
          Companies can post internships and training. Job seekers can apply,
          build profiles, and show real portfolio proof.
        </p>

        <div className="auth-highlights">
          <article>
            <strong>Company account</strong>
            <span>Create opportunities and review applicants.</span>
          </article>
          <article>
            <strong>Job seeker account</strong>
            <span>Find opportunities and track your progress.</span>
          </article>
        </div>
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <div>
          <h2>Register</h2>
          <p>Choose your account type first.</p>
        </div>

        {error ? <div className="auth-error">{error}</div> : null}

        <div className="role-picker" role="radiogroup" aria-label="Account type">
          <button
            type="button"
            className={role === RegisterRoles.JobSeeker ? "active" : ""}
            onClick={() => {
              setRole(RegisterRoles.JobSeeker);
              setCompanyName("");
            }}
          >
            <strong>Job seeker</strong>
            <span>Apply for internships and training.</span>
          </button>
          <button
            type="button"
            className={role === RegisterRoles.Company ? "active" : ""}
            onClick={() => setRole(RegisterRoles.Company)}
          >
            <strong>Company</strong>
            <span>Post opportunities and train talent.</span>
          </button>
        </div>

        <div className="form-grid">
          <Input
            label="First name"
            name="firstName"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
          <Input
            label="Last name"
            name="lastName"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
          />
        </div>

        {isCompany ? (
          <Input
            label="Company name"
            name="companyName"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            required
          />
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

        <div className="form-grid">
          <Input
            label="Password"
            name="password"
            type="password"
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <Input
            label="Confirm password"
            name="confirmPassword"
            type="password"
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>

        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Create account
        </Button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </section>
  );
}
