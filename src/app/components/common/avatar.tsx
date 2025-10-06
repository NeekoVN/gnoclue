import React from "react";
import Image from "next/image";
import { IUser, IUserPublic } from "../../types/user";

interface AvatarProps {
  // Optional image source. If not provided, will check user.avatar, then fall back to initials
  src?: string;
  // Fallback initial to render when no image is provided
  fallbackInitial?: string;
  // Provide a user object to auto-fill avatar (user.avatar), initial (user.username), and title
  user?: IUser | IUserPublic;
  // Accessible name/title
  alt?: string;
  // Size of the avatar. Accepts CSS length (e.g., "2.5rem", "40px"). Defaults to 2.5rem
  size?: string;
  // Background color when showing fallbackInitial
  backgroundColor?: string;
  // Text color for the fallbackInitial
  foregroundColor?: string;
  // Whether to show an outline/border around the avatar
  outline?: boolean;
  // Optional custom outline color
  outlineColor?: string;
  // Enable hover affordance (scale)
  hover?: boolean;
  // Click handler; when provided, the avatar shows pointer cursor
  onClick?: () => void;
  // Additional classes for layout integration
  className?: string;
  // Badge configuration
  badge?: {
    type: "online" | "offline" | "unread";
    count?: number; // For unread messages
    color?: string; // Custom badge color
  };
}

/**
 * Reusable user avatar component that supports image or initial fallback.
 * When a user object is provided, it will use the user's avatar field if available,
 * otherwise falls back to initials. The src prop takes precedence over user.avatar.
 * Now includes badge support for online status and unread message count.
 */
const Avatar: React.FC<AvatarProps> = ({
  src,
  fallbackInitial,
  user,
  alt,
  size = "2.5rem",
  backgroundColor = "var(--surface-variant)",
  foregroundColor = "var(--on-surface)",
  outline = false,
  outlineColor = "var(--outline)",
  hover = false,
  onClick,
  className,
  badge,
}) => {
  const computeFontSizeFromSize = (s: string): string => {
    const trimmed = (s || "").trim();
    if (trimmed.endsWith("px")) {
      const px = parseFloat(trimmed.replace("px", ""));
      return `${Math.max(10, Math.round(px * 0.4))}px`;
    }
    if (trimmed.endsWith("rem")) {
      const rem = parseFloat(trimmed.replace("rem", ""));
      return `${(rem * 0.4).toFixed(3)}rem`;
    }
    if (trimmed.endsWith("em")) {
      const em = parseFloat(trimmed.replace("em", ""));
      return `${(em * 0.4).toFixed(3)}em`;
    }
    return "1rem";
  };

  const getBadgeColor = (): string => {
    if (badge?.color) return badge.color;

    switch (badge?.type) {
      case "online":
        return "#10b981"; // Green for online
      case "offline":
        return "#6b7280"; // Gray for offline
      case "unread":
        return "#dc2626"; // Red for unread messages
      default:
        return "#dc2626";
    }
  };

  // Outer wrapper controls positioning and siblings (badge)
  const outerStyle: React.CSSProperties = {
    width: size,
    height: size,
    position: "relative",
    display: "inline-block",
  };

  // Inner content wrapper (2nd outermost) wraps the actual avatar content
  const contentStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    borderRadius: "9999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: backgroundColor,
    border: outline ? `2px solid ${outlineColor}` : undefined,
    boxSizing: "border-box",
    overflow: "hidden",
  };

  const interactiveClasses = [
    hover ? "transition-transform hover:scale-110" : "",
    onClick ? "cursor-pointer" : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  const resolvedAlt = alt || (user ? user.username : undefined) || "avatar";
  const resolvedInitial = (
    fallbackInitial ||
    (user ? user.username?.[0] : undefined) ||
    "?"
  ).toUpperCase();

  // Use user's avatar if available, otherwise fall back to provided src or initials
  const resolvedSrc = user?.avatar || src;

  const renderBadge = () => {
    if (!badge) return null;

    const badgeColor = getBadgeColor();

    // Derive a badge size from avatar size (approx 30%) with sensible bounds
    const numericFromSize = (val: string): number | undefined => {
      const trimmed = (val || "").trim();
      if (trimmed.endsWith("px")) return parseFloat(trimmed);
      if (trimmed.endsWith("rem")) return parseFloat(trimmed) * 16;
      if (trimmed.endsWith("em")) return parseFloat(trimmed) * 16;
      const n = parseFloat(trimmed);
      return isNaN(n) ? undefined : n;
    };
    const basePx = numericFromSize(size) ?? 40;
    const badgePx = Math.max(10, Math.min(18, Math.round(basePx * 0.3)));

    const baseStyle: React.CSSProperties = {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: `${badgePx}px`,
      height: `${badgePx}px`,
      backgroundColor: badgeColor,
      borderRadius: "9999px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "2px solid var(--surface)",
      boxSizing: "border-box",
      lineHeight: 1,
      fontWeight: "bold",
      color: "#fff",
      fontSize: `${Math.max(9, Math.round(badgePx * 0.6))}px`,
      pointerEvents: "none",
    };

    if (badge.type === "unread" && badge.count) {
      const displayCount = badge.count > 99 ? "99+" : badge.count.toString();
      return <div style={{ ...baseStyle, border: "none" }}>{displayCount}</div>;
    }

    return <div style={baseStyle} />;
  };

  return (
    <div
      style={outerStyle}
      className={interactiveClasses}
      onClick={onClick}
      title={resolvedAlt}
    >
      <div style={contentStyle}>
        {resolvedSrc ? (
          <Image
            src={resolvedSrc}
            alt={resolvedAlt}
            fill
            sizes="42px"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <span
            style={{
              color: foregroundColor,
              fontWeight: "bold",
              fontSize: computeFontSizeFromSize(size),
            }}
            title={resolvedAlt}
          >
            {resolvedInitial}
          </span>
        )}
      </div>
      {renderBadge()}
    </div>
  );
};

export default Avatar;
