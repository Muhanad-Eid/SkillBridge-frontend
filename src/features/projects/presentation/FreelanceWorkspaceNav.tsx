import { NavLink } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";

export default function FreelanceWorkspaceNav() {
  const { user } = useAuth();
  const isCompany = user?.role === "Company";
  const basePath = isCompany ? "/company/freelance" : "/job-seeker/freelance";
  const items = isCompany
    ? [
        { label: "Tasks", to: basePath, end: true },
        { label: "Contracts", to: `${basePath}/work`, end: false },
      ]
    : [
        { label: "Browse tasks", to: basePath, end: true },
        { label: "My proposals", to: `${basePath}/proposals`, end: false },
        { label: "Contracts", to: `${basePath}/work`, end: false },
      ];

  return (
    <nav className="freelance-section-tabs" aria-label="Freelance workspace">
      {items.map((item) => (
        <NavLink end={item.end} key={item.to} to={item.to}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
