"use client";

import React from "react";
import { useAuth } from "../contexts/AuthContext";

export default function SettingsPage() {
  const { isAuthenticated, loading } = useAuth();

  if (loading && !isAuthenticated) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  return (
    <aside className="flex !h-full">
      <div
        className="flex h-full border overflow-hidden"
        style={{
          background: "var(--surface-container-lowest)",
          boxSizing: "border-box",
          borderRadius: "0.75rem",
          width: "100%",
          maxWidth: "none",
          minWidth: "0",
        }}
      >
        a
      </div>
    </aside>
  );
}
