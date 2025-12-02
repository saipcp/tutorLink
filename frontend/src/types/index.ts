// Core entity types based on database schema

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  role: "student" | "tutor" | "admin";
  avatar?: string;
}

export interface TutorProfile {
  id: string;
  userId: string;
  bio?: string;
  rating: number;
  hourlyRate?: number;
  createdAt: string;
  updatedAt: string;
  subjects: string[];
  languages: string[];
  experience: number; // years
  education: string[];
  availability: AvailabilitySlot[];
}

export interface StudentProfile {
  id: string;
  userId: string;
  grade?: string;
  school?: string;
  preferences?: {
    subjects: string[];
    learningStyle: string[];
    goals: string[];
  };
}

export interface Subject {
  id: string;
  name: string;
  topics: Topic[];
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
}

export interface AvailabilitySlot {
  id: string;
  tutorId: string;
  dayOfWeek: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  startTime: string; // HH:MM format
  endTime: string;
  isActive: boolean;
}

export interface Session {
  id: string;
  tutorId: string;
  studentId: string;
  subjectId?: string;
  topicId?: string;
  startAt: string;
  endAt: string;
  status: "booked" | "completed" | "canceled" | "no_show";
  price?: number;
  createdAt: string;
  updatedAt: string;
  notes?: SessionNote[];
  review?: Review;
}

export interface SessionNote {
  id: string;
  sessionId: string;
  authorId: string;
  notes: string;
  createdAt: string;
}

export interface Review {
  id: string;
  sessionId: string;
  tutorId: string;
  studentId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title?: string;
  createdAt: string;
  members: ConversationMember[];
  lastMessage?: Message;
}

export interface ConversationMember {
  conversationId: string;
  userId: string;
  joinedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  sentAt: string;
  isRead: boolean;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  payload?: any;
  isRead: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  dueAt?: string;
  status: "todo" | "in_progress" | "done";
  estimatedMins?: number;
  actualMins?: number;
  createdAt: string;
  updatedAt: string;
  comments: TaskComment[];
  subjectId?: string;
  topicId?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface Plan {
  id: string;
  userId: string;
  generatedAt: string;
  goalSummary?: string;
  createdAt: string;
  updatedAt: string;
  items: PlanItem[];
  metadata?: {
    adaptiveLevel?: string;
    totalHours?: number;
    subjects?: string[];
    goals?: string[];
    generatedBy?: string;
    [key: string]: any;
  };
}

export interface PlanItem {
  id: string;
  planId: string;
  subjectId?: string;
  topicId?: string;
  title: string;
  targetMins?: number;
  dayIndex?: number;
  completed: boolean;
  metadata?: {
    sessionType?: "theory" | "practice" | "review" | "assessment";
    difficulty?: number;
    adaptivePath?: string;
    isMilestone?: boolean;
    [key: string]: any;
  };
}

export interface Payment {
  id: string;
  sessionId: string;
  payerId: string;
  amount: number;
  currency: string;
  method: "card" | "upi" | "paypal" | "other";
  status: "pending" | "completed" | "failed" | "refunded";
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// UI-specific types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface FilterOptions {
  subjects: string[];
  priceRange: [number, number];
  rating: number;
  availability: string[];
  languages: string[];
}

export interface BookingRequest {
  tutorId: string;
  startAt: string;
  endAt: string;
  subjectId?: string;
  topicId?: string;
  notes?: string;
}

export interface AIStudyPlanRequest {
  subjects: string[];
  topics: string[];
  duration: number; // days
  dailyHours: number;
  goals: string[];
  currentLevel: string;
}
