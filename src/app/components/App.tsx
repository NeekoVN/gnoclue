"use client";

import React from "react";
import Feed from "./feed";
import "../globals.css";
import "../styles/homePanel.css";

export default function App({ children }: { children?: React.ReactNode }) {
  return (
    <div
      className="home-panel !h-full !border !w-full"
      style={{ backgroundColor: "var(--surface-container-lowest)" }}
    >
      <div className="!h-full !w-full !overflow-y-auto">
        {children ?? <Feed />}
      </div>
    </div>
  );
}
