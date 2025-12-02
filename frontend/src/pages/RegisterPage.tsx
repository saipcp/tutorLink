import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { BookOpen, Eye, EyeOff, User, Mail, Lock, Phone } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Utility function to get role-based dashboard path
const getDashboardPath = (role: string) => {
  switch (role) {
    case "student":
      return "/student";
    case "tutor":
      return "/tutor";
    case "admin":
      return "/admin";
    default:
      return "/student";
  }
};

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student" as "student" | "tutor",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { register, loading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination from location state, fallback to role-based dashboard
  const from = (location.state as any)?.from;

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // First name validation
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s\-'\.]+$/.test(formData.firstName)) {
      errors.firstName =
        "First name can only contain letters, spaces, hyphens, apostrophes, and periods";
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s\-'\.]+$/.test(formData.lastName)) {
      errors.lastName =
        "Last name can only contain letters, spaces, hyphens, apostrophes, and periods";
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Phone validation (optional)
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      errors.phone = "Please enter a valid phone number";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    } else if (formData.password.length > 128) {
      errors.password = "Password must be less than 128 characters";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });

      // After successful registration, navigate to role-based dashboard
      // Use the intended destination if coming from another page, otherwise use role-based path
      const dashboardPath = getDashboardPath(user?.role || formData.role);
      navigate(from || dashboardPath, { replace: true });
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600">
            Or{" "}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                I am a:
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="student">Student</option>
                <option value="tutor">Tutor</option>
              </select>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-secondary-700"
                >
                  First Name
                </label>
                <div className="mt-1 relative">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    className={`input-field pl-12 ${
                      fieldErrors.firstName ? "border-red-500" : ""
                    }`}
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                  {fieldErrors.firstName && (
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.firstName}
                    </p>
                  )}
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-secondary-400" />
                  </div>
                </div>
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-secondary-700"
                >
                  Last Name
                </label>
                <div className="mt-1 relative">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    className={`input-field pl-12 ${
                      fieldErrors.lastName ? "border-red-500" : ""
                    }`}
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                  {fieldErrors.lastName && (
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.lastName}
                    </p>
                  )}
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-secondary-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-secondary-700"
              >
                Email Address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`input-field pl-12 ${
                    fieldErrors.email ? "border-red-500" : ""
                  }`}
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.email}
                  </p>
                )}
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-secondary-400" />
                </div>
              </div>
            </div>

            {/* Phone (Optional) */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-secondary-700"
              >
                Phone Number (Optional)
              </label>
              <div className="mt-1 relative">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className={`input-field pl-12 ${
                    fieldErrors.phone ? "border-red-500" : ""
                  }`}
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                />
                {fieldErrors.phone && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.phone}
                  </p>
                )}
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-secondary-400" />
                </div>
              </div>
            </div>

            {/* Password */}
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
                  autoComplete="new-password"
                  required
                  className={`input-field pl-10 pr-10 ${
                    fieldErrors.password ? "border-red-500" : ""
                  }`}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-secondary-400" />
                </div>
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
              {fieldErrors.password ? (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.password}
                </p>
              ) : (
                <p className="mt-1 text-xs text-secondary-500">
                  Must be at least 6 characters long
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-secondary-700"
              >
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className={`input-field pl-10 pr-10 ${
                    fieldErrors.confirmPassword ? "border-red-500" : ""
                  }`}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-secondary-400" />
                </div>
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-r-md transition-colors hover:text-secondary-600 min-w-[44px]"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-secondary-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-secondary-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Terms and Privacy */}
          <div className="flex items-start">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded mt-0.5"
            />
            <label
              htmlFor="terms"
              className="ml-2 block text-sm text-secondary-900"
            >
              I agree to the{" "}
              <Link
                to="#"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="#"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Privacy Policy
              </Link>
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="btn-primary w-full py-3"
            >
              {loading || isSubmitting
                ? "Creating Account..."
                : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
