export type Message = {
  id: number;
  projectId: number;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  sentAt: string;
  isRead: boolean;
};

export type SendMessageRequest = {
  receiverId: string;
  projectId: number;
  content: string;
};
