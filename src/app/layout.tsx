"use client";

import React from "react";
import "beercss";
import "material-dynamic-colors";
import "./globals.css";
import NavigationRail from "./components/common/navigationRail";
import TopAppBar from "./components/common/topAppBar";
import PostFormDialog from "./components/postFormDialog";
import SocketStatus from "./components/common/socketStatus";
import { usePathname } from "next/navigation";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import AuthGuard from "./components/AuthGuard";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const asAuthPage = pathname === "/signin" || pathname === "/signup";

  return (
    <html lang="en" className="h-full w-full">
      <head></head>
      <body
        className="m-0 p-0 h-full w-full light overflow-hidden"
        suppressHydrationWarning={true}>
        <AuthProvider>
          <SocketProvider>
            <AuthGuard>
              {!asAuthPage && <NavigationRail />}
              {!asAuthPage && <TopAppBar />}
              {!asAuthPage && <PostFormDialog />}
              <main
                className={`!pl-0 !max-w-full ${asAuthPage ? "!p-0" : ""}`}
                style={{ width: "100%", minWidth: "100%" }}>
                {children}
              </main>
              <SocketStatus />
            </AuthGuard>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
