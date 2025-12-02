import {
  User,
  TutorProfile,
  StudentProfile,
  Subject,
  Topic,
  Session,
  Review,
  Conversation,
  Message,
  Task,
  Plan,
  PlanItem,
  Notification,
  AvailabilitySlot,
  AuthState,
  FilterOptions,
  BookingRequest,
  AIStudyPlanRequest,
} from "../types";

import {
  mockUsers,
  mockTutorProfiles,
  mockStudentProfiles,
  mockSubjects,
  mockSessions,
  mockReviews,
  mockConversations,
  mockMessages,
  mockTasks,
  mockPlans,
  mockNotifications,
  mockApiDelay,
  getUserById,
  getTutorProfileByUserId,
  getStudentProfileByUserId,
  getSessionsByUserId,
  getReviewsByTutorId,
  getConversationsByUserId,
  getTasksByUserId,
  getPlansByUserId,
  getNotificationsByUserId,
} from "./mockData";

// In-memory storage for mutable data (simulating database)
let sessions = [...mockSessions];
let reviews = [...mockReviews];
let conversations = [...mockConversations];
let messages = [...mockMessages];
let tasks = [...mockTasks];
let plans = [...mockPlans];
let notifications = [...mockNotifications];
let users = [...mockUsers];
let tutorProfiles = [...mockTutorProfiles];
let studentProfiles = [...mockStudentProfiles];

// Authentication API
export const authApi = {
  async login(email: string, password: string): Promise<AuthState> {
    await mockApiDelay();

    const user = users.find((u) => u.email === email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // For demo purposes, accept any password
    return {
      user,
      isAuthenticated: true,
      loading: false,
    };
  },

  async logout(): Promise<void> {
    await mockApiDelay();
  },

  async register(userData: Partial<User>): Promise<User> {
    await mockApiDelay();

    const newUser: User = {
      id: (users.length + 1).toString(),
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      email: userData.email || "",
      phone: userData.phone,
      role: userData.role || "student",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      avatar: userData.avatar,
    };

    users.push(newUser);
    return newUser;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    await mockApiDelay();

    const user = users.find((u) => u.email === email);
    if (!user) {
      throw new Error("No account found with this email address");
    }

    // In a real app, this would send an email with a reset token
    console.log(`Password reset email sent to ${email}`);
    return {
      message: "Password reset instructions have been sent to your email",
    };
  },

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    await mockApiDelay();

    // In a real app, this would validate the token and update the password
    // For demo purposes, we'll just return success
    console.log(`Password reset with token: ${token}`);
    return {
      message: "Password has been successfully reset",
    };
  },
};

// Users API
export const usersApi = {
  async getCurrentUser(): Promise<User> {
    await mockApiDelay();
    // In a real app, this would get from auth context
    // For demo purposes, return student user by default
    // This should be replaced with actual auth context in real app
    return users.find((u) => u.role === "student") || users[0];
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    await mockApiDelay();

    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) throw new Error("User not found");

    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return users[userIndex];
  },
};

