import express from 'express';
import * as billingSettingsController from '../controllers/billingSettingsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get billing settings for the authenticated user
router.get('/', billingSettingsController.getBillingSettings);

// Update billing settings for the authenticated user
router.put('/', billingSettingsController.updateBillingSettings);

export default router;

