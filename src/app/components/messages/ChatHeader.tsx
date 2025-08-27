"use client";

import React from "react";
import { IConversation } from "../../types/messaging";
import Avatar from "../common/avatar";

interface ChatHeaderProps {
  activeConversation: IConversation | null;
  getConversationName: (conversation: IConversation) => string;
  getConversationInitial: (conversation: IConversation) => string;
  getAvatarColor: (conversation: IConversation) => string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeConversation,
  getConversationName,
  getConversationInitial,
  getAvatarColor,
}) => {
  return (
    <div
      className="!p-2 flex items-center justify-between"
      style={{
        backgroundColor: "var(--surface-variant)",
        borderTopRightRadius: "0.75rem",
        borderTopLeftRadius: "0",
        borderBottomLeftRadius: "0",
        borderBottomRightRadius: "0",
      }}>
      <div className="flex items-center gap-4">
        {activeConversation && (
          <Avatar
            fallbackInitial={getConversationInitial(activeConversation)}
            size="38px"
            backgroundColor={getAvatarColor(activeConversation)}
          />
        )}
        <div className="min-w-0 flex-1">
          <div
            className="font-medium truncate"
            style={{ color: "var(--on-surface)" }}>
            {activeConversation
              ? getConversationName(activeConversation)
              : "Select a conversation"}
          </div>
          <div
            className="text-sm truncate"
            style={{ color: "var(--on-surface-variant)" }}>
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
