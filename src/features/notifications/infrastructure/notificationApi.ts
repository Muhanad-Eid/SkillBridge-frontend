import { httpClient } from "../../../shared/api/httpClient";
import type { Notification } from "../domain/notificationTypes";

export function getMyNotificationsAsync() {
  return httpClient<Notification[]>("/api/notifications/my");
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
