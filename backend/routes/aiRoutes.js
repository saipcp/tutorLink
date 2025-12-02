import express from "express";
import * as aiController from "../controllers/aiController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// All AI routes require authentication
router.use(authenticateToken);

router.post("/chat", aiController.chatWithAiTutor);

export default router;

