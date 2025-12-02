-- TutorLink Database Schema
-- MySQL Database Schema for Phase 3

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS tutorlink CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tutorlink;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('student', 'tutor', 'admin') NOT NULL DEFAULT 'student',
  avatar VARCHAR(500),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tutor profiles table
CREATE TABLE IF NOT EXISTS tutor_profiles (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  bio TEXT,
  rating DECIMAL(3,2) DEFAULT 0.00,
  hourlyRate DECIMAL(10,2),
  experience INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  grade VARCHAR(50),
  school VARCHAR(255),
  preferences JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
  id VARCHAR(36) PRIMARY KEY,
  subjectId VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE,
  INDEX idx_subjectId (subjectId),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tutor subjects (many-to-many)
CREATE TABLE IF NOT EXISTS tutor_subjects (
  tutorId VARCHAR(36) NOT NULL,
  subjectId VARCHAR(36) NOT NULL,
  PRIMARY KEY (tutorId, subjectId),
  FOREIGN KEY (tutorId) REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE,
  INDEX idx_tutorId (tutorId),
  INDEX idx_subjectId (subjectId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tutor languages
CREATE TABLE IF NOT EXISTS tutor_languages (
  tutorId VARCHAR(36) NOT NULL,
  language VARCHAR(50) NOT NULL,
  PRIMARY KEY (tutorId, language),
  FOREIGN KEY (tutorId) REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  INDEX idx_tutorId (tutorId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tutor education
CREATE TABLE IF NOT EXISTS tutor_education (
  id VARCHAR(36) PRIMARY KEY,
  tutorId VARCHAR(36) NOT NULL,
  degree VARCHAR(255) NOT NULL,
  institution VARCHAR(255),
  year INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tutorId) REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  INDEX idx_tutorId (tutorId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Availability slots
CREATE TABLE IF NOT EXISTS availability_slots (
  id VARCHAR(36) PRIMARY KEY,
  tutorId VARCHAR(36) NOT NULL,
  dayOfWeek ENUM('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun') NOT NULL,
  startTime TIME NOT NULL,
  endTime TIME NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tutorId) REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  INDEX idx_tutorId (tutorId),
  INDEX idx_dayOfWeek (dayOfWeek)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(36) PRIMARY KEY,
  tutorId VARCHAR(36) NOT NULL,
  studentId VARCHAR(36) NOT NULL,
  subjectId VARCHAR(36),
  topicId VARCHAR(36),
  startAt DATETIME NOT NULL,
  endAt DATETIME NOT NULL,
  status ENUM('booked', 'completed', 'canceled', 'no_show') DEFAULT 'booked',
  price DECIMAL(10,2),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tutorId) REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (topicId) REFERENCES topics(id) ON DELETE SET NULL,
  INDEX idx_tutorId (tutorId),
  INDEX idx_studentId (studentId),
  INDEX idx_status (status),
  INDEX idx_startAt (startAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Session notes
CREATE TABLE IF NOT EXISTS session_notes (
  id VARCHAR(36) PRIMARY KEY,
  sessionId VARCHAR(36) NOT NULL,
  authorId VARCHAR(36) NOT NULL,
  notes TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessionId (sessionId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(36) PRIMARY KEY,
  sessionId VARCHAR(36) NOT NULL,
  tutorId VARCHAR(36) NOT NULL,
  studentId VARCHAR(36) NOT NULL,
  rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (tutorId) REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tutorId (tutorId),
  INDEX idx_studentId (studentId),
  INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversation members
CREATE TABLE IF NOT EXISTS conversation_members (
  conversationId VARCHAR(36) NOT NULL,
  userId VARCHAR(36) NOT NULL,
  joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (conversationId, userId),
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) PRIMARY KEY,
  conversationId VARCHAR(36) NOT NULL,
  senderId VARCHAR(36) NOT NULL,
  body TEXT NOT NULL,
  sentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  isRead BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_conversationId (conversationId),
  INDEX idx_senderId (senderId),
  INDEX idx_sentAt (sentAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings table (generic key/value store for admin-configurable settings)
CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(100) PRIMARY KEY,
  value JSON NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  dueAt DATETIME,
  status ENUM('todo', 'in_progress', 'done') DEFAULT 'todo',
  estimatedMins INT,
  actualMins INT,
  subjectId VARCHAR(36),
  topicId VARCHAR(36),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (topicId) REFERENCES topics(id) ON DELETE SET NULL,
  INDEX idx_userId (userId),
  INDEX idx_status (status),
  INDEX idx_dueAt (dueAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Task comments
CREATE TABLE IF NOT EXISTS task_comments (
  id VARCHAR(36) PRIMARY KEY,
  taskId VARCHAR(36) NOT NULL,
  authorId VARCHAR(36) NOT NULL,
  body TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_taskId (taskId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Study plans table
CREATE TABLE IF NOT EXISTS study_plans (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  generatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  goalSummary TEXT,
  metadata JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Plan items table
CREATE TABLE IF NOT EXISTS plan_items (
  id VARCHAR(36) PRIMARY KEY,
  planId VARCHAR(36) NOT NULL,
  subjectId VARCHAR(36),
  topicId VARCHAR(36),
  title VARCHAR(255) NOT NULL,
  targetMins INT,
  dayIndex INT,
  completed BOOLEAN DEFAULT FALSE,
  metadata JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (planId) REFERENCES study_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (topicId) REFERENCES topics(id) ON DELETE SET NULL,
  INDEX idx_planId (planId),
  INDEX idx_completed (completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment methods table (USA standards)
CREATE TABLE IF NOT EXISTS payment_methods (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  type ENUM('card', 'ach', 'paypal', 'bank', 'wire') NOT NULL,
  details VARCHAR(255) NOT NULL,
  isDefault BOOLEAN DEFAULT FALSE,
  expiry VARCHAR(10),
  -- Bank account fields (USA standards)
  accountNumber VARCHAR(50),
  accountHolderName VARCHAR(255),
  bankName VARCHAR(255),
  routingNumber VARCHAR(9),
  accountType ENUM('checking', 'savings'),
  swiftCode VARCHAR(11),
  -- Soft delete
  deletedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_isDefault (isDefault),
  INDEX idx_deletedAt (deletedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY,
  sessionId VARCHAR(36) NOT NULL,
  payerId VARCHAR(36) NOT NULL,
  paymentMethodId VARCHAR(36),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  method ENUM('card', 'ach', 'paypal', 'bank', 'wire') DEFAULT 'card',
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  paidAt DATETIME,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (payerId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (paymentMethodId) REFERENCES payment_methods(id) ON DELETE SET NULL,
  INDEX idx_sessionId (sessionId),
  INDEX idx_payerId (payerId),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User settings table (notifications, privacy preferences)
CREATE TABLE IF NOT EXISTS user_settings (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL UNIQUE,
  -- Notification preferences
  emailNotifications BOOLEAN DEFAULT TRUE,
  pushNotifications BOOLEAN DEFAULT TRUE,
  sessionReminders BOOLEAN DEFAULT TRUE,
  newMessages BOOLEAN DEFAULT TRUE,
  weeklyReports BOOLEAN DEFAULT FALSE,
  -- Privacy preferences
  profileVisibility ENUM('public', 'students', 'private') DEFAULT 'public',
  showOnlineStatus BOOLEAN DEFAULT TRUE,
  allowMessages BOOLEAN DEFAULT TRUE,
  dataSharing BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Billing settings table
CREATE TABLE IF NOT EXISTS billing_settings (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL UNIQUE,
  billingName VARCHAR(255),
  billingEmail VARCHAR(255),
  billingAddress TEXT,
  monthlyInvoices BOOLEAN DEFAULT TRUE,
  autoPayment BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL,
  payload JSON,
  isRead BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_isRead (isRead),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expiresAt TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

