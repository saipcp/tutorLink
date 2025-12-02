import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Hook to check if user session is valid and redirect to login if expired
 * Shows "Session Expired" error before redirecting
 */
export const useSessionCheck = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  const [showSessionExpired, setShowSessionExpired] = useState(false);

  useEffect(() => {
    // Listen for session expired events from API
    const handleSessionExpired = (event: CustomEvent) => {
      setShowSessionExpired(true);
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    };

    window.addEventListener("sessionExpired", handleSessionExpired as EventListener);

    // Check if user is authenticated after loading completes
    if (!loading && !isAuthenticated && !user) {
      setShowSessionExpired(true);
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    }

    return () => {
      window.removeEventListener("sessionExpired", handleSessionExpired as EventListener);
    };
  }, [isAuthenticated, user, loading, navigate]);

  return { showSessionExpired, isAuthenticated, user, loading };
};