// Tutors API
export const tutorsApi = {
  async getAllTutors(
    filters?: FilterOptions
  ): Promise<(TutorProfile & { user: User })[]> {
    await mockApiDelay();

    let filtered = [...tutorProfiles];

    if (filters?.subjects.length) {
      filtered = filtered.filter((tutor) =>
        filters.subjects.some((subject) => tutor.subjects.includes(subject))
      );
    }

    if (filters?.priceRange) {
      filtered = filtered.filter(
        (tutor) =>
          tutor.hourlyRate &&
          tutor.hourlyRate >= filters.priceRange[0] &&
          tutor.hourlyRate <= filters.priceRange[1]
      );
    }

    if (filters?.rating) {
      filtered = filtered.filter((tutor) => tutor.rating >= filters.rating);
    }

    // Add user data to each tutor profile
    const tutorsWithUsers = filtered.map((profile) => {
      const user = getUserById(profile.userId);
      if (!user) {
        // Handle case where user doesn't exist
        return {
          ...profile,
          user: {
            id: profile.userId,
            firstName: "Unknown",
            lastName: "User",
            email: "",
            role: "tutor",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as User,
        };
      }
      return { ...profile, user };
    });

    return tutorsWithUsers;
  },

  async getTutorById(tutorId: string): Promise<TutorProfile & { user: User }> {
    await mockApiDelay();

    const profile = tutorProfiles.find((p) => p.id === tutorId);
    if (!profile) throw new Error("Tutor not found");

    const user = getUserById(profile.userId);
    if (!user) throw new Error("User not found");

    return { ...profile, user };
  },

  async getTutorReviews(tutorId: string): Promise<Review[]> {
    await mockApiDelay();
    return getReviewsByTutorId(tutorId);
  },

  async updateAvailability(
    tutorId: string,
    availability: AvailabilitySlot[]
  ): Promise<void> {
    await mockApiDelay();

    const profile = tutorProfiles.find((p) => p.id === tutorId);
    if (profile) {
      profile.availability = availability;
    }
  },
};

// Sessions API
export const sessionsApi = {
  async getSessions(
    userId: string,
    role: "student" | "tutor"
  ): Promise<Session[]> {
    await mockApiDelay();
    return getSessionsByUserId(userId, role);
  },

  async bookSession(booking: BookingRequest): Promise<Session> {
    await mockApiDelay();

    const currentUser = users.find((u) => u.role === "student") || users[0];
    const newSession: Session = {
      id: (sessions.length + 1).toString(),
      tutorId: booking.tutorId,
      studentId: currentUser.id, // Current user
      subjectId: booking.subjectId,
      topicId: booking.topicId,
      startAt: booking.startAt,
      endAt: booking.endAt,
      status: "booked",
      price: 25, // Default price, should come from tutor
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    sessions.push(newSession);

    // Add notification for tutor
    const notification: Notification = {
      id: (notifications.length + 1).toString(),
      userId: booking.tutorId,
      type: "new_booking",
      payload: {
        sessionId: newSession.id,
        message: "New student booked a session",
      },
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    notifications.push(notification);

    return newSession;
  },

  async cancelSession(sessionId: string): Promise<void> {
    await mockApiDelay();

    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      session.status = "canceled";
      session.updatedAt = new Date().toISOString();
    }
  },

  async completeSession(sessionId: string, notes?: string): Promise<void> {
    await mockApiDelay();

    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      session.status = "completed";
      session.updatedAt = new Date().toISOString();

      if (notes) {
        // Add session notes (simplified)
        console.log("Session notes added:", notes);
      }
    }
  },
};

// Reviews API
// Students API
export const studentsApi = {
  async getStudentProfile(userId: string): Promise<StudentProfile | null> {
    await mockApiDelay();
    return getStudentProfileByUserId(userId);
  },

  async updateStudentProfile(
    userId: string,
    updates: Partial<StudentProfile>
  ): Promise<StudentProfile> {
    await mockApiDelay();

    let profile = studentProfiles.find((p) => p.userId === userId);
    if (!profile) {
      profile = {
        id: (studentProfiles.length + 1).toString(),
        userId,
        grade: updates.grade,
        school: updates.school,
        preferences: updates.preferences || {
          subjects: [],
          learningStyle: [],
          goals: [],
        },
      };
      studentProfiles.push(profile);
    } else {
      Object.assign(profile, updates);
    }

    return profile;
  },
};

export const reviewsApi = {
  async submitReview(
    sessionId: string,
    rating: number,
    comment?: string
  ): Promise<Review> {
    await mockApiDelay();

    const session = sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error("Session not found");

    const newReview: Review = {
      id: (reviews.length + 1).toString(),
      sessionId,
      tutorId: session.tutorId,
      studentId: session.studentId,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };

    reviews.push(newReview);

    // Update tutor rating
    const tutorReviews = getReviewsByTutorId(session.tutorId);
    const avgRating =
      tutorReviews.reduce((sum, r) => sum + r.rating, 0) / tutorReviews.length;

    const tutorProfile = tutorProfiles.find((p) => p.id === session.tutorId);
    if (tutorProfile) {
      tutorProfile.rating = Math.round(avgRating * 10) / 10;
    }

    return newReview;
  },

  async getReviewsForUser(userId: string): Promise<Review[]> {
    await mockApiDelay();

    // Get reviews where the user is either the tutor or student
    const userReviews = reviews.filter(
      (review) => review.tutorId === userId || review.studentId === userId
    );

    return userReviews;
  },

  async getReviewsByTutorId(tutorId: string): Promise<Review[]> {
    await mockApiDelay();
    return getReviewsByTutorId(tutorId);
  },
};

// Messaging API
export const messagingApi = {
  async getConversations(userId: string): Promise<Conversation[]> {
    await mockApiDelay();
    return getConversationsByUserId(userId);
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    await mockApiDelay();
    return messages.filter((m) => m.conversationId === conversationId);
  },

  async sendMessage(conversationId: string, body: string): Promise<Message> {
    await mockApiDelay();

    const currentUser = users.find((u) => u.role === "student") || users[0];
    const newMessage: Message = {
      id: (messages.length + 1).toString(),
      conversationId,
      senderId: currentUser.id, // Current user
      body,
      sentAt: new Date().toISOString(),
      isRead: false,
    };

    messages.push(newMessage);

    // Update conversation's last message
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      conversation.lastMessage = newMessage;
    }

    return newMessage;
  },
};

