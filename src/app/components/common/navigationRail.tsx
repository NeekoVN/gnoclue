"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

const NavigationRail: React.FC = () => {
  const [isMax, setIsMax] = useState(false);

  const toggleMax = () => {
    setIsMax(!isMax);
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
      <a>
        <i>home</i>
        <span>Home</span>
      </a>
      <a>
        <i>
          notifications
          <div className="badge">1</div>
        </i>
        <span>Notifs</span>
      </a>
      <a>
        <i>bookmark</i>
        <span>Saved</span>
      </a>
      <a>
        <i>folder</i>
        <span>Feeds</span>
      </a>
    </nav>
  );
};

export default dynamic(() => Promise.resolve(NavigationRail), { ssr: false });
