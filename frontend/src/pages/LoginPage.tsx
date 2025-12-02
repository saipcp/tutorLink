import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

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

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState("");
  const [searchParams] = useSearchParams();
  const hasInitializedError = useRef(false);

  const { login, loading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Load error from localStorage on mount
  useEffect(() => {
    const storedError = localStorage.getItem("tutorlink_login_error");
    if (storedError) {
      setError(storedError);
      // Clear from localStorage after reading
      localStorage.removeItem("tutorlink_login_error");
    }
  }, []);

  // Check for session expired event or query parameter
  useEffect(() => {
    const handleSessionExpired = (event: CustomEvent) => {
      setSessionExpiredMessage(event.detail?.message || "Your session has expired. Please log in again.");
    };

    window.addEventListener("sessionExpired", handleSessionExpired as EventListener);

    // Check if redirected from session expiration
    if (searchParams.get("expired") === "true") {
      setSessionExpiredMessage("Your session has expired. Please log in again.");
    }

    return () => {
      window.removeEventListener("sessionExpired", handleSessionExpired as EventListener);
    };
  }, [searchParams]);

  // Check for error state from URL query parameters or location state (only once on mount)
  useEffect(() => {
    // Only initialize from URL/location state once, don't interfere with form submission errors
    if (hasInitializedError.current) {
      return;
    }

    // Check URL query parameter for error
    const errorParam = searchParams.get("error");
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        invalid_credentials: "Invalid email or password. Please try again.",
        unauthorized: "You are not authorized to access this page.",
        session_expired: "Your session has expired. Please log in again.",
      };
      setError(errorMessages[errorParam] || decodeURIComponent(errorParam));
      hasInitializedError.current = true;
      // Clear the error parameter from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("error");
      navigate({ search: newSearchParams.toString() }, { replace: true });
      return;
    }

    // Check location state for error (only if no URL error)
    const locationState = location.state as any;
    if (locationState?.error) {
      setError(locationState.error);
      hasInitializedError.current = true;
      // Clear the error from location state
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount to avoid interfering with form submission errors

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear previous errors
    setError("");
    localStorage.removeItem("tutorlink_login_error");
    setFieldErrors({});
    hasInitializedError.current = false; // Allow new errors to be set

    if (!validateForm()) {
      return;
    }

    try {
      await login(formData.email, formData.password);

      // Clear any stored error on successful login
      localStorage.removeItem("tutorlink_login_error");
      setError("");

      // After successful login, navigate to role-based dashboard
      // Use the intended destination if coming from another page, otherwise use role-based path
      const from = (location.state as any)?.from;
      const dashboardPath = getDashboardPath(user?.role || "student");

      navigate(from || dashboardPath, { replace: true });
    } catch (err: any) {
      // Extract error message from various possible error formats
      let errorMessage = "Invalid email or password";
      
      if (err) {
        // Check for error message in different possible locations
        // The API service wraps errors in Error objects with .message property
        if (err.message) {
          errorMessage = err.message;
        } else if (err.error) {
          errorMessage = err.error;
        } else if (err.originalError) {
          // Check originalError for nested error data from API response
          if (err.originalError.error) {
            errorMessage = err.originalError.error;
          } else if (err.originalError.message) {
            errorMessage = err.originalError.message;
          }
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
      }
      
      // Ensure errorMessage is always a non-empty string
      const finalErrorMessage = errorMessage && errorMessage.trim() 
        ? errorMessage.trim() 
        : "Invalid email or password";
      
      // Store error in localStorage to persist across re-renders
      localStorage.setItem("tutorlink_login_error", finalErrorMessage);
      
      // Set error state - React will detect this change and re-render
      setError(finalErrorMessage);      
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing after a failed submission
    if (error) {
      setError("");
      localStorage.removeItem("tutorlink_login_error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link
            to="/"
            className="flex items-center justify-center space-x-2 mb-8"
          >
            <BookOpen className="h-8 w-8 text-primary-600" />
            <span className="text-2xl font-bold text-secondary-900">
              TutorLink
            </span>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600">
            Or{" "}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              create a new account
            </Link>
          </p>
        </div>
        <form 
          className="mt-8 space-y-6" 
          onSubmit={handleSubmit} 
          noValidate
          onReset={(e) => {
            // Prevent form reset from clearing error
            e.preventDefault();
          }}
        >
          {sessionExpiredMessage && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-yellow-600 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">{sessionExpiredMessage}</span>
              </div>
            </div>
          )}
          {error && (
            <div 
              key={`error-${error}`}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-red-600 mr-2 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-secondary-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`input-field mt-1 ${fieldErrors.email ? 'border-red-500' : ''}`}
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-secondary-700"
              >
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className={`input-field pr-10 ${fieldErrors.password ? 'border-red-500' : ''}`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-r-md transition-colors hover:text-secondary-600 min-w-[44px]"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-secondary-400" />
                ) : (
                  <Eye className="h-5 w-5 text-secondary-400" />
                )}
              </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-secondary-900"
              >
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-secondary-600 mb-4">Demo Accounts:</p>
            <div className="space-y-2 text-xs text-secondary-500">
              <p>Admin: admin@tutorlink.com / password</p>
              <p>Tutor: tutor@tutorlink.com / password</p>
              <p>Student: student@tutorlink.com / password</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
