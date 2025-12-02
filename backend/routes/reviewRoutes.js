import express from 'express';
import * as reviewsController from '../controllers/reviewsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/tutor/:id', reviewsController.getReviewsByTutorId);

router.use(authenticateToken);

router.get('/', reviewsController.getReviewsForUser);
router.post('/', reviewsController.submitReview);

export default router;

