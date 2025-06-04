"use client";

import React from "react";
import "beercss";
import "material-dynamic-colors";
import "./globals.css";
import NavigationRail from "./components/common/navigationRail";
import TopAppBar from "./components/common/topAppBar";
import PostFormDialog from "./components/postFormDialog";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const asAuthPage = pathname === "/signin" || pathname === "/signup";

  // If it's an auth page, render without navigation
  if (asAuthPage) {
    return (
      <html lang="en" className="h-full w-full">
        <head></head>
        <body className="m-0 p-0 h-full w-full light">{children}</body>
      </html>
    );
  }

  return (
    <html lang="en" className="h-full w-full">
      <head></head>
      <body className="m-0 p-0 h-full w-full light">
        <NavigationRail /> {/* This is fixed-positioned */}
        <PostFormDialog />
        <div className="flex flex-col !h-full" style={{ marginLeft: "80px" }}>
          <header className="transparent !p-0">
            <TopAppBar />
          </header>
          <main className="!flex-1 !p-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
