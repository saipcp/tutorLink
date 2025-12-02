import express from "express";
import * as adminController from "../controllers/adminController.js";
import * as adminSettingsController from "../controllers/adminSettingsController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRoles("admin"));

router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.post("/users", adminController.createUser);
router.put("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);
router.get("/sessions", adminController.getAllSessions);
router.get("/stats", adminController.getAdminStats);
// Admin settings endpoints
router.get("/settings/:key", adminSettingsController.getSetting);
router.put("/settings/:key", adminSettingsController.setSetting);

export default router;
