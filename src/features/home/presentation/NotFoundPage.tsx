import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getRoleHomePath, useAuth } from "../../../shared/auth/AuthContext";
import Button from "../../../shared/components/Button";

export default function NotFoundPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const destination = user ? getRoleHomePath(user.role) : "/";

  return (
    <section className="not-found-page">
      <span>404</span>
      <h1>Page not found</h1>
      <div>
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={17} aria-hidden="true" />
          Go back
        </Button>
        <Button to={destination} variant="primary">
          <LayoutDashboard size={17} aria-hidden="true" />
          {user ? "Dashboard" : "Home"}
        </Button>
      </div>
    </section>
  );
}
