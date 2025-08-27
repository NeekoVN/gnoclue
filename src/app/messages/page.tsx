"use client";

import React from "react";
import { useAuth } from "../contexts/AuthContext";
import MessagePanel from "../components/messages/MessagePanel";

export default function MessagesPage() {
  const { isAuthenticated, loading } = useAuth();
  if (loading && !isAuthenticated) return <div>Loading...</div>;
  if (!isAuthenticated) return null;
  return (
    <div className="w-full h-full">
      <MessagePanel className="!w-full" />
    </div>
  );
}
