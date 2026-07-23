import type { AuthRole } from "../../auth/domain/authTypes";

export type Notification = {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: number;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
};

export function getNotificationDestination(
  notification: Notification,
  role: AuthRole | undefined,
) {
  const actionUrl = notification.actionUrl?.trim();

  if (actionUrl?.startsWith("/") && !actionUrl.startsWith("//")) {
    return actionUrl;
  }

  if (role === "Company") {
    if (notification.type === 0) return "/company/messages";
    if (notification.type === 1) return "/company/applications";
    if (notification.type === 2) return "/company/projects";
    if (notification.type === 4) return "/company/profile";
    return "/company/dashboard";
  }

  if (role === "JobSeeker") {
    if (notification.type === 0) return "/job-seeker/messages";
    if (notification.type === 1) return "/job-seeker/applications";
    if (notification.type === 2) return "/job-seeker/opportunities";
    if (notification.type === 3) return "/job-seeker/reviews";
    return "/job-seeker/dashboard";
  }

  return "/admin/dashboard";
}
