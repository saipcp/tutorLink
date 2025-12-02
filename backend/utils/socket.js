import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io = null;
// Map userId -> Set(socketId)
const userSockets = new Map();

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        // disconnect if no token
        socket.disconnect(true);
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      // attach userId to socket
      socket.data.userId = userId;

      // add socket to map
      if (!userSockets.has(userId)) userSockets.set(userId, new Set());
      userSockets.get(userId).add(socket.id);

      // notify presence: other parts of app can listen to 'presence' event
      io.emit("presence", { userId, online: true });

      // handle typing events forwarded to other participants
      socket.on("typing", (payload) => {
        // payload: { conversationId, isTyping }
        socket
          .to(payload.conversationId)
          .emit("typing", { ...payload, userId });
      });

      socket.on("joinConversation", ({ conversationId }) => {
        if (conversationId) socket.join(conversationId);
      });

      socket.on("leaveConversation", ({ conversationId }) => {
        if (conversationId) socket.leave(conversationId);
      });

      socket.on("markRead", ({ conversationId }) => {
        // forward to other members of the conversation so they can update UI
        socket
          .to(conversationId)
          .emit("messagesRead", { conversationId, userId });
      });

      socket.on("disconnect", () => {
        // remove socket from map
        const set = userSockets.get(userId);
        if (set) {
          set.delete(socket.id);
          if (set.size === 0) userSockets.delete(userId);
        }
        // broadcast presence
        io.emit("presence", { userId, online: false });
      });
    } catch (err) {
      // invalid token
      socket.disconnect(true);
    }
  });

  return io;
}

export function getIO() {
  return io;
}

export function getUserSocketIds(userId) {
  return userSockets.get(userId) ? Array.from(userSockets.get(userId)) : [];
}

export function isUserOnline(userId) {
  return userSockets.has(userId);
}
