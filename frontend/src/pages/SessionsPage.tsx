import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  User,
  BookOpen,
  CheckCircle,
  MessageSquare,
  Search,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sessionsApi, tutorsApi, subjectsApi } from "../services/api";
import type { Session } from "../types";

const SessionsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<
    "all" | "upcoming" | "completed" | "canceled"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  if (!user) return null;

  // Data queries
  const { data: sessions } = useQuery({
    queryKey: ["sessions", user.id],
    queryFn: () =>
      sessionsApi.getSessions(user.id, user.role as "student" | "tutor"),
  });

  const { data: tutors } = useQuery({
    queryKey: ["tutors"],
    queryFn: () => tutorsApi.getAllTutors(),
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.getAllSubjects(),
  });

  // Filter sessions based on user role and selected filter
  const filteredSessions =
    sessions?.filter((session) => {
      // Search filter
      let matchesSearch = true;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const subjectName = getSubjectName(session.subjectId).toLowerCase();
        const tutorOrStudentName = user.role === "student"
          ? (getTutorName(session.tutorId) || "").toLowerCase()
          : (getStudentName(session) || "").toLowerCase();
        
        matchesSearch = 
          subjectName.includes(searchLower) ||
          tutorOrStudentName.includes(searchLower);
      }

      // Status filter
      let matchesFilter = true;
      switch (filter) {
        case "upcoming":
          matchesFilter = session.status === "booked";
          break;
        case "completed":
          matchesFilter = session.status === "completed";
          break;
        case "canceled":
          matchesFilter = session.status === "canceled";
          break;
        default:
          matchesFilter = true;
      }

      return matchesSearch && matchesFilter;
    }) || [];

  const getTutorName = (tutorId: string) => {
    if (!tutorId || !tutors) return "Unknown Tutor";
    const tutor = tutors.find((t) => t.id === tutorId);
    if (!tutor) return "Unknown Tutor";
    // Handle different tutor data structures
    if (tutor.user) {
      return `${tutor.user.firstName || ""} ${tutor.user.lastName || ""}`.trim() || "Unknown Tutor";
    }
    if (tutor.firstName) {
      return `${tutor.firstName || ""} ${tutor.lastName || ""}`.trim() || "Unknown Tutor";
    }
    return "Unknown Tutor";
  };

  const getStudentName = (session: Session) => {
    // Use student info from session if available (backend returns studentFirstName and studentLastName)
    if ((session as any).studentFirstName && (session as any).studentLastName) {
      return `${(session as any).studentFirstName} ${(session as any).studentLastName}`;
    }
    if ((session as any).studentName) {
      return (session as any).studentName;
    }
    return `Student ${session.studentId?.slice(-4) || "Unknown"}`;
  };

  const getSubjectName = (subjectId?: string) => {
    if (!subjectId) return "General";
    const subject = subjects?.find((s) => s.id === subjectId);
    return subject?.name || "Unknown Subject";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: Session["status"]) => {
    switch (status) {
      case "booked":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "canceled":
        return "bg-red-100 text-red-700";
      case "no_show":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: Session["status"]) => {
    switch (status) {
      case "booked":
        return "Booked";
      case "completed":
        return "Completed";
      case "canceled":
        return "Canceled";
      case "no_show":
        return "No Show";
      default:
        return "Unknown";
    }
  };

  const upcomingSessions = filteredSessions.filter(
    (s) => s.status === "booked"
  );
  const completedSessions = filteredSessions.filter(
    (s) => s.status === "completed"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user.role === "student" ? "My Sessions" : "My Schedule"}
          </h1>
          <p className="text-gray-600">
            {user.role === "student"
              ? "View and manage your tutoring sessions"
              : "Manage your tutoring schedule and sessions"}
          </p>
        </div>
        {user.role === "student" && (
          <button
            onClick={() => navigate("/browse")}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Book New Session</span>
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {upcomingSessions.length}
          </div>
          <div className="text-sm text-gray-600">Upcoming</div>
        </div>
        <div className="card text-center">
          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {completedSessions.length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="card text-center">
          <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {filteredSessions.length}
          </div>
          <div className="text-sm text-gray-600">Total Sessions</div>
        </div>
        <div className="card text-center">
          <BookOpen className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {user.role === "student"
              ? tutors?.filter((t) =>
                  upcomingSessions.some((s) => s.tutorId === t.id)
                ).length || 0
              : new Set(upcomingSessions.map((s) => s.studentId)).size}
          </div>
          <div className="text-sm text-gray-600">
            {user.role === "student" ? "Active Tutors" : "Active Students"}
          </div>
        </div>
      </div>

      {/* Sessions List */}
      {!filteredSessions.length ? (
        <div className="card text-center py-12">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? "No sessions found" : "No sessions yet"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm
              ? "Try adjusting your search terms"
              : user.role === "student"
              ? "Book your first tutoring session to get started"
              : "Your upcoming sessions will appear here"}
          </p>
          {user.role === "student" && !searchTerm && (
            <button
              onClick={() => navigate("/browse")}
              className="btn-primary flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Find Tutors</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSessions.map((session) => (
            <div key={session.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getSubjectName(session.subjectId)}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                        session.status
                      )}`}
                    >
                      {getStatusText(session.status)}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(session.startAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatTime(session.startAt)} -{" "}
                        {formatTime(session.endAt)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.role === "student" ? (
                        <>
                          <User className="h-4 w-4" />
                          <span>{getTutorName(session.tutorId)}</span>
                        </>
                      ) : (
                        <>
                          <User className="h-4 w-4" />
                          <span>{getStudentName(session)}</span>
                        </>
                      )}
                    </div>
                    {session.price && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          ${session.price}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Session Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  {session.status === "booked" && (
                    <>
                      <button
                        onClick={() => navigate(`/messages`)}
                        className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center space-x-1"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span>Message</span>
                      </button>
                    </>
                  )}
                  {session.status === "completed" && 
                   user.role === "student" && 
                   session.studentId === user.id && (
                    <button
                      onClick={() => {
                        navigate("/student/reviews");
                      }}
                      className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center space-x-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      <span>Leave Review</span>
                    </button>
                  )}
                </div>
                {session.status === "booked" && user.role === "student" && (
                  <button className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Sessions Alert */}
      {user.role === "student" && upcomingSessions.length > 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">
                Upcoming Sessions
              </h3>
              <p className="text-blue-700 text-sm mb-3">
                You have {upcomingSessions.length} session
                {upcomingSessions.length > 1 ? "s" : ""} scheduled. Don't forget
                to prepare!
              </p>
              <div className="space-y-2">
                {upcomingSessions.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-blue-800">
                      {getSubjectName(session.subjectId)} with{" "}
                      {getTutorName(session.tutorId)}
                    </span>
                    <span className="text-blue-600 font-medium">
                      {formatDate(session.startAt)} at{" "}
                      {formatTime(session.startAt)}
                    </span>
                  </div>
                ))}
                {upcomingSessions.length > 3 && (
                  <div className="text-blue-600 text-sm">
                    +{upcomingSessions.length - 3} more sessions
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionsPage;
