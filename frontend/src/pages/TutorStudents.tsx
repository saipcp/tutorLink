import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Calendar,
  MessageSquare,
  Search,
  Mail,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sessionsApi, subjectsApi, adminApi } from "../services/api";
import type { Session } from "../types";

const TutorStudents: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "recent">("all");

  if (!user || (user.role !== "tutor" && user.role !== "admin")) return null;

  const isAdmin = user.role === "admin";

  // Data queries
  const { data: sessions } = useQuery({
    queryKey: isAdmin ? ["allSessions"] : ["sessions", user.id],
    queryFn: () => isAdmin 
      ? adminApi.getAllSessions()
      : sessionsApi.getSessions(user.id, "tutor"),
    enabled: !!user,
  });

  const { data: allUsers } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => adminApi.getAllUsers(),
    enabled: isAdmin,
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.getAllSubjects(),
  });

  // Get students based on role
  const allStudents = isAdmin
    ? // For admin: get all students from users list
      (allUsers?.filter((u) => u.role === "student") || []).map((studentUser) => {
        const studentSessions = sessions?.filter((s) => s.studentId === studentUser.id) || [];
        return {
          id: studentUser.id,
          name: `${studentUser.firstName || ""} ${studentUser.lastName || ""}`.trim() || "Unknown Student",
          email: studentUser.email || "",
          sessions: studentSessions,
        };
      })
    : // For tutor: get unique students from sessions
      (sessions?.reduce((acc, session) => {
        if (session.studentId && !acc.find((s) => s.id === session.studentId)) {
          // Use studentFirstName and studentLastName from session if available
          const studentName = ((session as any).studentFirstName && (session as any).studentLastName)
            ? `${(session as any).studentFirstName} ${(session as any).studentLastName}`
            : (session as any).studentName || "Unknown Student";
          
          acc.push({
            id: session.studentId,
            name: studentName,
            email: (session as any).studentEmail || "",
            sessions: sessions.filter((s) => s.studentId === session.studentId),
          });
        }
        return acc;
      }, [] as Array<{ id: string; name: string; email: string; sessions: Session[] }>) || []);

  // Filter students based on search and filter criteria
  const filteredStudents = allStudents.filter((student) => {
    // Search filter
    if (
      searchTerm &&
      !student.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !student.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // Status filter
    switch (filter) {
      case "active":
        return student.sessions.some(
          (s) => new Date(s.startAt) > new Date() && s.status === "booked"
        );
      case "recent":
        return student.sessions.some(
          (s) =>
            new Date(s.startAt) >
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        );
      default:
        return true;
    }
  });

  // Helper functions
  const getSubjectName = (subjectId: string) => {
    return subjects?.find((s) => s.id === subjectId)?.name || "Unknown Subject";
  };

  const getUpcomingSessions = (studentSessions: Session[]) => {
    return studentSessions.filter(
      (s) => new Date(s.startAt) > new Date() && s.status === "booked"
    );
  };

  const getCompletedSessions = (studentSessions: Session[]) => {
    return studentSessions.filter((s) => s.status === "completed");
  };

  const getTotalHours = (studentSessions: Session[]) => {
    return studentSessions
      .filter((s) => s.status === "completed")
      .reduce((total, session) => {
        const start = new Date(session.startAt);
        const end = new Date(session.endAt);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin ? "All Students" : "My Students"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin 
              ? "View and manage all students in the platform"
              : "Manage your student relationships and session history"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {allStudents.length}
          </div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
        <div className="card text-center">
          <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {
              allStudents.filter(
                (s) => getUpcomingSessions(s.sessions).length > 0
              ).length
            }
          </div>
          <div className="text-sm text-gray-600">Active Students</div>
        </div>
        <div className="card text-center">
          <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(
              allStudents.reduce(
                (total, s) => total + getTotalHours(s.sessions),
                0
              )
            )}
          </div>
          <div className="text-sm text-gray-600">Total Hours</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="input-field w-48"
          >
            <option value="all">All Students</option>
            <option value="active">Active</option>
            <option value="recent">Recent</option>
          </select>
        </div>
      </div>

      {/* Students List */}
      {!filteredStudents.length ? (
        <div className="card text-center py-12">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? "No students found" : "No students yet"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Students you work with will appear here"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredStudents.map((student) => (
            <div key={student.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        student.name || "Unknown Student"
                      )}&size=48&background=3B82F6&color=FFFFFF&bold=true`}
                      alt={student.name || "Unknown Student"}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const initials = student.name
                          ? student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                          : "??";
                        target.src = `data:image/svg+xml;base64,${btoa(`
                          <svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
                            <rect width="48" height="48" fill="#3B82F6"/>
                            <text x="24" y="32" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="white">${initials}</text>
                          </svg>
                        `)}`;
                      }}
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {student.name}
                      </h3>
                      {student.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-1" />
                          {student.email}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {getUpcomingSessions(student.sessions).length}
                      </div>
                      <div className="text-xs text-gray-600">Upcoming</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {getCompletedSessions(student.sessions).length}
                      </div>
                      <div className="text-xs text-gray-600">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {Math.round(getTotalHours(student.sessions))}h
                      </div>
                      <div className="text-xs text-gray-600">Total Hours</div>
                    </div>
                  </div>

                  {/* Recent subjects */}
                  {student.sessions.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Recent Subjects
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(Array.from(
                          new Set(
                            student.sessions
                              .map((s) => s.subjectId)
                              .filter((id): id is string => !!id)
                          )
                        ) as string[])
                          .slice(0, 3)
                          .map((subjectId) => (
                            <span
                              key={subjectId}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                            >
                              {getSubjectName(subjectId)}
                            </span>
                          ))}
                        {(Array.from(
                          new Set(
                            student.sessions
                              .map((s) => s.subjectId)
                              .filter((id): id is string => !!id)
                          )
                        ) as string[]).length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            +
                            {(Array.from(
                              new Set(
                                student.sessions
                                  .map((s) => s.subjectId)
                                  .filter((id): id is string => !!id)
                              )
                            ) as string[]).length - 3}{" "}
                            more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-2 pt-4 border-t border-gray-100">
                {getUpcomingSessions(student.sessions).length > 0 && (
                  <button
                    onClick={() => navigate("/messages")}
                    className="btn-secondary text-sm flex items-center space-x-1"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Message</span>
                  </button>
                )}
                <button
                  onClick={() => navigate(isAdmin ? "/admin/sessions" : "/tutor/sessions")}
                  className="btn-secondary text-sm flex items-center space-x-1"
                >
                  <Calendar className="h-4 w-4" />
                  <span>View Sessions</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TutorStudents;
