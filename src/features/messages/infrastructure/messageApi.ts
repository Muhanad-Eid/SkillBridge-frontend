import { httpClient } from "../../../shared/api/httpClient";
import type { Message, SendMessageRequest } from "../domain/messageTypes";

let unreadCountEndpointSupported = true;

export function getMyMessagesAsync() {
  return httpClient<Message[]>("/api/messages/my");
}

export async function getUnreadMessageCountAsync(currentUserId?: string) {
  if (unreadCountEndpointSupported) {
    try {
      const result = await httpClient<{ count: number }>(
        "/api/messages/unread-count",
      );
      return result.count;
    } catch {
      unreadCountEndpointSupported = false;
    }
  }

  const messages = await getMyMessagesAsync();
  return messages.filter(
    (message) =>
      !message.isRead &&
      (!currentUserId || message.receiverId === currentUserId),
  ).length;
}

export function getConversationAsync(otherUserId: string, projectId: number) {
  const params = new URLSearchParams({
    otherUserId,
    projectId: String(projectId),
  });

  return httpClient<Message[]>(`/api/messages/conversation?${params}`);
}

export function sendMessageAsync(request: SendMessageRequest) {
  return httpClient<Message>("/api/messages", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function markMessageReadAsync(messageId: number) {
  return httpClient<void>(`/api/messages/${messageId}/read`, {
    method: "PUT",
  });
}
//
