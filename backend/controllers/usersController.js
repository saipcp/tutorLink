import pool from '../config/database.js';
import { hashPassword } from '../utils/password.js';

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, email, phone, avatar } = req.body;

    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (phone !== undefined) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;

    // Handle email update with validation
    if (email) {
      // Check if email is already taken by another user
      const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({ error: 'Email is already taken by another user' });
      }

      updates.email = email;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    await pool.execute(
      `UPDATE users SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, userId]
    );

    const [users] = await pool.execute(
      'SELECT id, firstName, lastName, email, role, phone, avatar, createdAt, updatedAt FROM users WHERE id = ?',
      [userId]
    );

    res.json(users[0]);
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    // Get current password
    const [users] = await pool.execute('SELECT password FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const { comparePassword } = await import('../utils/password.js');
    const isValid = await comparePassword(currentPassword, users[0].password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    const hashedPassword = await hashPassword(newPassword);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

