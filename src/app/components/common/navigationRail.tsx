"use client";

import React from "react";
import dynamic from "next/dynamic";

const NavigationRail: React.FC = () => {
  return (
    <nav className="left">
      <button className="square round extra fill" data-ui="#post-form-dialog">
        <i>add</i>
      </button>
      <a>
        <i>home</i>
        <span>Home</span>
      </a>
      <a>
        <i>notifications</i>
        <div className="badge">1</div>
        <span>Notifs</span>
      </a>
      <a>
        <i>bookmark</i>
        <span>Saved</span>
      </a>
      <a>
        <i>folder</i>
        <span>My Feeds</span>
      </a>
    </nav>
  );
};

export default dynamic(() => Promise.resolve(NavigationRail), { ssr: false });
