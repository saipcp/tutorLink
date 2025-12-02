import { User } from "../types";

// API Configuration
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

// Request deduplication map - stores pending requests by endpoint+method+body hash
const pendingRequests = new Map<string, Promise<any>>();

// Rate limiting state
const rateLimitState = {
  retryAfter: 0,
  last429Time: 0,
};

// Request throttling - track last request time per endpoint
const requestThrottle = new Map<string, number>();
const THROTTLE_DELAY = 100; // Minimum 100ms between requests to the same endpoint

// Helper function to create request key for deduplication
const createRequestKey = (endpoint: string, options: RequestInit): string => {
  const method = options.method || 'GET';
  const body = options.body ? JSON.stringify(options.body) : '';
  return `${method}:${endpoint}:${body}`;
};

// Helper function to get auth token
const getAuthToken = (): string | null => {
  const userStr = localStorage.getItem("tutorlink_user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.token || null;
    } catch {
      return null;
    }
  }
  return null;
};

// Exponential backoff delay calculator
const calculateBackoffDelay = (attempt: number, retryAfter?: number): number => {
  // If server provides Retry-After header, use it
  if (retryAfter) {
    return retryAfter * 1000; // Convert to milliseconds
  }
  // Otherwise use exponential backoff: 1s, 2s, 4s, 8s, max 10s
  return Math.min(1000 * Math.pow(2, attempt), 10000);
};

// Helper function to make API requests with rate limiting and retry logic
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> => {
  const maxRetries = 3;
  const requestKey = createRequestKey(endpoint, options);

  // Check for rate limiting - if we recently got a 429, wait before making new requests
  const now = Date.now();
  if (rateLimitState.retryAfter > now) {
    const waitTime = rateLimitState.retryAfter - now;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  // Check if there's already a pending request for this endpoint+method+body
  // This prevents duplicate requests from being made simultaneously
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey)!;
  }

  // Throttle requests to the same endpoint (prevent rapid successive calls)
  const lastRequestTime = requestThrottle.get(endpoint) || 0;
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < THROTTLE_DELAY) {
    await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY - timeSinceLastRequest));
  }
  requestThrottle.set(endpoint, Date.now());

  const token = getAuthToken();
  // Use a plain object for headers to make TypeScript happy when adding Authorization
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Create the request promise
  const requestPromise = (async (): Promise<T> => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle 429 Too Many Requests with exponential backoff
      if (response.status === 429) {
        const retryAfterHeader = response.headers.get('Retry-After');
        const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
        
        // Update rate limit state
        const backoffDelay = calculateBackoffDelay(retryCount, retryAfter);
        rateLimitState.retryAfter = now + backoffDelay;
        rateLimitState.last429Time = now;

        // If we haven't exceeded max retries, retry with backoff
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          // Retry the request
          return apiRequest<T>(endpoint, options, retryCount + 1);
        }

        // Max retries exceeded
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: "Rate limit exceeded. Please try again later." };
        }
        const error = new Error(errorData.message || errorData.error || "Rate limit exceeded. Please try again later.");
        (error as any).status = 429;
        (error as any).originalError = errorData;
        throw error;
      }

      if (!response.ok) {
        // Handle 401 Unauthorized (session expired)
        // But exclude authentication endpoints (login, register, forgot-password, reset-password)
        // These endpoints return 401 for invalid credentials, not session expiration
        const isAuthEndpoint = endpoint.includes('/auth/login') || 
                              endpoint.includes('/auth/register') || 
                              endpoint.includes('/auth/forgot-password') || 
                              endpoint.includes('/auth/reset-password');
        
        if (response.status === 401 && !isAuthEndpoint) {
          // Clear auth data
          localStorage.removeItem("tutorlink_user");
          // Show session expired message via custom event
          const sessionExpiredEvent = new CustomEvent("sessionExpired", {
            detail: { message: "Your session has expired. Please log in again." },
          });
          window.dispatchEvent(sessionExpiredEvent);
          // Redirect to login after a short delay
          setTimeout(() => {
            window.location.href = "/login?expired=true";
          }, 2000);
        }

        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: "Network error" };
        }
        
        // Extract error message - backend can return either {error: "..."} or {message: "..."}
        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
        const error = new Error(errorMessage);
        // Preserve the original error data for debugging
        (error as any).originalError = errorData;
        (error as any).status = response.status;
        throw error;
      }

      return response.json();
    } finally {
      // Remove from pending requests after completion
      pendingRequests.delete(requestKey);
    }
  })();

  // Store the pending request
  pendingRequests.set(requestKey, requestPromise);

  return requestPromise;
};

