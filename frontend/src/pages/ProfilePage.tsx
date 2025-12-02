import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  User,
  Edit,
  Save,
  X,
  Mail,
  Phone,
  Calendar,
  Award,
  BookOpen,
  Star,
  GraduationCap,
  DollarSign,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  usersApi,
  tutorsApi,
  studentsApi,
  sessionsApi,
  reviewsApi,
} from "../services/api";
import type { TutorProfile, StudentProfile } from "../types";

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  // Role-specific profile data
  const { data: tutorProfile } = useQuery({
    queryKey: ["tutorProfile", user?.id],
    queryFn: () => tutorsApi.getTutorByUserId(user!.id),
    enabled: !!user?.id && user.role === "tutor",
  });

  const { data: studentProfile } = useQuery({
    queryKey: ["studentProfile", user?.id],
    queryFn: () => studentsApi.getStudentProfile(user!.id),
    enabled: !!user?.id && user.role === "student",
  });

  // Statistics queries
  const { data: sessions } = useQuery({
    queryKey: ["sessions", user?.id, user?.role],
    queryFn: () =>
      sessionsApi.getSessions(user!.id, user!.role as "student" | "tutor"),
    enabled: !!user?.id,
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", user?.id],
    queryFn: () => reviewsApi.getReviewsForUser(user!.id),
    enabled: !!user?.id,
  });

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: (updates: Partial<typeof editForm>) =>
      usersApi.updateProfile(user!.id, updates),
    onSuccess: (updatedUser) => {
      updateProfile(updatedUser);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["tutorProfile", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["studentProfile", user?.id] });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      usersApi.updatePassword(currentPassword, newPassword),
    onSuccess: () => {
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});
      alert("Password updated successfully!");
    },
    onError: (error: any) => {
      setPasswordErrors({ 
        currentPassword: error.message || "Failed to update password. Please check your current password." 
      });
    },
  });

  const handleEdit = () => {
    setEditForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
  };

  const [profileFormErrors, setProfileFormErrors] = useState<Record<string, string>>({});

  const validateProfileForm = () => {
    const errors: Record<string, string> = {};
    
    if (!editForm.firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (editForm.firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    }
    
    if (!editForm.lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (editForm.lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    }
    
    if (!editForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (editForm.phone && !/^[\d\s\-\+\(\)]+$/.test(editForm.phone)) {
      errors.phone = "Please enter a valid phone number";
    }
    
    setProfileFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFormErrors({});
    
    if (!validateProfileForm()) {
      return;
    }
    
    if (!user) return;

    await updateUserMutation.mutateAsync(editForm);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const validatePasswordForm = () => {
    const errors: Record<string, string> = {};
    
    if (!passwordForm.currentPassword.trim()) {
      errors.currentPassword = "Current password is required";
    }
    
    if (!passwordForm.newPassword.trim()) {
      errors.newPassword = "New password is required";
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = "New password must be at least 6 characters";
    }
    
    if (!passwordForm.confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});
    
    if (!validatePasswordForm()) {
      return;
    }
    
    await updatePasswordMutation.mutateAsync({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const handleQuickAction = (action: string) => {
    if (!user) return;
    
    switch (action) {
      case "changePassword":
        setShowPasswordModal(true);
        break;
      case "privacySettings":
        const rolePrefix = user.role === "student" ? "/student" : user.role === "tutor" ? "/tutor" : "/admin";
        navigate(`${rolePrefix}/settings?tab=privacy`);
        break;
      case "updateAvailability":
        navigate("/tutor/schedule");
        break;
      case "studyPreferences":
        navigate("/student/study-planner");
        break;
      default:
        break;
    }
  };

  // Calculate statistics
  const totalSessions = sessions?.length || 0;
  const completedSessions =
    sessions?.filter((s) => s.status === "completed").length || 0;
  const averageRating = reviews?.length
    ? (
        reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
      ).toFixed(1)
    : "0.0";

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Profile</h1>
          <p className="text-secondary-600">Manage your account information</p>
        </div>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="btn-secondary flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">
                Basic Information
              </h3>
              <User className="h-5 w-5 text-secondary-400" />
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => {
                        handleInputChange("firstName", e.target.value);
                        if (profileFormErrors.firstName) {
                          setProfileFormErrors({ ...profileFormErrors, firstName: '' });
                        }
                      }}
                      className={`input-field ${profileFormErrors.firstName ? 'border-red-500' : ''}`}
                      required
                    />
                    {profileFormErrors.firstName && (
                      <p className="mt-1 text-xs text-red-600">{profileFormErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => {
                        handleInputChange("lastName", e.target.value);
                        if (profileFormErrors.lastName) {
                          setProfileFormErrors({ ...profileFormErrors, lastName: '' });
                        }
                      }}
                      className={`input-field ${profileFormErrors.lastName ? 'border-red-500' : ''}`}
                      required
                    />
                    {profileFormErrors.lastName && (
                      <p className="mt-1 text-xs text-red-600">{profileFormErrors.lastName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => {
                        handleInputChange("email", e.target.value);
                        if (profileFormErrors.email) {
                          setProfileFormErrors({ ...profileFormErrors, email: '' });
                        }
                      }}
                      className={`input-field ${profileFormErrors.email ? 'border-red-500' : ''}`}
                      required
                    />
                    {profileFormErrors.email && (
                      <p className="mt-1 text-xs text-red-600">{profileFormErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => {
                        handleInputChange("phone", e.target.value);
                        if (profileFormErrors.phone) {
                          setProfileFormErrors({ ...profileFormErrors, phone: '' });
                        }
                      }}
                      className={`input-field ${profileFormErrors.phone ? 'border-red-500' : ''}`}
                    />
                    {profileFormErrors.phone && (
                      <p className="mt-1 text-xs text-red-600">{profileFormErrors.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      `${user.firstName || "Unknown"} ${
                        user.lastName || "User"
                      }`
                    )}&size=80&background=3B82F6&color=FFFFFF&bold=true`}
                    alt={`${user.firstName || "Unknown"} ${
                      user.lastName || "User"
                    }`}
                    className="w-20 h-20 rounded-full object-cover"
                    onError={(e) => {
                      // Fallback to initials in a colored circle if image fails
                      const target = e.target as HTMLImageElement;
                      const initials = `${user.firstName?.[0] || "?"}${
                        user.lastName?.[0] || "?"
                      }`;
                      target.src = `data:image/svg+xml;base64,${btoa(`
                        <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                          <rect width="80" height="80" fill="#3B82F6"/>
                          <text x="40" y="50" font-family="Arial, sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="white">${initials}</text>
                        </svg>
                      `)}`;
                    }}
                  />
                  <div>
                    <h4 className="text-xl font-semibold text-secondary-900">
                      {user.firstName} {user.lastName}
                    </h4>
                    <p className="text-secondary-600 capitalize">{user.role}</p>
                    <p className="text-sm text-secondary-500">
                      Member since{" "}
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-secondary-200">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-secondary-400" />
                    <span className="text-sm text-secondary-600">
                      {user.email}
                    </span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-secondary-400" />
                      <span className="text-sm text-secondary-600">
                        {user.phone}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-secondary-400" />
                    <span className="text-sm text-secondary-600">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Role-specific Information */}
          {user.role === "tutor" && tutorProfile && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-secondary-900">
                  Tutor Profile
                </h3>
                <Award className="h-5 w-5 text-secondary-400" />
              </div>
              <div className="space-y-4">
                {tutorProfile.bio && (
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-2">Bio</h4>
                    <p className="text-secondary-600">{tutorProfile.bio}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-2">
                      Rating
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-secondary-600">
                        {averageRating} ({reviews?.length || 0} reviews)
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-2">
                      Experience
                    </h4>
                    <span className="text-secondary-600">
                      {tutorProfile.experience} years
                    </span>
                  </div>
                  {tutorProfile.hourlyRate && (
                    <div>
                      <h4 className="font-medium text-secondary-900 mb-2">
                        Hourly Rate
                      </h4>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-secondary-600">
                          {(typeof tutorProfile.hourlyRate === 'number' ? tutorProfile.hourlyRate : parseFloat(tutorProfile.hourlyRate || '0')).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-2">
                      Languages
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {tutorProfile.languages.map((lang) => (
                        <span
                          key={lang}
                          className="text-xs px-2 py-1 bg-secondary-100 text-secondary-700 rounded"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {tutorProfile.subjects.length > 0 && (
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-2">
                      Subjects
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {tutorProfile.subjects.map((subject) => (
                        <span
                          key={subject}
                          className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {tutorProfile.education.length > 0 && (
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-2">
                      Education
                    </h4>
                    <div className="space-y-1">
                      {tutorProfile.education.map((edu, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <GraduationCap className="h-4 w-4 text-secondary-400" />
                          <span className="text-sm text-secondary-600">
                            {edu}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {user.role === "student" && studentProfile && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-secondary-900">
                  Student Profile
                </h3>
                <BookOpen className="h-5 w-5 text-secondary-400" />
              </div>
              <div className="space-y-4">
                {studentProfile.grade && (
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-2">
                      Grade
                    </h4>
                    <span className="text-secondary-600">
                      {studentProfile.grade}
                    </span>
                  </div>
                )}
                {studentProfile.school && (
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-2">
                      School
                    </h4>
                    <span className="text-secondary-600">
                      {studentProfile.school}
                    </span>
                  </div>
                )}
                {studentProfile.preferences && (
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-2">
                      Learning Preferences
                    </h4>
                    <div className="space-y-2">
                      {studentProfile.preferences.subjects.length > 0 && (
                        <div>
                          <span className="text-sm text-secondary-500">
                            Preferred Subjects:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {studentProfile.preferences.subjects.map(
                              (subject) => (
                                <span
                                  key={subject}
                                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                                >
                                  {subject}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                      {studentProfile.preferences.goals.length > 0 && (
                        <div>
                          <span className="text-sm text-secondary-500">
                            Goals:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {studentProfile.preferences.goals.map((goal) => (
                              <span
                                key={goal}
                                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded"
                              >
                                {goal}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Statistics Sidebar */}
        <div className="space-y-6">
          {/* Account Statistics */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Account Statistics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-secondary-600">Total Sessions</span>
                <span className="font-semibold text-secondary-900">
                  {totalSessions}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary-600">Completed Sessions</span>
                <span className="font-semibold text-green-600">
                  {completedSessions}
                </span>
              </div>
              {user.role === "tutor" && (
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">Average Rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-semibold text-secondary-900">
                      {averageRating}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-secondary-600">Member Since</span>
                <span className="font-semibold text-secondary-900">
                  {new Date(user.createdAt).getFullYear()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button 
                onClick={() => handleQuickAction("changePassword")}
                className="w-full text-left p-3 rounded-lg border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="font-medium text-secondary-900">
                  Change Password
                </div>
                <div className="text-sm text-secondary-600">
                  Update your password
                </div>
              </button>
              <button 
                onClick={() => handleQuickAction("privacySettings")}
                className="w-full text-left p-3 rounded-lg border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="font-medium text-secondary-900">
                  Privacy Settings
                </div>
                <div className="text-sm text-secondary-600">
                  Manage your privacy preferences
                </div>
              </button>
              {user.role === "tutor" && (
                <button 
                  onClick={() => handleQuickAction("updateAvailability")}
                  className="w-full text-left p-3 rounded-lg border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="font-medium text-secondary-900">
                    Update Availability
                  </div>
                  <div className="text-sm text-secondary-600">
                    Set your tutoring schedule
                  </div>
                </button>
              )}
              {user.role === "student" && (
                <button 
                  onClick={() => handleQuickAction("studyPreferences")}
                  className="w-full text-left p-3 rounded-lg border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="font-medium text-secondary-900">
                    Study Preferences
                  </div>
                  <div className="text-sm text-secondary-600">
                    Customize your learning goals
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">
                Change Password
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setPasswordErrors({});
                }}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => {
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value });
                      if (passwordErrors.currentPassword) {
                        setPasswordErrors({ ...passwordErrors, currentPassword: "" });
                      }
                    }}
                    className={`input-field pr-10 ${passwordErrors.currentPassword ? 'border-red-500' : ''}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-xs text-red-600">{passwordErrors.currentPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => {
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                      if (passwordErrors.newPassword) {
                        setPasswordErrors({ ...passwordErrors, newPassword: "" });
                      }
                    }}
                    className={`input-field pr-10 ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-xs text-red-600">{passwordErrors.newPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => {
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                      if (passwordErrors.confirmPassword) {
                        setPasswordErrors({ ...passwordErrors, confirmPassword: "" });
                      }
                    }}
                    className={`input-field pr-10 ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setPasswordErrors({});
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={updatePasswordMutation.isPending}
                >
                  {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
