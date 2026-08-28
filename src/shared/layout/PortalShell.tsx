import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChevronDown,
  LogOut,
  Menu,
  PanelsTopLeft,
  X,
  type LucideIcon,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import BrandIcon from "../components/BrandIcon";
import ThemeToggle from "../components/ThemeToggle";
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
  profilePath?: string;
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
  profilePath,
  banner,
  children,
  onLogout,
}: PortalShellProps) {
  const location = useLocation();
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
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
    if (!isNavigationOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsNavigationOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isNavigationOpen]);

  const primaryNavItems = navItems.slice(0, 6);
  const activeItemIsPrimary = primaryNavItems.some((item) => item.to === activeItem?.to);

  return (
    <div className={styles.shell} data-portal-role={role}>
      <header className={styles.topbar}>
        <Link className={styles.brand} to={homePath} title="SkillBridge home">
          <BrandIcon className={styles.brandIcon} />
          <span className={styles.brandText}><strong>SkillBridge</strong><small>{portalLabel}</small></span>
        </Link>
        <nav className={styles.primaryNavigation} aria-label={`${portalLabel} primary navigation`}>
          {primaryNavItems.map((item) => <NavLink key={item.to} className={({ isActive }) => `${styles.primaryNavItem} ${isActive ? styles.primaryNavItemActive : ""}`} to={item.to}>{item.label}{item.badgeCount && item.badgeCount > 0 ? <strong className={styles.badge}>{item.badgeCount}</strong> : null}</NavLink>)}
        </nav>
        <div className={styles.topbarActions}>
          <button className={`${styles.allSpacesButton} ${!activeItemIsPrimary ? styles.allSpacesButtonActive : ""}`} type="button" aria-expanded={isNavigationOpen} aria-controls={`${role}-bridge-deck`} onClick={() => setIsNavigationOpen((value) => !value)}><PanelsTopLeft size={17} aria-hidden="true" /><span>All spaces</span><ChevronDown size={15} aria-hidden="true" /></button>
          <button className={`${styles.iconButton} ${styles.mobileMenu}`} type="button" aria-label="Open all spaces" onClick={() => setIsNavigationOpen(true)}><Menu size={20} aria-hidden="true" /></button>
          <ThemeToggle className={styles.iconButton} />
          {profilePath ? <Link className={styles.userLink} to={profilePath} aria-label={`Open ${userName || "your"} profile`} title={userEmail || "Open profile"}><span className={styles.avatar} aria-hidden="true">{getInitials(userName)}</span><span className={styles.userText}><strong>{userName || "Account"}</strong><small>Profile & settings</small></span></Link> : <div className={styles.userLink} title={userEmail}><span className={styles.avatar} aria-hidden="true">{getInitials(userName)}</span></div>}
          <button className={styles.iconButton} type="button" aria-label="Log out" title="Log out" onClick={onLogout}><LogOut size={18} aria-hidden="true" /></button>
        </div>
      </header>

      {isNavigationOpen ? <><button className={styles.backdrop} type="button" aria-label="Close all spaces" onClick={() => setIsNavigationOpen(false)} /><section id={`${role}-bridge-deck`} className={styles.bridgeDeck} aria-label="All workspace spaces"><header><div><span>SkillBridge spaces</span><strong>{portalLabel}</strong></div><button className={styles.deckClose} type="button" aria-label="Close all spaces" onClick={() => setIsNavigationOpen(false)}><X size={20} aria-hidden="true" /></button></header><nav>{navItems.map((item) => { const Icon = item.icon; return <NavLink key={item.to} className={({ isActive }) => `${styles.deckItem} ${isActive ? styles.deckItemActive : ""}`} to={item.to} onClick={() => setIsNavigationOpen(false)}><Icon size={19} strokeWidth={1.8} aria-hidden="true" /><span>{item.label}</span>{item.badgeCount && item.badgeCount > 0 ? <strong className={styles.badge}>{item.badgeCount}</strong> : null}</NavLink>; })}</nav></section></> : null}
      <div className={styles.workspace}>{banner ? <div className={styles.banner}>{banner}</div> : null}<main className={styles.content}>{children}</main></div>
    </div>
  );
}
