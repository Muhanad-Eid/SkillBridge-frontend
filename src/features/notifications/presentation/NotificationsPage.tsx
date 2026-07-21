import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  CheckCheck,
  MessageSquare,
  ShieldCheck,
  Star,
  Trash2,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import type { Notification } from "../domain/notificationTypes";
import {
  deleteNotificationAsync,
  getMyNotificationsAsync,
  markAllNotificationsReadAsync,
  markNotificationReadAsync,
} from "../infrastructure/notificationApi";

type NotificationFilter = "all" | "unread";

const notificationPresentation: Record<
  number,
  { icon: LucideIcon; label: string }
> = {
  0: { icon: MessageSquare, label: "Message" },
  1: { icon: UsersRound, label: "Application" },
  2: { icon: BriefcaseBusiness, label: "Opportunity" },
  3: { icon: Star, label: "Review" },
  4: { icon: ShieldCheck, label: "System" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function loadNotifications(showLoading = false) {
    if (showLoading) setIsLoading(true);

    try {
      setNotifications(await getMyNotificationsAsync());
      setError("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load notifications.",
      );
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => loadNotifications(true), 0);
    const intervalId = window.setInterval(() => loadNotifications(false), 5000);
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;
  const visibleNotifications = useMemo(
    () =>
      filter === "unread"
        ? notifications.filter((notification) => !notification.isRead)
        : notifications,
    [filter, notifications],
  );

  async function markAllRead() {
    setError("");
    try {
      await markAllNotificationsReadAsync();
      await loadNotifications(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to mark notifications as read.",
      );
    }
  }

  async function markRead(notificationId: number) {
    setBusyId(notificationId);
    setError("");
    try {
      await markNotificationReadAsync(notificationId);
      await loadNotifications(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to mark the notification as read.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteNotification(notificationId: number) {
    setBusyId(notificationId);
    setError("");
    try {
      await deleteNotificationAsync(notificationId);
      await loadNotifications(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete the notification.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="page portal-notifications-page">
      <PageHeader
        title="Notifications"
        actions={
          <Button
            type="button"
            variant="secondary"
            className="button-with-icon"
            disabled={unreadCount === 0}
            onClick={markAllRead}
          >
            <CheckCheck size={17} aria-hidden="true" />
            Mark all read
          </Button>
        }
      />

      {error ? <div className="notice notice-error">{error}</div> : null}

      <div className="notification-filter-tabs" role="tablist" aria-label="Notification filter">
        <button
          type="button"
          role="tab"
          aria-selected={filter === "all"}
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All <strong>{notifications.length}</strong>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === "unread"}
          className={filter === "unread" ? "active" : ""}
          onClick={() => setFilter("unread")}
        >
          Unread <strong>{unreadCount}</strong>
        </button>
      </div>

      <DataState
        isLoading={isLoading}
        error=""
        empty={!isLoading && visibleNotifications.length === 0}
        emptyTitle={filter === "unread" ? "No unread notifications" : "No notifications"}
        emptyDescription="You are all caught up."
      />

      <div className="notification-list-v2">
        {visibleNotifications.map((notification) => {
          const presentation =
            notificationPresentation[notification.type] ?? {
              icon: Bell,
              label: "Update",
            };
          const Icon = presentation.icon;

          return (
            <article
              key={notification.id}
              className={notification.isRead ? "" : "unread"}
            >
              <span className="notification-type-icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <div>
                <span>{presentation.label}</span>
                <strong>{notification.title}</strong>
                <p>{notification.message}</p>
                <time dateTime={notification.createdAt}>
                  {new Date(notification.createdAt).toLocaleString()}
                </time>
              </div>
              <div className="notification-row-actions">
                {!notification.isRead ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="company-icon-action"
                    disabled={busyId === notification.id}
                    aria-label={`Mark ${notification.title} as read`}
                    title="Mark as read"
                    onClick={() => markRead(notification.id)}
                  >
                    <CheckCheck size={17} aria-hidden="true" />
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  className="company-icon-action company-danger-icon"
                  disabled={busyId === notification.id}
                  aria-label={`Delete ${notification.title}`}
                  title="Delete notification"
                  onClick={() => deleteNotification(notification.id)}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
