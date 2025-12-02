import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

// Get billing settings for the authenticated user
export const getBillingSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [settings] = await pool.execute(
      `SELECT 
        id, userId, billingName, billingEmail, billingAddress,
        monthlyInvoices, autoPayment, createdAt, updatedAt
      FROM billing_settings 
      WHERE userId = ?`,
      [userId]
    );

    // If no settings exist, return defaults
    if (settings.length === 0) {
      // Get user info for defaults
      const [users] = await pool.execute(
        'SELECT firstName, lastName, email FROM users WHERE id = ?',
        [userId]
      );
      
      const user = users[0];
      const defaultSettings = {
        id: null,
        userId,
        billingName: user ? `${user.firstName} ${user.lastName}` : '',
        billingEmail: user ? user.email : '',
        billingAddress: '',
        monthlyInvoices: true,
        autoPayment: false,
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

// Update billing settings for the authenticated user
export const updateBillingSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      billingName,
      billingEmail,
      billingAddress,
      monthlyInvoices,
      autoPayment,
    } = req.body;

    // Check if settings exist
    const [existing] = await pool.execute(
      'SELECT id FROM billing_settings WHERE userId = ?',
      [userId]
    );

    if (existing.length === 0) {
      // Create new settings
      const settingsId = uuidv4();
      await pool.execute(
        `INSERT INTO billing_settings (
          id, userId, billingName, billingEmail, billingAddress,
          monthlyInvoices, autoPayment
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          settingsId,
          userId,
          billingName || null,
          billingEmail || null,
          billingAddress || null,
          monthlyInvoices !== undefined ? monthlyInvoices : true,
          autoPayment !== undefined ? autoPayment : false,
        ]
      );

      const [newSettings] = await pool.execute(
        `SELECT 
          id, userId, billingName, billingEmail, billingAddress,
          monthlyInvoices, autoPayment, createdAt, updatedAt
        FROM billing_settings WHERE id = ?`,
        [settingsId]
      );

      return res.json(newSettings[0]);
    } else {
      // Update existing settings
      const updates = {};
      const values = [];

      if (billingName !== undefined) {
        updates.billingName = billingName;
        values.push(billingName);
      }
      if (billingEmail !== undefined) {
        updates.billingEmail = billingEmail;
        values.push(billingEmail);
      }
      if (billingAddress !== undefined) {
        updates.billingAddress = billingAddress;
        values.push(billingAddress);
      }
      if (monthlyInvoices !== undefined) {
        updates.monthlyInvoices = monthlyInvoices;
        values.push(monthlyInvoices);
      }
      if (autoPayment !== undefined) {
        updates.autoPayment = autoPayment;
        values.push(autoPayment);
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const setClause = Object.keys(updates)
        .map(key => `${key} = ?`)
        .join(', ');

      values.push(userId);

      await pool.execute(
        `UPDATE billing_settings 
         SET ${setClause}, updatedAt = CURRENT_TIMESTAMP 
         WHERE userId = ?`,
        values
      );

      const [updated] = await pool.execute(
        `SELECT 
          id, userId, billingName, billingEmail, billingAddress,
          monthlyInvoices, autoPayment, createdAt, updatedAt
        FROM billing_settings WHERE userId = ?`,
        [userId]
      );

      res.json(updated[0]);
    }
  } catch (error) {
    next(error);
  }
};

