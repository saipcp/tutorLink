import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Star,
  Clock,
  DollarSign,
  BookOpen,
  MapPin,
  Calendar,
  MessageSquare,
  User,
  Award,
  LogIn,
  Lock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { tutorsApi, subjectsApi, sessionsApi } from "../services/api";
import type {
  TutorProfile,
  Subject,
  FilterOptions,
  User as UserType,
} from "../types";

const TutorBrowse: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Determine if user is a student based on route or role
  const isStudentRoute = location.pathname.startsWith("/student");
  const isStudent = user?.role === "student" || isStudentRoute;

  // State for filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<"rating" | "price" | "experience">(
    "rating"
  );

  // Data queries
  const {
    data: tutors,
    isLoading: tutorsLoading,
    error: tutorsError,
  } = useQuery({
    queryKey: [
      "tutors",
      { searchTerm, selectedSubjects, priceRange, minRating },
    ],
    queryFn: () =>
      tutorsApi.getAllTutors({
        subjects: selectedSubjects,
        priceRange,
        rating: minRating,
        availability: [],
        languages: [],
      }),
  }) as {
    data: (TutorProfile & { user: UserType })[] | undefined;
    isLoading: boolean;
    error: Error | null;
  };

  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.getAllSubjects(),
  });

  // Filter and sort tutors
  const filteredTutors =
    tutors
      ?.filter((tutor) => {
        // Ensure subjects is always an array
        const tutorSubjects = Array.isArray(tutor.subjects)
          ? tutor.subjects
          : [];

        // Search filter
        const matchesSearch =
          searchTerm === "" ||
          (tutor.user?.firstName || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (tutor.user?.lastName || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          tutorSubjects.some((subject) =>
            subject.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          tutor.bio?.toLowerCase().includes(searchTerm.toLowerCase());

        // Subject filter
        const matchesSubjects =
          selectedSubjects.length === 0 ||
          selectedSubjects.some((selectedSubject) =>
            tutorSubjects.some(
              (tutorSubject) =>
                tutorSubject.toLowerCase() === selectedSubject.toLowerCase()
            )
          );

        // Price filter
        const matchesPrice =
          !tutor.hourlyRate ||
          (tutor.hourlyRate >= priceRange[0] &&
            tutor.hourlyRate <= priceRange[1]);

        // Rating filter
        const matchesRating = (tutor.rating || 0) >= minRating;

        return (
          matchesSearch && matchesSubjects && matchesPrice && matchesRating
        );
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "rating":
            return (b.rating || 0) - (a.rating || 0);
          case "price":
            return (a.hourlyRate || 0) - (b.hourlyRate || 0);
          case "experience":
            return (b.experience || 0) - (a.experience || 0);
          default:
            return 0;
        }
      }) || [];

  const handleBookTutor = (tutorId: string) => {
    if (!user) {
      // Redirect to login for non-authenticated users
      navigate("/login", {
        state: {
          from: location.pathname,
          redirectTo: `/student/book/${tutorId}`,
        },
      });
      return;
    }

    if (user.role !== "student") {
      // Only students can book tutors
      alert("Only students can book tutoring sessions.");
      return;
    }

    // Always navigate to student booking route
    navigate(`/student/book/${tutorId}`);
  };

  const handleViewProfile = (tutorId: string) => {
    if (!user) {
      // Redirect to login for non-authenticated users
      // Use shared route for profile viewing
      navigate("/login", {
        state: { from: location.pathname, redirectTo: `/tutor/${tutorId}` },
      });
      return;
    }

    // Navigate based on route context
    if (isStudentRoute) {
      navigate(`/student/tutor/${tutorId}`);
    } else {
      // Use shared route for profile viewing
      navigate(`/tutor/${tutorId}`);
    }
  };

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

  // Loading state
  if (tutorsLoading || subjectsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary-600 mx-auto mb-4 animate-spin" />
          <p className="text-secondary-600">Loading tutors...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (tutorsError) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Error Loading Tutors
        </h3>
        <p className="text-gray-600 mb-6">
          {tutorsError.message ||
            "Failed to load tutors. Please try again later."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find Tutors</h1>
          <p className="text-gray-600">
            Discover expert tutors in your subject area
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {filteredTutors.length}{" "}
            {filteredTutors.length === 1 ? "tutor" : "tutors"} available
          </div>
          {user && user.role === "student" && (
            <button
              onClick={() => navigate("/student/browse")}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Browse as Student
            </button>
          )}
        </div>
      </div>

      {/* Login Prompt for Non-Authenticated Users */}
      {!user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <LogIn className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900">
                Sign in to book sessions and contact tutors
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Create an account to book tutoring sessions, message tutors, and
                track your progress.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => navigate("/register")}
              className="btn-primary text-sm px-4 py-2"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate("/login")}
              className="btn-secondary text-sm px-4 py-2"
            >
              Sign In
            </button>
          </div>
        </div>
      )}

      {/* Role-based notice for tutors */}
      {user && user.role === "tutor" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-amber-900">
              Browsing as Tutor
            </h3>
            <p className="text-sm text-amber-800 mt-1">
              You can browse other tutors' profiles, but only students can book
              sessions.
            </p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search and Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">
                Search & Filter
              </h3>
            </div>

            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by name, subject, or bio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-12"
                />
              </div>
            </div>

            {/* Subjects Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subjects ({selectedSubjects.length} selected)
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {subjectsLoading ? (
                  <div className="text-sm text-gray-500">
                    Loading subjects...
                  </div>
                ) : subjects && subjects.length > 0 ? (
                  subjects.map((subject) => (
                    <label
                      key={subject.id}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(subject.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubjects([
                              ...selectedSubjects,
                              subject.name,
                            ]);
                          } else {
                            setSelectedSubjects(
                              selectedSubjects.filter((s) => s !== subject.name)
                            );
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">
                        {subject.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({subject.topics.length})
                      </span>
                    </label>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">
                    No subjects available
                  </div>
                )}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range: ${priceRange[0]} - ${priceRange[1]}/hour
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], parseInt(e.target.value)])
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>$0</span>
                  <span>$100+</span>
                </div>
              </div>
            </div>

            {/* Rating Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Rating:{" "}
                {minRating > 0 ? `${minRating.toFixed(1)}★` : "Any"}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Any</span>
                <span>5★</span>
              </div>
              {minRating > 0 && (
                <div className="flex items-center space-x-1 mt-2">
                  {renderStars(minRating)}
                </div>
              )}
            </div>

            {/* Sort By */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input-field"
              >
                <option value="rating">Highest Rated</option>
                <option value="price">Lowest Price</option>
                <option value="experience">Most Experienced</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(searchTerm ||
              selectedSubjects.length > 0 ||
              priceRange[1] < 100 ||
              minRating > 0) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedSubjects([]);
                  setPriceRange([0, 100]);
                  setMinRating(0);
                  setSortBy("rating");
                }}
                className="w-full btn-secondary text-sm"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        {/* Tutors Grid */}
        <div className="lg:col-span-3">
          {/* Results count */}
          {filteredTutors.length > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredTutors.length} of {tutors?.length || 0} tutors
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTutors.map((tutor) => (
              <div
                key={tutor.id}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleViewProfile(tutor.id)}
              >
                {/* Tutor Header */}
                <div className="flex items-start space-x-4 mb-4">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      `${tutor.user?.firstName || "Unknown"} ${
                        tutor.user?.lastName || "Tutor"
                      }`
                    )}&size=64&background=3B82F6&color=FFFFFF&bold=true`}
                    alt={`${tutor.user?.firstName || "Unknown"} ${
                      tutor.user?.lastName || "Tutor"
                    }`}
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const initials = `${tutor.user?.firstName?.[0] || "?"}${
                        tutor.user?.lastName?.[0] || "?"
                      }`;
                      target.src = `data:image/svg+xml;base64,${btoa(`
                        <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
                          <rect width="64" height="64" fill="#3B82F6"/>
                          <text x="32" y="42" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="white">${initials}</text>
                        </svg>
                      `)}`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {tutor.user?.firstName || "Unknown"}{" "}
                        {tutor.user?.lastName || "Tutor"}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-1 mb-2">
                      {renderStars(tutor.rating)}
                      <span className="text-sm text-gray-600">
                        {tutor.rating.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Award className="h-3 w-3 flex-shrink-0" />
                        <span>{tutor.experience} years</span>
                      </span>
                      {tutor.hourlyRate && (
                        <span className="flex items-center space-x-1">
                          <DollarSign className="h-3 w-3 flex-shrink-0" />
                          <span>${tutor.hourlyRate}/hr</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {tutor.bio && (
                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                    {tutor.bio}
                  </p>
                )}

                {/* Subjects */}
                {tutor.subjects &&
                  Array.isArray(tutor.subjects) &&
                  tutor.subjects.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-1 mb-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          Subjects
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {tutor.subjects.slice(0, 3).map((subject, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                          >
                            {subject}
                          </span>
                        ))}
                        {tutor.subjects.length > 3 && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            +{tutor.subjects.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                {/* Languages */}
                {tutor.languages &&
                  Array.isArray(tutor.languages) &&
                  tutor.languages.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-1 mb-2">
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          Languages
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {tutor.languages.map((language, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded"
                          >
                            {language}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Availability Preview */}
                <div className="mb-4">
                  <div className="flex items-center space-x-1 mb-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      Availability
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {tutor.availability && Array.isArray(tutor.availability)
                      ? tutor.availability.filter((slot) => slot.isActive)
                          .length
                      : 0}{" "}
                    time slots this week
                  </div>
                </div>

                {/* Action Buttons */}
                <div
                  className="flex space-x-2 pt-4 border-t border-gray-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewProfile(tutor.id);
                    }}
                    className="flex-1 btn-secondary text-sm"
                  >
                    View Profile
                  </button>
                  {user?.role === "student" || !user ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookTutor(tutor.id);
                      }}
                      disabled={!user}
                      className={`flex-1 text-sm ${
                        user
                          ? "btn-primary"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                      }`}
                    >
                      {user ? "Book Now" : "Login to Book"}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 text-sm rounded-lg px-4 py-2"
                    >
                      Students Only
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {!filteredTutors.length && tutors && tutors.length > 0 && (
            <div className="card text-center py-12">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Tutors Found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search criteria or filters to find more
                tutors.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedSubjects([]);
                  setPriceRange([0, 100]);
                  setMinRating(0);
                  setSortBy("rating");
                }}
                className="btn-primary"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* No tutors at all */}
          {!tutors || tutors.length === 0 ? (
            <div className="card text-center py-12">
              <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Tutors Available
              </h3>
              <p className="text-gray-600">
                There are currently no tutors registered on the platform.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Featured Subjects */}
      {subjects && subjects.length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <BookOpen className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">
              Popular Subjects
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => {
                  if (selectedSubjects.includes(subject.name)) {
                    setSelectedSubjects(
                      selectedSubjects.filter((s) => s !== subject.name)
                    );
                  } else {
                    setSelectedSubjects([...selectedSubjects, subject.name]);
                  }
                }}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  selectedSubjects.includes(subject.name)
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                <div className="font-medium text-sm">{subject.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {subject.topics.length}{" "}
                  {subject.topics.length === 1 ? "topic" : "topics"}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorBrowse;
