import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Calendar,
  BookOpen,
  CheckSquare,
  MessageSquare,
  User,
  Clock,
  Star,
  TrendingUp,
} from "lucide-react";
import ChatWidget from "../components/Chat/ChatWidget";
import { useAuth } from "../context/AuthContext";
import {
  sessionsApi,
  tasksApi,
  plansApi,
  subjectsApi,
  messagingApi,
  dashboardApi,
} from "../services/api";
import type {
  Session,
  Task,
  Plan,
  Subject,
  Conversation,
  Notification,
} from "../types";

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Dashboard data queries
  const { data: dashboardData } = useQuery({
    queryKey: ["studentDashboard", user?.id],
    queryFn: () => dashboardApi.getStudentDashboard(user!.id),
    enabled: !!user?.id,
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions", user?.id, "student"],
    queryFn: () => sessionsApi.getSessions(user!.id, "student"),
    enabled: !!user?.id,
  });

  const { data: tasks } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: () => tasksApi.getTasks(user!.id),
    enabled: !!user?.id,
  });

  const { data: plans } = useQuery({
    queryKey: ["plans", user?.id],
    queryFn: () => plansApi.getPlans(user!.id),
    enabled: !!user?.id,
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.getAllSubjects(),
  });

  const { data: conversations } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => messagingApi.getConversations(user!.id),
    enabled: !!user?.id,
  });

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (
      task: Omit<Task, "id" | "createdAt" | "updatedAt" | "comments">
    ) => tasksApi.createTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", user?.id] });
      queryClient.invalidateQueries({
        queryKey: ["studentDashboard", user?.id],
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      tasksApi.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", user?.id] });
      queryClient.invalidateQueries({
        queryKey: ["studentDashboard", user?.id],
      });
    },
  });

  // Quick action handlers
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    subjectId: "",
    topicId: "",
    estimatedMins: 60,
    dueAt: "",
  });

  const [taskFormErrors, setTaskFormErrors] = useState<Record<string, string>>(
    {}
  );

  const validateTaskForm = () => {
    const errors: Record<string, string> = {};

    if (!newTask.title.trim()) {
      errors.title = "Task title is required";
    } else if (newTask.title.trim().length < 3) {
      errors.title = "Task title must be at least 3 characters";
    } else if (newTask.title.trim().length > 255) {
      errors.title = "Task title must be less than 255 characters";
    }

    if (
      newTask.estimatedMins &&
      (newTask.estimatedMins < 1 || newTask.estimatedMins > 1440)
    ) {
      errors.estimatedMins =
        "Estimated minutes must be between 1 and 1440 (24 hours)";
    }

    if (newTask.dueAt) {
      const dueDate = new Date(newTask.dueAt);
      if (isNaN(dueDate.getTime())) {
        errors.dueAt = "Invalid date format";
      } else if (dueDate < new Date()) {
        errors.dueAt = "Due date cannot be in the past";
      }
    }

    setTaskFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskFormErrors({});

    if (!validateTaskForm()) {
      return;
    }

    if (!user?.id) return;

    await createTaskMutation.mutateAsync({
      userId: user.id,
      title: newTask.title,
      subjectId: newTask.subjectId || undefined,
      topicId: newTask.topicId || undefined,
      estimatedMins: newTask.estimatedMins,
      dueAt: newTask.dueAt || undefined,
      status: "todo",
    });

    setNewTask({
      title: "",
      subjectId: "",
      topicId: "",
      estimatedMins: 60,
      dueAt: "",
    });
    setShowTaskForm(false);
  };

  const handleTaskStatusChange = async (
    taskId: string,
    status: Task["status"]
  ) => {
    await updateTaskMutation.mutateAsync({ id: taskId, updates: { status } });
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-gray-600">Here's your learning overview</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowTaskForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center overflow-hidden">
          <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 truncate break-words px-2">
            {dashboardData?.upcomingSessions.length || 0}
          </div>
          <div className="text-sm text-gray-600 truncate px-2">Upcoming Sessions</div>
        </div>

        <div className="card text-center overflow-hidden">
          <CheckSquare className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 truncate break-words px-2">
            {dashboardData?.completedTasks || 0}
          </div>
          <div className="text-sm text-gray-600 truncate px-2">Completed Tasks</div>
        </div>

        <div className="card text-center overflow-hidden">
          <BookOpen className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 truncate break-words px-2">
            {dashboardData?.activePlans || 0}
          </div>
          <div className="text-sm text-gray-600 truncate px-2">Active Plans</div>
        </div>

        <div className="card text-center overflow-hidden">
          <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 truncate break-words px-2">
            {dashboardData?.totalStudyTime || 0}
          </div>
          <div className="text-sm text-gray-600 truncate px-2">Study Hours</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Quick Actions
            </h3>
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/student/browse")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Find Tutors</div>
              <div className="text-sm text-gray-600">
                Browse available tutors
              </div>
            </button>
            <button
              onClick={() => navigate("/student/browse")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Book Session</div>
              <div className="text-sm text-gray-600">
                Schedule a new session
              </div>
            </button>
            <button
              onClick={() => navigate("/student/study-planner")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Study Planner</div>
              <div className="text-sm text-gray-600">Create study plans</div>
            </button>
          </div>
        </div>

        {/* Chat widget */}
        <ChatWidget />

        {/* Upcoming Sessions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Upcoming Sessions
            </h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {dashboardData?.upcomingSessions.slice(0, 3).map((session: any) => (
              <div
                key={session.id}
                onClick={() => navigate("/student/sessions")}
                className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="font-medium text-gray-900">
                  {session.subjectName ||
                    (session.subjectId &&
                      subjects?.find((s) => s.id === session.subjectId)
                        ?.name) ||
                    "General Session"}
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(session.startAt).toLocaleDateString()} at{" "}
                  {new Date(session.startAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
            {(!Array.isArray(dashboardData?.upcomingSessions) ||
              !dashboardData.upcomingSessions.length) && (
              <p className="text-gray-500 text-sm">No upcoming sessions</p>
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Tasks
            </h3>
            <CheckSquare className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {tasks?.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{task.title}</div>
                  <div className="text-sm text-gray-600">
                    {task.estimatedMins} mins • {task.status}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {task.status === "todo" && (
                    <button
                      onClick={() =>
                        handleTaskStatusChange(task.id, "in_progress")
                      }
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                    >
                      Start
                    </button>
                  )}
                  {task.status === "in_progress" && (
                    <button
                      onClick={() => handleTaskStatusChange(task.id, "done")}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!tasks?.length && (
              <p className="text-gray-500 text-sm">No tasks yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => {
                    setNewTask({ ...newTask, title: e.target.value });
                    if (taskFormErrors.title) {
                      setTaskFormErrors({ ...taskFormErrors, title: "" });
                    }
                  }}
                  className={`input-field ${
                    taskFormErrors.title ? "border-red-500" : ""
                  }`}
                  placeholder="Enter task title"
                  required
                />
                {taskFormErrors.title && (
                  <p className="mt-1 text-xs text-red-600">
                    {taskFormErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject (Optional)
                </label>
                <select
                  value={newTask.subjectId}
                  onChange={(e) =>
                    setNewTask({ ...newTask, subjectId: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="">Select subject</option>
                  {subjects?.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Minutes
                </label>
                <input
                  type="number"
                  value={newTask.estimatedMins}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 60;
                    setNewTask({ ...newTask, estimatedMins: value });
                    if (taskFormErrors.estimatedMins) {
                      setTaskFormErrors({
                        ...taskFormErrors,
                        estimatedMins: "",
                      });
                    }
                  }}
                  className={`input-field ${
                    taskFormErrors.estimatedMins ? "border-red-500" : ""
                  }`}
                  min="1"
                  max="1440"
                />
                {taskFormErrors.estimatedMins && (
                  <p className="mt-1 text-xs text-red-600">
                    {taskFormErrors.estimatedMins}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={newTask.dueAt}
                  onChange={(e) => {
                    setNewTask({ ...newTask, dueAt: e.target.value });
                    if (taskFormErrors.dueAt) {
                      setTaskFormErrors({ ...taskFormErrors, dueAt: "" });
                    }
                  }}
                  className={`input-field ${
                    taskFormErrors.dueAt ? "border-red-500" : ""
                  }`}
                  min={new Date().toISOString().slice(0, 16)}
                />
                {taskFormErrors.dueAt && (
                  <p className="mt-1 text-xs text-red-600">
                    {taskFormErrors.dueAt}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notifications */}
      {dashboardData?.unreadNotifications > 0 && (
        <div className="card border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="font-medium text-gray-900">
                {dashboardData.unreadNotifications} unread notifications
              </span>
            </div>
            <button
              onClick={() => navigate("/notifications")}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              View all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
