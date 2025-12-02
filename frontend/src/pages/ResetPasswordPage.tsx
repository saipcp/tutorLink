import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token, formData.password);
      setIsSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (isSuccess) {
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

            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-secondary-900 mb-2">
                Password Reset Successful!
              </h2>
              <p className="text-secondary-600 mb-6">
                Your password has been successfully reset. You can now sign in
                with your new password.
              </p>

              <div className="space-y-2">
                <Link to="/login" className="btn-primary w-full">
                  Go to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
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

            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-secondary-900 mb-2">
                Invalid Reset Link
              </h2>
              <p className="text-secondary-600 mb-6">
                This password reset link is invalid or has expired. Please
                request a new one.
              </p>

              <div className="space-y-2">
                <Link to="/forgot-password" className="btn-primary w-full">
                  Request New Reset Link
                </Link>
                <Link to="/login" className="btn-secondary w-full">
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-secondary-900">
              Reset your password
            </h2>
            <p className="mt-2 text-secondary-600">
              Enter your new password below.
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* New Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-secondary-700"
              >
                New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="input-field pl-10 pr-10"
                  placeholder="Enter your new password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-secondary-400" />
                </div>
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-secondary-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-secondary-400" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-secondary-500">
                Must be at least 6 characters long
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-secondary-700"
              >
                Confirm New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="input-field pl-10 pr-10"
                  placeholder="Confirm your new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-secondary-400" />
                </div>
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3"
            >
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
