"use client";

import React from "react";
import { ITypingIndicator } from "../../types/messaging";

interface TypingIndicatorProps {
  typingUsers: ITypingIndicator[];
  className?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  className = "",
}) => {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`;
    } else {
      return `${typingUsers[0].username} and ${
        typingUsers.length - 1
      } others are typing...`;
    }
  };

  return (
    <div
      className={`flex round border primary-container primary-border items-center gap-2 !px-5 !py-2 !my-1 !mx-1 ${className}`}
      style={{
        maxWidth: "fit-content",
      }}>
      {/* Animated dots */}
      <div className="flex gap-1">
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{
            backgroundColor: "var(--on-primary-container)",
            animationDelay: "0ms",
          }}
        />
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{
            backgroundColor: "var(--on-primary-container)",
            animationDelay: "150ms",
          }}
        />
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{
            backgroundColor: "var(--on-primary-container)",
            animationDelay: "300ms",
          }}
        />
      </div>

      {/* Typing text */}
      <span
        className="text-sm"
        style={{ color: "var(--on-primary-container)" }}>
        {getTypingText()}
      </span>
    </div>
  );
};

export default TypingIndicator;
