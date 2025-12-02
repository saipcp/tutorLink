import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { accessLogger, consoleLogger } from "./middleware/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import tutorRoutes from "./routes/tutorRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentMethodsRoutes from "./routes/paymentMethodsRoutes.js";
import paymentsRoutes from "./routes/paymentsRoutes.js";
import billingSettingsRoutes from "./routes/billingSettingsRoutes.js";
import userSettingsRoutes from "./routes/userSettingsRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const API_VERSION = process.env.API_VERSION || "v1";

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
if (process.env.NODE_ENV === "production") {
  app.use(accessLogger);
} else {
  app.use(consoleLogger);
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/tutors`, tutorRoutes);
app.use(`/api/${API_VERSION}/sessions`, sessionRoutes);
app.use(`/api/${API_VERSION}/reviews`, reviewRoutes);
app.use(`/api/${API_VERSION}/tasks`, taskRoutes);
app.use(`/api/${API_VERSION}/plans`, planRoutes);
app.use(`/api/${API_VERSION}/messages`, messageRoutes);
app.use(`/api/${API_VERSION}/subjects`, subjectRoutes);
app.use(`/api/${API_VERSION}/notifications`, notificationRoutes);
app.use(`/api/${API_VERSION}/dashboard`, dashboardRoutes);
app.use(`/api/${API_VERSION}/admin`, adminRoutes);
app.use(`/api/${API_VERSION}/payment-methods`, paymentMethodsRoutes);
app.use(`/api/${API_VERSION}/payments`, paymentsRoutes);
app.use(`/api/${API_VERSION}/billing-settings`, billingSettingsRoutes);
app.use(`/api/${API_VERSION}/user-settings`, userSettingsRoutes);
app.use(`/api/${API_VERSION}/ai`, aiRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize real-time socket server
import { initSocket } from "./utils/socket.js";
initSocket(server);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 API Version: ${API_VERSION}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api/${API_VERSION}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
