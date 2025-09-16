"use client";

import React, { useState, useEffect } from "react";
import { ITypingIndicator } from "../../types/messaging";

interface TypingIndicatorProps {
  typingUsers: ITypingIndicator[];
  className?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (typingUsers.length > 0) {
      setShouldRender(true);
      // Small delay to ensure DOM element is rendered before fade in
      const fadeInTimer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(fadeInTimer);
    } else {
      setIsVisible(false);
      // Wait for fade out animation to complete before removing from DOM
      const fadeOutTimer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(fadeOutTimer);
    }
  }, [typingUsers.length]);

  if (!shouldRender) return null;

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
        opacity: isVisible ? 1 : 0,
        transition: "opacity 200ms ease-in-out",
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
