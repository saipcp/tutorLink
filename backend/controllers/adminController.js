import pool from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { v4 as uuidv4 } from 'uuid';

export const getAllUsers = async (req, res, next) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, firstName, lastName, email, role, phone, avatar, createdAt, updatedAt FROM users ORDER BY createdAt DESC'
    );

    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute(
      'SELECT id, firstName, lastName, email, role, phone, avatar, createdAt, updatedAt FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
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

    res.status(201).json(users[0]);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, phone } = req.body;

    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (phone !== undefined) updates.phone = phone;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    await pool.execute(
      `UPDATE users SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, id]
    );

    const [users] = await pool.execute(
      'SELECT id, firstName, lastName, email, role, phone, avatar, createdAt, updatedAt FROM users WHERE id = ?',
      [id]
    );

    res.json(users[0]);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user (cascade will handle related records)
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAllSessions = async (req, res, next) => {
  try {
    const query = `
      SELECT s.*,
        u1.firstName as tutorFirstName,
        u1.lastName as tutorLastName,
        u1.email as tutorEmail,
        u2.firstName as studentFirstName,
        u2.lastName as studentLastName,
        u2.email as studentEmail,
        sub.name as subjectName,
        t.name as topicName
      FROM sessions s
      LEFT JOIN tutor_profiles tp ON s.tutorId = tp.id
      LEFT JOIN users u1 ON tp.userId = u1.id
      LEFT JOIN users u2 ON s.studentId = u2.id
      LEFT JOIN subjects sub ON s.subjectId = sub.id
      LEFT JOIN topics t ON s.topicId = t.id
      ORDER BY s.startAt DESC
      LIMIT 100
    `;

    const [sessions] = await pool.execute(query);

    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

export const getAdminStats = async (req, res, next) => {
  try {
    // Get total users
    const [totalUsers] = await pool.execute('SELECT COUNT(*) as count FROM users');
    
    // Get users by role
    const [students] = await pool.execute("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const [tutors] = await pool.execute("SELECT COUNT(*) as count FROM users WHERE role = 'tutor'");
    const [admins] = await pool.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");

    // Get total sessions
    const [totalSessions] = await pool.execute('SELECT COUNT(*) as count FROM sessions');
    const [completedSessions] = await pool.execute("SELECT COUNT(*) as count FROM sessions WHERE status = 'completed'");

    // Get total subjects
    const [totalSubjects] = await pool.execute('SELECT COUNT(*) as count FROM subjects');

    // Get total reviews
    const [totalReviews] = await pool.execute('SELECT COUNT(*) as count FROM reviews');
    const [avgRating] = await pool.execute('SELECT AVG(rating) as avg FROM reviews');

    res.json({
      totalUsers: parseInt(totalUsers[0].count),
      students: parseInt(students[0].count),
      tutors: parseInt(tutors[0].count),
      admins: parseInt(admins[0].count),
      totalSessions: parseInt(totalSessions[0].count),
      completedSessions: parseInt(completedSessions[0].count),
      totalSubjects: parseInt(totalSubjects[0].count),
      totalReviews: parseInt(totalReviews[0].count),
      averageRating: parseFloat(avgRating[0].avg) || 0
    });
  } catch (error) {
    next(error);
  }
};

