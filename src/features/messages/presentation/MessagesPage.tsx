import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import type { Message } from "../domain/messageTypes";
import {
  getConversationAsync,
  getMyMessagesAsync,
  markMessageReadAsync,
  sendMessageAsync,
} from "../infrastructure/messageApi";

type ActiveConversation = {
  receiverId: string;
  receiverName: string;
  projectId: number;
  projectTitle?: string;
};

type ConversationThread = ActiveConversation & {
  latestMessage: Message | null;
  unreadCount: number;
};

const messageDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const liveRefreshMs = 3000;

function formatMessageTime(value: string) {
  return messageDateFormatter.format(new Date(value));
}

function getThreadKey(receiverId: string, projectId: number) {
  return `${receiverId.toLowerCase()}-${projectId}`;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<ActiveConversation | null>(null);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [conversationError, setConversationError] = useState("");
  const [sendError, setSendError] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = user?.userId.toLowerCase();

  const loadMessages = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!options.silent) {
      setIsLoading(true);
    }

    setError("");

    try {
      setMessages(await getMyMessagesAsync());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load messages.",
      );
    } finally {
      if (!options.silent) {
        setIsLoading(false);
      }
    }
  }, []);

  const loadConversation = useCallback(async (
    conversation: ActiveConversation,
    options: { silent?: boolean } = {},
  ) => {
    if (!options.silent) {
      setIsConversationLoading(true);
    }

    setConversationError("");

    try {
      const data = await getConversationAsync(
        conversation.receiverId,
        conversation.projectId,
      );
      const unreadIncoming = data.filter(
        (message) =>
          currentUserId &&
          message.receiverId.toLowerCase() === currentUserId &&
          !message.isRead,
      );

      if (unreadIncoming.length > 0) {
        await Promise.all(
          unreadIncoming.map((message) => markMessageReadAsync(message.id)),
        );

        const refreshed = await getConversationAsync(
          conversation.receiverId,
          conversation.projectId,
        );
        setConversationMessages(refreshed);
        await loadMessages({ silent: true });
      } else {
        setConversationMessages(data);
      }
    } catch (caughtError) {
      setConversationError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load this conversation.",
      );
    } finally {
      if (!options.silent) {
        setIsConversationLoading(false);
      }
    }
  }, [currentUserId, loadMessages]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadMessages(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadMessages]);

  useEffect(() => {
    const receiverId = searchParams.get("receiverId");
    const projectIdValue = Number(searchParams.get("projectId"));

    if (!receiverId || !projectIdValue) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveConversation({
        receiverId,
        receiverName: searchParams.get("receiverName") || "Selected person",
        projectId: projectIdValue,
        projectTitle: searchParams.get("projectTitle") || undefined,
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [searchParams]);

  useEffect(() => {
    if (!activeConversation) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => void loadConversation(activeConversation),
      0,
    );

    return () => window.clearTimeout(timeoutId);
  }, [activeConversation, loadConversation]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadMessages({ silent: true });
    }, liveRefreshMs);

    return () => window.clearInterval(intervalId);
  }, [loadMessages]);

  useEffect(() => {
    if (!activeConversation) {
      return;
    }

    const intervalId = window.setInterval(() => {
      loadConversation(activeConversation, { silent: true });
    }, liveRefreshMs);

    return () => window.clearInterval(intervalId);
  }, [activeConversation, loadConversation]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [
    conversationMessages.length,
    activeConversation?.receiverId,
    activeConversation?.projectId,
  ]);

  const conversations = useMemo(() => {
    const threads = new Map<string, ConversationThread>();

    messages.forEach((message) => {
      const isSender =
        currentUserId && message.senderId.toLowerCase() === currentUserId;
      const receiverId = isSender ? message.receiverId : message.senderId;
      const receiverName = isSender ? message.receiverName : message.senderName;
      const key = getThreadKey(receiverId, message.projectId);
      const existing = threads.get(key);
      const isUnreadIncoming =
        currentUserId &&
        message.receiverId.toLowerCase() === currentUserId &&
        !message.isRead;

      if (!existing) {
        threads.set(key, {
          receiverId,
          receiverName,
          projectId: message.projectId,
          latestMessage: message,
          unreadCount: isUnreadIncoming ? 1 : 0,
        });
        return;
      }

      if (
        new Date(message.sentAt).getTime() >
        new Date(existing.latestMessage?.sentAt ?? 0).getTime()
      ) {
        existing.latestMessage = message;
      }

      if (isUnreadIncoming) {
        existing.unreadCount += 1;
      }
    });

    const sortedThreads = [...threads.values()].sort((left, right) => {
      return (
        new Date(right.latestMessage?.sentAt ?? 0).getTime() -
        new Date(left.latestMessage?.sentAt ?? 0).getTime()
      );
    });

    if (!activeConversation) {
      return sortedThreads;
    }

    const activeKey = getThreadKey(
      activeConversation.receiverId,
      activeConversation.projectId,
    );

    if (threads.has(activeKey)) {
      return sortedThreads.map((thread) =>
        getThreadKey(thread.receiverId, thread.projectId) === activeKey
          ? {
              ...thread,
              receiverName: activeConversation.receiverName,
              projectTitle: activeConversation.projectTitle,
            }
          : thread,
      );
    }

    return [
      {
        ...activeConversation,
        latestMessage: null,
        unreadCount: 0,
      },
      ...sortedThreads,
    ];
  }, [activeConversation, currentUserId, messages]);

  const selectConversation = useCallback(
    (conversation: ActiveConversation, updateUrl = true) => {
      setActiveConversation(conversation);
      setConversationMessages([]);
      setContent("");
      setSendError("");

      if (!updateUrl) {
        return;
      }

      const nextParams = new URLSearchParams({
        receiverId: conversation.receiverId,
        receiverName: conversation.receiverName,
        projectId: String(conversation.projectId),
      });

      if (conversation.projectTitle) {
        nextParams.set("projectTitle", conversation.projectTitle);
      }

      setSearchParams(nextParams);
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (activeConversation || conversations.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => selectConversation(conversations[0], false),
      0,
    );

    return () => window.clearTimeout(timeoutId);
  }, [activeConversation, conversations, selectConversation]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeConversation) {
      return;
    }

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setSendError("Write a message before sending.");
      return;
    }

    setIsSending(true);
    setSendError("");

    try {
      await sendMessageAsync({
        receiverId: activeConversation.receiverId,
        projectId: activeConversation.projectId,
        content: trimmedContent,
      });

      setContent("");
      await loadConversation(activeConversation);
      await loadMessages();
    } catch (caughtError) {
      setSendError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to send message.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="page messages-page">
      <PageHeader
        eyebrow="Messages"
        title="Conversations"
        description="Start a chat from a profile, then continue the project conversation here."
      />

      <div className="messages-layout">
        <Card title="Chats" description="People connected to your projects.">
          <DataState
            isLoading={isLoading}
            error={error}
            empty={conversations.length === 0}
            emptyTitle="No conversations yet"
            emptyDescription="Open an applicant or company profile and choose Send message."
          />

          {conversations.length > 0 ? (
            <div className="conversation-list">
              {conversations.map((conversation) => {
                const isActive =
                  activeConversation &&
                  getThreadKey(
                    activeConversation.receiverId,
                    activeConversation.projectId,
                  ) ===
                    getThreadKey(
                      conversation.receiverId,
                      conversation.projectId,
                    );

                return (
                  <button
                    className={`conversation-button ${isActive ? "active" : ""}`}
                    key={getThreadKey(
                      conversation.receiverId,
                      conversation.projectId,
                    )}
                    type="button"
                    onClick={() => selectConversation(conversation)}
                  >
                    <span>
                      <strong>{conversation.receiverName}</strong>
                      {conversation.unreadCount > 0 ? (
                        <b>{conversation.unreadCount}</b>
                      ) : null}
                    </span>
                    <small>
                      {conversation.projectTitle ??
                        `Project ${conversation.projectId}`}
                    </small>
                    <p>
                      {conversation.latestMessage?.content ??
                        "No messages yet. Start the conversation."}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : null}
        </Card>

        <Card
          className="chat-panel-card"
          title={activeConversation?.receiverName ?? "Select a conversation"}
          description={
            activeConversation
              ? activeConversation.projectTitle ??
                `Project ${activeConversation.projectId}`
              : "Choose a chat from the left, or open a profile and click Send message."
          }
        >
          {!activeConversation ? (
            <div className="chat-empty">
              <strong>No chat selected</strong>
              <span>Open a profile to start a project message.</span>
            </div>
          ) : (
            <div className="chat-panel">
              {conversationError ? (
                <div className="notice notice-error">{conversationError}</div>
              ) : null}

              {isConversationLoading ? (
                <div className="notice">Loading conversation...</div>
              ) : null}

              <div className="chat-messages">
                {conversationMessages.length === 0 && !isConversationLoading ? (
                  <div className="chat-empty compact">
                    <strong>No messages yet</strong>
                    <span>Send the first message for this project.</span>
                  </div>
                ) : null}

                {conversationMessages.map((message) => {
                  const isMine =
                    currentUserId &&
                    message.senderId.toLowerCase() === currentUserId;

                  return (
                    <article
                      className={`chat-bubble ${isMine ? "outgoing" : "incoming"}`}
                      key={message.id}
                    >
                      <strong>{isMine ? "You" : message.senderName}</strong>
                      <p>{message.content}</p>
                      <span>{formatMessageTime(message.sentAt)}</span>
                    </article>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <form className="compose-form" onSubmit={handleSend}>
                <label className="field">
                  <span>Message</span>
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder={`Write to ${activeConversation.receiverName}`}
                    required
                  />
                </label>
                {sendError ? (
                  <div className="notice notice-error">{sendError}</div>
                ) : null}
                <div className="compose-actions">
                  <Button type="submit" isLoading={isSending}>
                    Send message
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
