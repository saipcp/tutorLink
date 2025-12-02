import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Users,
  BookOpen,
  BarChart3,
  Settings,
  Edit,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  adminApi,
  subjectsApi,
  sessionsApi,
  reviewsApi,
} from "../services/api";
import type { User as UserType, Session } from "../types";

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Admin data queries
  const { data: allUsers } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => adminApi.getAllUsers(),
  });

  const { data: adminStats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => adminApi.getAdminStats(),
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.getAllSubjects(),
  });

  const { data: allSessions } = useQuery({
    queryKey: ["allSessions"],
    queryFn: () => adminApi.getAllSessions(),
  });

  // Use stats from admin API instead of fetching all sessions
  const totalSessions = adminStats?.totalSessions || 0;
  const completedSessions = adminStats?.completedSessions || 0;
  const totalReviews = adminStats?.totalReviews || 0;

  // State for forms
  const [showUserForm, setShowUserForm] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "student" as "student" | "tutor" | "admin",
  });

  const [newSubject, setNewSubject] = useState({
    name: "",
    // store topics as an array of strings
    topics: [] as string[],
  });
  // raw input for topics so typing commas/spaces isn't interrupted
  const [newSubjectInput, setNewSubjectInput] = useState("");

  const createSubjectMutation = useMutation({
    mutationFn: (subjectData: { name: string; topics: string[] }) =>
      subjectsApi.createSubject(subjectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (userData: typeof newUser & { password: string }) =>
      adminApi.createUser({
        ...userData,
        password: userData.password || "password",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<UserType> }) =>
      adminApi.updateUser(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newUser.firstName.trim() ||
      !newUser.lastName.trim() ||
      !newUser.email.trim()
    )
      return;

    await createUserMutation.mutateAsync({
      ...newUser,
      password: "password", // Admin should set a proper password
    });

    setNewUser({
      firstName: "",
      lastName: "",
      email: "",
      role: "student",
    });
    setShowUserForm(false);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    await updateUserMutation.mutateAsync({
      id: editingUser.id,
      updates: newUser,
    });

    setEditingUser(null);
    setNewUser({
      firstName: "",
      lastName: "",
      email: "",
      role: "student",
    });
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      await deleteUserMutation.mutateAsync(userId);
    }
  };

  const startEditUser = (user: UserType) => {
    setEditingUser(user);
    setNewUser({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });
  };

  // Calculate analytics from API data
  const totalUsers = adminStats?.totalUsers || allUsers?.length || 0;
  const totalStudents =
    adminStats?.students ||
    allUsers?.filter((u) => u.role === "student").length ||
    0;
  const totalTutors =
    adminStats?.tutors ||
    allUsers?.filter((u) => u.role === "tutor").length ||
    0;
  const totalSubjects = subjects?.length || adminStats?.totalSubjects || 0;
  const totalAdmins = adminStats?.admins || allUsers?.filter((u) => u.role === "admin").length || 0;
  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Platform management and analytics</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowUserForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add User</span>
          </button>
          <button
            onClick={() => {
              // seed the raw input when opening the modal
              setNewSubjectInput(newSubject.topics.join(", "));
              setShowSubjectForm(true);
            }}
            className="btn-secondary flex items-center space-x-2"
          >
            <BookOpen className="h-4 w-4" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center overflow-hidden">
          <BookOpen className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 truncate break-words px-2">
            {totalSubjects}
          </div>
          <div className="text-sm text-gray-600 truncate px-2">Subjects</div>
          <div className="text-xs text-gray-500 mt-1 truncate px-2">
            {subjects?.reduce((acc, s) => acc + s.topics.length, 0) || 0} topics
          </div>
        </div>

        <div className="card text-center overflow-hidden">
          <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 truncate break-words px-2">
            {totalSessions}
          </div>
          <div className="text-sm text-gray-600 truncate px-2">Total Sessions</div>
          <div className="text-xs text-gray-500 mt-1 truncate px-2">
            {completedSessions} completed
          </div>
        </div>

        <div className="card text-center overflow-hidden">
          <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 truncate break-words px-2">
            {totalUsers}
          </div>
          <div className="text-sm text-gray-600 truncate px-2">Total Users</div>
          <div className="text-xs text-gray-500 mt-1 truncate px-2">
             {totalStudents} students, {totalTutors} tutors, {totalAdmins} admins
          </div>
        </div>

        <div className="card text-center overflow-hidden">
          <Settings className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 truncate break-words px-2">
            {user.role === "admin" ? "Admin" : "User"}
          </div>
          <div className="text-sm text-gray-600 truncate px-2">Current Role</div>
          <div className="text-xs text-gray-500 mt-1 truncate px-2">Full Access</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Management */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              User Management
            </h3>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {allUsers?.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      `${user.firstName || "Unknown"} ${
                        user.lastName || "User"
                      }`
                    )}&size=40&background=3B82F6&color=FFFFFF&bold=true`}
                    alt={`${user.firstName || "Unknown"} ${
                      user.lastName || "User"
                    }`}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const initials = `${user.firstName?.[0] || "?"}${
                        user.lastName?.[0] || "?"
                      }`;
                      target.src = `data:image/svg+xml;base64,${btoa(`
                        <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                          <rect width="40" height="40" fill="#3B82F6"/>
                          <text x="20" y="28" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="white">${initials}</text>
                        </svg>
                      `)}`;
                    }}
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div className="text-xs text-gray-500 capitalize">
                      {user.role}
                    </div>
                  </div>
                </div>
                <div
                  className="flex space-x-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => startEditUser(user)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {!allUsers?.length && (
              <p className="text-gray-500 text-sm">No users found</p>
            )}
            {allUsers && allUsers.length > 5 && (
              <button
                onClick={() => navigate("/admin/users")}
                className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium py-2"
              >
                View all {allUsers.length} users
              </button>
            )}
          </div>
        </div>

        {/* Subject Catalog */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Subject Catalog
            </h3>
            <BookOpen className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {subjects?.slice(0, 5).map((subject) => (
              <div
                key={subject.id}
                onClick={() => navigate("/admin/subjects")}
                className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="font-medium text-gray-900 mb-1">
                  {subject.name}
                </div>
                <div className="text-sm text-gray-600">
                  {subject.topics.length} topics
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {subject.topics.slice(0, 3).map((topic: any) => (
                    <span
                      key={topic.id}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                    >
                      {topic.name}
                    </span>
                  ))}
                  {subject.topics.length > 3 && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      +{subject.topics.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            ))}
            {!subjects?.length && (
              <p className="text-gray-500 text-sm">No subjects found</p>
            )}
            {subjects && subjects.length > 5 && (
              <button
                onClick={() => navigate("/admin/subjects")}
                className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium py-2"
              >
                View all {subjects.length} subjects
              </button>
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Sessions
            </h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {allSessions?.slice(0, 4).map((session: any) => (
              <div
                key={session.id}
                className="p-3 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-gray-900">
                    {session.subjectName || "Session"} -{" "}
                    {session.tutorFirstName} {session.tutorLastName} &{" "}
                    {session.studentFirstName} {session.studentLastName}
                  </div>
                  <div
                    className={`text-xs px-2 py-1 rounded ${
                      session.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : session.status === "booked"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {session.status}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {session.startAt ? (
                    <>
                      {new Date(session.startAt).toLocaleDateString()} at{" "}
                      {new Date(session.startAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </>
                  ) : (
                    "Date not available"
                  )}
                </div>
                {session.price && (
                  <div className="text-sm font-medium text-green-600 mt-1">
                    ${typeof session.price === 'number' ? session.price.toFixed(2) : parseFloat(session.price || '0').toFixed(2)}
                  </div>
                )}
              </div>
            ))}
            {!allSessions?.length && (
              <p className="text-gray-500 text-sm">No sessions found</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Quick Actions
            </h3>
            <Settings className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <button 
              onClick={() => navigate("/admin/users")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-900">User Management</div>
              <div className="text-sm text-gray-600">
                Create, edit, and manage users
              </div>
            </button>
            <button 
              onClick={() => navigate("/admin/subjects")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Subject Catalog</div>
              <div className="text-sm text-gray-600">
                Manage subjects and topics
              </div>
            </button>
            <button 
              onClick={() => navigate("/browse")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Find Tutors</div>
              <div className="text-sm text-gray-600">
                Browse and discover tutors
              </div>
            </button>
            <button 
              onClick={() => navigate("/admin/sessions")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Sessions</div>
              <div className="text-sm text-gray-600">
                View and manage all sessions
              </div>
            </button>
            <button 
              onClick={() => navigate("/admin/schedule")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Schedule</div>
              <div className="text-sm text-gray-600">
                Manage availability and schedule
              </div>
            </button>
            <button 
              onClick={() => navigate("/admin/students")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Students</div>
              <div className="text-sm text-gray-600">
                View and manage students
              </div>
            </button>
            <button 
              onClick={() => navigate("/admin/study-planner")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Study Planner</div>
              <div className="text-sm text-gray-600">
                Create and manage study plans
              </div>
            </button>
            <button 
              onClick={() => navigate("/tasks")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Tasks</div>
              <div className="text-sm text-gray-600">
                Manage tasks and assignments
              </div>
            </button>
            <button 
              onClick={() => navigate("/messages")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Messages</div>
              <div className="text-sm text-gray-600">
                View conversations and messages
              </div>
            </button>
            <button 
              onClick={() => navigate("/admin/reviews")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Reviews</div>
              <div className="text-sm text-gray-600">
                View and manage reviews
              </div>
            </button>
            <button 
              onClick={() => navigate("/admin/analytics")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-900">
                Analytics & Reports
              </div>
              <div className="text-sm text-gray-600">View platform metrics</div>
            </button>
            <button 
              onClick={() => navigate("/aitutor")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-900">AI Tutor</div>
              <div className="text-sm text-gray-600">
                Chat with AI tutor assistant
              </div>
            </button>
            <button 
              onClick={() => navigate("/admin/ai")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-900">AI Settings</div>
              <div className="text-sm text-gray-600">
                Configure AI features
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {(showUserForm || editingUser) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingUser ? "Edit User" : "Add New User"}
            </h3>
            <form
              onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={newUser.firstName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, firstName: e.target.value })
                  }
                  className="input-field"
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={newUser.lastName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, lastName: e.target.value })
                  }
                  className="input-field"
                  placeholder="Enter last name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="input-field"
                  placeholder="user@tutorlink.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      role: e.target.value as "student" | "tutor" | "admin",
                    })
                  }
                  className="input-field"
                >
                  <option value="student">Student</option>
                  <option value="tutor">Tutor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserForm(false);
                    setEditingUser(null);
                    setNewUser({
                      firstName: "",
                      lastName: "",
                      email: "",
                      role: "student",
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showSubjectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Subject</h3>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();

                // parse topics from raw input
                const parts = newSubjectInput
                  .split(/[;,\n]+/)
                  .map((t) => t.trim())
                  .filter(Boolean);

                // validation
                if (!newSubject.name.trim()) return;
                if (!parts || parts.length === 0) return;

                try {
                  await createSubjectMutation.mutateAsync({
                    name: newSubject.name.trim(),
                    topics: parts,
                  });

                  setNewSubject({ name: "", topics: [] });
                  setNewSubjectInput("");
                  setShowSubjectForm(false);
                } catch (err) {
                  console.error("Create subject failed", err);
                  alert("Failed to create subject — try again.");
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) =>
                    setNewSubject({ ...newSubject, name: e.target.value })
                  }
                  className="input-field"
                  placeholder="Enter subject name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topics (comma-separated)
                </label>
                <input
                  type="text"
                  value={newSubjectInput}
                  onChange={(e) => setNewSubjectInput(e.target.value)}
                  onBlur={() => {
                    const parts = newSubjectInput
                      .split(/[;,\n]+/)
                      .map((t) => t.trim())
                      .filter(Boolean);

                    setNewSubject({ ...newSubject, topics: parts });
                  }}
                  className="input-field"
                  placeholder="Enter topics separated by commas"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubjectForm(false);
                    setNewSubject({ name: "", topics: [] });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
