import { v4 as uuidv4 } from "uuid";
import pool from "../config/database.js";
import { getIO, getUserSocketIds } from "./socket.js";

/**
 * Create a notification and emit it via socket if user is online
 * @param {string} userId - The user ID to notify
 * @param {string} type - Notification type (e.g., 'message', 'new_booking', 'session_canceled', etc.)
 * @param {object} payload - Notification payload data
 * @returns {Promise<string>} - The notification ID
 */
export async function createNotification(userId, type, payload) {
  const notifId = uuidv4();
  
  try {
    // Insert notification into database
    await pool.execute(
      "INSERT INTO notifications (id, userId, type, payload) VALUES (?, ?, ?, ?)",
      [notifId, userId, type, JSON.stringify(payload)]
    );

    // Emit socket event if user is online
    const io = getIO();
    if (io) {
      const socketIds = getUserSocketIds(userId);
      if (socketIds.length > 0) {
        const notification = {
          id: notifId,
          userId,
          type,
          payload,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        
        socketIds.forEach((socketId) => {
          io.to(socketId).emit("newNotification", notification);
        });
      }
    }

    return notifId;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Create notifications for multiple users
 * @param {string[]} userIds - Array of user IDs to notify
 * @param {string} type - Notification type
 * @param {object} payload - Notification payload data
 * @returns {Promise<string[]>} - Array of notification IDs
 */
export async function createNotificationsForUsers(userIds, type, payload) {
  const promises = userIds.map((userId) => createNotification(userId, type, payload));
  return Promise.all(promises);
}

