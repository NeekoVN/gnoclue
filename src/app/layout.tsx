'use client';

import React from 'react';
import 'mdui/mdui.css';
import './globals.css';
import NavigationRail from './components/common/navigationRail';
import TopAppBar from './components/common/topAppBar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
        <head>
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet" />
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Sharp" rel="stylesheet" />
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Two+Tone" rel="stylesheet" />
        </head>
        <body className="m-0 p-0">
            <mdui-layout className="h-screen w-screen relative overflow-hidden">
              <TopAppBar/>
              <NavigationRail/>
              <mdui-layout-main>
                {children}
              </mdui-layout-main>
            </mdui-layout>
        </body>
    </html>
  );
} 