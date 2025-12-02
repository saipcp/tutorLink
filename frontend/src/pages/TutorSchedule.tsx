import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  User,
  BookOpen,
  CheckCircle,
  XCircle,
  Play,
  Eye,
  MessageSquare,
  Filter,
  Search,
  Plus,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sessionsApi, subjectsApi, tutorsApi } from "../services/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Session, Subject, AvailabilitySlot } from "../types";

const TutorSchedule: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<
    "all" | "upcoming" | "today" | "completed" | "canceled"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [availabilityForm, setAvailabilityForm] = useState<{
    [key: string]: { enabled: boolean; startTime: string; endTime: string };
  }>({
    Monday: { enabled: false, startTime: "", endTime: "" },
    Tuesday: { enabled: false, startTime: "", endTime: "" },
    Wednesday: { enabled: false, startTime: "", endTime: "" },
    Thursday: { enabled: false, startTime: "", endTime: "" },
    Friday: { enabled: false, startTime: "", endTime: "" },
    Saturday: { enabled: false, startTime: "", endTime: "" },
    Sunday: { enabled: false, startTime: "", endTime: "" },
  });

  if (!user || (user.role !== "tutor" && user.role !== "admin")) return null;

  // Data queries
  const { data: sessions } = useQuery({
    queryKey: ["sessions", user.id],
    queryFn: () => sessionsApi.getSessions(user.id, "tutor"),
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.getAllSubjects(),
  });

  // Mutation for updating availability
  const updateAvailabilityMutation = useMutation({
    mutationFn: (availability: AvailabilitySlot[]) =>
      tutorsApi.updateAvailability(user!.id, availability),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", user?.id] });
      setShowAvailabilityForm(false);
    },
  });

  const handleSaveAvailability = async () => {
    const availabilitySlots: AvailabilitySlot[] = Object.entries(
      availabilityForm
    )
      .filter(([_, slot]) => slot.enabled && slot.startTime && slot.endTime)
      .map(([day, slot], index) => ({
        id: `slot-${Date.now()}-${index}`,
        tutorId: user!.id,
        dayOfWeek: day.substring(0, 3) as
          | "Mon"
          | "Tue"
          | "Wed"
          | "Thu"
          | "Fri"
          | "Sat"
          | "Sun",
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: true,
      }));

    await updateAvailabilityMutation.mutateAsync(availabilitySlots);

    // Reset form
    setAvailabilityForm({
      Monday: { enabled: false, startTime: "", endTime: "" },
      Tuesday: { enabled: false, startTime: "", endTime: "" },
      Wednesday: { enabled: false, startTime: "", endTime: "" },
      Thursday: { enabled: false, startTime: "", endTime: "" },
      Friday: { enabled: false, startTime: "", endTime: "" },
      Saturday: { enabled: false, startTime: "", endTime: "" },
      Sunday: { enabled: false, startTime: "", endTime: "" },
    });
  };

  const handleAvailabilityToggle = (day: string, enabled: boolean) => {
    setAvailabilityForm((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled },
    }));
  };

  const handleTimeChange = (
    day: string,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setAvailabilityForm((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  // Filter sessions based on selected filter
  const filteredSessions =
    sessions
      ?.filter((session) => {
        const now = new Date();
        const sessionDate = new Date(session.startAt);

        switch (filter) {
          case "upcoming":
            return sessionDate > now && session.status === "confirmed";
          case "today":
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return sessionDate >= today && sessionDate < tomorrow;
          case "completed":
            return session.status === "completed";
          case "canceled":
            return session.status === "canceled";
          default:
            return true;
        }
      })
      .filter((session) => {
        if (!searchTerm) return true;
        const subject = subjects?.find((s) => s.id === session.subjectId);
        return (
          subject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          session.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }) || [];

  // Helper functions
  const getSubjectName = (subjectId?: string) => {
    if (!subjectId) return "General";
    return subjects?.find((s) => s.id === subjectId)?.name || "Unknown Subject";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "completed":
        return "Completed";
      case "canceled":
        return "Canceled";
      default:
        return status;
    }
  };

  // Calculate stats
  const upcomingSessions = filteredSessions.filter(
    (s) => new Date(s.startAt) > new Date() && s.status === "confirmed"
  );
  const todaySessions = filteredSessions.filter((s) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sessionDate = new Date(s.startAt);
    return sessionDate >= today && sessionDate < tomorrow;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
          <p className="text-gray-600 mt-1">
            Manage your tutoring sessions and availability
          </p>
        </div>
        <button
          onClick={() => setShowAvailabilityForm(true)}
          className="btn-secondary flex items-center space-x-2"
        >
          <Settings className="h-4 w-4" />
          <span>Availability Settings</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {upcomingSessions.length}
          </div>
          <div className="text-sm text-gray-600">Upcoming Sessions</div>
        </div>
        <div className="card text-center">
          <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {todaySessions.length}
          </div>
          <div className="text-sm text-gray-600">Sessions Today</div>
        </div>
        <div className="card text-center">
          <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {filteredSessions.filter((s) => s.status === "completed").length}
          </div>
          <div className="text-sm text-gray-600">Completed Sessions</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
          </div>
        </div>
        <div className="flex space-x-2 w-48">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="input-field w-full"
          >
            <option value="all">All Sessions</option>
            <option value="upcoming">Upcoming</option>
            <option value="today">Today</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      {/* Sessions List */}
      {!filteredSessions.length ? (
        <div className="card text-center py-12">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? "No sessions found" : "No sessions scheduled"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Your scheduled sessions will appear here"}
          </p>
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
                      className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusColor(
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
                      <User className="h-4 w-4" />
                      <span>
                        {((session as any).studentFirstName && (session as any).studentLastName)
                          ? `${(session as any).studentFirstName} ${(session as any).studentLastName}`
                          : (session as any).studentName || "Unknown Student"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-2 pt-4 border-t border-gray-100">
                {session.status === "confirmed" &&
                  new Date(session.startAt) > new Date() && (
                    <>
                      <button className="btn-primary text-sm flex items-center space-x-1">
                        <Play className="h-4 w-4" />
                        <span>Join Session</span>
                      </button>
                      <button className="btn-secondary text-sm flex items-center space-x-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>Message</span>
                      </button>
                    </>
                  )}
                {session.status === "completed" && (
                  <button 
                    onClick={() => setSelectedSession(session)}
                    className="btn-secondary text-sm flex items-center space-x-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Session Details</h3>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Subject</label>
                <p className="text-gray-900">{getSubjectName(selectedSession.subjectId)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Student</label>
                <p className="text-gray-900">
                  {((selectedSession as any).studentFirstName && (selectedSession as any).studentLastName)
                    ? `${(selectedSession as any).studentFirstName} ${(selectedSession as any).studentLastName}`
                    : (selectedSession as any).studentName || "Unknown Student"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <p className="text-gray-900">{formatDate(selectedSession.startAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Time</label>
                  <p className="text-gray-900">
                    {formatTime(selectedSession.startAt)} - {formatTime(selectedSession.endAt)}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <span
                  className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                    selectedSession.status
                  )}`}
                >
                  {getStatusText(selectedSession.status)}
                </span>
              </div>

              {selectedSession.price && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Price</label>
                  <p className="text-gray-900">
                    ${typeof selectedSession.price === 'number' 
                      ? selectedSession.price.toFixed(2) 
                      : parseFloat(selectedSession.price || '0').toFixed(2)}
                  </p>
                </div>
              )}

              {(selectedSession as any).notes && (selectedSession as any).notes.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Session Notes</label>
                  <div className="mt-2 space-y-2">
                    {(selectedSession as any).notes.map((note: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">{note.content || note.note}</p>
                        {note.createdAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(note.createdAt || "")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  onClick={() => setSelectedSession(null)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Availability Settings Modal */}
      {showAvailabilityForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Update Availability</h3>
              <button
                onClick={() => setShowAvailabilityForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Set your weekly availability schedule. Students will be able to
                book sessions during these times. Make sure to set realistic
                time slots that work for your schedule.
              </p>

              <div className="space-y-3">
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((day) => (
                  <div
                    key={day}
                    className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-900">{day}</span>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={availabilityForm[day].enabled}
                          onChange={(e) =>
                            handleAvailabilityToggle(day, e.target.checked)
                          }
                          className="rounded"
                        />
                        <span className="text-sm text-gray-600">
                          {availabilityForm[day].enabled
                            ? "Available"
                            : "Unavailable"}
                        </span>
                      </label>
                    </div>

                    {availabilityForm[day].enabled && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={availabilityForm[day].startTime}
                            onChange={(e) =>
                              handleTimeChange(day, "startTime", e.target.value)
                            }
                            className="input-field text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            End Time
                          </label>
                          <input
                            type="time"
                            value={availabilityForm[day].endTime}
                            onChange={(e) =>
                              handleTimeChange(day, "endTime", e.target.value)
                            }
                            className="input-field text-sm"
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-blue-900">Tip</div>
                    <div className="text-blue-700">
                      Your availability will be visible to students when they
                      browse and book sessions. Make sure to keep your schedule
                      up to date!
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => setShowAvailabilityForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAvailability}
                  className="btn-primary"
                  disabled={Object.values(availabilityForm).every(
                    (slot) => !slot.enabled
                  )}
                >
                  Save Availability
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorSchedule;
