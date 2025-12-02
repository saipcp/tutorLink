import express from 'express';
import * as userSettingsController from '../controllers/userSettingsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user settings for the authenticated user
router.get('/', userSettingsController.getUserSettings);

// Update user settings for the authenticated user
router.put('/', userSettingsController.updateUserSettings);

export default router;

