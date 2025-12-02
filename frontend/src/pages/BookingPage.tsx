import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  User,
  BookOpen,
  DollarSign,
  Star,
  MapPin,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Watch,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { tutorsApi, sessionsApi, subjectsApi } from "../services/api";
import type {
  TutorProfile,
  AvailabilitySlot,
  Subject,
  BookingRequest,
} from "../types";

const BookingPage: React.FC = () => {
  const { tutorId } = useParams<{ tutorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] =
    useState<AvailabilitySlot | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [duration, setDuration] = useState<number>(60); // minutes

  // Fetch tutor data
  const { data: tutorData, isLoading: tutorLoading } = useQuery({
    queryKey: ["tutor", tutorId],
    queryFn: () => tutorsApi.getTutorById(tutorId!),
    enabled: !!tutorId,
  });

  // Fetch subjects
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.getAllSubjects(),
  });

  // Fetch tutor's existing sessions to check availability
  const { data: existingSessions } = useQuery({
    queryKey: ["tutorSessions", tutorId],
    queryFn: () => sessionsApi.getSessions(tutorId!, "tutor"),
    enabled: !!tutorId,
  });

  // Booking mutation
  const bookingMutation = useMutation({
    mutationFn: (booking: BookingRequest) => sessionsApi.bookSession(booking),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["tutorSessions", tutorId] });
      navigate(`/student/sessions`);
    },
  });

  // Get available time slots for selected date
  const getAvailableTimeSlots = (): AvailabilitySlot[] => {
    if (!tutorData || !selectedDate) return [];

    // Ensure availability is an array
    if (!tutorData.availability || !Array.isArray(tutorData.availability)) {
      return [];
    }

    // Convert date to day of week in the format the DB uses (Mon, Tue, Wed, etc.)
    const date = new Date(selectedDate);
    const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayOfWeek = daysMap[dayIndex];

    const dayAvailability = tutorData.availability.filter(
      (slot) => slot.dayOfWeek === dayOfWeek && slot.isActive
    );

    // Filter out slots that conflict with existing sessions
    const availableSlots = dayAvailability.filter((slot) => {
      if (!existingSessions) return true;

      const slotStart = new Date(`${selectedDate}T${slot.startTime}`);
      const slotEnd = new Date(`${selectedDate}T${slot.endTime}`);

      return !existingSessions.some((session) => {
        if (session.status === "canceled") return false;
        const sessionStart = new Date(session.startAt);
        const sessionEnd = new Date(session.endAt);

        return (
          (slotStart >= sessionStart && slotStart < sessionEnd) ||
          (slotEnd > sessionStart && slotEnd <= sessionEnd) ||
          (slotStart <= sessionStart && slotEnd >= sessionEnd)
        );
      });
    });

    return availableSlots;
  };

  // Generate individual time slots from availability blocks
  const generateTimeSlots = (): Array<{
    id: string;
    startTime: string;
    endTime: string;
  }> => {
    const availabilityBlocks = getAvailableTimeSlots();
    const timeSlots: Array<{ id: string; startTime: string; endTime: string }> =
      [];

    // Slot interval in minutes (e.g., 30 minutes means slots every 30 mins)
    const slotInterval = 60; // Generate slots every hour

    availabilityBlocks.forEach((block) => {
      // Parse start and end times
      const startParts = block.startTime.split(":");
      const startHours = parseInt(startParts[0]);
      const startMins = parseInt(startParts[1]);

      const endParts = block.endTime.split(":");
      const endHours = parseInt(endParts[0]);
      const endMins = parseInt(endParts[1]);

      // Convert to minutes since midnight
      let currentTimeInMins = startHours * 60 + startMins;
      const blockEndInMins = endHours * 60 + endMins;

      // Generate slots at regular intervals
      while (currentTimeInMins + duration <= blockEndInMins) {
        const slotStartHours = Math.floor(currentTimeInMins / 60);
        const slotStartMins = currentTimeInMins % 60;

        const slotEndTimeInMins = currentTimeInMins + duration;
        const slotEndHours = Math.floor(slotEndTimeInMins / 60);
        const slotEndMins = slotEndTimeInMins % 60;

        const startTime = `${slotStartHours
          .toString()
          .padStart(2, "0")}:${slotStartMins.toString().padStart(2, "0")}`;
        const endTime = `${slotEndHours
          .toString()
          .padStart(2, "0")}:${slotEndMins.toString().padStart(2, "0")}`;

        // Check if this slot conflicts with existing sessions
        const slotStart = new Date(`${selectedDate}T${startTime}:00`);
        const slotEnd = new Date(`${selectedDate}T${endTime}:00`);

        const hasConflict = existingSessions?.some((session) => {
          if (session.status === "canceled") return false;
          const sessionStart = new Date(session.startAt);
          const sessionEnd = new Date(session.endAt);

          return (
            (slotStart >= sessionStart && slotStart < sessionEnd) ||
            (slotEnd > sessionStart && slotEnd <= sessionEnd) ||
            (slotStart <= sessionStart && slotEnd >= sessionEnd)
          );
        });

        if (!hasConflict) {
          timeSlots.push({
            id: `${block.id}-${startTime}`,
            startTime,
            endTime,
          });
        }

        currentTimeInMins += slotInterval;
      }
    });

    return timeSlots;
  };

  const availableSlots = generateTimeSlots();

  // Get topics for selected subject
  const selectedSubjectData = subjects?.find((s) => s.id === selectedSubject);
  const topics = selectedSubjectData?.topics || [];

  // Calculate session end time
  const getSessionEndTime = (startTime: string): string => {
    // Handle both HH:MM and HH:MM:SS formats
    const timeParts = startTime.split(":");
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
    const start = new Date(
      `2000-01-01T${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:00`
    );
    const end = new Date(start.getTime() + duration * 60000);
    return `${end.getHours().toString().padStart(2, "0")}:${end
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateBookingForm = () => {
    const errors: Record<string, string> = {};

    if (!selectedSubject) {
      errors.subject = "Please select a subject";
    }

    if (!selectedDate) {
      errors.date = "Please select a date";
    } else {
      const selected = new Date(selectedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        errors.date = "Date cannot be in the past";
      }
    }

    if (!selectedTimeSlot) {
      errors.timeSlot = "Please select a time slot";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    if (!validateBookingForm()) {
      return;
    }

    if (!tutorId || !selectedDate || !selectedTimeSlot || !selectedSubject) {
      return;
    }

    const startAt = `${selectedDate}T${selectedTimeSlot.startTime}:00`;
    const endAt = `${selectedDate}T${
      (selectedTimeSlot as any).endTime ||
      getSessionEndTime(selectedTimeSlot.startTime)
    }:00`;

    const booking: BookingRequest = {
      tutorId,
      startAt,
      endAt,
      subjectId: selectedSubject,
      topicId: selectedTopic || undefined,
      notes: notes.trim() || undefined,
    };

    await bookingMutation.mutateAsync(booking);
  };

  const formatTime = (time: string) => {
    // Handle both HH:MM and HH:MM:SS formats
    const timeParts = time.split(":");
    const hours = timeParts[0];
    const minutes = timeParts[1];
    const hour = parseInt(hours);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get minimum date (today)
  const minDate = new Date().toISOString().split("T")[0];

  // Get maximum date (30 days from now)
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  if (tutorLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading tutor information...</p>
        </div>
      </div>
    );
  }

  if (!tutorData) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Tutor Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          The tutor you're looking for doesn't exist.
        </p>
        <button onClick={() => navigate("/browse")} className="btn-primary">
          Browse Tutors
        </button>
      </div>
    );
  }

  const hourlyRate = tutorData.hourlyRate || 25;
  const totalPrice = (hourlyRate * duration) / 60;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            Book a Session
          </h1>
          <p className="text-secondary-600">
            Schedule a tutoring session with {tutorData.user.firstName}{" "}
            {tutorData.user.lastName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Booking Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tutor Info Card */}
          <div className="card">
            <div className="flex items-start space-x-4">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  `${tutorData.user.firstName || ""} ${
                    tutorData.user.lastName || ""
                  }`
                )}&size=80&background=3B82F6&color=FFFFFF&bold=true`}
                alt={`${tutorData.user.firstName} ${tutorData.user.lastName}`}
                className="w-20 h-20 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const initials = `${tutorData.user.firstName?.[0] || "?"}${
                    tutorData.user.lastName?.[0] || "?"
                  }`;
                  target.src = `data:image/svg+xml;base64,${btoa(`
                    <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                      <rect width="80" height="80" fill="#3B82F6"/>
                      <text x="40" y="50" font-family="Arial, sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="white">${initials}</text>
                    </svg>
                  `)}`;
                }}
              />
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-secondary-900 mb-1">
                  {tutorData.user.firstName} {tutorData.user.lastName}
                </h3>
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm text-secondary-600">
                    4.8 (24 reviews)
                  </span>
                </div>
                {tutorData.bio && (
                  <p className="text-sm text-secondary-600 mb-3">
                    {tutorData.bio}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {tutorData.subjects.slice(0, 3).map((subject) => (
                    <span
                      key={subject}
                      className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-secondary-900">
                  ${hourlyRate}
                </div>
                <div className="text-sm text-secondary-600">per hour</div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <form onSubmit={handleSubmit} className="card space-y-6">
            {/* Subject Selection */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                <BookOpen className="h-4 w-4 inline mr-2" />
                Subject *
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedTopic("");
                  if (formErrors.subject) {
                    setFormErrors({ ...formErrors, subject: "" });
                  }
                }}
                className={`input-field ${
                  formErrors.subject ? "border-red-500" : ""
                }`}
                required
              >
                <option value="">Select a subject</option>
                {subjects?.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              {formErrors.subject && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.subject}
                </p>
              )}
            </div>

            {/* Topic Selection */}
            {topics.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Topic (Optional)
                </label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select a topic (optional)</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Duration Selection */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                <Clock className="h-4 w-4 inline mr-2" />
                Session Duration *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[30, 60, 90].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setDuration(dur)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      duration === dur
                        ? "border-primary-600 bg-primary-50 text-primary-700"
                        : "border-secondary-200 hover:border-secondary-300 text-secondary-700"
                    }`}
                  >
                    <div className="font-semibold">{dur} min</div>
                    <div className="text-xs text-secondary-500">
                      ${((hourlyRate * dur) / 60).toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                <CalendarDays className="h-4 w-4 inline mr-2" />
                Select Date *
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTimeSlot(null);
                  if (formErrors.date) {
                    setFormErrors({ ...formErrors, date: "" });
                  }
                }}
                min={minDate}
                max={maxDate}
                className={`input-field ${
                  formErrors.date ? "border-red-500" : ""
                }`}
                required
              />
              {formErrors.date && (
                <p className="mt-1 text-sm text-red-600">{formErrors.date}</p>
              )}
              {selectedDate && (
                <p className="mt-2 text-sm text-secondary-600">
                  {formatDate(selectedDate)}
                </p>
              )}
              {tutorData?.availability && tutorData.availability.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-medium text-blue-900 mb-2">
                    Available Days:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(
                      new Set(
                        tutorData.availability
                          .filter((slot) => slot.isActive)
                          .map((slot) => slot.dayOfWeek)
                      )
                    ).map((day) => (
                      <span
                        key={day}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Time Slot Selection */}
            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  <Watch className="h-4 w-4 inline mr-2" />
                  Select Time Slot *
                </label>
                {availableSlots.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600 inline mr-2" />
                    <div className="inline-block">
                      <p className="text-sm font-medium text-yellow-800">
                        No available time slots for this date.
                      </p>
                      {tutorData?.availability &&
                      tutorData.availability.length === 0 ? (
                        <p className="text-xs text-yellow-700 mt-1">
                          This tutor hasn't set up their availability yet.
                          Please try contacting them directly.
                        </p>
                      ) : (
                        <p className="text-xs text-yellow-700 mt-1">
                          Please select another date or check the tutor's
                          available days below.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedTimeSlot?.id === slot.id;

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => {
                              setSelectedTimeSlot(slot as any);
                              if (formErrors.timeSlot) {
                                setFormErrors({ ...formErrors, timeSlot: "" });
                              }
                            }}
                            className={`p-3 rounded-lg border-2 transition-colors text-left ${
                              isSelected
                                ? "border-primary-600 bg-primary-50 text-primary-700"
                                : "border-secondary-200 hover:border-secondary-300 text-secondary-700"
                            }`}
                          >
                            <div className="font-semibold">
                              {formatTime(slot.startTime)}
                            </div>
                            <div className="text-xs text-secondary-500">
                              to {formatTime(slot.endTime)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {formErrors.timeSlot && (
                      <p className="mt-2 text-sm text-red-600">
                        {formErrors.timeSlot}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="input-field"
                placeholder="Any specific topics you'd like to focus on or questions you have..."
              />
            </div>

            {/* Error Message */}
            {bookingMutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Booking Failed
                  </p>
                  <p className="text-sm text-red-700">
                    {(bookingMutation.error as Error)?.message ||
                      "Please try again later."}
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                bookingMutation.isPending ||
                !selectedDate ||
                !selectedTimeSlot ||
                !selectedSubject
              }
              className="btn-primary w-full py-3"
            >
              {bookingMutation.isPending ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Booking Session...</span>
                </span>
              ) : (
                `Book Session - $${totalPrice.toFixed(2)}`
              )}
            </button>
          </form>
        </div>

        {/* Right Column - Booking Summary */}
        <div className="space-y-6">
          {/* Booking Summary */}
          <div className="card sticky top-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Booking Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-secondary-600">Tutor</span>
                <span className="font-medium text-secondary-900">
                  {tutorData.user.firstName} {tutorData.user.lastName}
                </span>
              </div>
              {selectedSubject && (
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">Subject</span>
                  <span className="font-medium text-secondary-900">
                    {selectedSubjectData?.name || "Not selected"}
                  </span>
                </div>
              )}
              {selectedTopic && (
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">Topic</span>
                  <span className="font-medium text-secondary-900">
                    {topics.find((t) => t.id === selectedTopic)?.name ||
                      "Not selected"}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-secondary-600">Duration</span>
                <span className="font-medium text-secondary-900">
                  {duration} minutes
                </span>
              </div>
              {selectedDate && (
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">Date</span>
                  <span className="font-medium text-secondary-900">
                    {new Date(selectedDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
              {selectedTimeSlot && (
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">Time</span>
                  <span className="font-medium text-secondary-900">
                    {formatTime(selectedTimeSlot.startTime)} -{" "}
                    {formatTime(getSessionEndTime(selectedTimeSlot.startTime))}
                  </span>
                </div>
              )}
              <div className="border-t border-secondary-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-secondary-600">Hourly Rate</span>
                  <span className="font-medium text-secondary-900">
                    ${hourlyRate}/hr
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-secondary-900">
                    Total
                  </span>
                  <span className="text-xl font-bold text-primary-600">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tutor Details */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Tutor Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-sm text-secondary-600">
                  {tutorData.experience} years of experience
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-secondary-400" />
                <span className="text-sm text-secondary-600">
                  {tutorData.subjects.length} subjects
                </span>
              </div>
              {tutorData.languages.length > 0 && (
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-secondary-400" />
                  <span className="text-sm text-secondary-600">
                    Languages: {tutorData.languages.join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Help */}
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Need Help?</h4>
                <p className="text-sm text-blue-800">
                  If you have any questions about booking or need to reschedule,
                  you can contact the tutor directly after booking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
