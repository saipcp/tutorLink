import express from 'express';
import * as tutorsController from '../controllers/tutorsController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/', tutorsController.getAllTutors);
router.get('/user/:userId', tutorsController.getTutorByUserId);
router.get('/:id', tutorsController.getTutorById);
router.get('/:id/reviews', tutorsController.getTutorReviews);

router.use(authenticateToken);
router.use(authorizeRoles('tutor'));

router.put('/profile', tutorsController.updateTutorProfile);

export default router;

