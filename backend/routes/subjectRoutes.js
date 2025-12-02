import express from 'express';
import * as subjectsController from '../controllers/subjectsController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/', subjectsController.getAllSubjects);
router.get('/:id', subjectsController.getSubjectById);

// Admin only routes
router.post('/', authenticateToken, authorizeRoles('admin'), subjectsController.createSubject);

export default router;

