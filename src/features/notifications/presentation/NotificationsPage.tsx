import { useEffect, useState } from "react";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import type { Notification } from "../domain/notificationTypes";
import {
  deleteNotificationAsync,
  getMyNotificationsAsync,
  markAllNotificationsReadAsync,
  markNotificationReadAsync,
} from "../infrastructure/notificationApi";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotifications() {
    setIsLoading(true);
    try {
      setNotifications(await getMyNotificationsAsync());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load notifications.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markAllRead() {
    await markAllNotificationsReadAsync();
    await loadNotifications();
  }

  async function markRead(notificationId: number) {
    await markNotificationReadAsync(notificationId);
    await loadNotifications();
  }

  async function deleteNotification(notificationId: number) {
    await deleteNotificationAsync(notificationId);
    await loadNotifications();
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Notifications"
        title="Updates"
        description="Review application, message, project, and system updates."
        actions={<Button onClick={markAllRead}>Mark all read</Button>}
      />

      <DataState
        isLoading={isLoading}
        error={error}
        empty={notifications.length === 0}
        emptyTitle="No notifications"
        emptyDescription="You are all caught up."
      />

      <div className="stack">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            eyebrow={notification.isRead ? "Read" : "Unread"}
            title={notification.title}
            description={notification.message}
            actions={
              <div className="actions-row">
                {!notification.isRead ? (
                  <Button
                    variant="secondary"
                    onClick={() => markRead(notification.id)}
                  >
                    Mark read
                  </Button>
                ) : null}
                <Button
                  variant="secondary"
                  onClick={() => deleteNotification(notification.id)}
                >
                  Delete
                </Button>
              </div>
            }
          >
            <p>{new Date(notification.createdAt).toLocaleString()}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
