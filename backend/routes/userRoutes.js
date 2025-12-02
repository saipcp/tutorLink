import express from 'express';
import * as usersController from '../controllers/usersController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.put('/profile', usersController.updateProfile);
router.put('/password', usersController.updatePassword);

export default router;

