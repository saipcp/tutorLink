import express from 'express';
import * as plansController from '../controllers/plansController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', plansController.getPlans);
router.post('/generate', plansController.generateStudyPlan);
router.put('/:planId/items/:itemId', plansController.updatePlanItem);
router.delete('/:id', plansController.deletePlan);

export default router;

