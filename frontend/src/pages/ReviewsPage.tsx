import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  User,
  Calendar,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Filter,
  Search,
  Eye,
  Flag,
  Award,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { sessionsApi, reviewsApi, tutorsApi } from "../services/api";
import type { Review, Session } from "../types";

const ReviewsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "given" | "received">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Data queries
  const { data: sessions } = useQuery({
    queryKey: ["sessions", user?.id],
    queryFn: () =>
      sessionsApi.getSessions(user!.id, user!.role as "student" | "tutor"),
    enabled: !!user?.id,
  });

  const { data: allReviews } = useQuery({
    queryKey: ["reviews", user?.id],
    queryFn: () => reviewsApi.getReviewsForUser(user!.id),
    enabled: !!user?.id,
  });

  const { data: tutorProfiles } = useQuery({
    queryKey: ["tutors"],
    queryFn: () => tutorsApi.getAllTutors(),
  });

  // Filter reviews based on user role and filter selection
  const filteredReviews =
    allReviews?.filter((review) => {
      const matchesSearch =
        searchTerm === "" ||
        review.comment?.toLowerCase().includes(searchTerm.toLowerCase());

      if (user?.role === "student") {
        // Students see reviews they've given
        return review.studentId === user.id && matchesSearch;
      } else if (user?.role === "tutor") {
        // Tutors see reviews they've received
        return review.tutorId === user.id && matchesSearch;
      }

      return matchesSearch;
    }) || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRatingText = (rating: number) => {
    const texts = ["Poor", "Fair", "Good", "Very Good", "Excellent"];
    return texts[rating - 1];
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {rating}/5 ({getRatingText(rating)})
        </span>
      </div>
    );
  };

  const getAverageRating = () => {
    if (!filteredReviews.length) return 0;
    const sum = filteredReviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / filteredReviews.length).toFixed(1);
  };

  const getReviewStats = () => {
    const totalReviews = filteredReviews.length;
    const ratingCounts = [1, 2, 3, 4, 5].map(
      (rating) => filteredReviews.filter((r) => r.rating === rating).length
    );

    return { totalReviews, ratingCounts };
  };

  const stats = getReviewStats();

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user.role === "tutor" ? "My Reviews" : "Reviews"}
          </h1>
          <p className="text-gray-600">
            {user.role === "tutor"
              ? "Reviews from your students"
              : "Reviews you've given to tutors"}
          </p>
        </div>

        {/* Quick Stats for Tutors */}
        {user.role === "tutor" && (
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {getAverageRating()}
              </div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalReviews}
              </div>
              <div className="text-sm text-gray-600">Total Reviews</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as "all" | "given" | "received")
            }
            className="input-field w-48"
          >
            <option value="all">All Reviews</option>
            <option value="given">Given</option>
            <option value="received">Received</option>
          </select>
        </div>
      </div>

      {/* Review Stats for Tutors */}
      {user.role === "tutor" && stats.totalReviews > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="card text-center">
            <Award className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-gray-900">
              {getAverageRating()}
            </div>
            <div className="text-sm text-gray-600">Average</div>
          </div>
          <div className="card text-center">
            <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-gray-900">
              {stats.ratingCounts[4]}
            </div>
            <div className="text-sm text-gray-600">5 Stars</div>
          </div>
          <div className="card text-center">
            <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-gray-900">
              {stats.ratingCounts[3]}
            </div>
            <div className="text-sm text-gray-600">4 Stars</div>
          </div>
          <div className="card text-center">
            <MessageSquare className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-gray-900">
              {stats.ratingCounts[2]}
            </div>
            <div className="text-sm text-gray-600">3 Stars</div>
          </div>
          <div className="card text-center">
            <Flag className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-gray-900">
              {stats.ratingCounts[0] + stats.ratingCounts[1]}
            </div>
            <div className="text-sm text-gray-600">&lt;3 Stars</div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {!filteredReviews.length ? (
        <div className="card text-center py-12">
          <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? "No reviews found" : "No reviews yet"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm
              ? "Try adjusting your search terms"
              : user.role === "tutor"
              ? "Complete sessions with students to start receiving reviews"
              : "Complete sessions with tutors to leave reviews"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const session = sessions?.find((s) => s.id === review.sessionId);
            const tutor = tutorProfiles?.find((t) => t.id === review.tutorId);

            return (
              <div key={review.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {user.role === "tutor"
                          ? ((review as any).studentFirstName && (review as any).studentLastName)
                            ? `${(review as any).studentFirstName} ${(review as any).studentLastName}`
                            : `Student ${review.studentId?.slice(-4) || "Unknown"}`
                          : tutor?.user?.firstName +
                              " " +
                              tutor?.user?.lastName || "Unknown Tutor"}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(review.createdAt)}</span>
                        {session && (
                          <>
                            <span>•</span>
                            <span>
                              {session.subjectId || "General"} Session
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">{renderStars(review.rating)}</div>
                </div>

                {review.comment && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span>Helpful</span>
                    </span>
                    <button className="flex items-center space-x-1 hover:text-gray-900">
                      <Flag className="h-4 w-4" />
                      <span>Report</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>Review</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Write Review Section (for students) */}
      {user.role === "student" &&
        (sessions?.filter(
          (s) =>
            s.status === "completed" &&
            !filteredReviews.some((r) => r.sessionId === s.id)
        ) || []).length > 0 && (
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-center space-x-2 mb-4">
              <Star className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">
                Write a Review
              </h3>
            </div>
            <p className="text-blue-700 mb-4">
              You have completed sessions that haven't been reviewed yet. Share
              your feedback to help other students!
            </p>
            <button className="btn-primary bg-blue-600 hover:bg-blue-700">
              Write Review
            </button>
          </div>
        )}
    </div>
  );
};

export default ReviewsPage;
