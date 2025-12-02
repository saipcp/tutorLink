import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from '../utils/notifications.js';

export const submitReview = async (req, res, next) => {
  try {
    const { sessionId, rating, comment } = req.body;
    const studentId = req.user.id;

    if (!sessionId || !rating) {
      return res.status(400).json({ error: 'Session ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify session exists and belongs to student
    const [sessions] = await pool.execute(
      'SELECT tutorId, studentId FROM sessions WHERE id = ?',
      [sessionId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (sessions[0].studentId !== studentId) {
      return res.status(403).json({ error: 'You can only review your own sessions' });
    }

    // Check if review already exists
    const [existingReviews] = await pool.execute(
      'SELECT id FROM reviews WHERE sessionId = ?',
      [sessionId]
    );

    if (existingReviews.length > 0) {
      return res.status(409).json({ error: 'Review already exists for this session' });
    }

    const tutorId = sessions[0].tutorId;
    const reviewId = uuidv4();

    await pool.execute(
      `INSERT INTO reviews (id, sessionId, tutorId, studentId, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [reviewId, sessionId, tutorId, studentId, rating, comment || null]
    );

    // Update tutor rating
    const [reviews] = await pool.execute(
      'SELECT AVG(rating) as avgRating FROM reviews WHERE tutorId = ?',
      [tutorId]
    );

    const avgRating = parseFloat(reviews[0].avgRating) || 0;

    await pool.execute(
      'UPDATE tutor_profiles SET rating = ? WHERE id = ?',
      [avgRating, tutorId]
    );

    // Get tutor user ID and student info for notification
    const [tutorInfo] = await pool.execute(
      `SELECT tp.userId, u.firstName as tutorFirstName, u.lastName as tutorLastName
       FROM tutor_profiles tp
       LEFT JOIN users u ON tp.userId = u.id
       WHERE tp.id = ?`,
      [tutorId]
    );

    const [studentInfo] = await pool.execute(
      'SELECT firstName, lastName FROM users WHERE id = ?',
      [studentId]
    );

    if (tutorInfo.length > 0) {
      const tutorUserId = tutorInfo[0].userId;
      const studentName = studentInfo.length > 0 
        ? `${studentInfo[0].firstName} ${studentInfo[0].lastName}`
        : 'A student';

      // Notify tutor about new review
      await createNotification(
        tutorUserId,
        'new_review',
        {
          reviewId,
          sessionId,
          tutorId,
          studentId,
          studentName,
          rating,
          comment: comment || null,
          newRating: avgRating,
          message: `${studentName} left you a ${rating}-star review`
        }
      );
    }

    const [newReview] = await pool.execute(
      'SELECT * FROM reviews WHERE id = ?',
      [reviewId]
    );

    res.status(201).json(newReview[0]);
  } catch (error) {
    next(error);
  }
};

export const getReviewsForUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let query = `
      SELECT r.*,
        u1.firstName as tutorFirstName,
        u1.lastName as tutorLastName,
        u2.firstName as studentFirstName,
        u2.lastName as studentLastName
      FROM reviews r
      LEFT JOIN tutor_profiles tp ON r.tutorId = tp.id
      LEFT JOIN users u1 ON tp.userId = u1.id
      LEFT JOIN users u2 ON r.studentId = u2.id
      WHERE ${role === 'tutor' ? 'r.tutorId = (SELECT id FROM tutor_profiles WHERE userId = ?)' : 'r.studentId = ?'}
      ORDER BY r.createdAt DESC
    `;

    const [reviews] = await pool.execute(query, [userId]);

    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

export const getReviewsByTutorId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [reviews] = await pool.execute(
      `SELECT r.*,
        u.firstName as studentFirstName,
        u.lastName as studentLastName,
        u.avatar as studentAvatar
       FROM reviews r
       INNER JOIN users u ON r.studentId = u.id
       WHERE r.tutorId = ?
       ORDER BY r.createdAt DESC`,
      [id]
    );

    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

