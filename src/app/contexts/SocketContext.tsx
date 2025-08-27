"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const connectingRef = useRef<boolean>(false);

  const connect = () => {
    if (!token || !isAuthenticated || connectingRef.current) return;

    connectingRef.current = true;

    // Use the same host as the current page for Socket.IO connection
    const protocol =
      typeof window !== "undefined" ? window.location.protocol : "http:";
    const host =
      typeof window !== "undefined" ? window.location.hostname : "localhost";
    const socketUrl = `${protocol}//${host}:6996`;

    const newSocket = io(socketUrl, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
      // Add reconnection limits to prevent infinite reconnection attempts
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id, "URL:", socketUrl);
      setIsConnected(true);
      connectingRef.current = false;
      try {
        // Inform server of current user id (room auth)
        const uid =
          (typeof window !== "undefined"
            ? (window as unknown as { __auth_user_id?: string }).__auth_user_id
            : null) || localStorage.getItem("userId");
        if (uid) newSocket.emit("auth", uid);
      } catch {}
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
      connectingRef.current = false;
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error, "URL:", socketUrl);
      setIsConnected(false);
      connectingRef.current = false;
    });

    // Add more debugging events
    newSocket.on("connect_timeout", () => {
      console.error("Socket connection timeout");
      connectingRef.current = false;
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
    });

    newSocket.on("reconnect_failed", () => {
      console.error("Socket reconnection failed after all attempts");
      connectingRef.current = false;
    });

    // Listen for test events
    newSocket.on("test_event", (data) => {
      console.log("Received test event:", data);
    });

    setSocket(newSocket);

    // Make socket available globally for debugging
    if (typeof window !== "undefined") {
      (window as unknown as { __SOCKET__: Socket }).__SOCKET__ = newSocket;
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      connectingRef.current = false;
    }
  };

  // Connect when user is authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, token]);

  const value: SocketContextType = {
    socket,
    isConnected,
    connect,
    disconnect,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
