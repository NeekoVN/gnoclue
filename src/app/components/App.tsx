"use client";

import React from "react";
import Feed from "./feed";
import "../globals.css";
import "../styles/homePanel.css";

export default function App({ children }: { children?: React.ReactNode }) {
  return (
    <div className="home-panel !bg-white !h-full !border !w-full">
      <div className="!h-full !w-full !overflow-y-auto">
        {children ?? <Feed />}
      </div>
    </div>
  );
}
