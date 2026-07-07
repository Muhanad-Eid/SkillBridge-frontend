import { httpClient } from "../../../shared/api/httpClient";
import type { Message, SendMessageRequest } from "../domain/messageTypes";

export function getMyMessagesAsync() {
  return httpClient<Message[]>("/api/messages/my");
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
