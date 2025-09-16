"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  IConversation,
  IMessage,
  IPaginatedMessages,
  ITypingIndicator,
} from "../../types/messaging";
import {
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage,
  getConversationParticipants,
  IConversationParticipant,
} from "../../services/messaging";
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../contexts/AuthContext";
import ParticipantsList from "./ParticipantsList";
import MessagesList from "./MessagesList";
import BottomBar from "./BottomBar";
import ChatHeader from "./ChatHeader";
import TypingIndicator from "./TypingIndicator";
import { useLiveEvents } from "../../hooks/useLiveEvents";

import { getPublicUserById } from "../../services/user";
import { IUserPublic } from "../../types/user";
import { FEATURES } from "../../config/flags";
import { SimpleE2EClient } from "@/app/crypto/simpleE2E";

interface MessagePanelProps {
  className?: string;
}

const MessagePanel: React.FC<MessagePanelProps> = ({ className }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [participantUsers, setParticipantUsers] = useState<
    Record<string, IUserPublic>
  >({});
  const [conversationParticipants, setConversationParticipants] = useState<
    Record<string, IConversationParticipant[]>
  >({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [typingUsers, setTypingUsers] = useState<ITypingIndicator[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const outgoingPlainByCiphertextRef = useRef<Map<string, string>>(new Map());
  const participantUsersRef = useRef(participantUsers);

  // Live events hook
  const { startTyping, stopTyping, markMessageAsRead, joinRooms, leaveRooms } =
    useLiveEvents({
      conversationId: activeId || undefined,
      onTypingUpdate: setTypingUsers,
      onOnlineStatusUpdate: setOnlineUsers,
      onUnreadCountUpdate: (unreadCount) => {
        setUnreadCounts((prev) => ({
          ...prev,
          [unreadCount.conversationId]: unreadCount.count,
        }));
      },
    });

  // Join all conversation rooms once we have the list, to receive presence updates
  useEffect(() => {
    const ids = (Array.isArray(conversations) ? conversations : [])
      .map((c) => c._id)
      .filter(Boolean) as string[];
    if (ids.length > 0) joinRooms(ids);
    return () => {
      if (ids.length > 0) leaveRooms(ids);
    };
  }, [conversations, joinRooms, leaveRooms]);

  useEffect(() => {
    participantUsersRef.current = participantUsers;
  }, [participantUsers]);
  // kept if we later re-introduce limited handshake sends; currently unused
  // const handshakeOnceByPeerRef = useRef<Set<string>>(new Set());

  // Helper: get other participant id in a direct conversation
  const getOtherParticipantId = React.useCallback(
    (conversationId: string): string | null => {
      const parts = conversationParticipants[conversationId];
      if (!parts || !user) return null;
      const other = parts.find((p) => p.userId !== user._id);
      return other ? other.userId : null;
    },
    [conversationParticipants, user]
  );

  // Handle conversation selection and clear unread count
  const handleConversationSelect = (conversationId: string) => {
    setActiveId(conversationId);
    // Clear unread count for selected conversation
    setUnreadCounts((prev) => {
      const newCounts = { ...prev };
      delete newCounts[conversationId];
      return newCounts;
    });
  };

  // Fetch user information for participants
  const fetchParticipantUsers = React.useCallback(
    async (conversations: IConversation[]) => {
      const userIds = new Set<string>();

      // Collect user IDs from conversation participants
      for (const conversation of conversations) {
        if (conversation._id) {
          try {
            // Get participants for this conversation
            const participantsResponse = await getConversationParticipants(
              conversation._id
            );
            const participants = participantsResponse.participants;

            // Store participants for this conversation
            setConversationParticipants((prev) => ({
              ...prev,
              [conversation._id]: participants,
            }));

            // Collect user IDs (excluding current user)
            participants.forEach((participant) => {
              if (participant.userId !== user?._id) {
                userIds.add(participant.userId);
              }
            });
          } catch (error) {
            console.error(
              `Failed to fetch participants for conversation ${conversation._id}:`,
              error
            );
          }
        }
      }

      // Fetch user information for missing users
      const missingUserIds = Array.from(userIds).filter(
        (id) => !participantUsers[id]
      );

      if (missingUserIds.length > 0) {
        try {
          const userPromises = missingUserIds.map(async (userId) => {
            try {
              const userInfo = await getPublicUserById(userId);
              return { userId, userInfo } as {
                userId: string;
                userInfo: IUserPublic | null;
              };
            } catch (error) {
              console.error(`Failed to fetch user ${userId}:`, error);
              return { userId, userInfo: null } as {
                userId: string;
                userInfo: IUserPublic | null;
              };
            }
          });

          const results = await Promise.all(userPromises);
          const newUsers: Record<string, IUserPublic> = {};

          results.forEach(({ userId, userInfo }) => {
            if (userInfo) {
              newUsers[userId] = userInfo;
            }
          });

          if (Object.keys(newUsers).length > 0) {
            setParticipantUsers((prev) => ({ ...prev, ...newUsers }));
          }
        } catch (error) {
          console.error("Failed to fetch participant users:", error);
        }
      }
    },
    [participantUsers, user?._id]
  );

  // Identity/OTK bootstrap is handled centrally in AuthContext; avoid doing it here to prevent
  // identity churn and OTK mismatches across tabs/reloads.

  useEffect(() => {
    const load = async () => {
      try {
        const data = await listConversations();

        setConversations(data);

        // Fetch user information for participants
        await fetchParticipantUsers(data);

        if (!activeId && data.length > 0) {
          setActiveId(data[0]._id);
        }
      } catch {}
    };
    load();
    // pick up requested conversation id from sessionStorage (if any)
    if (typeof window !== "undefined") {
      const preset = sessionStorage.getItem("openConversationId");
      if (preset) {
        setActiveId(preset);
        sessionStorage.removeItem("openConversationId");
      }
    }
  }, [activeId, fetchParticipantUsers]);

  // Fetch participant users when conversations change
  useEffect(() => {
    if (conversations.length > 0) {
      fetchParticipantUsers(conversations);
    }
  }, [conversations, user?._id, fetchParticipantUsers]);

  useEffect(() => {
    if (!activeId) return;
    const load = async () => {
      try {
        const res: IPaginatedMessages = await listMessages(activeId, 1, 20);

        const items = [...res.items].reverse();

        // Decrypt messages loaded from API
        if (FEATURES.e2e_text_simple) {
          const client = SimpleE2EClient.getInstance();
          client.setUserId(user?._id || "");

          const decryptedItems = await Promise.all(
            items.map(async (msg) => {
              try {
                // Get participant IDs for key derivation
                const participants =
                  conversationParticipants[msg.conversationId];
                const participantIds = participants?.map((p) => p.userId) || [];

                const plaintext = await client.decrypt(
                  msg.conversationId,
                  {
                    ciphertext: msg.ciphertext,
                    nonce: msg.nonce || "",
                  },
                  participantIds
                );

                if (FEATURES.debug_messaging)
                  console.log(
                    "[Simple E2E] API message decryption successful:",
                    plaintext
                  );

                return { ...msg, plaintext } as IMessage;
              } catch (error) {
                if (FEATURES.debug_messaging)
                  console.warn(
                    "[Simple E2E] API message decryption failed:",
                    error
                  );
                return msg; // Return original message if decryption fails
              }
            })
          );

          setMessages(decryptedItems);
        } else {
          setMessages(items);
        }

        socket?.emit("conversation:join", activeId);
        await markConversationRead(activeId, new Date().toISOString());

        // Scroll to bottom after messages are loaded
        requestAnimationFrame(() => {
          listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
        });
      } catch {
        if (FEATURES.debug_messaging) console.error("Failed to load messages");
      }
    };
    load();
    return () => {
      if (activeId) socket?.emit("conversation:leave", activeId);
    };
  }, [
    activeId,
    socket,
    getOtherParticipantId,
    conversationParticipants,
    user?._id,
  ]);

  // Auto session init on conversation activation is disabled to avoid consuming OTKs prematurely.
  useEffect(() => {
    return;
  }, [activeId, getOtherParticipantId]);

  useEffect(() => {
    if (!socket) return;
    // Real-time: add newly created conversations to both ends via socket event
    interface IncomingConv {
      _id?: string;
      id?: string;
      type?: IConversation["type"];
      name?: string | null;
      participantIds?: string[];
      participants?: Array<{ userId: string }>;
      lastMessageAt?: string;
      createdAt?: string;
      updatedAt?: string;
    }
    const onConversationNew = (conv: IncomingConv) => {
      try {
        const id = conv?._id || conv?.id;
        if (!id) return;
        setConversations((prev) => {
          if (prev.some((c) => c._id === id)) return prev;
          const normalized = {
            _id: id,
            type: (conv?.type as IConversation["type"]) || "direct",
            name: conv?.name || undefined,
            participantIds: Array.isArray(conv?.participantIds)
              ? conv.participantIds
              : Array.isArray(conv?.participants)
              ? (conv.participants as Array<{ userId: string }>).map(
                  (p) => p.userId
                )
              : [],
            lastMessageAt: conv?.lastMessageAt || new Date().toISOString(),
            unreadCount: 0,
            createdAt: conv?.createdAt || new Date().toISOString(),
            updatedAt: conv?.updatedAt || new Date().toISOString(),
          } as IConversation;
          // Fetch participants for this conversation and cache users
          fetchParticipantUsers([normalized]).catch(() => {});
          // If no active conversation, set this as active
          setActiveId((cur) => cur || id);
          return [...prev, normalized];
        });
      } catch {}
    };

    socket.on("conversation:new", onConversationNew);
    socket.on("conversation:created", onConversationNew);
    const onNew = (msg: IMessage) => {
      // Update unread count for non-active conversations
      if (msg.conversationId !== activeId && msg.senderId !== user?._id) {
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.conversationId]: (prev[msg.conversationId] || 0) + 1,
        }));
      }

      if (msg.conversationId !== activeId) {
        if (FEATURES.debug_messaging)
          console.log("Message not for current conversation, ignoring");
        return;
      }

      (async () => {
        let displayMsg = msg;
        if (FEATURES.e2e_text_simple) {
          try {
            // Try to use cached plaintext for own messages first
            if (msg.senderId === user?._id) {
              const cached = outgoingPlainByCiphertextRef.current.get(
                msg.ciphertext
              );
              if (cached) {
                displayMsg = { ...msg, plaintext: cached } as IMessage;
                outgoingPlainByCiphertextRef.current.delete(msg.ciphertext);
                setMessages((prev) => {
                  const exists = prev.some((m) => m._id === msg._id);
                  if (exists) return prev;
                  return [...prev, displayMsg];
                });
                return;
              }
            }

            // Decrypt message using conversation key
            const client = SimpleE2EClient.getInstance();
            client.setUserId(user?._id || "");

            try {
              // Get participant IDs for key derivation
              const participants = conversationParticipants[msg.conversationId];
              const participantIds = participants?.map((p) => p.userId) || [];

              const plaintext = await client.decrypt(
                msg.conversationId,
                {
                  ciphertext: msg.ciphertext,
                  nonce: msg.nonce || "",
                },
                participantIds
              );

              if (FEATURES.debug_messaging)
                console.log(
                  "[Simple E2E] message decryption successful:",
                  plaintext
                );

              displayMsg = { ...msg, plaintext } as IMessage;
            } catch {
              if (FEATURES.debug_messaging)
                console.warn("[Simple E2E] message decryption failed");
              // Leave message as encrypted
            }
          } catch {
            console.warn("[E2E] decrypt incoming failed");
            // leave as-is
          }
        }
        setMessages((prev) => {
          if (FEATURES.debug_messaging) console.log("prev count:", prev.length);
          const exists = prev.some((m) => m._id === msg._id);
          if (exists) {
            if (FEATURES.debug_messaging) console.log("dup -> ignore");
            return prev;
          }
          const newMessages = [...prev, displayMsg];
          if (FEATURES.debug_messaging)
            console.log("new count:", newMessages.length);
          return newMessages;
        });
      })();

      // Fetch user information for the message sender if not already cached
      if (
        msg.senderId !== user?._id &&
        !participantUsersRef.current[msg.senderId]
      ) {
        if (FEATURES.debug_messaging)
          getPublicUserById(msg.senderId)
            .then((userInfo) => {
              setParticipantUsers((prev) => ({
                ...prev,
                [msg.senderId]: userInfo,
              }));
            })
            .catch(() => {});
      }

      // scroll to bottom on new
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
      });
    };
    socket.on("message:new", onNew);
    return () => {
      socket.off("conversation:new", onConversationNew);
      socket.off("conversation:created", onConversationNew);
      socket.off("message:new", onNew);
    };
  }, [socket, activeId, user?._id, getOtherParticipantId]);

  // Removed reload-resilience decrypt effect to avoid loops

  // Allow other pages to request opening a conversation
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string>;
      if (ce.detail) {
        setActiveId(ce.detail);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("openConversation", handler as EventListener);
      return () =>
        window.removeEventListener(
          "openConversation",
          handler as EventListener
        );
    }
  }, []);

  const activeConversation = useMemo(() => {
    const list = Array.isArray(conversations) ? conversations : [];
    return list.find((c) => c._id === activeId) || null;
  }, [conversations, activeId]);

  const handleSend = async () => {
    if (!activeId || !input.trim() || isSending) return;

    const messageText = input.trim();
    setInput(""); // Clear input immediately for better UX
    // Ensure typing stops when message is sent
    try {
      stopTyping();
    } catch {}
    setIsSending(true);

    // Bootstrap handled centrally in AuthContext; do not run here

    try {
      let ciphertextToSend = messageText;
      let nonceToSend: string | null = null;

      if (FEATURES.e2e_text_simple) {
        const client = SimpleE2EClient.getInstance();
        client.setUserId(user?._id || "");

        try {
          // Get participant IDs for key derivation
          const participants = conversationParticipants[activeId];
          const participantIds = participants?.map((p) => p.userId) || [];

          const enc = await client.encrypt(
            activeId,
            messageText,
            participantIds
          );
          ciphertextToSend = enc.ciphertext;
          nonceToSend = enc.nonce;

          // Store plaintext for own message display
          outgoingPlainByCiphertextRef.current.set(enc.ciphertext, messageText);

          if (FEATURES.debug_messaging) {
            console.log("[Simple E2E] Message encrypted successfully");
          }
        } catch (e) {
          console.warn("[Simple E2E] Encryption failed:", e);
          setIsSending(false);
          return;
        }
      }

      // Generate a random nonce for the message (Phase 1: simple random bytes)
      const nonce = btoa(
        String.fromCharCode(...crypto.getRandomValues(new Uint8Array(12)))
      );

      const payload = {
        conversationId: activeId,
        ciphertext: ciphertextToSend,
        nonce: nonceToSend || nonce,
        parentMessageId: null,
        attachments: [],
      };
      const saved = await sendMessage(payload);
      console.log("Message sent successfully");

      // Optimistically append own message locally so it appears immediately
      const ownMessage: IMessage = {
        ...saved,
        plaintext: messageText,
        senderId: user?._id || saved.senderId,
      } as IMessage;
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === ownMessage._id);
        if (exists) return prev;
        return [...prev, ownMessage];
      });
      // Scroll to bottom after appending
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
      });

      // Note: Server should handle socket emission, not client
      // socket?.emit("message:send", saved, () => {});
    } catch (e) {
      console.error("Failed to send message", e);
      // TODO: Add proper error handling UI
    } finally {
      setIsSending(false);
    }
  };

  // Generate avatar color based on conversation name or ID
  const getAvatarColor = (conversation: IConversation) => {
    const colors = [
      "var(--error)",
      "var(--primary)",
      "var(--tertiary)",
      "var(--secondary)",
      "var(--surface-variant)",
      "var(--outline)",
    ];
    const index =
      (conversation.name || conversation._id).charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get conversation display name
  const getConversationName = (conversation: IConversation) => {
    if (conversation.name) {
      return conversation.name;
    }

    // For direct conversations, use the participants data
    if (conversation.type === "direct" && user) {
      const participants = conversationParticipants[conversation._id];
      if (participants && participants.length > 0) {
        // Find the other participant (not the current user)
        const otherParticipant = participants.find(
          (participant) => participant.userId !== user._id
        );

        if (otherParticipant) {
          // Try to get the actual username from cached user data
          const otherUser = participantUsers[otherParticipant.userId];
          if (otherUser) {
            return otherUser.username;
          } else {
            // Fallback to ID-based name if user data not loaded yet
            const displayName = `User ${otherParticipant.userId.slice(-4)}`;
            return displayName;
          }
        }
      }
      return "Direct chat";
    }

    return "Direct chat";
  };

  // Get conversation initial
  const getConversationInitial = (conversation: IConversation) => {
    const name = getConversationName(conversation);
    return name.charAt(0).toUpperCase();
  };

  // Debug: Check if this is full-width mode
  const isFullWidth = className?.includes("!w-full");
  console.log(
    "MessagePanel className:",
    className,
    "isFullWidth:",
    isFullWidth
  );

  return (
    <aside className={`flex !h-full ${className || ""}`}>
      <div
        className={`flex h-full border overflow-hidden ${
          isFullWidth ? "" : "message-panel-container"
        }`}
        style={{
          background: "var(--surface)",
          boxSizing: "border-box",
          borderRadius: "0.75rem",
          ...(isFullWidth && {
            width: "100%",
            maxWidth: "none",
            minWidth: "0",
          }),
        }}>
        <ParticipantsList
          conversations={conversations}
          activeId={activeId}
          onSelect={handleConversationSelect}
          getAvatarColor={getAvatarColor}
          getConversationInitial={getConversationInitial}
          unreadCounts={unreadCounts}
          onlineUsers={onlineUsers}
          currentUserId={user?._id}
          participantsByConversation={conversationParticipants}
        />

        {/* Right Side - Chat Interface */}
        <div className="flex-1 flex flex-col relative min-w-0">
          {/* Top Part - Chat Header */}
          <ChatHeader
            activeConversation={activeConversation}
            getConversationName={getConversationName}
            getConversationInitial={getConversationInitial}
            getAvatarColor={getAvatarColor}
          />

          {/* Middle Part - Chat Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto">
            <MessagesList
              messages={messages}
              currentUserId={user?._id}
              onMessageVisible={(id) => markMessageAsRead(id)}
            />
          </div>

          {/* Floating typing indicator above the input, independent of scroll */}
          {typingUsers.length > 0 && (
            <div
              className="pointer-events-none absolute left-0 right-0"
              style={{
                bottom: "80px",
                display: "flex",
                justifyContent: "center",
                zIndex: 50,
              }}>
              <div className="pointer-events-auto">
                <TypingIndicator typingUsers={typingUsers} />
              </div>
            </div>
          )}

          {/* Bottom Part - Input Bar */}
          <BottomBar
            input={input}
            onInputChange={setInput}
            onSend={handleSend}
            isSending={isSending}
            onTypingStart={startTyping}
            onTypingStop={stopTyping}
          />
        </div>
      </div>
    </aside>
  );
};

export default MessagePanel;
