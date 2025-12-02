import pool from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role, phone } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    const userId = uuidv4();

    // Create user
    await pool.execute(
      `INSERT INTO users (id, firstName, lastName, email, password, role, phone) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, firstName, lastName, email, hashedPassword, role || 'student', phone || null]
    );

    // Create profile based on role
    if (role === 'tutor') {
      const tutorProfileId = uuidv4();
      await pool.execute(
        'INSERT INTO tutor_profiles (id, userId) VALUES (?, ?)',
        [tutorProfileId, userId]
      );
    } else if (role === 'student') {
      const studentProfileId = uuidv4();
      await pool.execute(
        'INSERT INTO student_profiles (id, userId) VALUES (?, ?)',
        [studentProfileId, userId]
      );
    }

    // Get created user
    const [users] = await pool.execute(
      'SELECT id, firstName, lastName, email, role, phone, createdAt, updatedAt FROM users WHERE id = ?',
      [userId]
    );

    const user = users[0];
    const token = generateToken(user.id, user.role);

    // Remove password from user object
    delete user.password;

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const [users] = await pool.execute(
      'SELECT id, firstName, lastName, email, password, role, phone, createdAt, updatedAt FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const [users] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      // Don't reveal if user exists or not for security
      return res.json({
        message: 'If an account exists with this email, password reset instructions have been sent'
      });
    }

    const userId = users[0].id;
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await pool.execute(
      `INSERT INTO password_reset_tokens (id, userId, token, expiresAt) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), userId, token, expiresAt]
    );

    // In production, send email with reset link
    console.log(`Password reset token for ${email}: ${token}`);

    // For development: return token in response (in production, token would be sent via email)
    const isDevelopment = process.env.NODE_ENV !== 'production';
    res.json({
      message: 'If an account exists with this email, password reset instructions have been sent',
      ...(isDevelopment && { token }) // Only include token in development mode
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Find valid token
    const [tokens] = await pool.execute(
      `SELECT userId FROM password_reset_tokens 
       WHERE token = ? AND expiresAt > NOW() AND used = FALSE`,
      [token]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const userId = tokens[0].userId;
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    // Mark token as used
    await pool.execute(
      'UPDATE password_reset_tokens SET used = TRUE WHERE token = ?',
      [token]
    );

    res.json({ message: 'Password has been successfully reset' });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, firstName, lastName, email, role, phone, avatar, createdAt, updatedAt FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    next(error);
  }
};

