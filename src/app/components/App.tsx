"use client";

import React from "react";
import Feed from "./feed";
import "../globals.css";
import "../styles/homePanel.css";

export default function App() {
  return (
    <div className="home-panel flex m-0 p-0 justify-center items-start !h-full !w-full bg-white">
      <div className="w-full h-full">
        <Feed />
      </div>
    </div>
  );
}
