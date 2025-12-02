import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Utility function to get role-based dashboard path
const getDashboardPath = (role: string) => {
  switch (role) {
    case "tutor":
      return "/tutor";
    case "admin":
      return "/admin/dashboard";
    default:
      return "/student";
  }
};

const DashboardRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login", { replace: true });
      } else {
        const dashboardPath = getDashboardPath(user.role);
        navigate(dashboardPath, { replace: true });
      }
    }
  }, [user, loading, navigate]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
};

export default DashboardRedirect;

