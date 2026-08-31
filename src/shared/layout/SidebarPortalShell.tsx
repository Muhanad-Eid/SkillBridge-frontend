import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import BrandIcon from "../components/BrandIcon";
import ThemeToggle from "../components/ThemeToggle";
import useSidebarPreference from "../hooks/useSidebarPreference";
import styles from "./SidebarPortalShell.module.scss";

export type PortalRole = "admin" | "company" | "job-seeker" | "university";

export type PortalNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  badgeCount?: number;
};

type SidebarPortalShellProps = {
  role: PortalRole;
  portalLabel: string;
  homePath: string;
  navItems: PortalNavItem[];
  userName?: string;
  userEmail?: string;
  profilePath?: string;
  banner?: ReactNode;
  children: ReactNode;
  onLogout: () => void;
};

const accountLabels = new Set([
  "Profile",
  "Company profile",
  "Training provider profile",
  "Change password",
]);

function getInitials(name?: string) {
  const initials = name
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "SB";
}

export default function SidebarPortalShell({
  role,
  portalLabel,
  homePath,
  navItems,
  userName,
  userEmail,
  profilePath,
  banner,
  children,
  onLogout,
}: SidebarPortalShellProps) {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useSidebarPreference(role);
  const activeItem = useMemo(
    () =>
      [...navItems]
        .sort((left, right) => right.to.length - left.to.length)
        .find(
          (item) =>
            location.pathname === item.to ||
            location.pathname.startsWith(`${item.to}/`),
        ),
    [location.pathname, navItems],
  );
  const workspaceItems = navItems.filter((item) => !accountLabels.has(item.label));
  const accountItems = navItems.filter((item) => accountLabels.has(item.label));

  useEffect(() => {
    if (!isMobileOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMobileOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen]);

  function renderNavigation(items: PortalNavItem[], label: string) {
    if (items.length === 0) return null;

    return (
      <section className={styles.navGroup} aria-labelledby={`${role}-${label.toLowerCase()}-navigation`}>
        <h2 id={`${role}-${label.toLowerCase()}-navigation`} className={styles.navLabel}>{label}</h2>
        <nav aria-label={`${label} navigation`}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
                }
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                onClick={() => setIsMobileOpen(false)}
              >
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                <span className={styles.navText}>{item.label}</span>
                {item.badgeCount && item.badgeCount > 0 ? (
                  <strong className={styles.badge}>{item.badgeCount}</strong>
                ) : null}
              </NavLink>
            );
          })}
        </nav>
      </section>
    );
  }

  return (
    <div
      className={`${styles.shell} ${isCollapsed ? styles.collapsed : ""}`}
      data-portal-role={role}
    >
      <a className={styles.skipLink} href="#portal-main-content">Skip to main content</a>
      <aside
        id={`${role}-portal-navigation`}
        className={`${styles.sidebar} ${isMobileOpen ? styles.mobileOpen : ""}`}
      >
        <header className={styles.brandRow}>
          <Link className={styles.brand} to={homePath} title="SkillBridge home">
            <BrandIcon className={styles.brandIcon} />
            <span className={styles.brandText}>
              <strong>SkillBridge</strong>
              <small>{portalLabel}</small>
            </span>
          </Link>
          <button
            className={`${styles.iconButton} ${styles.sidebarCollapse}`}
            type="button"
            aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
            title={isCollapsed ? "Expand navigation" : "Collapse navigation"}
            onClick={() => setIsCollapsed((value) => !value)}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            className={styles.mobileClose}
            type="button"
            aria-label="Close navigation"
            onClick={() => setIsMobileOpen(false)}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.navigation}>
          {renderNavigation(workspaceItems, "Workspace")}
          {renderNavigation(accountItems, "Account")}
        </div>

        <footer className={styles.sidebarFooter}>
          {profilePath ? (
            <Link
              className={`${styles.user} ${styles.userLink}`}
              to={profilePath}
              aria-label={`Open ${userName || "your"} profile`}
              title={isCollapsed ? "Open profile" : undefined}
            >
              <span className={styles.avatar} aria-hidden="true">{getInitials(userName)}</span>
              <span className={styles.userText}>
                <strong>{userName || "SkillBridge user"}</strong>
                <small>{userEmail}</small>
              </span>
            </Link>
          ) : (
            <div className={styles.user} title={isCollapsed ? userName : undefined}>
              <span className={styles.avatar} aria-hidden="true">{getInitials(userName)}</span>
              <span className={styles.userText}>
                <strong>{userName || "SkillBridge user"}</strong>
                <small>{userEmail}</small>
              </span>
            </div>
          )}
          <div className={styles.footerActions}>
            <ThemeToggle className={styles.iconButton} />
            <button className={styles.iconButton} type="button" aria-label="Log out" title="Log out" onClick={onLogout}>
              <LogOut size={18} aria-hidden="true" />
            </button>
          </div>
        </footer>
      </aside>

      {isMobileOpen ? (
        <button className={styles.backdrop} type="button" aria-label="Close navigation" onClick={() => setIsMobileOpen(false)} />
      ) : null}

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <button
            className={`${styles.iconButton} ${styles.mobileMenu}`}
            type="button"
            aria-label="Open navigation"
            aria-controls={`${role}-portal-navigation`}
            aria-expanded={isMobileOpen}
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <div className={styles.pageIdentity}>
            <small>{portalLabel}</small>
            <strong>{activeItem?.label || "Workspace"}</strong>
          </div>
        </header>
        {banner ? <div className={styles.banner}>{banner}</div> : null}
        <main id="portal-main-content" className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
