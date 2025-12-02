import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

// Get user settings for the authenticated user
export const getUserSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [settings] = await pool.execute(
      `SELECT 
        id, userId,
        emailNotifications, pushNotifications, sessionReminders, newMessages, weeklyReports,
        profileVisibility, showOnlineStatus, allowMessages, dataSharing,
        createdAt, updatedAt
      FROM user_settings 
      WHERE userId = ?`,
      [userId]
    );

    // If no settings exist, return defaults
    if (settings.length === 0) {
      const defaultSettings = {
        id: null,
        userId,
        emailNotifications: true,
        pushNotifications: true,
        sessionReminders: true,
        newMessages: true,
        weeklyReports: false,
        profileVisibility: 'public',
        showOnlineStatus: true,
        allowMessages: true,
        dataSharing: false,
        createdAt: null,
        updatedAt: null,
      };
      
      return res.json(defaultSettings);
    }

    res.json(settings[0]);
  } catch (error) {
    next(error);
  }
};

// Update user settings for the authenticated user
export const updateUserSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      emailNotifications,
      pushNotifications,
      sessionReminders,
      newMessages,
      weeklyReports,
      profileVisibility,
      showOnlineStatus,
      allowMessages,
      dataSharing,
    } = req.body;

    // Check if settings exist
    const [existing] = await pool.execute(
      'SELECT id FROM user_settings WHERE userId = ?',
      [userId]
    );

    if (existing.length === 0) {
      // Create new settings
      const settingsId = uuidv4();
      await pool.execute(
        `INSERT INTO user_settings (
          id, userId,
          emailNotifications, pushNotifications, sessionReminders, newMessages, weeklyReports,
          profileVisibility, showOnlineStatus, allowMessages, dataSharing
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          settingsId,
          userId,
          emailNotifications !== undefined ? emailNotifications : true,
          pushNotifications !== undefined ? pushNotifications : true,
          sessionReminders !== undefined ? sessionReminders : true,
          newMessages !== undefined ? newMessages : true,
          weeklyReports !== undefined ? weeklyReports : false,
          profileVisibility || 'public',
          showOnlineStatus !== undefined ? showOnlineStatus : true,
          allowMessages !== undefined ? allowMessages : true,
          dataSharing !== undefined ? dataSharing : false,
        ]
      );

      const [newSettings] = await pool.execute(
        `SELECT 
          id, userId,
          emailNotifications, pushNotifications, sessionReminders, newMessages, weeklyReports,
          profileVisibility, showOnlineStatus, allowMessages, dataSharing,
          createdAt, updatedAt
        FROM user_settings WHERE id = ?`,
        [settingsId]
      );

      return res.json(newSettings[0]);
    } else {
      // Update existing settings
      const updates = {};
      const values = [];

      if (emailNotifications !== undefined) {
        updates.emailNotifications = emailNotifications;
        values.push(emailNotifications);
      }
      if (pushNotifications !== undefined) {
        updates.pushNotifications = pushNotifications;
        values.push(pushNotifications);
      }
      if (sessionReminders !== undefined) {
        updates.sessionReminders = sessionReminders;
        values.push(sessionReminders);
      }
      if (newMessages !== undefined) {
        updates.newMessages = newMessages;
        values.push(newMessages);
      }
      if (weeklyReports !== undefined) {
        updates.weeklyReports = weeklyReports;
        values.push(weeklyReports);
      }
      if (profileVisibility !== undefined) {
        updates.profileVisibility = profileVisibility;
        values.push(profileVisibility);
      }
      if (showOnlineStatus !== undefined) {
        updates.showOnlineStatus = showOnlineStatus;
        values.push(showOnlineStatus);
      }
      if (allowMessages !== undefined) {
        updates.allowMessages = allowMessages;
        values.push(allowMessages);
      }
      if (dataSharing !== undefined) {
        updates.dataSharing = dataSharing;
        values.push(dataSharing);
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const setClause = Object.keys(updates)
        .map(key => `${key} = ?`)
        .join(', ');

      values.push(userId);

      await pool.execute(
        `UPDATE user_settings 
         SET ${setClause}, updatedAt = CURRENT_TIMESTAMP 
         WHERE userId = ?`,
        values
      );

      const [updated] = await pool.execute(
        `SELECT 
          id, userId,
          emailNotifications, pushNotifications, sessionReminders, newMessages, weeklyReports,
          profileVisibility, showOnlineStatus, allowMessages, dataSharing,
          createdAt, updatedAt
        FROM user_settings WHERE userId = ?`,
        [userId]
      );

      res.json(updated[0]);
    }
  } catch (error) {
    next(error);
  }
};

