/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import dynamic from "next/dynamic";
import { removeAuthCookie } from "../../utils/auth";
import { useRouter } from "next/navigation";

const TopAppBar: React.FC = () => {
  const router = useRouter();

  const handleLogout = () => {
    console.log("Logging out user...");
    removeAuthCookie();
    console.log("Auth cookie removed, redirecting to signin");
    router.push("/signin");
  };

  return (
    <header style={{ backgroundColor: "var(--surface)" }}>
      <nav>
        <img
          src="/full-logo.svg"
          alt="logo"
          width={130}
          height={30}
          className="!p-2 rounded-lg"
          style={{ backgroundColor: "var(--primary-container)" }}
        />
        <div
          className="field center-align max !mx-40 medium prefix round fill active"
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

        <button className="circle large transparent" onClick={handleLogout}>
          <img className="responsive" src="/favicon.png" alt="avatar" />
        </button>
      </nav>
    </header>
  );
};

export default dynamic(() => Promise.resolve(TopAppBar), { ssr: false });
