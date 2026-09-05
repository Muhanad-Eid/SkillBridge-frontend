import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  BriefcaseBusiness,
  CheckCheck,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Star,
  Trash2,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import { useAuth } from "../../../shared/auth/AuthContext";
import { notifyPortalBadgesChanged } from "../../../shared/events/portalEvents";
import {
  getNotificationDestination,
  type Notification,
} from "../domain/notificationTypes";
import {
  deleteNotificationAsync,
  getMyNotificationsAsync,
  markAllNotificationsReadAsync,
  markNotificationReadAsync,
} from "../infrastructure/notificationApi";

type NotificationFilter = "all" | "unread";
const emptyNotifications: Notification[] = [];

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ["notifications", "mine"],
    queryFn: ({ signal }) => getMyNotificationsAsync({ signal }),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  const notifications = notificationsQuery.data ?? emptyNotifications;
  const refreshNotifications = () => {
    void queryClient.invalidateQueries({ queryKey: ["notifications", "mine"] });
    notifyPortalBadgesChanged();
  };
  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsReadAsync,
    onSuccess: refreshNotifications,
  });
  const markReadMutation = useMutation({
    mutationFn: markNotificationReadAsync,
    onSuccess: refreshNotifications,
  });
  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotificationAsync,
    onSuccess: refreshNotifications,
  });
  const busyId = markReadMutation.isPending
    ? markReadMutation.variables
    : deleteNotificationMutation.isPending
      ? deleteNotificationMutation.variables
      : null;
  const requestError =
    notificationsQuery.error ??
    markAllReadMutation.error ??
    markReadMutation.error ??
    deleteNotificationMutation.error;
  const error = requestError instanceof Error ? requestError.message : "";

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

  function openNotification(notification: Notification) {
    const destination = getNotificationDestination(notification, user?.role);

    if (!notification.isRead) {
      queryClient.setQueryData<Notification[]>(["notifications", "mine"], (current) =>
        current?.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ) ?? current,
      );
      markReadMutation.mutate(notification.id);
    }

    navigate(destination);
  }

  return (
    <section className="page portal-notifications-page">
      <PageHeader
        eyebrow="Workspace attention"
        title="Notifications"
        description="Follow decisions, approvals, messages, and evidence changes that require your attention."
        actions={
          <Button
            type="button"
            variant="secondary"
            className="button-with-icon"
            disabled={unreadCount === 0}
            onClick={() => markAllReadMutation.mutate()}
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
        isLoading={notificationsQuery.isLoading}
        error=""
        empty={!notificationsQuery.isLoading && visibleNotifications.length === 0}
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
              <button
                type="button"
                className="notification-open-action"
                disabled={busyId === notification.id}
                onClick={() => openNotification(notification)}
                aria-label={`Open ${notification.title}`}
              >
                <span className="notification-type-icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span className="notification-copy">
                  <span>{presentation.label}</span>
                  <strong>{notification.title}</strong>
                  <p>{notification.message}</p>
                  <time dateTime={notification.createdAt}>
                    {new Date(notification.createdAt).toLocaleString()}
                  </time>
                </span>
                <ExternalLink
                  className="notification-open-icon"
                  size={17}
                  aria-hidden="true"
                />
              </button>
              <div className="notification-row-actions">
                {!notification.isRead ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="company-icon-action"
                    disabled={busyId === notification.id}
                    aria-label={`Mark ${notification.title} as read`}
                    title="Mark as read"
                    onClick={() => markReadMutation.mutate(notification.id)}
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
                  onClick={() => deleteNotificationMutation.mutate(notification.id)}
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
