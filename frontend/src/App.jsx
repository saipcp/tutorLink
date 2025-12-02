import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Context providers
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

// Layout components
import Layout from "./components/Layout/Layout";
import PublicLayout from "./components/Layout/PublicLayout";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AboutPage from "./pages/AboutPage";
import HelpPage from "./pages/HelpPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import StudentDashboard from "./pages/StudentDashboard";
import TutorDashboard from "./pages/TutorDashboard";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminSubjectsPage from "./pages/AdminSubjectsPage";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";
import AdminAIPage from "./pages/AdminAIPage";
import TutorBrowse from "./pages/TutorBrowse";
import TutorProfile from "./pages/TutorProfile";
import BookingPage from "./pages/BookingPage";
import StudyPlanner from "./pages/StudyPlanner";
import TaskManagement from "./pages/TaskManagement";
import Messaging from "./pages/Messaging";
import TutorBotPage from "./pages/TutorBotPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import ReviewsPage from "./pages/ReviewsPage";
import SessionsPage from "./pages/SessionsPage";
import PaymentPage from "./pages/PaymentPage";
import NotFoundPage from "./pages/NotFoundPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import TutorSchedule from "./pages/TutorSchedule";
import TutorStudents from "./pages/TutorStudents";
import DashboardRedirect from "./components/DashboardRedirect";

// Protected route component
import { ProtectedRoute, PublicAuthRoute } from "./context/AuthContext";

// Create a client for React Query with optimized settings to prevent excessive requests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - consider data fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime) - keep unused data in cache
      retry: (failureCount, error) => {
        // Don't retry on 429 errors - we handle those in apiRequest
        if (error?.status === 429) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnReconnect: false, // Don't refetch on reconnect
      refetchOnMount: true, // Only refetch on mount if data is stale
      refetchInterval: false, // Disable automatic polling
    },
    mutations: {
      retry: false, // Don't retry mutations automatically
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* SocketProvider must be inside AuthProvider so it has access to user/token */}
        <SocketProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<LandingPage />} />
                <Route
                  path="login"
                  element={
                    <PublicAuthRoute>
                      <LoginPage />
                    </PublicAuthRoute>
                  }
                />
                <Route
                  path="register"
                  element={
                    <PublicAuthRoute>
                      <RegisterPage />
                    </PublicAuthRoute>
                  }
                />
                <Route
                  path="forgot-password"
                  element={
                    <PublicAuthRoute>
                      <ForgotPasswordPage />
                    </PublicAuthRoute>
                  }
                />
                <Route
                  path="reset-password"
                  element={
                    <PublicAuthRoute>
                      <ResetPasswordPage />
                    </PublicAuthRoute>
                  }
                />
                <Route path="about" element={<AboutPage />} />
                <Route path="help" element={<HelpPage />} />
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="terms" element={<TermsPage />} />
              </Route>

              {/* Dashboard redirect - outside Layout to avoid Layout constraints */}
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardRedirect />
                  </ProtectedRoute>
                }
              />

              {/* Protected routes */}
              <Route path="/" element={<Layout />}>
                {/* Dashboard routes based on role */}
                <Route
                  path="student/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["student"]}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="tutor/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["tutor"]}>
                      <TutorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Student routes */}
                <Route path="student">
                  <Route
                    index
                    element={
                      <ProtectedRoute allowedRoles={["student"]}>
                        <StudentDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["student"]}>
                        <StudentDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="browse"
                    element={
                      <ProtectedRoute allowedRoles={["student"]}>
                        <TutorBrowse />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="tutor/:id"
                    element={
                      <ProtectedRoute allowedRoles={["student"]}>
                        <TutorProfile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="book/:tutorId"
                    element={
                      <ProtectedRoute allowedRoles={["student"]}>
                        <BookingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="study-planner"
                    element={
                      <ProtectedRoute allowedRoles={["student"]}>
                        <StudyPlanner />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="profile"
                    element={
                      <ProtectedRoute allowedRoles={["student"]}>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="settings"
                    element={
                      <ProtectedRoute allowedRoles={["student"]}>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="payment"
                    element={
                      <ProtectedRoute allowedRoles={["student"]}>
                        <PaymentPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="reviews"
                    element={
                      <ProtectedRoute allowedRoles={["student"]}>
                        <ReviewsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="sessions"
                    element={
                      <ProtectedRoute allowedRoles={["student"]}>
                        <SessionsPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Tutor routes */}
                <Route path="tutor">
                  <Route
                    index
                    element={
                      <ProtectedRoute allowedRoles={["tutor"]}>
                        <TutorDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["tutor"]}>
                        <TutorDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="browse"
                    element={
                      <ProtectedRoute allowedRoles={["tutor"]}>
                        <TutorBrowse />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="schedule"
                    element={
                      <ProtectedRoute allowedRoles={["tutor"]}>
                        <TutorSchedule />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="students"
                    element={
                      <ProtectedRoute allowedRoles={["tutor"]}>
                        <TutorStudents />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="profile"
                    element={
                      <ProtectedRoute allowedRoles={["tutor"]}>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="settings"
                    element={
                      <ProtectedRoute allowedRoles={["tutor"]}>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="payment"
                    element={
                      <ProtectedRoute allowedRoles={["tutor"]}>
                        <PaymentPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="reviews"
                    element={
                      <ProtectedRoute allowedRoles={["tutor"]}>
                        <ReviewsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="sessions"
                    element={
                      <ProtectedRoute allowedRoles={["tutor"]}>
                        <SessionsPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Admin routes */}
                <Route path="admin">
                  <Route
                    index
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <Navigate to="/admin/dashboard" replace />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="users"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminUsersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="subjects"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminSubjectsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="analytics"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminAnalyticsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="ai"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminAIPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="profile"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="settings"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="payment"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <PaymentPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="sessions"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <SessionsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="study-planner"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <StudyPlanner />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="schedule"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <TutorSchedule />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="students"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <TutorStudents />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="reviews"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <ReviewsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="browse"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <TutorBrowse />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Shared routes (accessible by all authenticated users) */}
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="browse"
                  element={
                    <ProtectedRoute>
                      <TutorBrowse />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="tutor/:id"
                  element={
                    <ProtectedRoute>
                      <TutorProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="tasks"
                  element={
                    <ProtectedRoute allowedRoles={["student", "tutor", "admin"]}>
                      <TaskManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="messages"
                  element={
                    <ProtectedRoute>
                      <Messaging />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="aitutor"
                  element={
                    <ProtectedRoute>
                      <TutorBotPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Error pages */}
                <Route path="404" element={<NotFoundPage />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Route>

              {/* Error pages outside Layout */}
              <Route path="403" element={<UnauthorizedPage />} />
            </Routes>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
