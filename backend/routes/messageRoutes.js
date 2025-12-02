import express from "express";
import * as messagingController from "../controllers/messagingController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/conversations", messagingController.getConversations);
router.get("/users", messagingController.getUsersForMessaging);
router.post("/conversations", messagingController.createConversation);
// Allow sending a message without an existing conversation ID - controller can create one if recipientId is provided
router.post("/conversations/messages", messagingController.sendMessage);
router.get(
  "/conversations/:conversationId/messages",
  messagingController.getMessages
);
router.post(
  "/conversations/:conversationId/messages",
  messagingController.sendMessage
);

export default router;
