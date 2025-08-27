"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  getToolbarRadius,
  cornerRadiusToCSS,
  getTransitionDuration,
} from "../../utils/cornerRadius";

interface BottomBarProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isSending?: boolean;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

const BottomBar: React.FC<BottomBarProps> = ({
  input,
  onInputChange,
  onSend,
  isSending = false,
  onTypingStart,
  onTypingStop,
}) => {
  const [isSendActive, setIsSendActive] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const [toolbarHeight, setToolbarHeight] = useState(64); // Default height
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate corner radius based on current state
  const cornerRadius = getToolbarRadius(toolbarHeight, isSendActive);
  const borderRadiusCSS = cornerRadiusToCSS(cornerRadius);

  // Update toolbar height when component mounts
  useEffect(() => {
    if (navRef.current) {
      const height = navRef.current.offsetHeight;
      setToolbarHeight(height);
    }
  }, []);

  const handleSendClick = () => {
    // Ensure typing indicator stops when sending
    onTypingStop?.();
    onSend();
  };

  const handleSendMouseDown = () => {
    setIsSendActive(true);
  };

  const handleSendMouseUp = () => {
    setIsSendActive(false);
  };

  return (
    <nav
      ref={navRef}
      className="toolbar tertiary-container !m-2 !flex !items-center !gap-2"
      style={{
        padding: "12px",
        borderRadius: borderRadiusCSS,
        transition: `border-radius ${getTransitionDuration(
          getToolbarRadius(toolbarHeight, false),
          getToolbarRadius(toolbarHeight, true)
        )}ms ease`,
      }}>
      <button
        className="!flex-shrink-0 circle"
        style={{
          backgroundColor: "var(--tertiary-container)",
          color: "var(--on-tertiary-container)",
        }}>
        <i className="fill tertiary-text">add_photo_alternate</i>
      </button>
      <div
        className="field round fill !flex-1 !min-w-0"
        style={{ height: "40px" }}>
        <input
          type="text"
          placeholder="Type here"
          value={input}
          onChange={(e) => {
            onInputChange(e.target.value);

            // Typing indicator stays ON while there is text; OFF when cleared
            const hasText = e.target.value.length > 0;
            if (hasText) {
              onTypingStart?.();
            } else {
              onTypingStop?.();
            }

            // Clear any previous timers; no inactivity timeout behavior
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = null;
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendClick();
            }
          }}
          style={{
            backgroundColor: "var(--surface)",
            color: "var(--on-surface)",
            border: "none",
            outline: "none",
            width: "100%",
            padding: "0.5rem 1rem",
            borderRadius: "9999px",
            boxShadow: "none",
          }}
        />
      </div>
      <button
        onClick={handleSendClick}
        onMouseDown={handleSendMouseDown}
        onMouseUp={handleSendMouseUp}
        onMouseLeave={handleSendMouseUp}
        disabled={isSending}
        className="!flex-shrink-0 tertiary"
        style={{
          opacity: isSending ? 0.6 : 1,
          cursor: isSending ? "not-allowed" : "pointer",
        }}>
        <i className="fill">{isSending ? "schedule" : "send"}</i>
      </button>
    </nav>
  );
};

export default BottomBar;
