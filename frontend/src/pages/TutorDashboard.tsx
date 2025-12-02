import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Calendar,
  Users,
  DollarSign,
  Clock,
  Star,
  MessageSquare,
  Settings,
  CheckCircle,
  XCircle,
  UserPlus,
  TrendingUp,
  BookOpen,
  Award,
  Bell,
  Eye,
  Video,
  Edit,
  Trash2,
  User,
  MapPin,
  Mail,
  Phone,
  ChevronRight,
} from "lucide-react";
import ChatWidget from "../components/Chat/ChatWidget";
import { useAuth } from "../context/AuthContext";
import {
  sessionsApi,
  dashboardApi,
  tutorsApi,
  messagingApi,
  reviewsApi,
  subjectsApi,
} from "../services/api";
import type { Session, AvailabilitySlot, Review, Subject } from "../types";

const TutorDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Dashboard data queries
  const { data: dashboardData } = useQuery({
    queryKey: ["tutorDashboard", user?.id],
    queryFn: () => dashboardApi.getTutorDashboard(user!.id),
    enabled: !!user?.id,
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions", user?.id, "tutor"],
    queryFn: () => sessionsApi.getSessions(user!.id, "tutor"),
    enabled: !!user?.id,
  });

  const { data: tutorProfile } = useQuery({
    queryKey: ["tutorProfile", user?.id],
    queryFn: () => tutorsApi.getTutorByUserId(user!.id),
    enabled: !!user?.id,
  });

  const { data: reviews } = useQuery({
    queryKey: ["tutorReviews", user?.id],
    queryFn: async () => {
      if (tutorProfile?.id) {
        return tutorsApi.getTutorReviews(tutorProfile.id);
      }
      return [];
    },
    enabled: !!user?.id && !!tutorProfile?.id,
  });

  const { data: conversations } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => messagingApi.getConversations(user!.id),
    enabled: !!user?.id,
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.getAllSubjects(),
  });

  // Mutations
  const updateAvailabilityMutation = useMutation({
    mutationFn: (availability: AvailabilitySlot[]) =>
      tutorsApi.updateAvailability(user!.id, availability),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutorDashboard", user?.id] });
    },
  });

  const completeSessionMutation = useMutation({
    mutationFn: ({ sessionId, notes }: { sessionId: string; notes?: string }) =>
      sessionsApi.completeSession(sessionId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sessions", user?.id, "tutor"],
      });
      queryClient.invalidateQueries({ queryKey: ["tutorDashboard", user?.id] });
    },
  });

  const cancelSessionMutation = useMutation({
    mutationFn: (sessionId: string) => sessionsApi.cancelSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sessions", user?.id, "tutor"],
      });
      queryClient.invalidateQueries({ queryKey: ["tutorDashboard", user?.id] });
    },
  });

  // State for forms
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [showNotesForm, setShowNotesForm] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
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

  const handleCompleteSession = async (sessionId: string) => {
    if (notes.trim()) {
      await completeSessionMutation.mutateAsync({ sessionId, notes });
    } else {
      await completeSessionMutation.mutateAsync({ sessionId });
    }
    setShowNotesForm(null);
    setNotes("");
  };

  const handleCancelSession = async (sessionId: string) => {
    if (confirm("Are you sure you want to cancel this session?")) {
      await cancelSessionMutation.mutateAsync(sessionId);
    }
  };

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
    setShowAvailabilityForm(false);

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

  const getSubjectName = (subjectId: string) => {
    return subjects?.find((s) => s.id === subjectId)?.name || "Unknown Subject";
  };

  const getStudentName = (session: Session) => {
    // Use student info from session if available
    if ((session as any).studentFirstName && (session as any).studentLastName) {
      return `${(session as any).studentFirstName} ${
        (session as any).studentLastName
      }`;
    }
    return `Student ${session.studentId.slice(-4)}`;
  };

  const calculateEarnings = () => {
    const completedSessions =
      sessions?.filter((s) => s.status === "completed") || [];
    const thisMonth = completedSessions.filter((s) => {
      const sessionDate = new Date(s.startAt);
      const now = new Date();
      return (
        sessionDate.getMonth() === now.getMonth() &&
        sessionDate.getFullYear() === now.getFullYear()
      );
    });

    const total = completedSessions.reduce((sum, s) => {
      const price = typeof s.price === 'number' ? s.price : parseFloat(s.price || '0') || 0;
      return sum + price;
    }, 0);
    const thisMonthTotal = thisMonth.reduce((sum, s) => {
      const price = typeof s.price === 'number' ? s.price : parseFloat(s.price || '0') || 0;
      return sum + price;
    }, 0);

    // Format numbers properly with 2 decimal places
    const formatCurrency = (num: number) => {
      // Ensure we have a valid number
      const validNum = isNaN(num) || !isFinite(num) ? 0 : num;
      // Round to 2 decimal places
      const rounded = Math.round(validNum * 100) / 100;
      // Format with commas and 2 decimal places
      return rounded.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    };

    return {
      total: total,
      thisMonth: thisMonthTotal,
      sessionsThisMonth: thisMonth.length,
      formattedTotal: formatCurrency(total),
      formattedThisMonth: formatCurrency(thisMonthTotal),
    };
  };

  const earnings = calculateEarnings();

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Welcome back, {user.firstName}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your tutoring business today
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAvailabilityForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Update Availability</span>
          </button>
          <button
            onClick={() => navigate("/tutor/settings")}
            className="btn-secondary flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>View Profile</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card hover:shadow-lg transition-shadow overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="h-8 w-8 text-blue-600 flex-shrink-0" />
            <div className="text-right min-w-0 flex-1 ml-2">
              <div className="text-xs text-gray-500 truncate">Today</div>
              <div className="text-sm font-medium text-blue-600 truncate">
                {(Array.isArray(dashboardData?.upcomingSessions) &&
                  dashboardData.upcomingSessions.filter((s: any) => {
                    const today = new Date().toDateString();
                    return new Date(s.startAt).toDateString() === today;
                  }).length) ||
                  0}
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 truncate">
            {Array.isArray(dashboardData?.upcomingSessions)
              ? dashboardData.upcomingSessions.length
              : typeof dashboardData?.upcomingSessions === "number"
              ? dashboardData.upcomingSessions
              : 0}
          </div>
          <div className="text-sm text-gray-600 truncate">Upcoming Sessions</div>
          <div className="flex items-center mt-1">
            {Array.isArray(dashboardData?.upcomingSessions) && dashboardData.upcomingSessions.length > 0 ? (
              <>
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">
                  {dashboardData.upcomingSessions.length} upcoming
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-500">No upcoming sessions</span>
            )}
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
            <div className="text-right min-w-0 flex-1 ml-2">
              <div className="text-xs text-gray-500 truncate">This Month</div>
              <div className="text-sm font-medium text-green-600 truncate">
                {earnings.sessionsThisMonth}
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 truncate">
            {typeof dashboardData?.completedSessions === "number"
              ? dashboardData.completedSessions
              : Array.isArray(dashboardData?.completedSessions)
              ? dashboardData.completedSessions.length
              : 0}
          </div>
          <div className="text-sm text-gray-600 truncate">Completed Sessions</div>
          <div className="flex items-center mt-1">
            {earnings.sessionsThisMonth > 0 ? (
              <>
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">
                  {earnings.sessionsThisMonth} this month
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-500">No sessions this month</span>
            )}
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8 text-green-600 flex-shrink-0" />
            <div className="text-right min-w-0 flex-1 ml-2">
              <div className="text-xs text-gray-500 truncate">This Month</div>
              <div className="text-sm font-medium text-green-600 truncate">
                ${earnings.formattedThisMonth}
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 truncate break-words">
            ${earnings.formattedTotal}
          </div>
          <div className="text-sm text-gray-600 truncate">Total Earnings</div>
          <div className="flex items-center mt-1">
            {earnings.thisMonth > 0 ? (
              <>
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">
                  ${earnings.formattedThisMonth} this month
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-500">No earnings this month</span>
            )}
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <Star className="h-8 w-8 text-yellow-600 flex-shrink-0" />
            <div className="text-right min-w-0 flex-1 ml-2">
              <div className="text-xs text-gray-500 truncate">All Time</div>
              <div className="text-sm font-medium text-yellow-600 truncate">
                {reviews?.length || 0} reviews
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 truncate">
            {dashboardData?.averageRating?.toFixed(2) || "0.00"}
          </div>
          <div className="text-sm text-gray-600 truncate">Average Rating</div>
          <div className="flex items-center mt-1">
            <Award className="h-3 w-3 text-yellow-500 mr-1" />
            <span className="text-xs text-gray-600">Excellent!</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Upcoming Sessions
            </h3>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">
                Next:{" "}
                {Array.isArray(dashboardData?.upcomingSessions) &&
                dashboardData.upcomingSessions.length
                  ? new Date(
                      dashboardData.upcomingSessions[0]?.startAt
                    ).toLocaleDateString()
                  : "None"}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {Array.isArray(dashboardData?.upcomingSessions) &&
              dashboardData.upcomingSessions.slice(0, 4).map((session: any) => (
                <div
                  key={session.id}
                  className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {getStudentName(session)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getSubjectName(session.subjectId || "")}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center space-x-1">
                        <Video className="h-3 w-3" />
                        <span>Join</span>
                      </button>
                      {session.status === "booked" && (
                        <>
                          <button
                            onClick={() => setShowNotesForm(session.id)}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center space-x-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            <span>Complete</span>
                          </button>
                          <button
                            onClick={() => handleCancelSession(session.id)}
                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center space-x-1"
                          >
                            <XCircle className="h-3 w-3" />
                            <span>Cancel</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {new Date(session.startAt).toLocaleDateString()} at{" "}
                      {new Date(session.startAt).toLocaleTimeString()} -{" "}
                      {new Date(session.endAt).toLocaleTimeString()}
                    </div>
                    {session.price && (
                      <div className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                        ${typeof session.price === 'number' ? session.price.toFixed(2) : parseFloat(session.price || '0').toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            {(!Array.isArray(dashboardData?.upcomingSessions) ||
              !dashboardData.upcomingSessions.length) && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-2">
                  No upcoming sessions
                </p>
                <button
                  onClick={() => navigate("/tutor/students")}
                  className="btn-primary text-sm"
                >
                  Browse Students
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Messages
            </h3>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">Recent</span>
            </div>
          </div>
          <div className="space-y-3">
            {conversations?.slice(0, 3).map((conversation: any) => {
              const otherMembers = conversation.members?.filter(
                (m: any) => m.userId !== user!.id
              ) || [];
              const otherMember =
                otherMembers.length > 0 ? otherMembers[0] : null;
              
              const getInitials = (firstName?: string, lastName?: string) => {
                if (firstName && lastName) {
                  return `${firstName[0]}${lastName[0]}`.toUpperCase();
                }
                return "U";
              };

              return (
                <div
                  key={conversation.id}
                  onClick={() => navigate("/messages")}
                  className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {otherMember?.avatar ? (
                        <img
                          src={otherMember.avatar}
                          alt={otherMember.firstName || "User"}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                          {getInitials(otherMember?.firstName, otherMember?.lastName)}
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">
                        {otherMember
                          ? `${otherMember.firstName || ""} ${
                              otherMember.lastName || ""
                            }`.trim() ||
                            `User ${otherMember.userId?.slice(-4) || ""}`
                          : "Unknown User"}
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage?.body || "No messages yet"}
                      </div>
                    </div>
                    {conversation.lastMessage && (
                      <div className="text-xs text-gray-500">
                        {new Date(conversation.lastMessage.sentAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {!conversations?.length && (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-2">No messages yet</p>
                <button
                  onClick={() => navigate("/messages")}
                  className="btn-primary text-sm"
                >
                  Start Messaging
                </button>
              </div>
            )}
            {conversations && conversations.length > 3 && (
              <button
                onClick={() => navigate("/messages")}
                className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium py-2"
              >
                View all conversations
              </button>
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Reviews
            </h3>
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-900">
                {dashboardData?.averageRating?.toFixed(2) || "0.00"}
              </span>
              <span className="text-sm text-gray-500">
                ({reviews?.length || 0} total)
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {reviews?.slice(0, 3).map((review: any) => {
              const studentName =
                review.studentFirstName && review.studentLastName
                  ? `${review.studentFirstName} ${review.studentLastName}`
                  : `Student ${review.studentId?.slice(-4) || ""}`;
              return (
                <div
                  key={review.id}
                  className="p-4 rounded-lg border border-gray-200 hover:border-yellow-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {studentName}
                        </div>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < review.rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="text-xs text-gray-500 ml-1">
                            {review.rating}/5
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                      "{review.comment}"
                    </p>
                  )}
                </div>
              );
            })}
            {!reviews?.length && (
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-2">No reviews yet</p>
                <p className="text-xs text-gray-400">
                  Complete sessions to start receiving reviews
                </p>
              </div>
            )}
            {reviews && reviews.length > 3 && (
              <button
                onClick={() => navigate("/tutor/reviews")}
                className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium py-2"
              >
                View all {reviews.length} reviews
              </button>
            )}
          </div>
        </div>

        {/* Availability Schedule */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Your Availability
            </h3>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <button
                onClick={() => setShowAvailabilityForm(true)}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Edit
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {Array.isArray(dashboardData?.availability) &&
              dashboardData.availability.slice(0, 5).map((slot: any) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 rounded border border-gray-200 bg-gray-50"
                >
                  <div className="text-sm font-medium text-gray-900 capitalize">
                    {slot.dayOfWeek}
                  </div>
                  <div className="text-sm text-gray-600">
                    {slot.startTime} - {slot.endTime}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        slot.isActive ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <span className="text-xs text-gray-500">
                      {slot.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            {(!Array.isArray(dashboardData?.availability) ||
              !dashboardData.availability.length) && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-2">
                  No availability set
                </p>
                <button
                  onClick={() => setShowAvailabilityForm(true)}
                  className="btn-primary text-sm"
                >
                  Set Availability
                </button>
              </div>
            )}
            {Array.isArray(dashboardData?.availability) &&
              dashboardData.availability.length > 5 && (
                <button className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium py-2">
                  View full schedule
                </button>
              )}
          </div>
        </div>

      </div>

      {/* Session Notes Modal */}
      {showNotesForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Session Notes</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field h-24"
                  placeholder="Add any notes about this session..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowNotesForm(null);
                    setNotes("");
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCompleteSession(showNotesForm)}
                  className="btn-primary"
                >
                  Complete Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Availability Update Modal */}
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

      {/* Quick Actions & Earnings Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Quick Actions
            </h3>
            <UserPlus className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-2">
            <button 
              onClick={() => navigate("/tutor/students")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors flex items-center space-x-3"
            >
              <BookOpen className="h-4 w-4 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Browse Students</div>
                <div className="text-sm text-gray-600">
                  Find new students to tutor
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
            </button>
            <button 
              onClick={() => navigate("/messages")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors flex items-center space-x-3"
            >
              <MessageSquare className="h-4 w-4 text-green-600" />
              <div>
                <div className="font-medium text-gray-900">Messages</div>
                <div className="text-sm text-gray-600">
                  Check your conversations
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
            </button>
            <button 
              onClick={() => navigate(`/tutor/${tutorProfile?.id || user?.id}`)}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors flex items-center space-x-3"
            >
              <Award className="h-4 w-4 text-purple-600" />
              <div>
                <div className="font-medium text-gray-900">View Profile</div>
                <div className="text-sm text-gray-600">
                  See how students view you
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
            </button>
            <button 
              onClick={() => navigate("/tutor/reviews")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-colors flex items-center space-x-3"
            >
              <Star className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="font-medium text-gray-900">Reviews</div>
                <div className="text-sm text-gray-600">
                  Read student feedback
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
            </button>
          </div>
        </div>

        {/* This Month's Summary */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Performance Overview
              </h3>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200 overflow-hidden">
                <div className="text-2xl font-bold text-green-600 truncate break-words">
                  {earnings.sessionsThisMonth}
                </div>
                <div className="text-sm text-green-700 truncate">
                  Sessions This Month
                </div>
                <div className="text-xs text-green-600 mt-1 truncate">
                  {earnings.sessionsThisMonth > 0 ? `+${earnings.sessionsThisMonth} this month` : 'No sessions yet'}
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200 overflow-hidden">
                <div className="text-2xl font-bold text-blue-600 truncate break-words">
                  ${earnings.formattedThisMonth}
                </div>
                <div className="text-sm text-blue-700 truncate">Earned This Month</div>
                <div className="text-xs text-blue-600 mt-1 truncate">
                  {earnings.thisMonth > 0 ? `+${((earnings.thisMonth / Math.max(earnings.total - earnings.thisMonth, 1)) * 100).toFixed(2)}% from last month` : 'No earnings yet'}
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200 overflow-hidden">
                <div className="text-2xl font-bold text-purple-600 truncate break-words">
                  {dashboardData?.averageRating?.toFixed(2) || "0.00"}
                </div>
                <div className="text-sm text-purple-700 truncate">Average Rating</div>
                <div className="text-xs text-purple-600 mt-1 truncate">
                  {reviews?.length || 0} total reviews
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center overflow-hidden">
                <div className="text-lg font-bold text-gray-900 truncate break-words">
                  {Array.isArray(dashboardData?.upcomingSessions)
                    ? dashboardData.upcomingSessions.length
                    : typeof dashboardData?.upcomingSessions === "number"
                    ? dashboardData.upcomingSessions
                    : 0}
                </div>
                <div className="text-xs text-gray-600 truncate">Upcoming</div>
              </div>
              <div className="text-center overflow-hidden">
                <div className="text-lg font-bold text-gray-900 truncate break-words">
                  {Math.floor(
                    earnings.total / (tutorProfile?.hourlyRate || 25) || 0
                  )}
                  h
                </div>
                <div className="text-xs text-gray-600 truncate">Total Hours</div>
              </div>
              <div className="text-center overflow-hidden">
                <div className="text-lg font-bold text-gray-900 truncate break-words">
                  {dashboardData?.totalReviews || 0}
                </div>
                <div className="text-xs text-gray-600 truncate">Reviews</div>
              </div>
              <div className="text-center overflow-hidden">
                <div className="text-lg font-bold text-gray-900 truncate break-words">
                  ${(tutorProfile?.hourlyRate || 0).toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 truncate">Per Hour</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;
