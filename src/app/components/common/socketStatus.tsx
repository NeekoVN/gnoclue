"use client";

import React from "react";
import { useSocket } from "../../contexts/SocketContext";

const SocketStatus: React.FC = () => {
  const { socket, isConnected } = useSocket();

  const testSocketEvent = () => {
    if (socket?.connected) {
      console.log("Testing socket event emission");
      socket.emit("test_event", {
        message: "Test from client",
        timestamp: Date.now(),
      });
    }
  };

  if (process.env.NODE_ENV === "development") {
    return (
      <div
        className="fixed bottom-4 right-4 z-50 p-2 rounded-lg text-xs"
        style={{
          backgroundColor: isConnected ? "var(--success)" : "var(--error)",
          color: "white",
        }}>
        {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
        {socket && (
          <div className="mt-1 text-xs opacity-75">
            ID: {socket.id || "N/A"}
          </div>
        )}
        {isConnected && (
          <button
            onClick={testSocketEvent}
            className="mt-1 px-2 py-1 bg-blue-500 text-white rounded text-xs">
            Test Socket
          </button>
        )}
      </div>
    );
  }

  return null;
};

export default SocketStatus;
