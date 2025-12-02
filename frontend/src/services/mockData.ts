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
} from "../types";

// Mock Users
export const mockUsers: User[] = [
  {
    id: "1",
    firstName: "Student",
    lastName: "User",
    email: "student@tutorlink.com",
    phone: "+1234567890",
    role: "student",
    createdAt: "2025-01-15T10:30:00Z",
    updatedAt: "2025-01-15T10:30:00Z",
  },
  {
    id: "2",
    firstName: "Tutor",
    lastName: "User",
    email: "tutor@tutorlink.com",
    phone: "+1234567891",
    role: "tutor",
    createdAt: "2025-01-10T09:15:00Z",
    updatedAt: "2025-01-10T09:15:00Z",
  },
  {
    id: "3",
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice.johnson@email.com",
    phone: "+1234567892",
    role: "tutor",
    createdAt: "2025-01-08T14:20:00Z",
    updatedAt: "2025-01-08T14:20:00Z",
  },
  {
    id: "4",
    firstName: "Bob",
    lastName: "Wilson",
    email: "bob.wilson@email.com",
    phone: "+1234567893",
    role: "student",
    createdAt: "2025-01-12T16:45:00Z",
    updatedAt: "2025-01-12T16:45:00Z",
  },
  {
    id: "5",
    firstName: "Emma",
    lastName: "Brown",
    email: "emma.brown@email.com",
    phone: "+1234567894",
    role: "tutor",
    createdAt: "2025-01-05T11:30:00Z",
    updatedAt: "2025-01-05T11:30:00Z",
  },
  {
    id: "6",
    firstName: "Admin",
    lastName: "User",
    email: "admin@tutorlink.com",
    phone: "+1234567895",
    role: "admin",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
];

// Mock Subjects and Topics
export const mockSubjects: Subject[] = [
  {
    id: "1",
    name: "Mathematics",
    topics: [
      { id: "1", subjectId: "1", name: "Algebra" },
      { id: "2", subjectId: "1", name: "Geometry" },
      { id: "3", subjectId: "1", name: "Calculus" },
      { id: "4", subjectId: "1", name: "Statistics" },
      { id: "5", subjectId: "1", name: "Trigonometry" },
    ],
  },
  {
    id: "2",
    name: "Physics",
    topics: [
      { id: "6", subjectId: "2", name: "Mechanics" },
      { id: "7", subjectId: "2", name: "Thermodynamics" },
      { id: "8", subjectId: "2", name: "Electromagnetism" },
      { id: "9", subjectId: "2", name: "Optics" },
      { id: "10", subjectId: "2", name: "Quantum Physics" },
    ],
  },
  {
    id: "3",
    name: "Chemistry",
    topics: [
      { id: "11", subjectId: "3", name: "Organic Chemistry" },
      { id: "12", subjectId: "3", name: "Inorganic Chemistry" },
      { id: "13", subjectId: "3", name: "Physical Chemistry" },
      { id: "14", subjectId: "3", name: "Biochemistry" },
      { id: "15", subjectId: "3", name: "Analytical Chemistry" },
    ],
  },
  {
    id: "4",
    name: "Biology",
    topics: [
      { id: "16", subjectId: "4", name: "Cell Biology" },
      { id: "17", subjectId: "4", name: "Genetics" },
      { id: "18", subjectId: "4", name: "Ecology" },
      { id: "19", subjectId: "4", name: "Human Biology" },
      { id: "20", subjectId: "4", name: "Microbiology" },
    ],
  },
  {
    id: "5",
    name: "English",
    topics: [
      { id: "21", subjectId: "5", name: "Grammar" },
      { id: "22", subjectId: "5", name: "Literature" },
      { id: "23", subjectId: "5", name: "Writing" },
      { id: "24", subjectId: "5", name: "Reading Comprehension" },
      { id: "25", subjectId: "5", name: "Public Speaking" },
    ],
  },
  {
    id: "6",
    name: "Computer Science",
    topics: [
      { id: "26", subjectId: "6", name: "Programming" },
      { id: "27", subjectId: "6", name: "Data Structures" },
      { id: "28", subjectId: "6", name: "Algorithms" },
      { id: "29", subjectId: "6", name: "Web Development" },
      { id: "30", subjectId: "6", name: "Machine Learning" },
    ],
  },
];

// Mock Tutor Profiles
export const mockTutorProfiles: TutorProfile[] = [
  {
    id: "1",
    userId: "2",
    bio: "Experienced mathematics tutor with 5+ years of teaching experience. Specializes in calculus and algebra.",
    rating: 4.8,
    hourlyRate: 25,
    createdAt: "2025-01-10T09:15:00Z",
    updatedAt: "2025-01-10T09:15:00Z",
    subjects: ["Mathematics"],
    languages: ["English", "Spanish"],
    experience: 5,
    education: ["MS Mathematics", "BS Mathematics"],
    availability: [
      {
        id: "1",
        tutorId: "1",
        dayOfWeek: "Mon",
        startTime: "09:00",
        endTime: "17:00",
        isActive: true,
      },
      {
        id: "2",
        tutorId: "1",
        dayOfWeek: "Tue",
        startTime: "09:00",
        endTime: "17:00",
        isActive: true,
      },
      {
        id: "3",
        tutorId: "1",
        dayOfWeek: "Wed",
        startTime: "09:00",
        endTime: "17:00",
        isActive: true,
      },
      {
        id: "4",
        tutorId: "1",
        dayOfWeek: "Thu",
        startTime: "09:00",
        endTime: "17:00",
        isActive: true,
      },
      {
        id: "5",
        tutorId: "1",
        dayOfWeek: "Fri",
        startTime: "09:00",
        endTime: "17:00",
        isActive: true,
      },
    ],
  },
  {
    id: "2",
    userId: "3",
    bio: "Physics and Chemistry expert with a passion for making complex concepts accessible to all students.",
    rating: 4.9,
    hourlyRate: 30,
    createdAt: "2025-01-08T14:20:00Z",
    updatedAt: "2025-01-08T14:20:00Z",
    subjects: ["Physics", "Chemistry"],
    languages: ["English", "French"],
    experience: 7,
    education: ["PhD Physics", "MS Chemistry"],
    availability: [
      {
        id: "6",
        tutorId: "2",
        dayOfWeek: "Tue",
        startTime: "10:00",
        endTime: "18:00",
        isActive: true,
      },
      {
        id: "7",
        tutorId: "2",
        dayOfWeek: "Wed",
        startTime: "10:00",
        endTime: "18:00",
        isActive: true,
      },
      {
        id: "8",
        tutorId: "2",
        dayOfWeek: "Thu",
        startTime: "10:00",
        endTime: "18:00",
        isActive: true,
      },
      {
        id: "9",
        tutorId: "2",
        dayOfWeek: "Sat",
        startTime: "09:00",
        endTime: "15:00",
        isActive: true,
      },
    ],
  },
  {
    id: "3",
    userId: "5",
    bio: "Biology and Computer Science tutor with industry experience. Loves helping students discover the beauty of life sciences and technology.",
    rating: 4.7,
    hourlyRate: 28,
    createdAt: "2025-01-05T11:30:00Z",
    updatedAt: "2025-01-05T11:30:00Z",
    subjects: ["Biology", "Computer Science"],
    languages: ["English", "German"],
    experience: 6,
    education: ["MS Biology", "BS Computer Science"],
    availability: [
      {
        id: "10",
        tutorId: "3",
        dayOfWeek: "Mon",
        startTime: "08:00",
        endTime: "16:00",
        isActive: true,
      },
      {
        id: "11",
        tutorId: "3",
        dayOfWeek: "Wed",
        startTime: "08:00",
        endTime: "16:00",
        isActive: true,
      },
      {
        id: "12",
        tutorId: "3",
        dayOfWeek: "Fri",
        startTime: "08:00",
        endTime: "16:00",
        isActive: true,
      },
      {
        id: "13",
        tutorId: "3",
        dayOfWeek: "Sun",
        startTime: "10:00",
        endTime: "14:00",
        isActive: true,
      },
    ],
  },
];

// Mock Student Profiles
export const mockStudentProfiles: StudentProfile[] = [
  {
    id: "1",
    userId: "1", // Student User
    grade: "Grade 12",
    school: "Lincoln High School",
    preferences: {
      subjects: ["Mathematics", "Physics"],
      learningStyle: ["Visual", "Practice"],
      goals: ["Improve grades", "Prepare for college"],
    },
  },
  {
    id: "2",
    userId: "4",
    grade: "Grade 11",
    school: "Washington High School",
    preferences: {
      subjects: ["Chemistry", "Biology"],
      learningStyle: ["Auditory", "Discussion"],
      goals: ["Understand concepts", "Excel in exams"],
    },
  },
];

// Mock Sessions
export const mockSessions: Session[] = [
  {
    id: "1",
    tutorId: "1", // Jane Smith profile
    studentId: "1", // Student User
    subjectId: "1",
    topicId: "1",
    startAt: "2025-10-28T14:00:00Z",
    endAt: "2025-10-28T15:00:00Z",
    status: "booked",
    price: 25,
    createdAt: "2025-10-25T10:30:00Z",
    updatedAt: "2025-10-25T10:30:00Z",
    notes: [
      {
        id: "1",
        sessionId: "1",
        authorId: "2",
        notes:
          "Student needs help with quadratic equations. Focus on word problems.",
        createdAt: "2025-10-28T15:05:00Z",
      },
    ],
  },
  {
    id: "2",
    tutorId: "1", // Jane Smith profile
    studentId: "4",
    subjectId: "3",
    topicId: "11",
    startAt: "2025-10-27T16:00:00Z",
    endAt: "2025-10-27T17:30:00Z",
    status: "completed",
    price: 45,
    createdAt: "2025-10-24T14:20:00Z",
    updatedAt: "2025-10-27T17:35:00Z",
    review: {
      id: "1",
      sessionId: "2",
      tutorId: "1",
      studentId: "4",
      rating: 5,
      comment:
        "Excellent explanation of organic chemistry concepts. Very patient and knowledgeable.",
      createdAt: "2025-10-27T17:40:00Z",
    },
  },
];

// Mock Reviews
export const mockReviews: Review[] = [
  {
    id: "1",
    sessionId: "2",
    tutorId: "2",
    studentId: "4",
    rating: 5,
    comment:
      "Excellent explanation of organic chemistry concepts. Very patient and knowledgeable.",
    createdAt: "2025-10-27T17:40:00Z",
  },
  {
    id: "2",
    sessionId: "1",
    tutorId: "1",
    studentId: "1",
    rating: 4,
    comment: "Good session overall. Could use more practice problems.",
    createdAt: "2025-10-28T15:05:00Z",
  },
];

// Mock Conversations
export const mockConversations: Conversation[] = [
  {
    id: "1",
    title: "Math Tutoring Session",
    createdAt: "2025-10-25T10:30:00Z",
    members: [
      { conversationId: "1", userId: "1", joinedAt: "2025-10-25T10:30:00Z" }, // Student
      { conversationId: "1", userId: "2", joinedAt: "2025-10-25T10:30:00Z" }, // Tutor
    ],
    lastMessage: {
      id: "1",
      conversationId: "1",
      senderId: "1",
      body: "Hi Tutor, I'm ready for our session tomorrow. Should I prepare anything specific?",
      sentAt: "2025-10-26T20:15:00Z",
      isRead: true,
    },
  },
];

// Mock Messages
export const mockMessages: Message[] = [
  {
    id: "1",
    conversationId: "1",
    senderId: "1", // Student
    body: "Hi Tutor, I'm ready for our session tomorrow. Should I prepare anything specific?",
    sentAt: "2025-10-26T20:15:00Z",
    isRead: true,
  },
  {
    id: "2",
    conversationId: "1",
    senderId: "2", // Tutor
    body: "Hi Student! Just review the quadratic equations we discussed last time. I'll prepare some practice problems for you.",
    sentAt: "2025-10-26T20:30:00Z",
    isRead: true,
  },
];

// Mock Tasks
export const mockTasks: Task[] = [
  {
    id: "1",
    userId: "1",
    title: "Complete calculus homework",
    dueAt: "2025-10-30T23:59:00Z",
    status: "in_progress",
    estimatedMins: 120,
    actualMins: 90,
    createdAt: "2025-10-25T10:00:00Z",
    updatedAt: "2025-10-27T15:30:00Z",
    subjectId: "1",
    topicId: "3",
    comments: [
      {
        id: "1",
        taskId: "1",
        authorId: "1",
        body: "Need to focus on integration techniques",
        createdAt: "2025-10-25T10:05:00Z",
      },
    ],
  },
  {
    id: "2",
    userId: "1",
    title: "Review physics notes",
    dueAt: "2025-10-28T18:00:00Z",
    status: "todo",
    estimatedMins: 60,
    createdAt: "2025-10-26T14:00:00Z",
    updatedAt: "2025-10-26T14:00:00Z",
    subjectId: "2",
    comments: [],
  },
];

// Mock Study Plans
export const mockPlans: Plan[] = [
  {
    id: "1",
    userId: "1",
    generatedAt: "2025-10-25T09:00:00Z",
    goalSummary:
      "Prepare for upcoming calculus exam and improve problem-solving skills",
    createdAt: "2025-10-25T09:00:00Z",
    updatedAt: "2025-10-25T09:00:00Z",
    items: [
      {
        id: "1",
        planId: "1",
        subjectId: "1",
        topicId: "3",
        title: "Review integration rules",
        targetMins: 45,
        dayIndex: 0,
        completed: true,
      },
      {
        id: "2",
        planId: "1",
        subjectId: "1",
        topicId: "1",
        title: "Practice algebraic manipulation",
        targetMins: 60,
        dayIndex: 1,
        completed: false,
      },
      {
        id: "3",
        planId: "1",
        subjectId: "1",
        topicId: "3",
        title: "Work on application problems",
        targetMins: 90,
        dayIndex: 2,
        completed: false,
      },
    ],
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: "1",
    userId: "1",
    type: "session_reminder",
    payload: {
      sessionId: "1",
      message: "Your tutoring session starts in 1 hour",
    },
    isRead: false,
    createdAt: "2025-10-28T13:00:00Z",
  },
  {
    id: "2",
    userId: "2",
    type: "new_booking",
    payload: { sessionId: "1", message: "New student booked a session" },
    isRead: true,
    createdAt: "2025-10-25T10:30:00Z",
  },
  {
    id: "3",
    userId: "1",
    type: "task_due",
    payload: { taskId: "2", message: "Physics notes review is due soon" },
    isRead: false,
    createdAt: "2025-10-28T12:00:00Z",
  },
];

// Helper functions to simulate API delays
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApiDelay = () => delay(Math.random() * 500 + 200);

// Utility functions to get related data
export const getUserById = (id: string): User | undefined => {
  return mockUsers.find((user) => user.id === id);
};

export const getTutorProfileByUserId = (
  userId: string
): TutorProfile | undefined => {
  return mockTutorProfiles.find((profile) => profile.userId === userId);
};

export const getStudentProfileByUserId = (
  userId: string
): StudentProfile | undefined => {
  return mockStudentProfiles.find((profile) => profile.userId === userId);
};

export const getSessionsByUserId = (
  userId: string,
  role: "student" | "tutor"
): Session[] => {
  if (role === "student") {
    return mockSessions.filter((session) => session.studentId === userId);
  } else {
    return mockSessions.filter((session) => session.tutorId === userId);
  }
};

export const getReviewsByTutorId = (tutorId: string): Review[] => {
  return mockReviews.filter((review) => review.tutorId === tutorId);
};

export const getConversationsByUserId = (userId: string): Conversation[] => {
  return mockConversations.filter((conv) =>
    conv.members.some((member) => member.userId === userId)
  );
};

export const getTasksByUserId = (userId: string): Task[] => {
  return mockTasks.filter((task) => task.userId === userId);
};

export const getPlansByUserId = (userId: string): Plan[] => {
  return mockPlans.filter((plan) => plan.userId === userId);
};

export const getNotificationsByUserId = (userId: string): Notification[] => {
  return mockNotifications.filter(
    (notification) => notification.userId === userId
  );
};
