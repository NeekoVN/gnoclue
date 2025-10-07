"use client";

import React from "react";
import { IConversation } from "../../types/messaging";
import { IUserPublic } from "../../types/user";
import { IConversationParticipant } from "../../services/messaging";
import Avatar from "../common/avatar";

interface ChatHeaderProps {
  activeConversation: IConversation | null;
  getConversationName: (conversation: IConversation) => string;
  getConversationInitial: (conversation: IConversation) => string;
  getAvatarColor: (conversation: IConversation) => string;
  participantUsers?: Record<string, IUserPublic>;
  currentUserId?: string;
  conversationParticipants?: Record<string, IConversationParticipant[]>;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeConversation,
  getConversationName,
  getConversationInitial,
  getAvatarColor,
  participantUsers = {},
  currentUserId,
  conversationParticipants = {},
}) => {
  // Get the user object for the active conversation (for direct chats)
  const getConversationUser = (
    conversation: IConversation
  ): IUserPublic | undefined => {
    if (conversation.type === "direct" && currentUserId) {
      const participants = conversationParticipants[conversation._id];
      if (participants && participants.length > 0) {
        const otherParticipant = participants.find(
          (participant) => participant.userId !== currentUserId
        );
        if (otherParticipant) {
          return participantUsers[otherParticipant.userId] || undefined;
        }
      }
    }
    return undefined;
  };

  const conversationUser = activeConversation
    ? getConversationUser(activeConversation)
    : undefined;
  return (
    <div
      className="!p-2 flex items-center justify-between"
      style={{
        backgroundColor: "var(--surface-variant)",
        borderTopRightRadius: "0.75rem",
        borderTopLeftRadius: "0",
        borderBottomLeftRadius: "0",
        borderBottomRightRadius: "0",
      }}
    >
      <div className="flex items-center gap-4">
        {activeConversation && (
          <Avatar
            user={conversationUser}
            fallbackInitial={
              conversationUser
                ? undefined
                : getConversationInitial(activeConversation)
            }
            size="38px"
            backgroundColor={
              conversationUser ? undefined : getAvatarColor(activeConversation)
            }
            alt={
              conversationUser
                ? conversationUser.username
                : getConversationName(activeConversation)
            }
          />
        )}
        <div className="min-w-0 flex-1">
          <div
            className="font-medium truncate"
            style={{ color: "var(--on-surface)" }}
          >
            {activeConversation
              ? getConversationName(activeConversation)
              : "Select a conversation"}
          </div>
          <div
            className="text-sm truncate"
            style={{ color: "var(--on-surface-variant)" }}
          >
            E2E Encrypted
          </div>
        </div>
      </div>
      <button className="border circle !mx-1">
        <i>more_horiz</i>
      </button>
    </div>
  );
};

export default ChatHeader;
