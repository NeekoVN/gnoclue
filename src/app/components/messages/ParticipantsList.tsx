"use client";

import React from "react";
import { IConversation } from "../../types/messaging";
import Avatar from "../common/avatar";

interface ParticipantsListProps {
  conversations: IConversation[];
  activeId: string | null;
  onSelect: (conversationId: string) => void;
  getAvatarColor: (conversation: IConversation) => string;
  getConversationInitial: (conversation: IConversation) => string;
  // New props for badge functionality
  unreadCounts?: Record<string, number>; // Conversation ID -> unread count
  onlineUsers?: Set<string>; // Set of online user IDs
  currentUserId?: string; // Exclude self from presence calculation
  participantsByConversation?: Record<string, Array<{ userId: string }>>; // Optional fallback
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({
  conversations,
  onSelect,
  getAvatarColor,
  getConversationInitial,
  unreadCounts = {},
  onlineUsers = new Set(),
  currentUserId,
  participantsByConversation = {},
}) => {
  const getBadgeForConversation = (conversation: IConversation) => {
    // Priority 1: Check for unread count first (highest priority)
    const unreadCount = unreadCounts[conversation._id];
    if (unreadCount && unreadCount > 0) {
      return {
        type: "unread" as const,
        count: unreadCount,
      };
    }

    // Priority 2: Check for online/offline status
    let participantIds = (conversation.participantIds || []).filter(
      (id) => !currentUserId || id !== currentUserId
    );
    if (
      participantIds.length === 0 &&
      participantsByConversation[conversation._id]
    ) {
      participantIds = participantsByConversation[conversation._id]
        .map((p) => p.userId)
        .filter((id) => !currentUserId || id !== currentUserId);
    }
    // If participantIds is missing, try to infer from conversation name structure (fallback)
    // Otherwise rely on unreadCount > 0 to still show badge
    const hasOnlineParticipant = participantIds.some((id) =>
      onlineUsers.has(id)
    );
    // Debug presence matching
    try {
      console.debug(
        "[Presence] conv=",
        conversation._id,
        "participants=",
        participantIds,
        "online=",
        Array.from(onlineUsers),
        "hasOnline=",
        hasOnlineParticipant
      );
    } catch {}

    // Presence badge is always shown: online if any participant online, else offline
    return hasOnlineParticipant
      ? { type: "online" as const }
      : { type: "offline" as const };
  };

  return (
    <div
      className="w-16 min-w-16 flex flex-col"
      style={{
        backgroundColor: "var(--surface-variant)",
        borderTopLeftRadius: "0.75rem",
        borderBottomLeftRadius: "0.75rem",
        borderTopRightRadius: "0",
        borderBottomRightRadius: "0",
      }}>
      <div className="flex-1 flex flex-col items-center !py-4 !pt-3 !space-y-3 overflow-y-auto">
        {(Array.isArray(conversations) ? conversations : []).map(
          (conversation) => {
            // Add safety check for conversation object
            if (!conversation || !conversation._id) {
              return null;
            }

            const badge = getBadgeForConversation(conversation);

            return (
              <Avatar
                key={conversation._id}
                fallbackInitial={getConversationInitial(conversation) || "?"}
                size="38px"
                backgroundColor={getAvatarColor(conversation)}
                hover
                onClick={() => onSelect(conversation._id)}
                alt={conversation.name || conversation._id}
                badge={badge}
              />
            );
          }
        )}
      </div>
    </div>
  );
};

export default ParticipantsList;
