import { useEffect, useState } from "react";

type PortalName = "admin" | "company" | "job-seeker";

export default function useSidebarPreference(portal: PortalName) {
  const storageKey = `skillbridge:${portal}:sidebar-collapsed`;
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(isCollapsed));
    } catch {
      // The sidebar still works when browser storage is unavailable.
    }
  }, [isCollapsed, storageKey]);

  return [isCollapsed, setIsCollapsed] as const;
}
