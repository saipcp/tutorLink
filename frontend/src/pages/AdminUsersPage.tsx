import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Edit, Trash2, UserPlus, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { adminApi, usersApi } from "../services/api";
import type { User as UserType } from "../types";

const AdminUsersPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Admin data queries
  const { data: allUsers } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => adminApi.getAllUsers(),
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (userData: {
      firstName: string;
      lastName: string;
      email: string;
      role: "student" | "tutor" | "admin";
      password?: string;
    }) =>
      adminApi.createUser({
        ...userData,
        password: userData.password || "password",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<UserType> }) =>
      adminApi.updateUser(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });

  // State for forms and search
  const [searchTerm, setSearchTerm] = useState("");
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "student" as "student" | "tutor" | "admin",
  });

  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>(
    {}
  );

  const validateUserForm = () => {
    const errors: Record<string, string> = {};

    if (!newUser.firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (newUser.firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    }

    if (!newUser.lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (newUser.lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    }

    if (!newUser.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!newUser.role) {
      errors.role = "Role is required";
    }

    setUserFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormErrors({});

    if (!validateUserForm()) {
      return;
    }

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
    setUserFormErrors({});

    if (!validateUserForm()) {
      return;
    }

    if (!editingUser) return;

    await updateUserMutation.mutateAsync({
      id: editingUser.id,
      updates: {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
      },
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

  // Filter users by search term (partial matching)
  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    if (!searchTerm.trim()) return allUsers;

    const term = searchTerm.toLowerCase();
    return allUsers.filter((u) => {
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
      const email = u.email?.toLowerCase() || "";
      const role = u.role?.toLowerCase() || "";
      return (
        fullName.includes(term) ||
        email.includes(term) ||
        role.includes(term)
      );
    });
  }, [allUsers, searchTerm]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">
            Create, edit, and manage platform users
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowUserForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Users Section */}
      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              User Management
            </h3>
            <Users className="h-5 w-5 text-gray-400" />
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "No users found matching your search" : "No users found"}
              </div>
            ) : (
              filteredUsers.map((user) => (
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
                <div className="flex space-x-2">
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
              ))
            )}
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
                  onChange={(e) => {
                    setNewUser({ ...newUser, firstName: e.target.value });
                    if (userFormErrors.firstName) {
                      setUserFormErrors({ ...userFormErrors, firstName: "" });
                    }
                  }}
                  className={`input-field ${
                    userFormErrors.firstName ? "border-red-500" : ""
                  }`}
                  placeholder="Enter first name"
                  required
                />
                {userFormErrors.firstName && (
                  <p className="mt-1 text-xs text-red-600">
                    {userFormErrors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={newUser.lastName}
                  onChange={(e) => {
                    setNewUser({ ...newUser, lastName: e.target.value });
                    if (userFormErrors.lastName) {
                      setUserFormErrors({ ...userFormErrors, lastName: "" });
                    }
                  }}
                  className={`input-field ${
                    userFormErrors.lastName ? "border-red-500" : ""
                  }`}
                  placeholder="Enter last name"
                  required
                />
                {userFormErrors.lastName && (
                  <p className="mt-1 text-xs text-red-600">
                    {userFormErrors.lastName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => {
                    setNewUser({ ...newUser, email: e.target.value });
                    if (userFormErrors.email) {
                      setUserFormErrors({ ...userFormErrors, email: "" });
                    }
                  }}
                  className={`input-field ${
                    userFormErrors.email ? "border-red-500" : ""
                  }`}
                  placeholder="user@tutorlink.com"
                  required
                />
                {userFormErrors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    {userFormErrors.email}
                  </p>
                )}
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
    </div>
  );
};

export default AdminUsersPage;
