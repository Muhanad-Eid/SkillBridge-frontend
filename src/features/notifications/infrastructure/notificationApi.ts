import { HttpError, httpClient } from "../../../shared/api/httpClient";
import type { Notification } from "../domain/notificationTypes";

let unreadCountEndpointSupported = true;

export function getMyNotificationsAsync() {
  return httpClient<Notification[]>("/api/notifications/my");
}

export async function getUnreadNotificationCountAsync() {
  if (unreadCountEndpointSupported) {
    try {
      const result = await httpClient<{ count: number }>(
        "/api/notifications/unread-count",
      );
      return result.count;
    } catch (error) {
      if (!(error instanceof HttpError) || ![404, 405].includes(error.status)) {
        throw error;
      }

      unreadCountEndpointSupported = false;
    }
  }

  const notifications = await getMyNotificationsAsync();
  return notifications.filter((notification) => !notification.isRead).length;
}

export function markNotificationReadAsync(notificationId: number) {
  return httpClient<void>(`/api/notifications/${notificationId}/read`, {
    method: "PUT",
  });
}

export function markAllNotificationsReadAsync() {
  return httpClient<void>("/api/notifications/read-all", {
    method: "PUT",
  });
}

export function deleteNotificationAsync(notificationId: number) {
  return httpClient<void>(`/api/notifications/${notificationId}`, {
    method: "DELETE",
  });
}
