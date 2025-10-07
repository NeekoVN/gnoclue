/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import Avatar from "./avatar";

const TopAppBar: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleAvatarClick = () => {
    setShowMenu(!showMenu);
  };

  const handleProfileClick = () => {
    if (user?._id) {
      router.push(`/users/${user._id}`);
    }
    setShowMenu(false);
  };

  const handleSettingsClick = () => {
    router.push("/settings");
    setShowMenu(false);
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn("Sign out encountered an error", e);
    }
    setShowMenu(false);
  };

  return (
    <header style={{ backgroundColor: "var(--surface)" }} className="!px-2">
      <nav className="transparent !justify-between">
        <img
          src="/full-logo.svg"
          alt="logo"
          width={130}
          height={30}
          className="!p-2"
          style={{
            backgroundColor: "var(--primary-container)",
            cursor: "pointer",
            borderRadius: "67rem",
          }}
          onClick={() => router.push("/")}
        />
        <div
          className="field center-align max medium prefix round fill active min-w-[200px] max-w-[600px] w-full"
          data-ui="#search"
        >
          <i className="front">search</i>
          <input placeholder="Search" />
          <menu className="min !rounded-3xl" id="search">
            <li>
              <div className="field large prefix">
                <i className="front">arrow_back</i>
                <input />
              </div>
            </li>
            <li>
              <i>history</i>
              <div>Item 1</div>
            </li>
            <li>
              <i>history</i>
              <div>Item 2</div>
            </li>
            <li>
              <i>history</i>
              <div>Item 3</div>
            </li>
          </menu>
        </div>

        <nav className={`min ${showMenu ? "active" : ""}`}>
          <Avatar
            user={user || undefined}
            size="2.5rem"
            onClick={handleAvatarClick}
            className="extra circle"
          />
          <menu
            className={`bottom transparent no-wrap left right-align ${
              showMenu ? "active" : ""
            }`}
          >
            <li>
              <button className="fill" onClick={handleProfileClick}>
                <i>person</i>
                <span>Profile</span>
              </button>
            </li>
            <li>
              <button className="fill" onClick={handleSettingsClick}>
                <i>settings</i>
                <span>Settings</span>
              </button>
            </li>
            <li className="block md:hidden">
              <button className="fill" onClick={handleSignOut}>
                <i>logout</i>
                <span>Sign out</span>
              </button>
            </li>
          </menu>
        </nav>
      </nav>
    </header>
  );
};

export default TopAppBar;
