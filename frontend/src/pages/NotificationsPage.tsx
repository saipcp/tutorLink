import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Calendar,
  Star,
  CheckCircle,
  XCircle,
  Bell,
} from "lucide-react";
import { notificationsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

// Helper function to format notification message
const formatNotification = (notification: any) => {
  const { type, payload } = notification;
  let parsedPayload;
  
  try {
    parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;
  } catch {
    parsedPayload = payload || {};
  }

  switch (type) {
    case "message":
      return {
        icon: MessageSquare,
        iconColor: "text-blue-600",
        bgColor: "bg-blue-50",
        title: "New Message",
        message: parsedPayload.excerpt || parsedPayload.message || "You have a new message",
        action: () => `/messages${parsedPayload.conversationId ? `?conversation=${parsedPayload.conversationId}` : ''}`,
      };
    case "conversation":
      return {
        icon: MessageSquare,
        iconColor: "text-green-600",
        bgColor: "bg-green-50",
        title: "New Conversation",
        message: parsedPayload.title || "Someone started a conversation with you",
        action: () => `/messages${parsedPayload.conversationId ? `?conversation=${parsedPayload.conversationId}` : ''}`,
      };
    case "new_booking":
      return {
        icon: Calendar,
        iconColor: "text-purple-600",
        bgColor: "bg-purple-50",
        title: "New Booking",
        message: parsedPayload.message || parsedPayload.studentName 
          ? `${parsedPayload.studentName} booked a session with you`
          : "You have a new session booking",
        action: () => `/tutor/schedule`,
      };
    case "session_canceled":
      return {
        icon: XCircle,
        iconColor: "text-red-600",
        bgColor: "bg-red-50",
        title: "Session Canceled",
        message: parsedPayload.message || parsedPayload.canceledByName
          ? `${parsedPayload.canceledByName} canceled a session`
          : "A session was canceled",
        action: () => `/tutor/schedule`,
      };
    case "session_completed":
      return {
        icon: CheckCircle,
        iconColor: "text-green-600",
        bgColor: "bg-green-50",
        title: "Session Completed",
        message: parsedPayload.message || parsedPayload.tutorName
          ? `${parsedPayload.tutorName} marked your session as completed`
          : "A session was completed",
        action: () => `/student/sessions`,
      };
    case "new_review":
      return {
        icon: Star,
        iconColor: "text-yellow-600",
        bgColor: "bg-yellow-50",
        title: "New Review",
        message: parsedPayload.message || parsedPayload.studentName
          ? `${parsedPayload.studentName} left you a ${parsedPayload.rating || ''}-star review`
          : "You received a new review",
        action: () => `/tutor/reviews`,
      };
    default:
      return {
        icon: Bell,
        iconColor: "text-gray-600",
        bgColor: "bg-gray-50",
        title: type || "Notification",
        message: parsedPayload.message || JSON.stringify(parsedPayload),
        action: () => `/notifications`,
      };
  }
};

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () =>
      user?.id
        ? notificationsApi.getNotifications(user.id)
        : Promise.resolve([]),
    enabled: !!user?.id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries(["notifications", user?.id]),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(user?.id || ""),
    onSuccess: () => queryClient.invalidateQueries(["notifications", user?.id]),
  });

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div>
          <button
            onClick={() => markAllMutation.mutate()}
            className="btn-secondary"
          >
            Mark all read
          </button>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div>Loading…</div>
        ) : notifications.length === 0 ? (
          <div className="text-gray-500">No notifications</div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n: any) => {
              const formatted = formatNotification(n);
              const Icon = formatted.icon;
              
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) {
                      markAsReadMutation.mutate(n.id);
                    }
                    navigate(formatted.action());
                  }}
                  className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all ${
                    n.isRead 
                      ? "bg-white border-gray-200" 
                      : `${formatted.bgColor} border-blue-300`
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 ${formatted.iconColor}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">
                              {formatted.title}
                            </h3>
                            {!n.isRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatted.message}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-xs text-gray-400">
                          {new Date(n.createdAt).toLocaleDateString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: '2-digit',
                          })} {new Date(n.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                        </div>
                        {!n.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsReadMutation.mutate(n.id);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
