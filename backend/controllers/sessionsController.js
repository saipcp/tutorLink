import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from '../utils/notifications.js';

export const getSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { status } = req.query;

    let query = `
      SELECT s.*,
        u1.firstName as tutorFirstName,
        u1.lastName as tutorLastName,
        u1.avatar as tutorAvatar,
        u2.firstName as studentFirstName,
        u2.lastName as studentLastName,
        u2.avatar as studentAvatar,
        sub.name as subjectName,
        t.name as topicName
      FROM sessions s
      LEFT JOIN tutor_profiles tp ON s.tutorId = tp.id
      LEFT JOIN users u1 ON tp.userId = u1.id
      LEFT JOIN users u2 ON s.studentId = u2.id
      LEFT JOIN subjects sub ON s.subjectId = sub.id
      LEFT JOIN topics t ON s.topicId = t.id
      WHERE ${role === 'tutor' ? 's.tutorId = (SELECT id FROM tutor_profiles WHERE userId = ?)' : 's.studentId = ?'}
    `;

    const params = [userId];

    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }

    query += ' ORDER BY s.startAt DESC';

    const [sessions] = await pool.execute(query, params);

    // Get session notes
    const sessionsWithNotes = await Promise.all(sessions.map(async (session) => {
      const [notes] = await pool.execute(
        'SELECT * FROM session_notes WHERE sessionId = ? ORDER BY createdAt',
        [session.id]
      );
      return { ...session, notes };
    }));

    res.json(sessionsWithNotes);
  } catch (error) {
    next(error);
  }
};

export const bookSession = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { tutorId, startAt, endAt, subjectId, topicId, notes } = req.body;

    if (!tutorId || !startAt || !endAt) {
      return res.status(400).json({ error: 'Tutor ID, start time, and end time are required' });
    }

    // Get tutor's hourly rate
    const [tutors] = await pool.execute(
      'SELECT hourlyRate FROM tutor_profiles WHERE id = ?',
      [tutorId]
    );

    if (tutors.length === 0) {
      return res.status(404).json({ error: 'Tutor not found' });
    }

    const hourlyRate = tutors[0].hourlyRate || 25; // Default rate
    const start = new Date(startAt);
    const end = new Date(endAt);
    const hours = (end - start) / (1000 * 60 * 60);
    const price = hourlyRate * hours;

    const sessionId = uuidv4();

    await pool.execute(
      `INSERT INTO sessions (id, tutorId, studentId, subjectId, topicId, startAt, endAt, status, price)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'booked', ?)`,
      [sessionId, tutorId, studentId, subjectId || null, topicId || null, startAt, endAt, price]
    );

    // Add notification for tutor
    const [tutorUserIdResult] = await pool.execute(
      'SELECT userId FROM tutor_profiles WHERE id = ?',
      [tutorId]
    );
    if (tutorUserIdResult.length > 0) {
      const tutorUserId = tutorUserIdResult[0].userId;
      
      // Get student info for notification
      const [studentInfo] = await pool.execute(
        'SELECT firstName, lastName FROM users WHERE id = ?',
        [studentId]
      );
      
      const studentName = studentInfo.length > 0 
        ? `${studentInfo[0].firstName} ${studentInfo[0].lastName}`
        : 'A student';
      
      await createNotification(
        tutorUserId,
        'new_booking',
        {
          sessionId,
          studentId,
          studentName,
          startAt,
          endAt,
          subjectId,
          topicId,
          price,
          message: `${studentName} booked a session with you`
        }
      );
    }

    // Add session note if provided
    if (notes) {
      await pool.execute(
        'INSERT INTO session_notes (id, sessionId, authorId, notes) VALUES (?, ?, ?, ?)',
        [uuidv4(), sessionId, studentId, notes]
      );
    }

    const [newSession] = await pool.execute(
      'SELECT * FROM sessions WHERE id = ?',
      [sessionId]
    );

    res.status(201).json(newSession[0]);
  } catch (error) {
    next(error);
  }
};

export const cancelSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify user has permission
    const [sessions] = await pool.execute(
      `SELECT s.*, tp.userId as tutorUserId,
              u1.firstName as tutorFirstName, u1.lastName as tutorLastName,
              u2.firstName as studentFirstName, u2.lastName as studentLastName
       FROM sessions s
       LEFT JOIN tutor_profiles tp ON s.tutorId = tp.id
       LEFT JOIN users u1 ON tp.userId = u1.id
       LEFT JOIN users u2 ON s.studentId = u2.id
       WHERE s.id = ?`,
      [id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessions[0];
    if (session.studentId !== userId && session.tutorUserId !== userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this session' });
    }

    await pool.execute(
      "UPDATE sessions SET status = 'canceled', updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    // Notify the other party about cancellation
    const isTutor = session.tutorUserId === userId;
    const notifyUserId = isTutor ? session.studentId : session.tutorUserId;
    const cancelerName = isTutor 
      ? `${session.tutorFirstName} ${session.tutorLastName}`
      : `${session.studentFirstName} ${session.studentLastName}`;

    await createNotification(
      notifyUserId,
      'session_canceled',
      {
        sessionId: id,
        canceledBy: userId,
        canceledByName: cancelerName,
        startAt: session.startAt,
        endAt: session.endAt,
        message: `${cancelerName} canceled a session`
      }
    );

    res.json({ message: 'Session canceled successfully' });
  } catch (error) {
    next(error);
  }
};

export const completeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    // Verify user is the tutor
    const [sessions] = await pool.execute(
      `SELECT s.*, tp.userId as tutorUserId,
              u1.firstName as tutorFirstName, u1.lastName as tutorLastName
       FROM sessions s
       LEFT JOIN tutor_profiles tp ON s.tutorId = tp.id
       LEFT JOIN users u1 ON tp.userId = u1.id
       WHERE s.id = ?`,
      [id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessions[0];
    if (session.tutorUserId !== userId) {
      return res.status(403).json({ error: 'Only the tutor can complete a session' });
    }

    await pool.execute(
      "UPDATE sessions SET status = 'completed', updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    if (notes) {
      await pool.execute(
        'INSERT INTO session_notes (id, sessionId, authorId, notes) VALUES (?, ?, ?, ?)',
        [uuidv4(), id, userId, notes]
      );
    }

    // Notify student that session is completed
    const tutorName = `${session.tutorFirstName} ${session.tutorLastName}`;
    await createNotification(
      session.studentId,
      'session_completed',
      {
        sessionId: id,
        tutorId: session.tutorId,
        tutorName,
        startAt: session.startAt,
        endAt: session.endAt,
        message: `${tutorName} marked your session as completed`
      }
    );

    res.json({ message: 'Session completed successfully' });
  } catch (error) {
    next(error);
  }
};

