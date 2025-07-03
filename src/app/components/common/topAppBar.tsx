/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useAuth } from "../../contexts/AuthContext";

const TopAppBar: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    console.log("Logging out user...");
    logout();
  };

  return (
    <header style={{ backgroundColor: "var(--surface)" }} className="!px-0">
      <nav className="top transparent !justify-between">
        <img
          src="/full-logo.svg"
          alt="logo"
          width={130}
          height={30}
          className="!p-2 rounded-lg"
          style={{ backgroundColor: "var(--primary-container)" }}
        />
        <div
          className="field center-align max medium prefix round fill active min-w-[200px] max-w-[600px] w-full"
          data-ui="#search">
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

        <button
          className="circle large transparent center-align"
          onClick={handleLogout}
          style={{ backgroundColor: "var(--primary-container)" }}>
          <span
            style={{
              color: "var(--primary)",
              fontWeight: "bold",
              fontSize: "1.2rem",
            }}>
            U
          </span>
        </button>
      </nav>
    </header>
  );
};

export default dynamic(() => Promise.resolve(TopAppBar), { ssr: false });
