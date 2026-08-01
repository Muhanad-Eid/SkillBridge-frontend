import { useEffect } from "react";
import { ArrowLeft, LayoutDashboard, RefreshCw } from "lucide-react";
import {
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router-dom";
import { getRoleHomePath, useAuth } from "../auth/AuthContext";
import BrandIcon from "./BrandIcon";
import Button from "./Button";

export default function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { user } = useAuth();
  const destination = user ? getRoleHomePath(user.role) : "/";
  const isMissingPage =
    isRouteErrorResponse(error) && error.status === 404;

  useEffect(() => {
    console.error("SkillBridge route error", error);
  }, [error]);

  return (
    <main className="app-error-page" role="alert">
      <BrandIcon />
      <span>{isMissingPage ? "404" : "Something went wrong"}</span>
      <h1>
        {isMissingPage
          ? "This page could not be found"
          : "We could not display this page"}
      </h1>
      <p>
        {isMissingPage
          ? "The link may be outdated or the page may have moved."
          : "Your account and saved work are unchanged. Reload the page or return to your portal."}
      </p>
      <div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Go back
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={17} aria-hidden="true" />
          Reload
        </Button>
        <Button to={destination}>
          <LayoutDashboard size={17} aria-hidden="true" />
          {user ? "Open portal" : "Home"}
        </Button>
      </div>
    </main>
  );
}
