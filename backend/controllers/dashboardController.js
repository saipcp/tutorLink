import pool from '../config/database.js';

export const getStudentDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get upcoming sessions
    const [upcomingSessions] = await pool.execute(
      `SELECT s.*, tp.id as tutorProfileId, u.firstName as tutorFirstName, u.lastName as tutorLastName
       FROM sessions s
       LEFT JOIN tutor_profiles tp ON s.tutorId = tp.id
       LEFT JOIN users u ON tp.userId = u.id
       WHERE s.studentId = ? AND s.status = 'booked' AND s.startAt > NOW()
       ORDER BY s.startAt ASC
       LIMIT 5`,
      [userId]
    );

    // Get completed sessions
    const [completedSessions] = await pool.execute(
      `SELECT COUNT(*) as count FROM sessions WHERE studentId = ? AND status = 'completed'`,
      [userId]
    );

    // Get pending tasks
    const [pendingTasks] = await pool.execute(
      `SELECT COUNT(*) as count FROM tasks 
       WHERE userId = ? AND status IN ('todo', 'in_progress')`,
      [userId]
    );

    // Get completed tasks
    const [completedTasks] = await pool.execute(
      `SELECT COUNT(*) as count FROM tasks WHERE userId = ? AND status = 'done'`,
      [userId]
    );

    // Get active plans
    const [activePlans] = await pool.execute(
      `SELECT COUNT(*) as count FROM study_plans WHERE userId = ?`,
      [userId]
    );

    // Get unread notifications
    const [unreadNotifications] = await pool.execute(
      `SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = FALSE`,
      [userId]
    );

    // Get total study time
    const [studyTime] = await pool.execute(
      `SELECT COALESCE(SUM(actualMins), 0) as total FROM tasks WHERE userId = ? AND status = 'done'`,
      [userId]
    );

    res.json({
      upcomingSessions,
      completedSessions: parseInt(completedSessions[0].count),
      pendingTasks: parseInt(pendingTasks[0].count),
      completedTasks: parseInt(completedTasks[0].count),
      activePlans: parseInt(activePlans[0].count),
      unreadNotifications: parseInt(unreadNotifications[0].count),
      totalStudyTime: parseInt(studyTime[0].total) || 0
    });
  } catch (error) {
    next(error);
  }
};

export const getTutorDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get tutor profile ID
    const [tutors] = await pool.execute('SELECT id FROM tutor_profiles WHERE userId = ?', [userId]);
    if (tutors.length === 0) {
      return res.status(404).json({ error: 'Tutor profile not found' });
    }

    const tutorId = tutors[0].id;

    // Get upcoming sessions
    const [upcomingSessions] = await pool.execute(
      `SELECT s.*, u.firstName as studentFirstName, u.lastName as studentLastName
       FROM sessions s
       LEFT JOIN users u ON s.studentId = u.id
       WHERE s.tutorId = ? AND s.status = 'booked' AND s.startAt > NOW()
       ORDER BY s.startAt ASC
       LIMIT 5`,
      [tutorId]
    );

    // Get completed sessions
    const [completedSessions] = await pool.execute(
      `SELECT COUNT(*) as count FROM sessions WHERE tutorId = ? AND status = 'completed'`,
      [tutorId]
    );

    // Get total earnings
    const [earnings] = await pool.execute(
      `SELECT COALESCE(SUM(price), 0) as total FROM sessions WHERE tutorId = ? AND status = 'completed'`,
      [tutorId]
    );

    // Get average rating
    const [rating] = await pool.execute(
      'SELECT rating FROM tutor_profiles WHERE id = ?',
      [tutorId]
    );

    // Get total reviews
    const [reviews] = await pool.execute(
      `SELECT COUNT(*) as count FROM reviews WHERE tutorId = ?`,
      [tutorId]
    );

    // Get unread notifications
    const [unreadNotifications] = await pool.execute(
      `SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = FALSE`,
      [userId]
    );

    // Get availability
    const [availability] = await pool.execute(
      'SELECT * FROM availability_slots WHERE tutorId = ? AND isActive = TRUE',
      [tutorId]
    );

    res.json({
      upcomingSessions,
      completedSessions: parseInt(completedSessions[0].count),
      totalEarnings: parseFloat(earnings[0].total) || 0,
      averageRating: parseFloat(rating[0].rating) || 0,
      totalReviews: parseInt(reviews[0].count),
      unreadNotifications: parseInt(unreadNotifications[0].count),
      availability
    });
  } catch (error) {
    next(error);
  }
};

