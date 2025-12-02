import express from 'express';
import * as sessionsController from '../controllers/sessionsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', sessionsController.getSessions);
router.post('/', sessionsController.bookSession);
router.put('/:id/cancel', sessionsController.cancelSession);
router.put('/:id/complete', sessionsController.completeSession);

export default router;

