"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";
import {
  ITypingIndicator,
  IUnreadCount,
} from "../types/messaging";

interface UseLiveEventsProps {
  conversationId?: string;
  onTypingUpdate?: (typingUsers: ITypingIndicator[]) => void;
  onOnlineStatusUpdate?: (onlineUsers: Set<string>) => void;
  onUnreadCountUpdate?: (unreadCount: IUnreadCount) => void;
}

export const useLiveEvents = ({
  conversationId,
  onTypingUpdate,
  onOnlineStatusUpdate,
  onUnreadCountUpdate,
}: UseLiveEventsProps = {}) => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  
  // State for live events
  const [typingUsers, setTypingUsers] = useState<ITypingIndicator[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  
  // Refs to track cleanup
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const listenersSetup = useRef<boolean>(false);
  const anyLoggerBound = useRef<boolean>(false);
  const offlineTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const OFFLINE_GRACE_MS = 2000; // avoid flicker during reload/reconnect

  // Typing indicator functions
  const startTyping = useCallback(() => {
    if (!socket?.connected || !conversationId || !user) return;
    
    socket.emit("typing:start", {
      conversationId,
      userId: user._id,
      username: user.username,
    });
  }, [socket, conversationId, user]);

  const stopTyping = useCallback(() => {
    if (!socket?.connected || !conversationId || !user) return;
    
    socket.emit("typing:stop", {
      conversationId,
      userId: user._id,
    });
  }, [socket, conversationId, user]);

  // Minimal read emission: backend will update per-user unread counts
  const markMessageAsRead = useCallback((messageId: string) => {
    if (!socket?.connected || !conversationId || !user) return;
    socket.emit("message:read", {
      conversationId,
      userId: user._id,
      lastReadMessageId: messageId,
      at: new Date().toISOString(),
    });
  }, [socket, conversationId, user]);



  // Join/leave conversation rooms
  const joinConversation = useCallback(() => {
    if (!socket?.connected || !conversationId || !user) return;
    
    socket.emit("conversation:join", {
      conversationId,
      userId: user._id,
    });
  }, [socket, conversationId, user]);

  const leaveConversation = useCallback(() => {
    if (!socket?.connected || !conversationId || !user) return;
    
    socket.emit("conversation:leave", {
      conversationId,
      userId: user._id,
    });
  }, [socket, conversationId, user]);

  // Join multiple conversation rooms (to receive presence/typing across list)
  const joinRooms = useCallback((conversationIds: string[]) => {
    if (!socket?.connected || !user) return;
    (conversationIds || []).forEach((cid) => {
      if (!cid) return;
      socket.emit("conversation:join", { conversationId: cid, userId: user._id });
    });
  }, [socket, user]);

  const leaveRooms = useCallback((conversationIds: string[]) => {
    if (!socket?.connected || !user) return;
    (conversationIds || []).forEach((cid) => {
      if (!cid) return;
      socket.emit("conversation:leave", { conversationId: cid, userId: user._id });
    });
  }, [socket, user]);

  // Transmit online status to backend
  const notifyUserOnline = useCallback(() => {
    if (!socket?.connected || !user) return;
    
    console.log("📡 Emitting presence:hello event");
    socket.emit("presence:hello", {
      userId: user._id,
      username: user.username,
      at: new Date().toISOString(),
    });
    // Legacy compatibility
    socket.emit("user:connect", {
      userId: user._id,
      username: user.username,
      connectedAt: new Date().toISOString(),
    });
  }, [socket, user]);

  const notifyUserOffline = useCallback(() => {
    if (!socket?.connected || !user) return;
    
    console.log("📡 Emitting presence:bye event");
    socket.emit("presence:bye", {
      userId: user._id,
      at: new Date().toISOString(),
    });
    // Legacy compatibility
    socket.emit("user:disconnect", {
      userId: user._id,
      disconnectedAt: new Date().toISOString(),
    });
  }, [socket, user]);

  // Handle typing indicators
  const handleTypingStart = useCallback((data: { conversationId: string; userId: string; username: string }) => {
    if (data.conversationId !== conversationId || data.userId === user?._id) return;
    
    setTypingUsers(prev => {
      const existing = prev.find(t => t.userId === data.userId);
      if (existing) {
        return prev.map(t => 
          t.userId === data.userId 
            ? { ...t, isTyping: true, timestamp: Date.now() }
            : t
        );
      }
      return [...prev, {
        conversationId: data.conversationId,
        userId: data.userId,
        username: data.username,
        isTyping: true,
        timestamp: Date.now(),
      }];
    });

    // Clear existing timeout
    if (typingTimeouts.current[data.userId]) {
      clearTimeout(typingTimeouts.current[data.userId]);
    }

    // Set timeout to stop typing indicator
    typingTimeouts.current[data.userId] = setTimeout(() => {
      setTypingUsers(prev => prev.filter(t => t.userId !== data.userId));
      delete typingTimeouts.current[data.userId];
    }, 10000); // Stop typing indicator after 10 seconds (increased from 5)
  }, [conversationId, user?._id]);

  const handleTypingStop = useCallback((data: { conversationId: string; userId: string }) => {
    if (data.conversationId !== conversationId || data.userId === user?._id) return;
    
    setTypingUsers(prev => prev.filter(t => t.userId !== data.userId));
    
    // Clear timeout
    if (typingTimeouts.current[data.userId]) {
      clearTimeout(typingTimeouts.current[data.userId]);
      delete typingTimeouts.current[data.userId];
    }
  }, [conversationId, user?._id]);

  // New: server-driven typing aggregate updates
  const handleTypingUpdate = useCallback((data: { conversationId: string; users: Array<{ userId: string; username: string; untilMs: number }> }) => {
    if (data.conversationId !== conversationId) return;
    const now = Date.now();
    const filtered = data.users.filter(u => u.userId !== user?._id && u.untilMs > now);

    // Replace typing users list based on server aggregate
    setTypingUsers(filtered.map(u => ({
      conversationId: data.conversationId,
      userId: u.userId,
      username: u.username,
      isTyping: true,
      timestamp: now,
    })));

    // Reset timeouts per user to auto-clear at expiry
    Object.values(typingTimeouts.current).forEach(t => clearTimeout(t));
    typingTimeouts.current = {};
    filtered.forEach(u => {
      const delay = Math.max(0, u.untilMs - now);
      typingTimeouts.current[u.userId] = setTimeout(() => {
        setTypingUsers(prev => prev.filter(t => t.userId !== u.userId));
        delete typingTimeouts.current[u.userId];
      }, delay);
    });
  }, [conversationId, user?._id]);

  // Handle online status updates
  const handleUserOnline = useCallback((data: { userId: string; lastSeen?: string }) => {
    console.log(`🟢 presence: ${data.userId} is ONLINE`);
    // Cancel any pending offline removal for this user
    const t = offlineTimersRef.current[data.userId];
    if (t) {
      clearTimeout(t);
      delete offlineTimersRef.current[data.userId];
    }
    setOnlineUsers(prev => {
      const newSet = new Set([...prev, data.userId]);
      console.log("🟢 online set →", Array.from(newSet));
      return newSet;
    });
  }, []);

  const handleUserOffline = useCallback((data: { userId: string; lastSeen?: string }) => {
    console.log(`🔴 presence: ${data.userId} is OFFLINE`, data?.lastSeen ? `lastSeen=${data.lastSeen}` : "");
    // Defer removal to absorb quick reconnects
    if (offlineTimersRef.current[data.userId]) clearTimeout(offlineTimersRef.current[data.userId]);
    offlineTimersRef.current[data.userId] = setTimeout(() => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        console.log("🔴 online set →", Array.from(newSet));
        return newSet;
      });
      delete offlineTimersRef.current[data.userId];
    }, OFFLINE_GRACE_MS);
  }, []);

  // Presence snapshot handler (server sends current online users on connect)
  const handlePresenceSnapshot = useCallback((data: { onlineUserIds?: string[] }) => {
    const ids = Array.isArray(data?.onlineUserIds) ? data!.onlineUserIds : [];
    const set = new Set<string>(ids);
    if (user?._id) set.add(user._id);
    console.log("📸 presence snapshot →", Array.from(set));
    setOnlineUsers(set);
  }, [user?._id]);

  // Remove clobbering init; presence is seeded by server snapshot and live events





  // Handle unread count updates
  const handleUnreadUpdate = useCallback((unreadCount: IUnreadCount) => {
    console.log("Unread count update:", unreadCount);
    setUnreadCounts(prev => ({
      ...prev,
      [unreadCount.conversationId]: unreadCount.count,
    }));
    onUnreadCountUpdate?.(unreadCount);
  }, [onUnreadCountUpdate]);

  // Initialize unread counts (will be populated by backend)
  useEffect(() => {
    if (conversationId && user) {
      // Unread counts will be populated by backend events
      console.log("Initializing unread counts for conversation:", conversationId);
    }
  }, [conversationId, user]);

  // Setup socket listeners on actual socket connect, and clean on disconnect
  useEffect(() => {
    if (!socket) return;

    // Ensure a catch-all logger is always present for debugging presence
    if (!anyLoggerBound.current) {
      socket.onAny((eventName, ...args) => {
        if (eventName.startsWith("user:") || eventName.startsWith("presence:") || eventName === "connect" || eventName === "disconnect") {
          try {
            const data = (args && args[0]) || {};
            const uid = (data && (data.userId || data.uid)) || "<unknown>";
            console.log(`🧭 onAny ${eventName} uid=${uid}`, data);
          } catch {
            console.log("🧭 onAny", eventName, args);
          }
        }
      });
      anyLoggerBound.current = true;
    }

    const bindAll = () => {
      if (listenersSetup.current) return;
      console.log("Setting up live event listeners for conversation:", conversationId);
      console.log("Socket connected:", socket.connected);
      console.log("Socket ID:", socket.id);

      socket.on("typing:start", handleTypingStart);
      socket.on("typing:stop", handleTypingStop);
      socket.on("typing:update", handleTypingUpdate);

      socket.on("user:online", handleUserOnline);
      socket.on("user:offline", handleUserOffline);
      socket.on("presence:online", handleUserOnline);
      socket.on("presence:offline", handleUserOffline);
      socket.on("presence:snapshot", handlePresenceSnapshot);

      socket.on("unread:update", handleUnreadUpdate);

      socket.onAny((eventName, ...args) => {
        if (eventName.startsWith("user:") || eventName.startsWith("presence:")) {
          try {
            const data = (args && args[0]) || {};
            const uid = (data && (data.userId || data.uid)) || "<unknown>";
            console.log(`👀 ${eventName} → userId=${uid}`, data);
          } catch {
            console.log("👀", eventName, args);
          }
        }
      });

      listenersSetup.current = true;
    };

    const unbindAll = () => {
      if (!listenersSetup.current) return;
      console.log("Cleaning up live event listeners");
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("typing:update", handleTypingUpdate);
      socket.off("user:online", handleUserOnline);
      socket.off("user:offline", handleUserOffline);
      socket.off("presence:online", handleUserOnline);
      socket.off("presence:offline", handleUserOffline);
      socket.off("presence:snapshot", handlePresenceSnapshot);
      socket.off("unread:update", handleUnreadUpdate);
      listenersSetup.current = false;
    };

    const onConnect = () => {
      console.log("🔗 socket connected", socket.id);
      bindAll();
    };
    const onDisconnect = (reason?: string) => {
      console.log("🔌 socket disconnected", reason);
      unbindAll();
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      unbindAll();
    };
  }, [socket, conversationId, handleTypingStart, handleTypingStop, handleTypingUpdate, handleUserOnline, handleUserOffline, handleUnreadUpdate, handlePresenceSnapshot]);

  // Join conversation when component mounts
  useEffect(() => {
    if (conversationId && isConnected) {
      joinConversation();
    }

    return () => {
      if (conversationId && isConnected) {
        leaveConversation();
      }
    };
  }, [conversationId, isConnected, joinConversation, leaveConversation]);

  // Notify backend of online/offline status
  useEffect(() => {
    if (isConnected && user) {
      // User just connected - notify backend
      notifyUserOnline();
    } else if (!isConnected && user) {
      // User just disconnected - notify backend
      notifyUserOffline();
    }
  }, [isConnected, user, notifyUserOnline, notifyUserOffline]);

  // Do NOT emit offline on beforeunload; server disconnect + grace handles reloads

  // Cleanup typing timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(typingTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      typingTimeouts.current = {};
    };
  }, []);

  // Notify parent components of updates
  useEffect(() => {
    onTypingUpdate?.(typingUsers);
  }, [typingUsers, onTypingUpdate]);

  useEffect(() => {
    onOnlineStatusUpdate?.(onlineUsers);
  }, [onlineUsers, onOnlineStatusUpdate]);

  return {
    // State
    typingUsers,
    onlineUsers,
    unreadCounts,
    
    // Actions
    startTyping,
    stopTyping,
    markMessageAsRead,
    joinConversation,
    leaveConversation,
    joinRooms,
    leaveRooms,
    notifyUserOnline,
    notifyUserOffline,
    
    // Connection status
    isConnected,
    
    // Debug functions
    debugAddOnlineUser: (userId: string) => {
      console.log("🧪 Debug: Manually adding online user:", userId);
      setOnlineUsers(prev => new Set([...prev, userId]));
    },
    debugRemoveOnlineUser: (userId: string) => {
      console.log("🧪 Debug: Manually removing online user:", userId);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    },
  };
};
