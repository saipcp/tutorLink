import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await forgotPassword(email.trim());
      setIsSubmitted(true);

      // Redirect to reset password page with the actual token
      // In development, the token is returned in the response
      // In production, the token would be sent via email
      const resetToken = (response as any).token;
      if (resetToken) {
        setTimeout(() => {
          navigate(`/reset-password?token=${resetToken}`);
        }, 2000);
      } else {
        // If no token in response (production mode), show message to check email
        // User would click link from email which contains the token
      }
    } catch (err: any) {
      setError(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  if (isSubmitted) {
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
                Check your email
              </h2>
              <p className="text-secondary-600 mb-6">
                We've sent password reset instructions to{" "}
                <strong>{email}</strong>
              </p>

              <div className="space-y-4">
                <p className="text-sm text-secondary-500">
                  Didn't receive the email? Check your spam folder or try again.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="btn-secondary w-full"
                  >
                    Try a different email
                  </button>
                  <button
                    onClick={handleBackToLogin}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Login</span>
                  </button>
                </div>
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
              Forgot your password?
            </h2>
            <p className="mt-2 text-secondary-600">
              Enter your email address and we'll send you instructions to reset
              your password.
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

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-secondary-700 mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-field pl-12"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-secondary-400" />
              </div>
            </div>
            <p className="mt-1 text-xs text-secondary-500">
              We'll send password reset instructions to this email
            </p>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3"
            >
              {isLoading ? "Sending..." : "Send Reset Instructions"}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-primary-600 hover:text-primary-500 flex items-center justify-center space-x-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Login</span>
            </Link>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-secondary-600 mb-4">Demo Accounts:</p>
          <div className="space-y-2 text-xs text-secondary-500">
            <p>Student: student@tutorlink.com</p>
            <p>Tutor: tutor@tutorlink.com</p>
            <p>Admin: admin@tutorlink.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