// Tasks API
export const tasksApi = {
  async getTasks(userId: string): Promise<Task[]> {
    await mockApiDelay();
    return getTasksByUserId(userId);
  },

  async createTask(
    task: Omit<Task, "id" | "createdAt" | "updatedAt" | "comments">
  ): Promise<Task> {
    await mockApiDelay();

    const newTask: Task = {
      ...task,
      id: (tasks.length + 1).toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
    };

    tasks.push(newTask);
    return newTask;
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    await mockApiDelay();

    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) throw new Error("Task not found");

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return tasks[taskIndex];
  },

  async deleteTask(taskId: string): Promise<void> {
    await mockApiDelay();
    tasks = tasks.filter((t) => t.id !== taskId);
  },
};

// Study Plans API
export const plansApi = {
  async getPlans(userId: string): Promise<Plan[]> {
    await mockApiDelay();
    return getPlansByUserId(userId);
  },

  async generateStudyPlan(request: AIStudyPlanRequest): Promise<Plan> {
    await mockApiDelay();

    // Enhanced AI plan generation with adaptive learning paths
    const subjects = mockSubjects.filter((s) =>
      request.subjects.includes(s.name)
    );
    const planItems: PlanItem[] = [];

    // Calculate study intensity based on current level and goals
    const studyIntensity =
      request.currentLevel === "beginner"
        ? 1.2
        : request.currentLevel === "intermediate"
        ? 1.0
        : 0.8;

    // Adaptive topic ordering based on difficulty and dependencies
    const topicDifficulty = {
      Mathematics: {
        "Basic Algebra": 1,
        Geometry: 2,
        Calculus: 3,
        Statistics: 2,
      },
      Physics: { Mechanics: 1, Thermodynamics: 2, Electricity: 2, Quantum: 3 },
      Chemistry: {
        "Atomic Structure": 1,
        "Chemical Bonds": 2,
        "Organic Chemistry": 3,
      },
    };

    subjects.forEach((subject, subjectIndex) => {
      const subjectTopics = subject.topics.slice().sort((a, b) => {
        const diffA =
          topicDifficulty[subject.name as keyof typeof topicDifficulty]?.[
            a.name
          ] || 1;
        const diffB =
          topicDifficulty[subject.name as keyof typeof topicDifficulty]?.[
            b.name
          ] || 1;
        return diffA - diffB;
      });

      subjectTopics.forEach((topic, topicIndex) => {
        const dayIndex = Math.floor(
          (topicIndex * request.duration) / subjectTopics.length
        );
        const baseTargetMins =
          ((request.dailyHours * 60) / request.subjects.length) *
          studyIntensity;

        // Add practice and review sessions
        const sessions = [
          {
            title: `📚 Learn ${topic.name} - Theory`,
            type: "theory",
            targetMins: Math.round(baseTargetMins * 0.6),
          },
          {
            title: `✏️ Practice ${topic.name} - Exercises`,
            type: "practice",
            targetMins: Math.round(baseTargetMins * 0.4),
          },
        ];

        // Add review sessions for complex topics
        if (
          topicDifficulty[subject.name as keyof typeof topicDifficulty]?.[
            topic.name
          ] > 2
        ) {
          sessions.push({
            title: `🔄 Review ${topic.name} - Advanced Concepts`,
            type: "review",
            targetMins: Math.round(baseTargetMins * 0.3),
          });
        }

        sessions.forEach((session, sessionIndex) => {
          planItems.push({
            id: `${planItems.length + 1}`,
            planId: "new",
            subjectId: subject.id,
            topicId: topic.id,
            title: session.title,
            targetMins: session.targetMins,
            dayIndex: dayIndex + sessionIndex,
            completed: false,
            metadata: {
              sessionType: session.type,
              difficulty:
                topicDifficulty[subject.name as keyof typeof topicDifficulty]?.[
                  topic.name
                ] || 1,
              adaptivePath: request.currentLevel,
            },
          });
        });
      });
    });

    // Add milestone assessments
    const milestones = [];
    for (let week = 1; week <= Math.ceil(request.duration / 7); week++) {
      milestones.push({
        id: `milestone-${week}`,
        title: `🎯 Week ${week} Assessment`,
        type: "assessment",
        dayIndex: week * 7 - 1,
        targetMins: 60,
      });
    }

    milestones.forEach((milestone) => {
      planItems.push({
        id: milestone.id,
        planId: "new",
        title: milestone.title,
        targetMins: milestone.targetMins,
        dayIndex: milestone.dayIndex,
        completed: false,
        metadata: {
          sessionType: milestone.type,
          isMilestone: true,
        },
      });
    });

    const currentUser = users.find((u) => u.role === "student") || users[0];
    const newPlan: Plan = {
      id: (plans.length + 1).toString(),
      userId: currentUser.id,
      generatedAt: new Date().toISOString(),
      goalSummary: `AI-Adaptive ${
        request.duration
      }-day study plan for ${request.subjects.join(", ")} (${
        request.currentLevel
      } level)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: planItems,
      metadata: {
        adaptiveLevel: request.currentLevel,
        totalHours: request.dailyHours * request.duration,
        subjects: request.subjects,
        goals: request.goals,
        generatedBy: "AI-Adaptive-Engine-v2.0",
      },
    };

    plans.push(newPlan);
    return newPlan;
  },

  async updatePlanItem(
    planId: string,
    itemId: string,
    completed: boolean
  ): Promise<void> {
    await mockApiDelay();

    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      const item = plan.items.find((i) => i.id === itemId);
      if (item) {
        item.completed = completed;
        plan.updatedAt = new Date().toISOString();
      }
    }
  },

  async deletePlan(planId: string): Promise<void> {
    await mockApiDelay();
    const index = plans.findIndex((p) => p.id === planId);
    if (index !== -1) {
      plans.splice(index, 1);
    }
  },
};

// Subjects API
export const subjectsApi = {
  async getAllSubjects(): Promise<Subject[]> {
    await mockApiDelay();
    return mockSubjects;
  },

  async getSubjectById(subjectId: string): Promise<Subject> {
    await mockApiDelay();

    const subject = mockSubjects.find((s) => s.id === subjectId);
    if (!subject) throw new Error("Subject not found");

    return subject;
  },
};

// Notifications API
export const notificationsApi = {
  async getNotifications(userId: string): Promise<Notification[]> {
    await mockApiDelay();
    return getNotificationsByUserId(userId);
  },

  async markAsRead(notificationId: string): Promise<void> {
    await mockApiDelay();

    const notification = notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    await mockApiDelay();

    notifications.forEach((n) => {
      if (n.userId === userId) {
        n.isRead = true;
      }
    });
  },
};

// AI Features API (mock implementations)
export const aiApi = {
  async generateStudyPlan(request: AIStudyPlanRequest): Promise<Plan> {
    // This is just a wrapper around the plans API for consistency
    return plansApi.generateStudyPlan(request);
  },

  async getTutorRecommendation(
    studentId: string,
    subject: string
  ): Promise<TutorProfile[]> {
    await mockApiDelay();

    return tutorProfiles
      .filter((tutor) => tutor.subjects.includes(subject))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);
  },

  async accessibilityAudit(content: string): Promise<{
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    await mockApiDelay();

    // Mock accessibility audit
    const issues = [];
    const suggestions = [];

    if (!content.includes("alt=")) {
      issues.push("Missing alt text for images");
      suggestions.push("Add descriptive alt text to all images");
    }

    if (content.length > 200 && !content.includes("aria-label")) {
      issues.push("Long content without proper labeling");
      suggestions.push("Add aria-labels for better screen reader support");
    }

    const score = Math.max(0, 100 - issues.length * 20);

    return {
      score,
      issues,
      suggestions,
    };
  },
};

// Dashboard data aggregation
export const dashboardApi = {
  async getStudentDashboard(studentId: string) {
    await mockApiDelay();

    const studentSessions = getSessionsByUserId(studentId, "student");
    const studentTasks = getTasksByUserId(studentId);
    const studentPlans = getPlansByUserId(studentId);
    const studentNotifications = getNotificationsByUserId(studentId);

    const upcomingSessions = studentSessions.filter(
      (s) => s.status === "booked"
    );
    const completedSessions = studentSessions.filter(
      (s) => s.status === "completed"
    );
    const pendingTasks = studentTasks.filter(
      (t) => t.status === "todo" || t.status === "in_progress"
    );
    const completedTasks = studentTasks.filter((t) => t.status === "done");

    return {
      upcomingSessions,
      completedSessions,
      pendingTasks,
      completedTasks,
      activePlans: studentPlans,
      unreadNotifications: studentNotifications.filter((n) => !n.isRead).length,
      totalStudyTime: completedTasks.reduce(
        (sum, task) => sum + (task.actualMins || 0),
        0
      ),
    };
  },

  async getTutorDashboard(tutorId: string) {
    await mockApiDelay();

    const tutorSessions = getSessionsByUserId(tutorId, "tutor");
    const tutorReviews = getReviewsByTutorId(tutorId);
    const tutorProfile = getTutorProfileByUserId(tutorId);
    const tutorNotifications = getNotificationsByUserId(tutorId);

    const upcomingSessions = tutorSessions.filter((s) => s.status === "booked");
    const completedSessions = tutorSessions.filter(
      (s) => s.status === "completed"
    );
    const totalEarnings = completedSessions.reduce(
      (sum, session) => sum + (session.price || 0),
      0
    );

    return {
      upcomingSessions,
      completedSessions,
      totalEarnings,
      averageRating: tutorProfile?.rating || 0,
      totalReviews: tutorReviews.length,
      unreadNotifications: tutorNotifications.filter((n) => !n.isRead).length,
      availability: tutorProfile?.availability || [],
    };
  },
};
