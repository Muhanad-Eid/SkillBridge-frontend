import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bell,
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

type NavigationGroup = "Work" | "Evidence" | "People" | "Account";

type PrimaryNavigationItem = {
  sourceLabel: string;
  label: string;
};

const primaryNavigationByRole: Record<PortalRole, PrimaryNavigationItem[]> = {
  admin: [
    { sourceLabel: "Overview", label: "Overview" },
    { sourceLabel: "Projects", label: "Work" },
    { sourceLabel: "Evidence", label: "Evidence" },
    { sourceLabel: "Users", label: "People" },
  ],
  company: [
    { sourceLabel: "Overview", label: "Overview" },
    { sourceLabel: "Work", label: "Work" },
    { sourceLabel: "Evidence Replay", label: "Evidence" },
    { sourceLabel: "Find talent", label: "People" },
  ],
  "job-seeker": [
    { sourceLabel: "Overview", label: "Overview" },
    { sourceLabel: "Discover", label: "Explore" },
    { sourceLabel: "Work", label: "Work" },
    { sourceLabel: "Evidence Replay", label: "Evidence" },
  ],
  university: [
    { sourceLabel: "Supervised training", label: "Work" },
    { sourceLabel: "Evidence Replay", label: "Evidence" },
  ],
};

function getNavigationGroup(item: PortalNavItem): NavigationGroup {
  if (["Evidence Replay", "Evidence requests", "Portfolio", "Reviews", "Evidence", "Audit log", "Skills"].includes(item.label)) {
    return "Evidence";
  }

  if (["Users", "Companies", "Job seekers", "Find talent", "Messages", "Reviews"].includes(item.label)) {
    return "People";
  }

  if (["Profile", "Company profile", "Training provider profile", "Change password"].includes(item.label)) {
    return "Account";
  }

  return "Work";
}

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
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
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
    if (!isNavigationOpen && !isAccountOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsNavigationOpen(false);
        setIsAccountOpen(false);
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        isAccountOpen &&
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsAccountOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isAccountOpen, isNavigationOpen]);

  const primaryNavItems = primaryNavigationByRole[role].flatMap((primaryItem) => {
    const navItem = navItems.find((item) => item.label === primaryItem.sourceLabel);
    return navItem ? [{ ...navItem, primaryLabel: primaryItem.label }] : [];
  });
  const activeItemIsPrimary = primaryNavItems.some((item) => item.to === activeItem?.to);
  const notificationItem = navItems.find((item) => item.label === "Notifications");
  const groupedNavItems = (Object.keys({ Work: true, Evidence: true, People: true }) as NavigationGroup[])
    .map((group) => ({
      group,
      items: navItems.filter(
        (item) =>
          getNavigationGroup(item) === group &&
          item.to !== notificationItem?.to &&
          !primaryNavItems.some((primaryItem) => primaryItem.to === item.to),
      ),
    }))
    .filter(({ items }) => items.length > 0);
  const profileItem = navItems.find((item) =>
    ["Profile", "Company profile", "Training provider profile"].includes(item.label),
  );
  const passwordItem = navItems.find((item) => item.label === "Change password");
  const resolvedProfilePath = profilePath ?? profileItem?.to;
  const ProfileIcon = profileItem?.icon;
  const PasswordIcon = passwordItem?.icon;
  const hasWorkspaceNavigation = groupedNavItems.length > 0;

  return (
    <div className={styles.shell} data-portal-role={role}>
      <a className={styles.skipLink} href="#portal-main-content">Skip to main content</a>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link className={styles.brand} to={homePath} title="SkillBridge home">
            <BrandIcon className={styles.brandIcon} />
            <span className={styles.brandText}><strong>SkillBridge</strong><small>{portalLabel}</small></span>
          </Link>
          <nav className={styles.primaryNavigation} aria-label={`${portalLabel} primary navigation`}>
            {primaryNavItems.map((item) => <NavLink key={item.to} className={({ isActive }) => `${styles.primaryNavItem} ${isActive ? styles.primaryNavItemActive : ""}`} to={item.to}>{item.primaryLabel}{item.badgeCount && item.badgeCount > 0 ? <strong className={styles.badge}>{item.badgeCount}</strong> : null}</NavLink>)}
          </nav>
          <div className={styles.topbarActions}>
            {hasWorkspaceNavigation ? <button className={`${styles.allSpacesButton} ${!activeItemIsPrimary ? styles.allSpacesButtonActive : ""}`} type="button" aria-expanded={isNavigationOpen} aria-controls={`${role}-bridge-deck`} onClick={() => { setIsAccountOpen(false); setIsNavigationOpen((value) => !value); }}><PanelsTopLeft size={17} aria-hidden="true" /><span>Workspace</span><ChevronDown size={15} aria-hidden="true" /></button> : null}
            {hasWorkspaceNavigation ? <button className={`${styles.iconButton} ${styles.mobileMenu}`} type="button" aria-label="Open workspace navigation" onClick={() => { setIsAccountOpen(false); setIsNavigationOpen(true); }}><Menu size={20} aria-hidden="true" /></button> : null}
            {notificationItem ? (
              <Link className={styles.notificationButton} to={notificationItem.to} aria-label={notificationItem.badgeCount ? `Notifications, ${notificationItem.badgeCount} unread` : "Notifications"} title="Notifications">
                <Bell size={18} aria-hidden="true" />
                {notificationItem.badgeCount ? <strong className={styles.notificationBadge}>{notificationItem.badgeCount}</strong> : null}
              </Link>
            ) : null}
            <div className={styles.account} ref={accountMenuRef}>
              <button className={`${styles.accountButton} ${isAccountOpen ? styles.accountButtonActive : ""}`} type="button" aria-label={`Open account menu for ${userName || "your account"}`} aria-expanded={isAccountOpen} aria-controls={`${role}-account-menu`} onClick={() => { setIsNavigationOpen(false); setIsAccountOpen((value) => !value); }}>
                <span className={styles.avatar} aria-hidden="true">{getInitials(userName)}</span>
                <span className={styles.userText}><strong>{userName || "Account"}</strong><small>{portalLabel}</small></span>
                <ChevronDown className={styles.accountChevron} size={15} aria-hidden="true" />
              </button>
              {isAccountOpen ? (
                <section id={`${role}-account-menu`} className={styles.accountMenu} aria-label="Account menu">
                  <header><span className={styles.avatar} aria-hidden="true">{getInitials(userName)}</span><div><strong>{userName || "Account"}</strong><small>{userEmail || portalLabel}</small></div></header>
                  <nav>
                    {resolvedProfilePath ? <Link to={resolvedProfilePath}>{ProfileIcon ? <ProfileIcon size={17} aria-hidden="true" /> : null}<span>{profileItem?.label ?? "Profile and settings"}</span></Link> : null}
                    {passwordItem ? <Link to={passwordItem.to}>{PasswordIcon ? <PasswordIcon size={17} aria-hidden="true" /> : null}<span>Change password</span></Link> : null}
                  </nav>
                  <div className={styles.appearanceRow}><span>Appearance</span><ThemeToggle className={styles.menuThemeToggle} /></div>
                  <button className={styles.logoutButton} type="button" onClick={onLogout}><LogOut size={17} aria-hidden="true" />Log out</button>
                </section>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {isNavigationOpen && hasWorkspaceNavigation ? <><button className={styles.backdrop} type="button" aria-label="Close workspace navigation" onClick={() => setIsNavigationOpen(false)} /><section id={`${role}-bridge-deck`} className={styles.bridgeDeck} aria-label="Workspace navigation"><header><div><span>Workspace map</span><strong>{activeItem ? `${activeItem.label} is open` : portalLabel}</strong></div><button className={styles.deckClose} type="button" aria-label="Close workspace navigation" onClick={() => setIsNavigationOpen(false)}><X size={20} aria-hidden="true" /></button></header><div className={styles.deckGroups}><section className={`${styles.deckGroup} ${styles.mobilePrimaryGroup}`}><h2>Main</h2><nav aria-label="Main navigation">{primaryNavItems.map((item) => { const Icon = item.icon; return <NavLink key={item.to} className={({ isActive }) => `${styles.deckItem} ${isActive ? styles.deckItemActive : ""}`} to={item.to} onClick={() => setIsNavigationOpen(false)}><Icon size={19} strokeWidth={1.8} aria-hidden="true" /><span>{item.label}</span>{item.badgeCount && item.badgeCount > 0 ? <strong className={styles.badge}>{item.badgeCount}</strong> : null}</NavLink>; })}</nav></section>{groupedNavItems.map(({ group, items }) => <section className={styles.deckGroup} key={group}><h2>{group}</h2><nav aria-label={`${group} navigation`}>{items.map((item) => { const Icon = item.icon; return <NavLink key={item.to} className={({ isActive }) => `${styles.deckItem} ${isActive ? styles.deckItemActive : ""}`} to={item.to} onClick={() => setIsNavigationOpen(false)}><Icon size={19} strokeWidth={1.8} aria-hidden="true" /><span>{item.label}</span>{item.badgeCount && item.badgeCount > 0 ? <strong className={styles.badge}>{item.badgeCount}</strong> : null}</NavLink>; })}</nav></section>)}</div></section></> : null}
      <div className={styles.workspace}>
        {banner ? <div className={styles.banner}>{banner}</div> : null}
        <main id="portal-main-content" className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
