import { type FormEvent, useEffect, useState } from "react";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import DataState from "../../../shared/components/DataState";
import Input from "../../../shared/components/Input";
import PageHeader from "../../../shared/components/PageHeader";
import type { Message } from "../domain/messageTypes";
import {
  getMyMessagesAsync,
  markMessageReadAsync,
  sendMessageAsync,
} from "../infrastructure/messageApi";

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [receiverId, setReceiverId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMessages() {
    setIsLoading(true);
    try {
      setMessages(await getMyMessagesAsync());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load messages.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessageAsync({
      receiverId: receiverId.trim(),
      projectId: Number(projectId),
      content: content.trim(),
    });
    setReceiverId("");
    setProjectId("");
    setContent("");
    await loadMessages();
  }

  async function handleRead(messageId: number) {
    await markMessageReadAsync(messageId);
    await loadMessages();
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Messages"
        title="Inbox"
        description="Send and review project-related conversations."
      />

      <div className="two-column">
        <Card title="Send message">
          <form className="stack" onSubmit={handleSend}>
            <Input
              label="Receiver user ID"
              value={receiverId}
              onChange={(event) => setReceiverId(event.target.value)}
              required
            />
            <Input
              label="Project ID"
              type="number"
              min="1"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              required
            />
            <label className="field">
              <span>Message</span>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                required
              />
            </label>
            <Button type="submit">Send message</Button>
          </form>
        </Card>

        <div className="stack">
          <DataState
            isLoading={isLoading}
            error={error}
            empty={messages.length === 0}
            emptyTitle="No messages yet"
            emptyDescription="Messages will appear after conversations begin."
          />
          {messages.map((message) => (
            <Card
              key={message.id}
              title={message.senderName}
              description={message.content}
              eyebrow={message.isRead ? "Read" : "Unread"}
              actions={
                !message.isRead ? (
                  <Button
                    variant="secondary"
                    onClick={() => handleRead(message.id)}
                  >
                    Mark read
                  </Button>
                ) : null
              }
            >
              <p>
                To {message.receiverName} · Project {message.projectId}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
