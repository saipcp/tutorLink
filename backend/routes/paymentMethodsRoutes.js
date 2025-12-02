import express from 'express';
import * as paymentMethodsController from '../controllers/paymentMethodsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all payment methods for the authenticated user
router.get('/', paymentMethodsController.getPaymentMethods);

// Get a specific payment method
router.get('/:id', paymentMethodsController.getPaymentMethodById);

// Create a new payment method
router.post('/', paymentMethodsController.createPaymentMethod);

// Update a payment method
router.put('/:id', paymentMethodsController.updatePaymentMethod);

// Soft delete a payment method
router.delete('/:id', paymentMethodsController.deletePaymentMethod);

// Set a payment method as default
router.put('/:id/default', paymentMethodsController.setDefaultPaymentMethod);

export default router;

