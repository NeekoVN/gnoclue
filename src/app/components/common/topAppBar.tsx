/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

const TopAppBar: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [navbarVisible, setNavbarVisible] = React.useState<boolean>(false);

  // Dynamically add Tailwind padding when bottom navbar is visible (<601px)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 601px)");
    const update = (matches: boolean) => setNavbarVisible(!matches);
    update(mql.matches);
    const handler = (e: MediaQueryListEvent) => update(e.matches);
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    } else {
      // Safari fallback
      mql.addListener(handler);
      return () => mql.removeListener(handler);
    }
  }, []);

  const handleProfileClick = () => {
    if (user?._id) {
      console.log("Navigating to user profile...");
      router.push(`/users/${user._id}`);
    }
  };

  return (
    <header
      style={{ backgroundColor: "var(--surface)" }}
      className={navbarVisible ? "!px-2" : "!px-0"}>
      <nav className="transparent !justify-between">
        <img
          src="/full-logo.svg"
          alt="logo"
          width={130}
          height={30}
          className="!p-2 rounded-lg"
          style={{
            backgroundColor: "var(--primary-container)",
            cursor: "pointer",
          }}
          onClick={() => router.push("/")}
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
          className="large primary center-align"
          onClick={handleProfileClick}
          style={{ backgroundColor: "var(--primary-container)" }}>
          <span
            style={{
              color: "var(--on-primary)",
              fontWeight: "bold",
              fontSize: "1.2rem",
            }}>
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </span>
        </button>
      </nav>
    </header>
  );
};

export default TopAppBar;
