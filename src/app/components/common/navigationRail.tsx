"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";

const NavigationRail: React.FC = () => {
  const [isMax, setIsMax] = useState(false);

  const toggleMax = () => {
    setIsMax(!isMax);
  };

  const { logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn("Sign out encountered an error", e);
    }
  };

  return (
    <nav className={`m l left ${isMax ? "max" : ""}`}>
      <header>
        <button className="extra circle transparent" onClick={toggleMax}>
          <i>{isMax ? "menu_open" : "menu"}</i>
        </button>
        <button className="extend square round" data-ui="#post-form-dialog">
          <i>add</i>
          <span>Add Post</span>
        </button>
      </header>
      <Link href="/">
        <i>home</i>
        <span>Home</span>
      </Link>
      <Link href="/saved">
        <i>bookmark</i>
        <span>Saved</span>
      </Link>
      <Link href="/feeds">
        <i>folder</i>
        <span>Feeds</span>
      </Link>
      {/* TODO: actually hide the button on large screen */}
      <Link href="/messages" className="block 2xl:hidden">
        <i>chat</i>
        <span>Chat</span>
      </Link>
      <div style={{ flex: 1 }}></div>
      <button className="transparent vertical" onClick={handleSignOut}>
        <i>logout</i>
        <span>Sign out</span>
      </button>
    </nav>
  );
};

export default NavigationRail;
