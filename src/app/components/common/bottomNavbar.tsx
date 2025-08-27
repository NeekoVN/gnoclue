"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BottomNavbar: React.FC = () => {
  const pathname = usePathname();

  return (
    <div className="bottom-navbar !bottom-0 !left-0 !right-0 !mx-2 !mb-2">
      <nav className="center-align !flex !items-center !gap-2">
        <nav className="tabbed !flex-1">
          <Link href="/" className={pathname === "/" ? "active" : ""}>
            <i>home</i>
            <span>Home</span>
          </Link>
          <a>
            <i>notifications</i>
            <span>Alerts</span>
          </a>
          <a>
            <i>bookmark</i>
            <span>Saved</span>
          </a>
          <a>
            <i>folder</i>
            <span>Feeds</span>
          </a>
          <Link
            href="/messages"
            className={pathname === "/messages" ? "active" : ""}>
            <i>chat</i>
            <span>Chat</span>
          </Link>
        </nav>
        <button className="extra square round" data-ui="#post-form-dialog">
          <i>add</i>
        </button>
      </nav>
    </div>
  );
};

export default BottomNavbar;
