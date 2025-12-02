import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const getAllTutors = async (req, res, next) => {
  try {
    const { subjects, minRating, maxPrice, minPrice } = req.query;

    let query = `
      SELECT 
        tp.id,
        tp.userId,
        tp.bio,
        tp.rating,
        tp.hourlyRate,
        tp.experience,
        u.firstName,
        u.lastName,
        u.email,
        u.avatar,
        GROUP_CONCAT(DISTINCT ts.subjectId) as subjectIds,
        GROUP_CONCAT(DISTINCT s.name) as subjects,
        GROUP_CONCAT(DISTINCT tl.language) as languages
      FROM tutor_profiles tp
      INNER JOIN users u ON tp.userId = u.id
      LEFT JOIN tutor_subjects ts ON tp.id = ts.tutorId
      LEFT JOIN subjects s ON ts.subjectId = s.id
      LEFT JOIN tutor_languages tl ON tp.id = tl.tutorId
      WHERE u.role = 'tutor'
    `;

    const conditions = [];
    const params = [];

    if (subjects) {
      const subjectArray = Array.isArray(subjects) ? subjects : [subjects];
      conditions.push('ts.subjectId IN (' + subjectArray.map(() => '?').join(',') + ')');
      params.push(...subjectArray);
    }

    if (minRating) {
      conditions.push('tp.rating >= ?');
      params.push(parseFloat(minRating));
    }

    if (minPrice) {
      conditions.push('tp.hourlyRate >= ?');
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      conditions.push('tp.hourlyRate <= ?');
      params.push(parseFloat(maxPrice));
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' GROUP BY tp.id';

    const [tutors] = await pool.execute(query, params);

    // Format response
    const formattedTutors = tutors.map(tutor => ({
      id: tutor.id,
      userId: tutor.userId,
      bio: tutor.bio,
      rating: parseFloat(tutor.rating) || 0,
      hourlyRate: tutor.hourlyRate ? parseFloat(tutor.hourlyRate) : null,
      experience: tutor.experience || 0,
      user: {
        id: tutor.userId,
        firstName: tutor.firstName,
        lastName: tutor.lastName,
        email: tutor.email,
        avatar: tutor.avatar,
        role: 'tutor'
      },
      subjects: tutor.subjects ? tutor.subjects.split(',') : [],
      languages: tutor.languages ? tutor.languages.split(',') : []
    }));

    res.json(formattedTutors);
  } catch (error) {
    next(error);
  }
};

export const getTutorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [tutors] = await pool.execute(
      `SELECT 
        tp.*,
        u.firstName,
        u.lastName,
        u.email,
        u.avatar
      FROM tutor_profiles tp
      INNER JOIN users u ON tp.userId = u.id
      WHERE tp.id = ?`,
      [id]
    );

    if (tutors.length === 0) {
      return res.status(404).json({ error: 'Tutor not found' });
    }

    const tutor = tutors[0];

    // Get subjects
    const [subjects] = await pool.execute(
      `SELECT s.id, s.name 
       FROM tutor_subjects ts
       INNER JOIN subjects s ON ts.subjectId = s.id
       WHERE ts.tutorId = ?`,
      [id]
    );

    // Get languages
    const [languages] = await pool.execute(
      'SELECT language FROM tutor_languages WHERE tutorId = ?',
      [id]
    );

    // Get education
    const [education] = await pool.execute(
      'SELECT degree, institution, year FROM tutor_education WHERE tutorId = ?',
      [id]
    );

    // Get availability
    const [availability] = await pool.execute(
      'SELECT id, dayOfWeek, startTime, endTime, isActive FROM availability_slots WHERE tutorId = ?',
      [id]
    );

    res.json({
      id: tutor.id,
      userId: tutor.userId,
      bio: tutor.bio,
      rating: parseFloat(tutor.rating) || 0,
      hourlyRate: tutor.hourlyRate ? parseFloat(tutor.hourlyRate) : null,
      experience: tutor.experience || 0,
      user: {
        id: tutor.userId,
        firstName: tutor.firstName,
        lastName: tutor.lastName,
        email: tutor.email,
        avatar: tutor.avatar,
        role: 'tutor'
      },
      subjects: subjects.map(s => s.name),
      languages: languages.map(l => l.language),
      education: education.map(e => {
        const parts = [];
        if (e.degree) parts.push(e.degree);
        if (e.institution) parts.push(e.institution);
        if (e.year) parts.push(`(${e.year})`);
        return parts.join(' - ') || 'Education not specified';
      }),
      availability: availability.map(a => ({
        id: a.id,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        isActive: Boolean(a.isActive)
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const updateTutorProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { bio, hourlyRate, experience, subjects, languages, education, availability } = req.body;

    // Get tutor profile ID
    const [tutors] = await pool.execute('SELECT id FROM tutor_profiles WHERE userId = ?', [userId]);
    if (tutors.length === 0) {
      return res.status(404).json({ error: 'Tutor profile not found' });
    }

    const tutorId = tutors[0].id;

    // Update basic profile
    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (hourlyRate !== undefined) updates.hourlyRate = hourlyRate;
    if (experience !== undefined) updates.experience = experience;

    if (Object.keys(updates).length > 0) {
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      await pool.execute(
        `UPDATE tutor_profiles SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [...values, tutorId]
      );
    }

    // Update subjects
    if (subjects && Array.isArray(subjects)) {
      await pool.execute('DELETE FROM tutor_subjects WHERE tutorId = ?', [tutorId]);
      for (const subjectId of subjects) {
        await pool.execute(
          'INSERT INTO tutor_subjects (tutorId, subjectId) VALUES (?, ?)',
          [tutorId, subjectId]
        );
      }
    }

    // Update languages
    if (languages && Array.isArray(languages)) {
      await pool.execute('DELETE FROM tutor_languages WHERE tutorId = ?', [tutorId]);
      for (const language of languages) {
        await pool.execute(
          'INSERT INTO tutor_languages (tutorId, language) VALUES (?, ?)',
          [tutorId, language]
        );
      }
    }

    // Update education
    if (education && Array.isArray(education)) {
      await pool.execute('DELETE FROM tutor_education WHERE tutorId = ?', [tutorId]);
      for (const edu of education) {
        await pool.execute(
          'INSERT INTO tutor_education (id, tutorId, degree, institution, year) VALUES (?, ?, ?, ?, ?)',
          [uuidv4(), tutorId, edu.degree, edu.institution || null, edu.year || null]
        );
      }
    }

    // Update availability
    if (availability && Array.isArray(availability)) {
      await pool.execute('DELETE FROM availability_slots WHERE tutorId = ?', [tutorId]);
      for (const slot of availability) {
        await pool.execute(
          'INSERT INTO availability_slots (id, tutorId, dayOfWeek, startTime, endTime, isActive) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), tutorId, slot.dayOfWeek, slot.startTime, slot.endTime, slot.isActive !== false]
        );
      }
    }

    // Return updated profile
    const [updatedTutors] = await pool.execute(
      `SELECT tp.*, u.firstName, u.lastName, u.email, u.avatar
       FROM tutor_profiles tp
       INNER JOIN users u ON tp.userId = u.id
       WHERE tp.id = ?`,
      [tutorId]
    );

    res.json(updatedTutors[0]);
  } catch (error) {
    next(error);
  }
};

export const getTutorByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const [tutors] = await pool.execute(
      `SELECT tp.*, u.firstName, u.lastName, u.email, u.avatar
       FROM tutor_profiles tp
       INNER JOIN users u ON tp.userId = u.id
       WHERE tp.userId = ?`,
      [userId]
    );

    if (tutors.length === 0) {
      return res.status(404).json({ error: 'Tutor profile not found' });
    }

    const tutor = tutors[0];
    const tutorId = tutor.id;

    // Get subjects
    const [subjects] = await pool.execute(
      `SELECT s.id, s.name 
       FROM tutor_subjects ts
       INNER JOIN subjects s ON ts.subjectId = s.id
       WHERE ts.tutorId = ?`,
      [tutorId]
    );

    // Get languages
    const [languages] = await pool.execute(
      'SELECT language FROM tutor_languages WHERE tutorId = ?',
      [tutorId]
    );

    // Get education
    const [education] = await pool.execute(
      'SELECT degree, institution, year FROM tutor_education WHERE tutorId = ?',
      [tutorId]
    );

    // Get availability
    const [availability] = await pool.execute(
      'SELECT id, dayOfWeek, startTime, endTime, isActive FROM availability_slots WHERE tutorId = ?',
      [tutorId]
    );

    res.json({
      id: tutor.id,
      userId: tutor.userId,
      bio: tutor.bio,
      rating: parseFloat(tutor.rating) || 0,
      hourlyRate: tutor.hourlyRate ? parseFloat(tutor.hourlyRate) : null,
      experience: tutor.experience || 0,
      user: {
        id: tutor.userId,
        firstName: tutor.firstName,
        lastName: tutor.lastName,
        email: tutor.email,
        avatar: tutor.avatar,
        role: 'tutor'
      },
      subjects: subjects.map(s => s.name),
      languages: languages.map(l => l.language),
      education: education.map(e => {
        const parts = [];
        if (e.degree) parts.push(e.degree);
        if (e.institution) parts.push(e.institution);
        if (e.year) parts.push(`(${e.year})`);
        return parts.join(' - ') || 'Education not specified';
      }),
      availability: availability.map(a => ({
        id: a.id,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        isActive: Boolean(a.isActive)
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const getTutorReviews = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [reviews] = await pool.execute(
      `SELECT r.*, u.firstName, u.lastName, u.avatar as studentAvatar
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

