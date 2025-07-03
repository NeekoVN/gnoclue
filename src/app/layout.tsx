"use client";

import React from "react";
import "beercss";
import "material-dynamic-colors";
import "./globals.css";
import NavigationRail from "./components/common/navigationRail";
import TopAppBar from "./components/common/topAppBar";
import PostFormDialog from "./components/postFormDialog";
import { usePathname } from "next/navigation";
import { AuthProvider } from "./contexts/AuthContext";

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
          {!asAuthPage && <NavigationRail />}
          {!asAuthPage && <TopAppBar />}
          {!asAuthPage && <PostFormDialog />}
          <main
            className={`responsive !pl-0 !max-w-full ${
              asAuthPage ? "!p-0" : ""
            }`}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
