import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const getAllSubjects = async (req, res, next) => {
  try {
    const [subjects] = await pool.execute(
      'SELECT id, name FROM subjects ORDER BY name'
    );

    // Get topics for each subject
    const subjectsWithTopics = await Promise.all(subjects.map(async (subject) => {
      const [topics] = await pool.execute(
        'SELECT id, name FROM topics WHERE subjectId = ? ORDER BY name',
        [subject.id]
      );
      return { ...subject, topics };
    }));

    res.json(subjectsWithTopics);
  } catch (error) {
    next(error);
  }
};

export const getSubjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [subjects] = await pool.execute('SELECT * FROM subjects WHERE id = ?', [id]);

    if (subjects.length === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const [topics] = await pool.execute(
      'SELECT * FROM topics WHERE subjectId = ? ORDER BY name',
      [id]
    );

    res.json({ ...subjects[0], topics });
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (req, res, next) => {
  try {
    const { name, topics } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Subject name is required' });
    }

    // Check if subject already exists
    const [existing] = await pool.execute('SELECT id FROM subjects WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Subject already exists' });
    }

    const subjectId = uuidv4();

    // Create subject
    await pool.execute('INSERT INTO subjects (id, name) VALUES (?, ?)', [subjectId, name]);

    // Create topics if provided
    if (topics && Array.isArray(topics) && topics.length > 0) {
      for (const topicName of topics) {
        if (topicName.trim()) {
          await pool.execute(
            'INSERT INTO topics (id, subjectId, name) VALUES (?, ?, ?)',
            [uuidv4(), subjectId, topicName.trim()]
          );
        }
      }
    }

    // Get created subject with topics
    const [subjects] = await pool.execute('SELECT * FROM subjects WHERE id = ?', [subjectId]);
    const [topicRows] = await pool.execute(
      'SELECT * FROM topics WHERE subjectId = ? ORDER BY name',
      [subjectId]
    );

    res.status(201).json({ ...subjects[0], topics: topicRows });
  } catch (error) {
    next(error);
  }
};

