import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  Edit,
  Trash2,
  BookOpen,
  Target,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { tasksApi, subjectsApi, plansApi, aiApi } from "../services/api";
import type { Task, Subject, Plan, PlanItem } from "../types";

const TaskManagement: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Data queries
  const { data: tasks } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: () => tasksApi.getTasks(user!.id),
    enabled: !!user?.id,
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.getAllSubjects(),
  });

  const { data: plans } = useQuery({
    queryKey: ["plans", user?.id],
    queryFn: () => plansApi.getPlans(user!.id),
    enabled: !!user?.id,
  });

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (
      task: Omit<Task, "id" | "createdAt" | "updatedAt" | "comments">
    ) => tasksApi.createTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", user?.id] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      tasksApi.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", user?.id] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => tasksApi.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", user?.id] });
    },
  });

  // AI Study Plan Generation
  const generatePlanMutation = useMutation({
    mutationFn: (request: {
      subjects: string[];
      topics: string[];
      duration: number;
      dailyHours: number;
      goals: string[];
      currentLevel: string;
    }) => aiApi.generateStudyPlan(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", user?.id] });
    },
  });

  // State for forms and filters
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<"all" | "todo" | "in_progress" | "done">(
    "all"
  );
  const [searchTerm, setSearchTerm] = useState("");

  const [newTask, setNewTask] = useState({
    title: "",
    subjectId: "",
    topicId: "",
    estimatedMins: 60,
    dueAt: "",
    status: "todo" as Task["status"],
  });

  const [newPlan, setNewPlan] = useState({
    subjects: [] as string[],
    topics: [] as string[],
    duration: 7,
    dailyHours: 2,
    goals: [] as string[],
    currentLevel: "beginner",
  });

  // Filter and search tasks
  const filteredTasks =
    tasks?.filter((task) => {
      const matchesFilter = filter === "all" || task.status === filter;
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.subjectId &&
          subjects
            ?.find((s) => s.id === task.subjectId)
            ?.name.toLowerCase()
            .includes(searchTerm.toLowerCase()));
      return matchesFilter && matchesSearch;
    }) || [];

  const todoTasks = filteredTasks.filter((t) => t.status === "todo");
  const inProgressTasks = filteredTasks.filter(
    (t) => t.status === "in_progress"
  );
  const completedTasks = filteredTasks.filter((t) => t.status === "done");

  const [taskFormErrors, setTaskFormErrors] = useState<Record<string, string>>({});

  const validateTaskForm = () => {
    const errors: Record<string, string> = {};
    
    if (!newTask.title.trim()) {
      errors.title = "Task title is required";
    } else if (newTask.title.trim().length < 3) {
      errors.title = "Task title must be at least 3 characters";
    } else if (newTask.title.trim().length > 255) {
      errors.title = "Task title must be less than 255 characters";
    }
    
    if (newTask.estimatedMins && (newTask.estimatedMins < 1 || newTask.estimatedMins > 1440)) {
      errors.estimatedMins = "Estimated minutes must be between 1 and 1440";
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
      status: newTask.status,
    });

    setNewTask({
      title: "",
      subjectId: "",
      topicId: "",
      estimatedMins: 60,
      dueAt: "",
      status: "todo",
    });
    setShowTaskForm(false);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskFormErrors({});
    
    if (!validateTaskForm()) {
      return;
    }
    
    if (!editingTask) return;

    await updateTaskMutation.mutateAsync({
      id: editingTask.id,
      updates: {
        title: newTask.title,
        subjectId: newTask.subjectId,
        topicId: newTask.topicId,
        estimatedMins: newTask.estimatedMins,
        dueAt: newTask.dueAt,
        status: newTask.status,
      },
    });

    setEditingTask(null);
    setNewTask({
      title: "",
      subjectId: "",
      topicId: "",
      estimatedMins: 60,
      dueAt: "",
      status: "todo",
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTaskMutation.mutateAsync(taskId);
    }
  };

  const startEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      subjectId: task.subjectId || "",
      topicId: task.topicId || "",
      estimatedMins: task.estimatedMins || 60,
      dueAt: task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : "",
      status: task.status,
    });
  };

  const handleStatusChange = async (taskId: string, status: Task["status"]) => {
    await updateTaskMutation.mutateAsync({ id: taskId, updates: { status } });
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !newPlan.subjects.length) return;

    await generatePlanMutation.mutateAsync({
      subjects: newPlan.subjects,
      topics: newPlan.topics,
      duration: newPlan.duration,
      dailyHours: newPlan.dailyHours,
      goals: newPlan.goals,
      currentLevel: newPlan.currentLevel,
    });

    setNewPlan({
      subjects: [],
      topics: [],
      duration: 7,
      dailyHours: 2,
      goals: [],
      currentLevel: "beginner",
    });
    setShowPlanForm(false);
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "done":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "todo":
        return <Circle className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "done":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600">
            Manage your learning tasks and study plans
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowPlanForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Target className="h-4 w-4" />
            <span>Generate AI Plan</span>
          </button>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">
            {todoTasks.length}
          </div>
          <div className="text-sm text-gray-600">To Do</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {inProgressTasks.length}
          </div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {completedTasks.length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">
            {plans?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Study Plans</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-12"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            {["all", "todo", "in_progress", "done"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  filter === status
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status === "all" ? "All" : status.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Status */}
        {[
          { title: "To Do", tasks: todoTasks, color: "gray" },
          { title: "In Progress", tasks: inProgressTasks, color: "blue" },
          { title: "Completed", tasks: completedTasks, color: "green" },
        ].map(({ title, tasks: statusTasks, color }) => (
          <div key={title} className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <span
                className={`text-sm font-medium px-2 py-1 rounded ${
                  color === "gray"
                    ? "bg-gray-100 text-gray-700"
                    : color === "blue"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {statusTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {statusTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getStatusIcon(task.status)}
                        <h4 className="font-medium text-gray-900">
                          {task.title}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{task.estimatedMins} mins</span>
                        </span>
                        {task.subjectId && (
                          <span className="flex items-center space-x-1">
                            <BookOpen className="h-3 w-3" />
                            <span>
                              {
                                subjects?.find((s) => s.id === task.subjectId)
                                  ?.name
                              }
                            </span>
                          </span>
                        )}
                        {task.dueAt && (
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Due: {new Date(task.dueAt).toLocaleDateString()}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {task.status === "todo" && (
                        <button
                          onClick={() =>
                            handleStatusChange(task.id, "in_progress")
                          }
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Start task"
                        >
                          <Clock className="h-4 w-4" />
                        </button>
                      )}
                      {task.status === "in_progress" && (
                        <button
                          onClick={() => handleStatusChange(task.id, "done")}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Complete task"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => startEditTask(task)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit task"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {task.status === "done" && task.actualMins && (
                    <div className="text-xs text-green-600">
                      Completed in {task.actualMins} minutes
                    </div>
                  )}
                </div>
              ))}

              {!statusTasks.length && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-sm">No {title.toLowerCase()} tasks</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Study Plans */}
      {plans && plans.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Your Study Plans
            </h3>
            <Target className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="p-4 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Study Plan</h4>
                  <span className="text-xs text-gray-500">
                    {new Date(plan.generatedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{plan.goalSummary}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-600">
                    {plan.items.length} study items
                  </span>
                  <button className="text-xs text-blue-600 hover:text-blue-700">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Task Modal */}
      {(showTaskForm || editingTask) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingTask ? "Edit Task" : "Add New Task"}
            </h3>
            <form
              onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
              className="space-y-4"
            >
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
                      setTaskFormErrors({ ...taskFormErrors, title: '' });
                    }
                  }}
                  className={`input-field ${taskFormErrors.title ? 'border-red-500' : ''}`}
                  placeholder="Enter task title"
                  required
                />
                {taskFormErrors.title && (
                  <p className="mt-1 text-xs text-red-600">{taskFormErrors.title}</p>
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

              <div className="grid grid-cols-2 gap-4">
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
                        setTaskFormErrors({ ...taskFormErrors, estimatedMins: '' });
                      }
                    }}
                    className={`input-field ${taskFormErrors.estimatedMins ? 'border-red-500' : ''}`}
                    min="1"
                    max="1440"
                  />
                  {taskFormErrors.estimatedMins && (
                    <p className="mt-1 text-xs text-red-600">{taskFormErrors.estimatedMins}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={newTask.status}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        status: e.target.value as Task["status"],
                      })
                    }
                    className="input-field"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Completed</option>
                  </select>
                </div>
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
                        setTaskFormErrors({ ...taskFormErrors, dueAt: '' });
                      }
                    }}
                    className={`input-field ${taskFormErrors.dueAt ? 'border-red-500' : ''}`}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  {taskFormErrors.dueAt && (
                    <p className="mt-1 text-xs text-red-600">{taskFormErrors.dueAt}</p>
                  )}
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTaskForm(false);
                    setEditingTask(null);
                    setNewTask({
                      title: "",
                      subjectId: "",
                      topicId: "",
                      estimatedMins: 60,
                      dueAt: "",
                      status: "todo",
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTask ? "Update Task" : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Study Plan Generator Modal */}
      {showPlanForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">
              Generate AI Study Plan
            </h3>
            <form onSubmit={handleGeneratePlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subjects
                </label>
                <select
                  multiple
                  value={newPlan.subjects}
                  onChange={(e) =>
                    setNewPlan({
                      ...newPlan,
                      subjects: Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      ),
                    })
                  }
                  className="input-field h-24"
                >
                  {subjects?.map((subject) => (
                    <option key={subject.id} value={subject.name}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Hold Ctrl/Cmd to select multiple subjects
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    value={newPlan.duration}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        duration: parseInt(e.target.value) || 7,
                      })
                    }
                    className="input-field"
                    min="1"
                    max="30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Hours
                  </label>
                  <input
                    type="number"
                    value={newPlan.dailyHours}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        dailyHours: parseInt(e.target.value) || 2,
                      })
                    }
                    className="input-field"
                    min="1"
                    max="8"
                    step="0.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Level
                </label>
                <select
                  value={newPlan.currentLevel}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, currentLevel: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPlanForm(false);
                    setNewPlan({
                      subjects: [],
                      topics: [],
                      duration: 7,
                      dailyHours: 2,
                      goals: [],
                      currentLevel: "beginner",
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!newPlan.subjects.length}
                >
                  Generate Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;
