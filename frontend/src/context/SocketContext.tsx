import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { AuthContext } from "./AuthContext";
import { useQueryClient } from "@tanstack/react-query";

const SocketContext = createContext<any>(null);

// Helper function to get notification message based on type
function getNotificationMessage(notification: any): string {
  const { type, payload } = notification;
  
  switch (type) {
    case "message":
      return payload?.excerpt || "You have a new message";
    case "new_booking":
      return payload?.message || "You have a new session booking";
    case "session_canceled":
      return payload?.message || "A session was canceled";
    case "session_completed":
      return payload?.message || "A session was completed";
    case "new_review":
      return payload?.message || "You received a new review";
    case "conversation":
      return "You have a new conversation";
    case "payment_completed":
      return payload?.message || "Payment completed successfully";
    case "payment_failed":
      return payload?.message || "Payment failed";
    case "task_assigned":
      return payload?.message || "You have a new task";
    default:
      return "You have a new notification";
  }
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Access AuthContext directly using useContext (not useAuth hook)
  // This allows us to handle undefined context gracefully
  const authContextValue = useContext(AuthContext);
  const user = authContextValue?.user || null;
  const userId = authContextValue?.user?.id;
  const loading = authContextValue?.loading || false;

  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [typingStatus, setTypingStatus] = useState<Record<string, Set<string>>>(
    {}
  );

  // derive backend base URL (strip /api/...)
  const apiBase =
    (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
  const baseUrl = apiBase.replace(/\/api\/.+$/, "") || "http://localhost:5000";

  // Request browser notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch((err) => {
        console.warn("Failed to request notification permission:", err);
      });
    }
  }, []);

  useEffect(() => {
    // Don't initialize socket if auth is still loading or user is not available
    if (loading || !user) return;

    const token = localStorage.getItem("tutorlink_user")
      ? JSON.parse(localStorage.getItem("tutorlink_user") || "{}").token
      : null;
    if (!token) return;

    const s: Socket = io(baseUrl, {
      auth: { token },
      autoConnect: true,
      transports: ["websocket"],
    });

    setSocket(s);

    // listeners
    s.on("connect", () => {
      // console.log('socket connected:', s.id);
    });

    s.on("presence", ({ userId, online }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: online }));
    });

    s.on("newMessage", (message: any) => {
      if (!message || !message.conversationId) return;
      const key = ["messages", message.conversationId];
      queryClient.setQueryData(key, (old: any[] | undefined) => {
        if (!old) return [message];
        // Check if message already exists (avoid duplicates)
        const exists = old.some((m) => m.id === message.id);
        if (exists) return old;
        // Also check if there's a temp message with the same body and sender (optimistic update)
        // If so, replace it instead of adding duplicate
        const tempMessageIndex = old.findIndex(
          (m) => m.id?.startsWith("temp-") && 
                  m.body === message.body && 
                  m.senderId === message.senderId &&
                  Math.abs(new Date(m.sentAt).getTime() - new Date(message.sentAt).getTime()) < 5000 // within 5 seconds
        );
        if (tempMessageIndex !== -1) {
          // Replace temp message with real one
          const updated = [...old];
          updated[tempMessageIndex] = message;
          return updated;
        }
        return [...old, message];
      });

      // Optimistically update conversations list to show last message immediately
      queryClient.setQueryData(["conversations"], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map((conv: any) => {
          if (conv.id === message.conversationId) {
            return {
              ...conv,
              lastMessage: message,
              updatedAt: message.sentAt,
            };
          }
          return conv;
        });
      });

      // Mark as stale but don't trigger immediate refetch (we already updated cache)
      queryClient.invalidateQueries({ 
        queryKey: ["conversations"],
        refetchType: 'none' // Don't trigger immediate refetch
      });
      // Only invalidate notifications if needed, but don't refetch immediately
      queryClient.invalidateQueries({ 
        queryKey: ["notifications", userId],
        refetchType: 'none'
      });
    });

    s.on("conversationCreated", (payload: any) => {
      // Mark as stale but don't trigger immediate refetch
      queryClient.invalidateQueries({ 
        queryKey: ["conversations"],
        refetchType: 'none'
      });
      queryClient.invalidateQueries({ 
        queryKey: ["notifications", userId],
        refetchType: 'none'
      });
    });

    s.on(
      "messagesRead",
      ({
        conversationId,
        userId,
      }: {
        conversationId: string;
        userId: string;
      }) => {
        // mark messages as read in cache for that conversation
        const key = ["messages", conversationId];
        queryClient.setQueryData(key, (old: any[] | undefined) => {
          if (!old) return old;
          return old.map((m) =>
            m.senderId !== userId ? { ...m, isRead: true } : m
          );
        });
        // Mark conversations as stale but don't refetch immediately
        queryClient.invalidateQueries({ 
          queryKey: ["conversations"],
          refetchType: 'none'
        });
      }
    );

    s.on("typing", ({ conversationId, userId, isTyping }: any) => {
      setTypingStatus((prev) => {
        const copy = { ...prev };
        if (!copy[conversationId]) copy[conversationId] = new Set();
        if (isTyping) copy[conversationId].add(userId);
        else copy[conversationId].delete(userId);
        return copy;
      });
    });

    s.on(
      "messageDelivered",
      ({ messageId, conversationId, recipients }: any) => {
        // update message in cache as delivered for sender
        if (!conversationId) return;
        const key = ["messages", conversationId];
        queryClient.setQueryData(key, (old: any[] | undefined) => {
          if (!old) return old;
          return old.map((m) =>
            m.id === messageId ? { ...m, delivered: true } : m
          );
        });
      }
    );

    // Handle new notifications via socket
    s.on("newNotification", (notification: any) => {
      if (!notification || !notification.userId || notification.userId !== userId) return;
      
      // Add notification to cache
      const key = ["notifications", userId];
      queryClient.setQueryData(key, (old: any[] | undefined) => {
        if (!old) return [notification];
        // Check if notification already exists (avoid duplicates)
        const exists = old.some((n) => n.id === notification.id);
        if (exists) return old;
        // Add new notification at the beginning
        return [notification, ...old];
      });

      // Show browser notification if permission granted
      if ("Notification" in window && Notification.permission === "granted") {
        const message = notification.payload?.message || getNotificationMessage(notification);
        new Notification("TutorLink", {
          body: message,
          icon: "/favicon.svg",
        });
      }
    });

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user, userId, queryClient]);

  const joinConversation = (conversationId: string) => {
    if (!socket || !conversationId) return;
    socket.emit("joinConversation", { conversationId });
  };

  const leaveConversation = (conversationId: string) => {
    if (!socket || !conversationId) return;
    socket.emit("leaveConversation", { conversationId });
  };

  const sendTyping = (conversationId: string, isTyping: boolean) => {
    if (!socket || !conversationId) return;
    socket.emit("typing", { conversationId, isTyping });
  };

  const markConversationRead = (conversationId: string) => {
    if (!socket || !conversationId) return;
    socket.emit("markRead", { conversationId });
  };

  const value = useMemo(
    () => ({
      socket,
      onlineUsers,
      typingStatus,
      joinConversation,
      leaveConversation,
      sendTyping,
      markConversationRead,
    }),
    [socket, onlineUsers, typingStatus]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

export default SocketContext;
