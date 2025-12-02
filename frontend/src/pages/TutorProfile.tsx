import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Star,
  Clock,
  DollarSign,
  BookOpen,
  MessageSquare,
  User,
  Award,
  GraduationCap,
  Calendar,
  MapPin,
  Mail,
  Phone,
  ArrowLeft,
  MessageCircle,
  BookOpen as BookIcon,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { tutorsApi, reviewsApi, sessionsApi } from "../services/api";
import ChatModal from "../components/Chat/ChatModal";
import type { TutorProfile, Review, Session } from "../types";

const TutorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { onlineUsers } = useSocket();

  // Fetch tutor data
  const {
    data: tutorData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tutor", id],
    queryFn: () => tutorsApi.getTutorById(id!),
    enabled: !!id,
  });

  // Fetch tutor reviews
  const { data: reviews } = useQuery({
    queryKey: ["tutorReviews", id],
    queryFn: () => reviewsApi.getReviewsByTutorId(id!),
    enabled: !!id,
  });

  // Fetch tutor sessions (for statistics)
  const { data: sessions } = useQuery({
    queryKey: ["tutorSessions", id],
    queryFn: () => sessionsApi.getSessions(id!, "tutor"),
    enabled: !!id,
  });

  const tutor = tutorData;
  const tutorReviews = reviews || [];
  const tutorSessions = sessions || [];

  // Calculate statistics
  const completedSessions = tutorSessions.filter(
    (s) => s.status === "completed"
  ).length;
  const averageRating =
    tutorReviews.length > 0
      ? (
          tutorReviews.reduce((sum, review) => sum + review.rating, 0) /
          tutorReviews.length
        ).toFixed(1)
      : "0.0";

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const handleBookTutor = () => {
    if (!user) {
      navigate("/login", { state: { from: `/book/${id}` } });
    } else {
      navigate(`/book/${id}`);
    }
  };

  const handleMessageTutor = () => {
    if (!user) {
      navigate("/login", { state: { from: `/messages` } });
    } else {
      // Open inline chat modal targeting this tutor
      setOpenChat(true);
    }
  };

  const [openChat, setOpenChat] = React.useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !tutor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/browse")}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Browse</span>
          </button>
        </div>
        <div className="card text-center py-12">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Tutor Not Found
          </h3>
          <p className="text-gray-600 mb-6">
            The tutor you're looking for doesn't exist or may have been removed.
          </p>
          <button onClick={() => navigate("/browse")} className="btn-primary">
            Browse Tutors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/browse")}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Browse</span>
          </button>
        </div>
        <div className="text-sm text-gray-500">Profile ID: {tutor.id}</div>
      </div>

      {/* Tutor Header Card */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-start space-y-6 lg:space-y-0 lg:space-x-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                `${tutor.user.firstName || "Unknown"} ${
                  tutor.user.lastName || "User"
                }`
              )}&size=128&background=3B82F6&color=FFFFFF&bold=true`}
              alt={`${tutor.user.firstName || "Unknown"} ${
                tutor.user.lastName || "User"
              }`}
              className="w-24 h-24 lg:w-32 lg:h-32 rounded-full object-cover mx-auto lg:mx-0"
              onError={(e) => {
                // Fallback to initials in a colored circle if image fails
                const target = e.target as HTMLImageElement;
                const initials = `${tutor.user.firstName?.[0] || "?"}${
                  tutor.user.lastName?.[0] || "?"
                }`;
                target.src = `data:image/svg+xml;base64,${btoa(`
                  <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
                    <rect width="128" height="128" fill="#3B82F6"/>
                    <text x="64" y="75" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white">${initials}</text>
                  </svg>
                `)}`;
              }}
            />
          </div>

          {/* Main Info */}
          <div className="flex-grow text-center lg:text-left">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                    {tutor.user.firstName} {tutor.user.lastName}
                  </h1>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      onlineUsers && onlineUsers[tutor.user.id]
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                    title={
                      onlineUsers && onlineUsers[tutor.user.id]
                        ? "Online"
                        : "Offline"
                    }
                  />
                </div>
                <p className="text-gray-600 mb-2">
                  {tutor.subjects.join(", ")} Tutor
                </p>
                <div className="flex items-center justify-center lg:justify-start space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-medium">
                      {tutor.rating.toFixed(1)}
                    </span>
                    <span>({tutorReviews.length} reviews)</span>
                  </div>
                  {tutor.experience && (
                    <div className="flex items-center space-x-1">
                      <Award className="h-4 w-4" />
                      <span>{tutor.experience} years experience</span>
                    </div>
                  )}
                  {tutor.hourlyRate && (
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span>${tutor.hourlyRate}/hour</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="flex justify-center lg:justify-end space-x-6 mt-4 lg:mt-0">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {completedSessions}
                  </div>
                  <div className="text-sm text-gray-600">Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {averageRating}
                  </div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {tutorReviews.length}
                  </div>
                  <div className="text-sm text-gray-600">Reviews</div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {tutor.bio && (
              <p className="text-gray-700 text-center lg:text-left leading-relaxed">
                {tutor.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleBookTutor}
          className="flex-1 btn-primary flex items-center justify-center space-x-2"
        >
          <BookIcon className="h-5 w-5" />
          <span>Book Session</span>
        </button>
        <button
          onClick={handleMessageTutor}
          className="flex-1 btn-secondary flex items-center justify-center space-x-2"
        >
          <MessageCircle className="h-5 w-5" />
          <span>Send Message</span>
        </button>
      </div>

      {/* Inline chat modal for starting / continuing conversation with this tutor */}
      <ChatModal
        open={openChat}
        conversationId={undefined}
        recipientId={tutor.user.id}
        onClose={() => setOpenChat(false)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subjects */}
          {tutor.subjects.length > 0 && (
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Subjects
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {tutor.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {tutor.languages.length > 0 && (
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Languages
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {tutor.languages.map((language) => (
                  <span
                    key={language}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                  >
                    {language}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {tutor.education.length > 0 && (
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Education
                </h3>
              </div>
              <div className="space-y-2">
                {tutor.education.map((edu, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-700">{edu}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Star className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">
                Reviews ({tutorReviews.length})
              </h3>
            </div>

            {tutorReviews.length > 0 ? (
              <div className="space-y-4">
                {tutorReviews.slice(0, 5).map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-gray-100 pb-4 last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex">{renderStars(review.rating)}</div>
                        <span className="text-sm text-gray-600">
                          {review.rating}/5
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}

                {tutorReviews.length > 5 && (
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View all {tutorReviews.length} reviews
                  </button>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No reviews yet. Be the first to leave a review!
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Availability */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">
                Availability
              </h3>
            </div>

            {tutor.availability.length > 0 ? (
              <div className="space-y-2">
                {tutor.availability
                  .filter((slot) => slot.isActive)
                  .map((slot) => (
                    <div
                      key={slot.id}
                      className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {slot.dayOfWeek}
                      </span>
                      <span className="text-sm text-gray-600">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Schedule not available</p>
            )}
          </div>

          {/* Contact Information */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contact Information
            </h3>
            <div className="space-y-3">
              {tutor.user.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {tutor.user.email}
                  </span>
                </div>
              )}
              {tutor.user.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {tutor.user.phone}
                  </span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Member since {new Date(tutor.user.createdAt).getFullYear()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="text-sm font-medium text-gray-900">
                  Within 1 hour
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="text-sm font-medium text-green-600">98%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Students</span>
                <span className="text-sm font-medium text-gray-900">
                  {Math.floor(completedSessions / 2) +
                    Math.floor(Math.random() * 10) +
                    5}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorProfile;
