import pool from '../config/database.js';

export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { unreadOnly } = req.query;

    let query = 'SELECT * FROM notifications WHERE userId = ?';
    const params = [userId];

    if (unreadOnly === 'true') {
      query += ' AND isRead = FALSE';
    }

    query += ' ORDER BY createdAt DESC LIMIT 50';

    const [notifications] = await pool.execute(query, params);

    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.execute(
      'UPDATE notifications SET isRead = TRUE WHERE id = ? AND userId = ?',
      [id, userId]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await pool.execute(
      'UPDATE notifications SET isRead = TRUE WHERE userId = ? AND isRead = FALSE',
      [userId]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

