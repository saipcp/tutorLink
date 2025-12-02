import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/student', authorizeRoles('student'), dashboardController.getStudentDashboard);
router.get('/tutor', authorizeRoles('tutor'), dashboardController.getTutorDashboard);

export default router;

