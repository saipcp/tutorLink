import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

// Get all payment methods for a user (excluding soft deleted)
export const getPaymentMethods = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [methods] = await pool.execute(
      `SELECT 
        id, type, details, isDefault, expiry,
        accountNumber, accountHolderName, bankName, routingNumber, accountType, swiftCode,
        createdAt, updatedAt
      FROM payment_methods 
      WHERE userId = ? AND deletedAt IS NULL
      ORDER BY isDefault DESC, createdAt DESC`,
      [userId]
    );

    res.json(methods);
  } catch (error) {
    next(error);
  }
};

// Get a single payment method by ID
export const getPaymentMethodById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [methods] = await pool.execute(
      `SELECT 
        id, type, details, isDefault, expiry,
        accountNumber, accountHolderName, bankName, routingNumber, accountType, swiftCode,
        createdAt, updatedAt
      FROM payment_methods 
      WHERE id = ? AND userId = ? AND deletedAt IS NULL`,
      [id, userId]
    );

    if (methods.length === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    res.json(methods[0]);
  } catch (error) {
    next(error);
  }
};

// Create a new payment method
export const createPaymentMethod = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      type,
      details,
      expiry,
      accountNumber,
      accountHolderName,
      bankName,
      routingNumber,
      accountType,
      swiftCode,
      isDefault,
    } = req.body;

    // Validation
    if (!type || !details) {
      return res.status(400).json({ error: 'Type and details are required' });
    }

    if (type === 'card' && !expiry) {
      return res.status(400).json({ error: 'Expiry date is required for cards' });
    }

    if ((type === 'bank' || type === 'ach' || type === 'wire') && 
        (!accountNumber || !accountHolderName || !bankName || !routingNumber)) {
      return res.status(400).json({ 
        error: 'Account number, holder name, bank name, and routing number are required for bank accounts' 
      });
    }

    if (routingNumber && routingNumber.length !== 9) {
      return res.status(400).json({ error: 'Routing number must be 9 digits' });
    }

    if (type === 'wire' && swiftCode && swiftCode.length > 11) {
      return res.status(400).json({ error: 'SWIFT code must be 8-11 characters' });
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await pool.execute(
        'UPDATE payment_methods SET isDefault = FALSE WHERE userId = ? AND deletedAt IS NULL',
        [userId]
      );
    }

    // If this is the first payment method, make it default
    const [existing] = await pool.execute(
      'SELECT COUNT(*) as count FROM payment_methods WHERE userId = ? AND deletedAt IS NULL',
      [userId]
    );
    const shouldBeDefault = existing[0].count === 0 || isDefault;

    const methodId = uuidv4();
    await pool.execute(
      `INSERT INTO payment_methods (
        id, userId, type, details, expiry, isDefault,
        accountNumber, accountHolderName, bankName, routingNumber, accountType, swiftCode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        methodId,
        userId,
        type,
        details,
        expiry || null,
        shouldBeDefault,
        accountNumber || null,
        accountHolderName || null,
        bankName || null,
        routingNumber || null,
        accountType || null,
        swiftCode || null,
      ]
    );

    const [newMethod] = await pool.execute(
      `SELECT 
        id, type, details, isDefault, expiry,
        accountNumber, accountHolderName, bankName, routingNumber, accountType, swiftCode,
        createdAt, updatedAt
      FROM payment_methods WHERE id = ?`,
      [methodId]
    );

    res.status(201).json(newMethod[0]);
  } catch (error) {
    next(error);
  }
};

// Update a payment method
export const updatePaymentMethod = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      details,
      expiry,
      accountNumber,
      accountHolderName,
      bankName,
      routingNumber,
      accountType,
      swiftCode,
      isDefault,
    } = req.body;

    // Check if payment method exists and belongs to user
    const [existing] = await pool.execute(
      'SELECT id, type FROM payment_methods WHERE id = ? AND userId = ? AND deletedAt IS NULL',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    const methodType = existing[0].type;

    // If setting as default, unset other defaults
    if (isDefault === true) {
      await pool.execute(
        'UPDATE payment_methods SET isDefault = FALSE WHERE userId = ? AND id != ? AND deletedAt IS NULL',
        [userId, id]
      );
    }

    // Build update query dynamically
    const updates = {};
    const values = [];

    if (details !== undefined) {
      updates.details = details;
      values.push(details);
    }
    if (expiry !== undefined) {
      updates.expiry = expiry;
      values.push(expiry);
    }
    if (accountNumber !== undefined) {
      updates.accountNumber = accountNumber;
      values.push(accountNumber);
    }
    if (accountHolderName !== undefined) {
      updates.accountHolderName = accountHolderName;
      values.push(accountHolderName);
    }
    if (bankName !== undefined) {
      updates.bankName = bankName;
      values.push(bankName);
    }
    if (routingNumber !== undefined) {
      if (routingNumber && routingNumber.length !== 9) {
        return res.status(400).json({ error: 'Routing number must be 9 digits' });
      }
      updates.routingNumber = routingNumber;
      values.push(routingNumber);
    }
    if (accountType !== undefined) {
      updates.accountType = accountType;
      values.push(accountType);
    }
    if (swiftCode !== undefined) {
      updates.swiftCode = swiftCode;
      values.push(swiftCode);
    }
    if (isDefault !== undefined) {
      updates.isDefault = isDefault;
      values.push(isDefault);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');

    values.push(id, userId);

    await pool.execute(
      `UPDATE payment_methods 
       SET ${setClause}, updatedAt = CURRENT_TIMESTAMP 
       WHERE id = ? AND userId = ? AND deletedAt IS NULL`,
      values
    );

    const [updated] = await pool.execute(
      `SELECT 
        id, type, details, isDefault, expiry,
        accountNumber, accountHolderName, bankName, routingNumber, accountType, swiftCode,
        createdAt, updatedAt
      FROM payment_methods WHERE id = ?`,
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    next(error);
  }
};

// Soft delete a payment method
export const deletePaymentMethod = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if payment method exists and belongs to user
    const [existing] = await pool.execute(
      'SELECT id, isDefault FROM payment_methods WHERE id = ? AND userId = ? AND deletedAt IS NULL',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // Check if this is the only payment method
    const [count] = await pool.execute(
      'SELECT COUNT(*) as count FROM payment_methods WHERE userId = ? AND deletedAt IS NULL',
      [userId]
    );

    if (count[0].count <= 1) {
      return res.status(400).json({ error: 'Cannot delete the only payment method' });
    }

    // If deleting default, set another as default
    if (existing[0].isDefault) {
      const [otherMethods] = await pool.execute(
        'SELECT id FROM payment_methods WHERE userId = ? AND id != ? AND deletedAt IS NULL LIMIT 1',
        [userId, id]
      );
      if (otherMethods.length > 0) {
        await pool.execute(
          'UPDATE payment_methods SET isDefault = TRUE WHERE id = ?',
          [otherMethods[0].id]
        );
      }
    }

    // Soft delete
    await pool.execute(
      'UPDATE payment_methods SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?',
      [id, userId]
    );

    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Set a payment method as default
export const setDefaultPaymentMethod = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if payment method exists and belongs to user
    const [existing] = await pool.execute(
      'SELECT id FROM payment_methods WHERE id = ? AND userId = ? AND deletedAt IS NULL',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // Unset all other defaults
    await pool.execute(
      'UPDATE payment_methods SET isDefault = FALSE WHERE userId = ? AND deletedAt IS NULL',
      [userId]
    );

    // Set this as default
    await pool.execute(
      'UPDATE payment_methods SET isDefault = TRUE WHERE id = ? AND userId = ?',
      [id, userId]
    );

    const [updated] = await pool.execute(
      `SELECT 
        id, type, details, isDefault, expiry,
        accountNumber, accountHolderName, bankName, routingNumber, accountType, swiftCode,
        createdAt, updatedAt
      FROM payment_methods WHERE id = ?`,
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    next(error);
  }
};

