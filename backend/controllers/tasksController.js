import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from '../utils/notifications.js';

export const getTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT t.*,
        s.name as subjectName,
        top.name as topicName
      FROM tasks t
      LEFT JOIN subjects s ON t.subjectId = s.id
      LEFT JOIN topics top ON t.topicId = top.id
      WHERE t.userId = ?
    `;

    const params = [userId];

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    query += ' ORDER BY t.createdAt DESC';

    const [tasks] = await pool.execute(query, params);

    // Get comments for each task
    const tasksWithComments = await Promise.all(tasks.map(async (task) => {
      const [comments] = await pool.execute(
        `SELECT tc.*, u.firstName, u.lastName
         FROM task_comments tc
         LEFT JOIN users u ON tc.authorId = u.id
         WHERE tc.taskId = ?
         ORDER BY tc.createdAt`,
        [task.id]
      );
      return { ...task, comments };
    }));

    res.json(tasksWithComments);
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, dueAt, status, estimatedMins, subjectId, topicId } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const taskId = uuidv4();

    await pool.execute(
      `INSERT INTO tasks (id, userId, title, dueAt, status, estimatedMins, subjectId, topicId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskId,
        userId,
        title,
        dueAt || null,
        status || 'todo',
        estimatedMins || null,
        subjectId || null,
        topicId || null
      ]
    );

    const [newTask] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [taskId]);

    res.status(201).json({ ...newTask[0], comments: [] });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, dueAt, status, estimatedMins, actualMins, subjectId, topicId } = req.body;

    // Verify ownership
    const [tasks] = await pool.execute('SELECT userId FROM tasks WHERE id = ?', [id]);
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (tasks[0].userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (dueAt !== undefined) updates.dueAt = dueAt;
    if (status !== undefined) updates.status = status;
    if (estimatedMins !== undefined) updates.estimatedMins = estimatedMins;
    if (actualMins !== undefined) updates.actualMins = actualMins;
    
    // Validate subjectId if provided
    if (subjectId !== undefined) {
      if (subjectId === null || subjectId === '') {
        // Allow setting to null or empty string (which becomes null)
        updates.subjectId = null;
      } else {
        // Validate that the subject exists
        const [subjects] = await pool.execute('SELECT id FROM subjects WHERE id = ?', [subjectId]);
        if (subjects.length === 0) {
          return res.status(400).json({ error: 'Invalid subjectId: subject does not exist' });
        }
        updates.subjectId = subjectId;
      }
    }
    
    // Validate topicId if provided
    if (topicId !== undefined) {
      if (topicId === null || topicId === '') {
        // Allow setting to null or empty string (which becomes null)
        updates.topicId = null;
      } else {
        // Validate that the topic exists
        const [topics] = await pool.execute('SELECT id FROM topics WHERE id = ?', [topicId]);
        if (topics.length === 0) {
          return res.status(400).json({ error: 'Invalid topicId: topic does not exist' });
        }
        updates.topicId = topicId;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    await pool.execute(
      `UPDATE tasks SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, id]
    );

    const [updatedTask] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [id]);
    const [comments] = await pool.execute(
      `SELECT tc.*, u.firstName, u.lastName
       FROM task_comments tc
       LEFT JOIN users u ON tc.authorId = u.id
       WHERE tc.taskId = ?
       ORDER BY tc.createdAt`,
      [id]
    );

    res.json({ ...updatedTask[0], comments });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const [tasks] = await pool.execute('SELECT userId FROM tasks WHERE id = ?', [id]);
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (tasks[0].userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.execute('DELETE FROM tasks WHERE id = ?', [id]);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const addTaskComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { body } = req.body;

    if (!body) {
      return res.status(400).json({ error: 'Comment body is required' });
    }

    // Verify task exists
    const [tasks] = await pool.execute('SELECT id FROM tasks WHERE id = ?', [id]);
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const commentId = uuidv4();

    await pool.execute(
      'INSERT INTO task_comments (id, taskId, authorId, body) VALUES (?, ?, ?, ?)',
      [commentId, id, userId, body]
    );

    const [newComment] = await pool.execute(
      `SELECT tc.*, u.firstName, u.lastName
       FROM task_comments tc
       LEFT JOIN users u ON tc.authorId = u.id
       WHERE tc.id = ?`,
      [commentId]
    );

    res.status(201).json(newComment[0]);
  } catch (error) {
    next(error);
  }
};

