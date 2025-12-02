import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShieldX, Lock, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface UnauthorizedPageProps {
  reason?: "not_authenticated" | "insufficient_permissions";
  requiredRoles?: string[];
}

const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({
  reason: propReason,
  requiredRoles: propRequiredRoles,
}) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get reason and requiredRoles from location state or props
  const state = location.state as {
    reason?: "not_authenticated" | "insufficient_permissions";
    requiredRoles?: string[];
  } | null;

  const reason = propReason || state?.reason || "insufficient_permissions";
  const requiredRoles = propRequiredRoles || state?.requiredRoles || [];

  const isNotAuthenticated = reason === "not_authenticated" || !isAuthenticated;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-6">
            <ShieldX className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-6xl font-bold text-secondary-900 mb-2">403</h1>
          <h2 className="text-2xl font-semibold text-secondary-700 mb-4">
            {isNotAuthenticated ? "Access Denied" : "Unauthorized Access"}
          </h2>
        </div>

        <div className="card mb-8">
          <div className="space-y-4">
            {isNotAuthenticated ? (
              <>
                <div className="flex items-center justify-center mb-4">
                  <Lock className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-secondary-700 font-medium mb-2">
                  You need to be logged in to access this page.
                </p>
                <p className="text-secondary-600 text-sm">
                  Please sign in to your account to continue.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center mb-4">
                  <ShieldX className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-secondary-700 font-medium mb-2">
                  You don't have permission to access this page.
                </p>
                {user && (
                  <p className="text-secondary-600 text-sm mb-2">
                    Your current role:{" "}
                    <span className="font-semibold capitalize">
                      {user.role}
                    </span>
                  </p>
                )}
                {requiredRoles.length > 0 && (
                  <p className="text-secondary-600 text-sm">
                    Required role(s):{" "}
                    <span className="font-semibold">
                      {requiredRoles
                        .map((role) => role.charAt(0).toUpperCase() + role.slice(1))
                        .join(", ")}
                    </span>
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isNotAuthenticated ? (
            <>
              <Link to="/login" className="btn-primary flex items-center justify-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/"
                className="btn-secondary flex items-center justify-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Go Home</span>
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate(-1)}
                className="btn-secondary flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Go Back</span>
              </button>
              {user?.role === "student" && (
                <Link
                  to="/student"
                  className="btn-primary flex items-center justify-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Student Dashboard</span>
                </Link>
              )}
              {user?.role === "tutor" && (
                <Link
                  to="/tutor"
                  className="btn-primary flex items-center justify-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Tutor Dashboard</span>
                </Link>
              )}
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  className="btn-primary flex items-center justify-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Admin Dashboard</span>
                </Link>
              )}
              {!user && (
                <Link
                  to="/"
                  className="btn-primary flex items-center justify-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Go Home</span>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;

