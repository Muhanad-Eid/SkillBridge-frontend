const portalBadgesChangedEvent = "skillbridge:portal-badges-changed";

export function notifyPortalBadgesChanged() {
  window.dispatchEvent(new Event(portalBadgesChangedEvent));
}

export function subscribeToPortalBadgeChanges(listener: () => void) {
  window.addEventListener(portalBadgesChangedEvent, listener);
  return () => window.removeEventListener(portalBadgesChangedEvent, listener);
}
