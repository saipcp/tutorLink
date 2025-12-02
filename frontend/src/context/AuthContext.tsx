import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Navigate } from "react-router-dom";
import { User, AuthState } from "../types";
import { authApi, usersApi } from "../services/api";
import UnauthorizedPage from "../pages/UnauthorizedPage";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: "student" | "tutor" | "admin";
  }) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  // Initialize auth state on app load
  useEffect(() => {
    let isMounted = true;
    let initTimeout: NodeJS.Timeout | null = null;

    const initAuth = async () => {
      try {
        // Check if user is already logged in
        const savedUser = localStorage.getItem("tutorlink_user");
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          
          // Use cached user data immediately to avoid blocking UI
          if (userData.id && userData.email) {
            setAuthState({
              user: userData,
              isAuthenticated: true,
              loading: false,
            });
          }

          // Verify token is still valid by fetching current user (but don't block UI)
          // Add a small delay to prevent rapid-fire requests on page load
          initTimeout = setTimeout(async () => {
            if (!isMounted) return;
            
            try {
              const currentUser = await usersApi.getCurrentUser();
              if (isMounted) {
                setAuthState({
                  user: currentUser,
                  isAuthenticated: true,
                  loading: false,
                });
                // Update stored user data
                localStorage.setItem("tutorlink_user", JSON.stringify({ ...currentUser, token: userData.token }));
              }
            } catch (error: any) {
              // Token invalid or expired, clear storage
              if (isMounted) {
                localStorage.removeItem("tutorlink_user");
                setAuthState({
                  user: null,
                  isAuthenticated: false,
                  loading: false,
                });
                // Dispatch session expired event if it's a 401 error
                if (error?.message?.includes("401") || error?.status === 401) {
                  const sessionExpiredEvent = new CustomEvent("sessionExpired", {
                    detail: { message: "Your session has expired. Please log in again." },
                  });
                  window.dispatchEvent(sessionExpiredEvent);
                }
              }
            }
          }, 500); // Small delay to batch with other initial requests
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            loading: false,
          });
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (isMounted) {
          setAuthState({
            user: null,
            isAuthenticated: false,
            loading: false,
          });
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true }));

      const result = await authApi.login(email, password);

      // Save user and token to localStorage
      const userData = { ...result.user, token: (result as any).token };
      localStorage.setItem("tutorlink_user", JSON.stringify(userData));

      setAuthState({
        user: result.user,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error: any) {
      setAuthState((prev) => ({ ...prev, loading: false }));
      // Re-throw the error so LoginPage can catch and display it
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();

      // Clear localStorage
      localStorage.removeItem("tutorlink_user");

      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
    } catch (error) {
      console.error("Error during logout:", error);
      // Even if API call fails, clear local state
      localStorage.removeItem("tutorlink_user");
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  };

  const register = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: "student" | "tutor" | "admin";
  }) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true }));

      const response = await authApi.register(userData);
      // API returns { user, token }
      const userDataWithToken = { ...response.user, token: (response as any).token };
      
      // Save to localStorage
      localStorage.setItem("tutorlink_user", JSON.stringify(userDataWithToken));

      setAuthState({
        user: response.user,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      setAuthState((prev) => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!authState.user) throw new Error("No user logged in");

    try {
      const updatedUser = await usersApi.updateProfile(
        authState.user.id,
        updates
      );

      // Get existing token from localStorage
      const savedUser = localStorage.getItem("tutorlink_user");
      const existingToken = savedUser ? JSON.parse(savedUser).token : null;

      // Update localStorage with new user data but preserve token
      const userDataWithToken = { ...updatedUser, token: existingToken };
      localStorage.setItem("tutorlink_user", JSON.stringify(userDataWithToken));

      setAuthState((prev) => ({
        ...prev,
        user: updatedUser,
      }));
    } catch (error) {
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await authApi.forgotPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      await authApi.resetPassword(token, newPassword);
    } catch (error) {
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    register,
    updateProfile,
    forgotPassword,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Utility function to get role-based dashboard path
const getDashboardPath = (role: string) => {
  switch (role) {
    case "tutor":
      return "/tutor";
    case "admin":
      return "/admin";
    default:
      return "/student";
  }
};

// Helper hooks for role-based access
export const useRole = () => {
  const { user } = useAuth();
  return user?.role;
};

export const useIsStudent = () => {
  const role = useRole();
  return role === "student";
};

export const useIsTutor = () => {
  const role = useRole();
  return role === "tutor";
};

export const useIsAdmin = () => {
  const role = useRole();
  return role === "admin";
};

// Protected route component
interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ("student" | "tutor" | "admin")[];
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = ["student", "tutor", "admin"],
  fallback = null,
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const [showSessionExpired, setShowSessionExpired] = React.useState(false);

  React.useEffect(() => {
    if (!loading && (!isAuthenticated || !user)) {
      // Show session expired message before redirecting
      setShowSessionExpired(true);
      // Redirect to login after showing message
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    }
  }, [loading, isAuthenticated, user]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showSessionExpired || !isAuthenticated || !user) {
    // Show session expired error message with fixed positioning to overlay Layout
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center mx-4">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {!isAuthenticated ? "Authentication Required" : "Session Expired"}
          </h2>
          <p className="text-gray-600 mb-6">
            {!isAuthenticated
              ? "You need to be logged in to access this page. Please log in to continue."
              : "Your session has expired. Please log in again to continue."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/login"
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <span>Go to Login</span>
            </a>
            <a
              href="/"
              className="btn-secondary flex items-center justify-center space-x-2"
            >
              <span>Go Home</span>
            </a>
          </div>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-500">
              Redirecting to login page...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to 403 page for users without required role
    return (
      <Navigate
        to="/403"
        replace
        state={{
          reason: "insufficient_permissions",
          requiredRoles: allowedRoles,
        }}
      />
    );
  }

  return <>{children}</>;
};

// Public auth route component - only allows unauthenticated users
interface PublicAuthRouteProps {
  children: ReactNode;
}

export const PublicAuthRoute: React.FC<PublicAuthRouteProps> = ({
  children,
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    // Redirect authenticated users to their role-based dashboard
    const dashboardPath = getDashboardPath(user.role);
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
};
