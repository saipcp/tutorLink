import express from 'express';
import * as tasksController from '../controllers/tasksController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', tasksController.getTasks);
router.post('/', tasksController.createTask);
router.put('/:id', tasksController.updateTask);
router.delete('/:id', tasksController.deleteTask);
router.post('/:id/comments', tasksController.addTaskComment);

export default router;