// Authentication API
export const authApi = {
  async login(email: string, password: string) {
    const response = await apiRequest<{ user: any; token: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );
    // Return token too so callers can persist it to localStorage
    return {
      user: response.user,
      token: response.token,
      isAuthenticated: true,
      loading: false,
    };
  },

  async logout() {
    // Token is removed from localStorage in AuthContext
    return Promise.resolve();
  },

  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: "student" | "tutor" | "admin";
    phone?: string;
  }) {
    const response = await apiRequest<{ user: any; token: string }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(userData),
      }
    );
    return { user: response.user, token: response.token };
  },

  async forgotPassword(email: string) {
    return apiRequest<{ message: string; token?: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, newPassword: string) {
    return apiRequest<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  },
};

// Users API
export const usersApi = {
  async getCurrentUser() {
    return apiRequest<any>("/auth/me");
  },

  async updateProfile(userId: string, updates: Partial<any>) {
    return apiRequest<any>("/users/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async updatePassword(currentPassword: string, newPassword: string) {
    return apiRequest<{ message: string }>("/users/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// Tutors API
export const tutorsApi = {
  async getAllTutors(filters?: {
    subjects?: string[];
    priceRange?: [number, number];
    rating?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.subjects?.length) {
      filters.subjects.forEach((s) => params.append("subjects", s));
    }
    if (filters?.priceRange) {
      params.append("minPrice", filters.priceRange[0].toString());
      params.append("maxPrice", filters.priceRange[1].toString());
    }
    if (filters?.rating) {
      params.append("minRating", filters.rating.toString());
    }

    const queryString = params.toString();
    return apiRequest<any[]>(`/tutors${queryString ? `?${queryString}` : ""}`);
  },

  async getTutorById(tutorId: string) {
    return apiRequest<any>(`/tutors/${tutorId}`);
  },

  async getTutorByUserId(userId: string) {
    return apiRequest<any>(`/tutors/user/${userId}`);
  },

  async getTutorReviews(tutorId: string) {
    return apiRequest<any[]>(`/tutors/${tutorId}/reviews`);
  },

  async updateAvailability(tutorId: string, availability: any[]) {
    return apiRequest<void>("/tutors/profile", {
      method: "PUT",
      body: JSON.stringify({ availability }),
    });
  },

  async updateTutorProfile(updates: {
    bio?: string;
    hourlyRate?: number;
    experience?: number;
    subjects?: string[];
    languages?: string[];
    education?: any[];
    availability?: any[];
  }) {
    return apiRequest<any>("/tutors/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },
};

// Sessions API
export const sessionsApi = {
  async getSessions(userId: string, role: "student" | "tutor") {
    return apiRequest<any[]>("/sessions");
  },

  async bookSession(booking: {
    tutorId: string;
    startAt: string;
    endAt: string;
    subjectId?: string;
    topicId?: string;
    notes?: string;
  }) {
    return apiRequest<any>("/sessions", {
      method: "POST",
      body: JSON.stringify(booking),
    });
  },

  async cancelSession(sessionId: string) {
    return apiRequest<void>(`/sessions/${sessionId}/cancel`, {
      method: "PUT",
    });
  },

  async completeSession(sessionId: string, notes?: string) {
    return apiRequest<void>(`/sessions/${sessionId}/complete`, {
      method: "PUT",
      body: JSON.stringify({ notes }),
    });
  },
};

// Reviews API
export const reviewsApi = {
  async submitReview(sessionId: string, rating: number, comment?: string) {
    return apiRequest<any>("/reviews", {
      method: "POST",
      body: JSON.stringify({ sessionId, rating, comment }),
    });
  },

  async getReviewsForUser(userId: string) {
    return apiRequest<any[]>("/reviews");
  },

  async getReviewsByTutorId(tutorId: string) {
    return apiRequest<any[]>(`/reviews/tutor/${tutorId}`);
  },
};

// Students API
export const studentsApi = {
  async getStudentProfile(userId: string) {
    // This would need a separate endpoint if needed
    return apiRequest<any>(`/users/profile`);
  },

  async updateStudentProfile(userId: string, updates: Partial<any>) {
    return apiRequest<any>("/users/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },
};

// Messaging API
export const messagingApi = {
  async getConversations(userId: string) {
    return apiRequest<any[]>("/messages/conversations");
  },

  async getUsersForMessaging() {
    return apiRequest<User[]>("/messages/users");
  },

  async getMessages(conversationId: string) {
    return apiRequest<any[]>(
      `/messages/conversations/${conversationId}/messages`
    );
  },

  async sendMessage(
    conversationId: string | undefined,
    body: string,
    recipientId?: string
  ) {
    // If conversationId is provided, send to that conversation
    if (conversationId) {
      return apiRequest<any>(
        `/messages/conversations/${conversationId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ body, recipientId }),
        }
      );
    }

    // Otherwise, hit POST /conversations/messages which creates a conversation if recipientId is provided
    return apiRequest<any>("/messages/conversations/messages", {
      method: "POST",
      body: JSON.stringify({ body, recipientId }),
    });
  },
  async createConversation(recipientId: string, title?: string) {
    return apiRequest<any>(`/messages/conversations`, {
      method: "POST",
      body: JSON.stringify({ recipientId, title }),
    });
  },
};

// Tasks API
export const tasksApi = {
  async getTasks(userId: string) {
    return apiRequest<any[]>("/tasks");
  },

  async createTask(
    task: Omit<any, "id" | "createdAt" | "updatedAt" | "comments">
  ) {
    return apiRequest<any>("/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    });
  },

  async updateTask(taskId: string, updates: Partial<any>) {
    return apiRequest<any>(`/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async deleteTask(taskId: string) {
    return apiRequest<void>(`/tasks/${taskId}`, {
      method: "DELETE",
    });
  },
};

// Study Plans API
export const plansApi = {
  async getPlans(userId: string) {
    return apiRequest<any[]>("/plans");
  },

  async generateStudyPlan(request: {
    subjects: string[];
    topics: string[];
    duration: number;
    dailyHours: number;
    goals: string[];
    currentLevel: string;
  }) {
    return apiRequest<any>("/plans/generate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  async updatePlanItem(planId: string, itemId: string, completed: boolean) {
    return apiRequest<void>(`/plans/${planId}/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ completed }),
    });
  },

  async deletePlan(planId: string) {
    return apiRequest<void>(`/plans/${planId}`, {
      method: "DELETE",
    });
  },
};

// Subjects API
export const subjectsApi = {
  async getAllSubjects() {
    return apiRequest<any[]>("/subjects");
  },

  async getSubjectById(subjectId: string) {
    return apiRequest<any>(`/subjects/${subjectId}`);
  },

  async createSubject(subjectData: { name: string; topics?: string[] }) {
    return apiRequest<any>("/subjects", {
      method: "POST",
      body: JSON.stringify(subjectData),
    });
  },
};

// Notifications API
export const notificationsApi = {
  async getNotifications(userId: string) {
    return apiRequest<any[]>("/notifications");
  },

  async markAsRead(notificationId: string) {
    return apiRequest<void>(`/notifications/${notificationId}/read`, {
      method: "PUT",
    });
  },

  async markAllAsRead(userId: string) {
    return apiRequest<void>("/notifications/read-all", {
      method: "PUT",
    });
  },
};

// Dashboard API
export const dashboardApi = {
  async getStudentDashboard(studentId: string) {
    return apiRequest<any>("/dashboard/student");
  },

  async getTutorDashboard(tutorId: string) {
    return apiRequest<any>("/dashboard/tutor");
  },
};

// Admin API
export const adminApi = {
  async getAllUsers() {
    return apiRequest<any[]>("/admin/users");
  },

  async getUserById(userId: string) {
    return apiRequest<any>(`/admin/users/${userId}`);
  },

  async createUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: "student" | "tutor" | "admin";
    phone?: string;
  }) {
    return apiRequest<any>("/admin/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  async updateUser(userId: string, updates: Partial<any>) {
    return apiRequest<any>(`/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async deleteUser(userId: string) {
    return apiRequest<void>(`/admin/users/${userId}`, {
      method: "DELETE",
    });
  },

  async getAllSessions() {
    return apiRequest<any[]>("/admin/sessions");
  },

  async getAdminStats() {
    return apiRequest<any>("/admin/stats");
  },
  async getSetting(key: string) {
    return apiRequest<any>(`/admin/settings/${key}`);
  },

  async updateSetting(key: string, value: any) {
    return apiRequest<any>(`/admin/settings/${key}`, {
      method: "PUT",
      body: JSON.stringify(value),
    });
  },
};

// Payment Methods API
export const paymentMethodsApi = {
  async getPaymentMethods() {
    return apiRequest<any[]>("/payment-methods");
  },

  async getPaymentMethodById(id: string) {
    return apiRequest<any>(`/payment-methods/${id}`);
  },

  async createPaymentMethod(methodData: {
    type: "card" | "ach" | "paypal" | "bank" | "wire";
    details: string;
    expiry?: string;
    accountNumber?: string;
    accountHolderName?: string;
    bankName?: string;
    routingNumber?: string;
    accountType?: "checking" | "savings";
    swiftCode?: string;
    isDefault?: boolean;
  }) {
    return apiRequest<any>("/payment-methods", {
      method: "POST",
      body: JSON.stringify(methodData),
    });
  },

  async updatePaymentMethod(id: string, updates: Partial<{
    details: string;
    expiry?: string;
    accountNumber?: string;
    accountHolderName?: string;
    bankName?: string;
    routingNumber?: string;
    accountType?: "checking" | "savings";
    swiftCode?: string;
    isDefault?: boolean;
  }>) {
    return apiRequest<any>(`/payment-methods/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async deletePaymentMethod(id: string) {
    return apiRequest<{ message: string }>(`/payment-methods/${id}`, {
      method: "DELETE",
    });
  },

  async setDefaultPaymentMethod(id: string) {
    return apiRequest<any>(`/payment-methods/${id}/default`, {
      method: "PUT",
    });
  },
};

// Payments/Transactions API
export const paymentsApi = {
  async getTransactions(params?: {
    status?: "pending" | "completed" | "failed" | "refunded";
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    
    const queryString = queryParams.toString();
    return apiRequest<{
      transactions: any[];
      total: number;
      limit: number;
      offset: number;
    }>(`/payments${queryString ? `?${queryString}` : ""}`);
  },

  async getTransactionById(id: string) {
    return apiRequest<any>(`/payments/${id}`);
  },
};

// Billing Settings API
export const billingSettingsApi = {
  async getBillingSettings() {
    return apiRequest<{
      id: string | null;
      userId: string;
      billingName: string;
      billingEmail: string;
      billingAddress: string;
      monthlyInvoices: boolean;
      autoPayment: boolean;
      createdAt: string | null;
      updatedAt: string | null;
    }>("/billing-settings");
  },

  async updateBillingSettings(settings: {
    billingName?: string;
    billingEmail?: string;
    billingAddress?: string;
    monthlyInvoices?: boolean;
    autoPayment?: boolean;
  }) {
    return apiRequest<{
      id: string;
      userId: string;
      billingName: string;
      billingEmail: string;
      billingAddress: string;
      monthlyInvoices: boolean;
      autoPayment: boolean;
      createdAt: string;
      updatedAt: string;
    }>("/billing-settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  },
};

// User Settings API (Notifications & Privacy)
export const userSettingsApi = {
  async getUserSettings() {
    return apiRequest<{
      id: string | null;
      userId: string;
      emailNotifications: boolean;
      pushNotifications: boolean;
      sessionReminders: boolean;
      newMessages: boolean;
      weeklyReports: boolean;
      profileVisibility: "public" | "students" | "private";
      showOnlineStatus: boolean;
      allowMessages: boolean;
      dataSharing: boolean;
      createdAt: string | null;
      updatedAt: string | null;
    }>("/user-settings");
  },

  async updateUserSettings(settings: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    sessionReminders?: boolean;
    newMessages?: boolean;
    weeklyReports?: boolean;
    profileVisibility?: "public" | "students" | "private";
    showOnlineStatus?: boolean;
    allowMessages?: boolean;
    dataSharing?: boolean;
  }) {
    return apiRequest<{
      id: string;
      userId: string;
      emailNotifications: boolean;
      pushNotifications: boolean;
      sessionReminders: boolean;
      newMessages: boolean;
      weeklyReports: boolean;
      profileVisibility: "public" | "students" | "private";
      showOnlineStatus: boolean;
      allowMessages: boolean;
      dataSharing: boolean;
      createdAt: string;
      updatedAt: string;
    }>("/user-settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  },
};

// AI Features API
export const aiApi = {
  async generateStudyPlan(request: {
    subjects: string[];
    topics: string[];
    duration: number;
    dailyHours: number;
    goals: string[];
    currentLevel: string;
  }) {
    return plansApi.generateStudyPlan(request);
  },

  async getTutorRecommendation(studentId: string, subject: string) {
    return tutorsApi.getAllTutors({ subjects: [subject], rating: 4 });
  },

  async accessibilityAudit(content: string) {
    // This would need a separate AI endpoint if implemented
    return Promise.resolve({
      score: 85,
      issues: [],
      suggestions: [],
    });
  },

  async chatWithAiTutor(message: string, conversationHistory: Array<{ role: string; content: string }> = []) {
    return apiRequest<{
      response: string;
      messageId: string;
      timestamp: string;
    }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, conversationHistory }),
    });
  },
};
