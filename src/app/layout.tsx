"use client";

import React from "react";
import "beercss";
import "material-dynamic-colors";
import "./globals.css";
import NavigationRail from "./components/common/navigationRail";
import BottomNavbar from "./components/common/bottomNavbar";
import TopAppBar from "./components/common/topAppBar";
import PostFormDialog from "./components/postFormDialog";
import SocketStatus from "./components/common/socketStatus";
import { usePathname } from "next/navigation";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import AuthGuard from "./components/AuthGuard";
import MessagePanel from "./components/messages/MessagePanel";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const asAuthPage = pathname === "/signin" || pathname === "/signup";
  const [navbarHidden, setNavbarHidden] = React.useState(false);

  // Dynamically apply Tailwind class when bottom navbar is hidden
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 601px)");
    const apply = (e: MediaQueryList | MediaQueryListEvent) =>
      setNavbarHidden(
        !!(e as MediaQueryList).matches ||
          (e as MediaQueryListEvent).matches === true
      );
    apply(mql);
    const handler = (e: MediaQueryListEvent) => apply(e);
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    } else {
      // Safari fallback
      mql.addListener(handler);
      return () => mql.removeListener(handler);
    }
  }, []);

  return (
    <html lang="en" className="h-full w-full">
      <head></head>
      <body
        className="!m-0 !p-0 h-dvh !w-full light !overflow-hidden"
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <SocketProvider>
            <AuthGuard>
              <div className="!flex h-dvh !w-full">
                {!asAuthPage && <NavigationRail />}
                <div className="!flex !flex-col !flex-1 !min-w-0">
                  {!asAuthPage && <TopAppBar />}
                  {!asAuthPage && <PostFormDialog />}
                  <div className="!flex-1 !min-h-0">
                    <div
                      className={`!flex !h-full !w-full !gap-2 !p-2 !pt-0 ${
                        navbarHidden ? "!pl-0" : ""
                      }`}
                    >
                      <div className="!flex-1 !min-w-0 !h-full">
                        <div className="!h-full !overflow-hidden">
                          {children}
                        </div>
                      </div>
                      {!asAuthPage &&
                        pathname !== "/messages" &&
                        pathname !== "/settings" && (
                          <div className="hidden xl:!flex !shrink-0 !h-full">
                            <MessagePanel />
                          </div>
                        )}
                    </div>
                  </div>
                  {!asAuthPage && (
                    <div className="pb-safe">
                      <BottomNavbar />
                    </div>
                  )}
                </div>
              </div>
              {false && <SocketStatus />}
            </AuthGuard>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
