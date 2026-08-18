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
import styles from "./PortalShell.module.scss";

export type PortalRole = "admin" | "company" | "job-seeker" | "university";

export type PortalNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  badgeCount?: number;
};

type PortalShellProps = {
  role: PortalRole;
  portalLabel: string;
  homePath: string;
  navItems: PortalNavItem[];
  userName?: string;
  userEmail?: string;
  banner?: ReactNode;
  children: ReactNode;
  onLogout: () => void;
};

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

export default function PortalShell({
  role,
  portalLabel,
  homePath,
  navItems,
  userName,
  userEmail,
  banner,
  children,
  onLogout,
}: PortalShellProps) {
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

  useEffect(() => {
    if (!isMobileOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMobileOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen]);

  return (
    <div
      className={`${styles.shell} ${isCollapsed ? styles.collapsed : ""}`}
      data-portal-role={role}
    >
      <aside
        id={`${role}-portal-navigation`}
        className={`${styles.sidebar} ${isMobileOpen ? styles.mobileOpen : ""}`}
      >
        <div className={styles.brandRow}>
          <Link className={styles.brand} to={homePath} title="SkillBridge">
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
            {isCollapsed ? (
              <ChevronRight size={18} aria-hidden="true" />
            ) : (
              <ChevronLeft size={18} aria-hidden="true" />
            )}
          </button>
          <button
            className={styles.mobileClose}
            type="button"
            aria-label="Close navigation"
            onClick={() => setIsMobileOpen(false)}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <nav className={styles.navigation} aria-label={`${portalLabel} navigation`}>
          <span className={styles.navLabel}>Workspace</span>
          {navItems.map((item) => {
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
                <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
                <span className={styles.navText}>{item.label}</span>
                {item.badgeCount && item.badgeCount > 0 ? (
                  <strong className={styles.badge}>{item.badgeCount}</strong>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.user} title={isCollapsed ? userName : undefined}>
            <span className={styles.avatar} aria-hidden="true">
              {getInitials(userName)}
            </span>
            <span className={styles.userText}>
              <strong>{userName || "SkillBridge user"}</strong>
              <small>{userEmail}</small>
            </span>
          </div>
          <div className={styles.footerActions}>
            <ThemeToggle className={styles.iconButton} />
            <button
              className={styles.iconButton}
              type="button"
              aria-label="Log out"
              title="Log out"
              onClick={onLogout}
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      {isMobileOpen ? (
        <button
          className={styles.backdrop}
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsMobileOpen(false)}
        />
      ) : null}

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.topbarStart}>
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
          </div>
        </header>

        {banner ? <div className={styles.banner}>{banner}</div> : null}
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
