import pool from "../config/database.js";
import { v4 as uuidv4 } from "uuid";
import { getIO, getUserSocketIds } from "../utils/socket.js";
import { createNotificationsForUsers } from "../utils/notifications.js";

export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [conversations] = await pool.execute(
      `SELECT DISTINCT c.*
       FROM conversations c
       INNER JOIN conversation_members cm ON c.id = cm.conversationId
       WHERE cm.userId = ?
       ORDER BY c.updatedAt DESC`,
      [userId]
    );

    // Get last message and other member for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const [lastMessage] = await pool.execute(
          `SELECT m.*, u.firstName as senderFirstName, u.lastName as senderLastName
         FROM messages m
         LEFT JOIN users u ON m.senderId = u.id
         WHERE m.conversationId = ?
         ORDER BY m.sentAt DESC
         LIMIT 1`,
          [conv.id]
        );

        const [otherMembers] = await pool.execute(
          `SELECT u.id, u.firstName, u.lastName, u.avatar, u.role
         FROM conversation_members cm
         INNER JOIN users u ON cm.userId = u.id
         WHERE cm.conversationId = ? AND cm.userId != ?`,
          [conv.id, userId]
        );

        return {
          ...conv,
          lastMessage: lastMessage[0] || null,
          members: otherMembers,
        };
      })
    );

    res.json(conversationsWithDetails);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify user is member of conversation
    const [members] = await pool.execute(
      "SELECT userId FROM conversation_members WHERE conversationId = ? AND userId = ?",
      [conversationId, userId]
    );

    if (members.length === 0) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this conversation" });
    }

    const [messages] = await pool.execute(
      `SELECT m.*, u.firstName, u.lastName, u.avatar
       FROM messages m
       LEFT JOIN users u ON m.senderId = u.id
       WHERE m.conversationId = ?
       ORDER BY m.sentAt ASC`,
      [conversationId]
    );

    // Mark messages as read for this user (messages where sender != current user)
    await pool.execute(
      `UPDATE messages
       SET isRead = TRUE
       WHERE conversationId = ? AND senderId != ? AND isRead = FALSE`,
      [conversationId, userId]
    );

    // Also mark any related message notifications as read for this user
    // JSON_UNQUOTE(JSON_EXTRACT(payload,'$.conversationId')) extracts the conversation id
    await pool.execute(
      `UPDATE notifications
       SET isRead = TRUE
       WHERE userId = ? AND type = 'message' AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.conversationId')) = ?`,
      [userId, conversationId]
    );

    // Emit messagesRead to conversation room so other members receive read receipt
    try {
      const io = getIO();
      if (io)
        io.to(conversationId).emit("messagesRead", { conversationId, userId });
    } catch (err) {
      // Non-fatal
      console.warn("Socket emit messagesRead failed:", err.message || err);
    }

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { body, recipientId } = req.body;

    if (!body) {
      return res.status(400).json({ error: "Message body is required" });
    }

    let convId = conversationId;

    // Create conversation if it doesn't exist
    if (!convId && recipientId) {
      convId = uuidv4();
      await pool.execute("INSERT INTO conversations (id) VALUES (?)", [convId]);
      await pool.execute(
        "INSERT INTO conversation_members (conversationId, userId) VALUES (?, ?)",
        [convId, userId]
      );
      await pool.execute(
        "INSERT INTO conversation_members (conversationId, userId) VALUES (?, ?)",
        [convId, recipientId]
      );
    } else if (convId) {
      // Verify user is member
      const [members] = await pool.execute(
        "SELECT userId FROM conversation_members WHERE conversationId = ? AND userId = ?",
        [convId, userId]
      );

      if (members.length === 0) {
        return res.status(403).json({ error: "Not authorized" });
      }
    } else {
      return res
        .status(400)
        .json({ error: "Conversation ID or recipient ID is required" });
    }

    const messageId = uuidv4();

    await pool.execute(
      `INSERT INTO messages (id, conversationId, senderId, body)
       VALUES (?, ?, ?, ?)`,
      [messageId, convId, userId, body]
    );

    // Update conversation updatedAt
    await pool.execute(
      "UPDATE conversations SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [convId]
    );

    const [newMessage] = await pool.execute(
      `SELECT m.*, u.firstName, u.lastName, u.avatar
       FROM messages m
       LEFT JOIN users u ON m.senderId = u.id
       WHERE m.id = ?`,
      [messageId]
    );

    // Create notifications for other members of the conversation (exclude sender)
    const [members] = await pool.execute(
      `SELECT userId FROM conversation_members WHERE conversationId = ? AND userId != ?`,
      [convId, userId]
    );

    if (members.length > 0) {
      const memberIds = members.map((m) => m.userId);
      const notificationPayload = {
        conversationId: convId,
        messageId,
        senderId: userId,
        excerpt: body?.substring(0, 200) || "",
      };

      // Create notifications (will emit socket events automatically)
      await createNotificationsForUsers(memberIds, "message", notificationPayload);

      try {
        const io = getIO();
        if (io) {
          // notify room members (if they have joined the room via sockets)
          io.to(convId).emit("newMessage", {
            ...newMessage[0],
            conversationId: convId,
          });

          // Send delivered confirmation back to sender if any recipients are online
          const onlineRecipients = members.filter(
            (m) => getUserSocketIds(m.userId).length > 0
          );
          if (onlineRecipients.length > 0) {
            const senderSocketIds = getUserSocketIds(userId);
            if (senderSocketIds.length > 0) {
              senderSocketIds.forEach((sid) =>
                io.to(sid).emit("messageDelivered", {
                  messageId,
                  conversationId: convId,
                  recipients: onlineRecipients.map((r) => r.userId),
                })
              );
            }
          }
        }
      } catch (err) {
        console.warn("Socket emit error (newMessage):", err.message || err);
      }
    }

    // Include conversationId in response so clients can navigate / update UI when a new conversation is created
    res.status(201).json({ ...newMessage[0], conversationId: convId });
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { recipientId, title } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: "Recipient ID is required" });
    }

    // Check if conversation already exists
    const [existing] = await pool.execute(
      `SELECT c.id
       FROM conversations c
       INNER JOIN conversation_members cm1 ON c.id = cm1.conversationId
       INNER JOIN conversation_members cm2 ON c.id = cm2.conversationId
       WHERE cm1.userId = ? AND cm2.userId = ?`,
      [userId, recipientId]
    );

    if (existing.length > 0) {
      return res.json({ conversationId: existing[0].id });
    }

    const conversationId = uuidv4();

    await pool.execute("INSERT INTO conversations (id, title) VALUES (?, ?)", [
      conversationId,
      title || null,
    ]);

    await pool.execute(
      "INSERT INTO conversation_members (conversationId, userId) VALUES (?, ?)",
      [conversationId, userId]
    );
    await pool.execute(
      "INSERT INTO conversation_members (conversationId, userId) VALUES (?, ?)",
      [conversationId, recipientId]
    );

    // Notify the recipient about the new conversation
    const notificationPayload = {
      conversationId,
      starterId: userId,
      title: title || null,
    };
    
    // Create notification (will emit socket event automatically)
    await createNotification(recipientId, "conversation", notificationPayload);

    try {
      const io = getIO();
      if (io) {
        const recipientSockets = getUserSocketIds(recipientId);
        if (recipientSockets.length > 0) {
          recipientSockets.forEach((sid) =>
            io.to(sid).emit("conversationCreated", {
              conversationId,
              starterId: userId,
              title: title || null,
            })
          );
        }
      }
    } catch (err) {
      console.warn(
        "Socket emit error (conversationCreated):",
        err.message || err
      );
    }

    res.status(201).json({ conversationId });
  } catch (error) {
    next(error);
  }
};

export const getUsersForMessaging = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let users = [];

    if (userRole === "admin") {
      // Admins can message all users
      const [allUsers] = await pool.execute(
        `SELECT id, firstName, lastName, email, role, avatar, phone
         FROM users
         WHERE id != ?
         ORDER BY firstName, lastName`,
        [userId]
      );
      users = allUsers;
    } else if (userRole === "tutor") {
      // Tutors can message students (from their sessions or all students)
      const [students] = await pool.execute(
        `SELECT DISTINCT u.id, u.firstName, u.lastName, u.email, u.role, u.avatar, u.phone
         FROM users u
         WHERE u.role = 'student' AND u.id != ?
         ORDER BY firstName, lastName`,
        [userId]
      );
      users = students;
    } else if (userRole === "student") {
      // Students can message tutors
      const [tutors] = await pool.execute(
        `SELECT DISTINCT u.id, u.firstName, u.lastName, u.email, u.role, u.avatar, u.phone
         FROM users u
         INNER JOIN tutor_profiles tp ON tp.userId = u.id
         WHERE u.role = 'tutor' AND u.id != ?
         ORDER BY firstName, lastName`,
        [userId]
      );
      users = tutors;
    }

    res.json(users);
  } catch (error) {
    next(error);
  }
};
