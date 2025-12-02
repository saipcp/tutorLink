import express from 'express';
import * as paymentsController from '../controllers/paymentsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get transaction history for the authenticated user
router.get('/', paymentsController.getTransactions);

// Get a specific transaction
router.get('/:id', paymentsController.getTransactionById);

export default router;

