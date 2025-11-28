"use client";

import React, { useEffect, useMemo, useRef } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import { IMessage } from "../../types/messaging";

interface MessagesListProps {
  messages: IMessage[];
  currentUserId?: string;
  onMessageVisible?: (messageId: string) => void;
}

const MessagesList: React.FC<MessagesListProps> = ({
  messages,
  currentUserId,
  onMessageVisible,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialScrollDoneRef = useRef<boolean>(false);

  const lastMessageId = useMemo(
    () => (messages.length > 0 ? messages[messages.length - 1]._id : undefined),
    [messages]
  );

  const scrollToBottom = (smooth: boolean) => {
    const container = containerRef.current;
    if (!container) return;
    try {
      if (smooth) {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      } else {
        container.scrollTop = container.scrollHeight;
      }
    } catch {
      // Fallback
      messagesEndRef.current?.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  // Auto-scroll to bottom when new messages arrive (skip until initial stabilization finishes)
  useEffect(() => {
    if (messages.length === 0) return;
    if (!initialScrollDoneRef.current) return;
    scrollToBottom(true);
  }, [lastMessageId]);

  // Force scroll to bottom on mount (Chromium sometimes stops short on reload)
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 6; // ~6 frames
    const rafKick = () => {
      scrollToBottom(false);
      attempts += 1;
      if (attempts < maxAttempts) requestAnimationFrame(rafKick);
    };
    // Run a few frames, plus timed retries to combat layout/paint timing
    rafKick();
    const t1 = setTimeout(() => scrollToBottom(false), 30);
    const t2 = setTimeout(() => scrollToBottom(false), 90);
    const t3 = setTimeout(() => {
      initialScrollDoneRef.current = true;
    }, 150);
    // Handle late layout shifts (e.g., header mounting) for a short window
    const onResize = () => scrollToBottom(false);
    window.addEventListener("resize", onResize);
    const tResizeStop = setTimeout(() => {
      window.removeEventListener("resize", onResize);
    }, 700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tResizeStop);
      window.removeEventListener("resize", onResize);
    };
    // run once on mount
  }, []);

  // Minimal read emission: when a non-own message enters view, emit once
  const marked = useRef<Set<string>>(new Set());
  const latestVisibleFromOthers = useRef<string | null>(null);
  useEffect(() => {
    if (!onMessageVisible || !currentUserId) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute("data-message-id");
          if (!id || marked.current.has(id)) return;
          const m = messages.find((mm) => mm._id === id);
          if (!m) return;
          if (m.senderId === currentUserId) return; // not own message
          // Only emit for the latest visible non-own message
          latestVisibleFromOthers.current = id;
          marked.current.add(id);
          onMessageVisible(latestVisibleFromOthers.current);
        });
      },
      { threshold: 0.6 }
    );
    const els = document.querySelectorAll("[data-message-id]");
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [messages, currentUserId, onMessageVisible]);

  return (
    <div ref={containerRef} style={{ backgroundColor: "var(--surface)" }}>
      <ScrollToBottom className="!h-full !w-full p-6 space-y-3">
        {messages.length === 0 && (
          <div
            className="text-center text-sm opacity-70"
            style={{ color: "var(--on-surface-variant)" }}>
            No messages yet. Start the conversation!
          </div>
        )}
        {messages
          .filter((m) => m.plaintext !== "__ack__")
          .map((message, index) => {
            const isOwnMessage = message.senderId === currentUserId;
            const messageDate = new Date(message.createdAt);
            const now = new Date();
            const isSameDay =
              messageDate.toDateString() === now.toDateString();
            const isSameYear =
              messageDate.getFullYear() === now.getFullYear();

            // Show time for today, day/month for same year, include year otherwise
            const messageTime = isSameDay
              ? messageDate.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })
              : messageDate.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  ...(isSameYear ? {} : { year: "2-digit" }),
                });

            // Get surrounding messages for contextual rounding
            const filteredMessages = messages.filter(
              (m) => m.plaintext !== "__ack__"
            );
            const prevMessage = index > 0 ? filteredMessages[index - 1] : null;
            const nextMessage =
              index < filteredMessages.length - 1
                ? filteredMessages[index + 1]
                : null;

            const prevIsSameSender =
              prevMessage && prevMessage.senderId === message.senderId;
            const nextIsSameSender =
              nextMessage && nextMessage.senderId === message.senderId;

            // Determine round classes based on context
            let roundClass = "";
            if (isOwnMessage) {
              if (!prevIsSameSender && !nextIsSameSender) {
                roundClass = "left-round top-round"; // Single message
              } else if (!prevIsSameSender && nextIsSameSender) {
                roundClass = "left-round top-round"; // First in group
              } else if (prevIsSameSender && !nextIsSameSender) {
                roundClass = "left-round bottom-round"; // Last in group
              } else {
                roundClass = "left-round"; // Middle in group
              }
            } else {
              if (!prevIsSameSender && !nextIsSameSender) {
                roundClass = "right-round top-round"; // Single message
              } else if (!prevIsSameSender && nextIsSameSender) {
                roundClass = "right-round top-round"; // First in group
              } else if (prevIsSameSender && !nextIsSameSender) {
                roundClass = "right-round bottom-round"; // Last in group
              } else {
                roundClass = "right-round"; // Middle in group
              }
            }

            return (
              <div
                key={message._id}
                data-message-id={message._id}
                className={`flex ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}>
                <div
                  className={`max-w-[70%] !px-5 !py-1 !my-0.5 !mx-1 relative ${roundClass}`}
                  style={{
                    backgroundColor: isOwnMessage
                      ? "var(--primary-container)"
                      : "var(--surface-variant)",
                  }}>
                  <div
                    className="text-sm break-words"
                    style={{
                      color: isOwnMessage
                        ? "var(--on-primary-container)"
                        : "var(--on-surface-variant)",
                    }}>
                    {message.plaintext ?? message.ciphertext}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span
                      className="text-xs opacity-70"
                      style={{
                        color: isOwnMessage
                          ? "var(--on-primary-container)"
                          : "var(--on-surface-variant)",
                      }}>
                      {messageTime}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </ScrollToBottom>
    </div>
  );
};

export default MessagesList;
