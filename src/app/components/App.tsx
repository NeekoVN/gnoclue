"use client";

import React from "react";
import Post from "./common/post";
import "../globals.css";
import "../styles/homePanel.css";

export default function App() {
  return (
    <div className="home-panel flex m-0 p-0 justify-center items-center !h-full !w-full bg-white">
      <Post />
    </div>
  );
}
