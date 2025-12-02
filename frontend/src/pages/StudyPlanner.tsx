import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Calendar,
  Clock,
  Target,
  BookOpen,
  CheckCircle,
  Circle,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Brain,
  TrendingUp,
  Zap,
  Book,
  PenTool,
  RefreshCw,
  Award,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { plansApi, tasksApi, subjectsApi, aiApi } from "../services/api";
import type { Plan, PlanItem, Task, Subject } from "../types";

const StudyPlanner: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Data queries
  const { data: plans } = useQuery({
    queryKey: ["plans", user?.id],
    queryFn: () => plansApi.getPlans(user!.id),
    enabled: !!user?.id,
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.getAllSubjects(),
  });

  const { data: tasks } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: () => tasksApi.getTasks(user!.id),
    enabled: !!user?.id,
  });

  // Mutations
  const generatePlanMutation = useMutation({
    mutationFn: (request: {
      subjects: string[];
      topics: string[];
      duration: number;
      dailyHours: number;
      goals: string[];
      currentLevel: string;
    }) => aiApi.generateStudyPlan(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["plans", user?.id] });
      await queryClient.refetchQueries({ queryKey: ["plans", user?.id] });
    },
  });

  const updatePlanItemMutation = useMutation({
    mutationFn: ({
      planId,
      itemId,
      completed,
    }: {
      planId: string;
      itemId: string;
      completed: boolean;
    }) => plansApi.updatePlanItem(planId, itemId, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", user?.id] });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (planId: string) => plansApi.deletePlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", user?.id] });
    },
  });

  // State for forms
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [newPlan, setNewPlan] = useState({
    subjects: [] as string[],
    topics: [] as string[],
    duration: 7,
    dailyHours: 2,
    goals: [] as string[],
    currentLevel: "beginner",
  });

  const [planFormErrors, setPlanFormErrors] = useState<Record<string, string>>(
    {}
  );
  const [activeSession, setActiveSession] = useState<{
    itemId: string;
    startTime: Date;
  } | null>(null);

  const validatePlanForm = () => {
    const errors: Record<string, string> = {};

    if (!newPlan.subjects.length) {
      errors.subjects = "Please select at least one subject";
    }

    if (newPlan.duration < 1 || newPlan.duration > 365) {
      errors.duration = "Duration must be between 1 and 365 days";
    }

    if (newPlan.dailyHours < 0.5 || newPlan.dailyHours > 12) {
      errors.dailyHours = "Daily hours must be between 0.5 and 12";
    }

    if (!newPlan.currentLevel) {
      errors.currentLevel = "Please select your current level";
    }

    setPlanFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanFormErrors({});

    if (!validatePlanForm()) {
      return;
    }

    if (!user?.id) return;

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

  const handlePlanItemToggle = async (
    planId: string,
    itemId: string,
    completed: boolean
  ) => {
    await updatePlanItemMutation.mutateAsync({ planId, itemId, completed });
  };

  const handleDeletePlan = async (planId: string) => {
    if (confirm("Are you sure you want to delete this study plan?")) {
      await deletePlanMutation.mutateAsync(planId);
    }
  };

  const handleStartSession = (itemId: string, itemTitle: string) => {
    if (activeSession?.itemId === itemId) {
      // Stop the current session
      setActiveSession(null);
    } else {
      // Start a new session
      setActiveSession({
        itemId,
        startTime: new Date(),
      });
      // Show notification
      alert(`Started study session: ${itemTitle}`);
    }
  };

  // Calculate progress
  const calculatePlanProgress = (plan: Plan) => {
    if (!plan.items.length) return 0;
    const completedItems = plan.items.filter((item) => item.completed).length;
    return Math.round((completedItems / plan.items.length) * 100);
  };

  const getPlanStatus = (plan: Plan) => {
    const progress = calculatePlanProgress(plan);
    if (progress === 0) return { status: "Not Started", color: "gray" };
    if (progress === 100) return { status: "Completed", color: "green" };
    return { status: "In Progress", color: "blue" };
  };

  const getSessionTypeIcon = (sessionType?: string) => {
    switch (sessionType) {
      case "theory":
        return <Book className="h-4 w-4 text-blue-600" />;
      case "practice":
        return <PenTool className="h-4 w-4 text-green-600" />;
      case "review":
        return <RefreshCw className="h-4 w-4 text-purple-600" />;
      case "assessment":
        return <Award className="h-4 w-4 text-yellow-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDifficultyColor = (difficulty?: number) => {
    if (!difficulty) return "bg-gray-100 text-gray-700";
    if (difficulty <= 1) return "bg-green-100 text-green-700";
    if (difficulty <= 2) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const getAdaptiveLevelBadge = (level?: string) => {
    const badges = {
      beginner: { text: "Beginner", color: "bg-green-100 text-green-700" },
      intermediate: {
        text: "Intermediate",
        color: "bg-blue-100 text-blue-700",
      },
      advanced: { text: "Advanced", color: "bg-purple-100 text-purple-700" },
    };
    return badges[level as keyof typeof badges] || badges.intermediate;
  };

  const calculateAdvancedStats = (plan: Plan) => {
    const totalItems = plan.items.length;
    const completedItems = plan.items.filter((item) => item.completed).length;
    const theoryItems = plan.items.filter(
      (item) => item.metadata?.sessionType === "theory"
    );
    const practiceItems = plan.items.filter(
      (item) => item.metadata?.sessionType === "practice"
    );
    const reviewItems = plan.items.filter(
      (item) => item.metadata?.sessionType === "review"
    );
    const assessmentItems = plan.items.filter(
      (item) => item.metadata?.sessionType === "assessment"
    );

    const totalMinutes = plan.items.reduce(
      (sum, item) => sum + (item.targetMins || 0),
      0
    );
    const completedMinutes = plan.items
      .filter((item) => item.completed)
      .reduce((sum, item) => sum + (item.targetMins || 0), 0);

    return {
      totalItems,
      completedItems,
      theoryItems: theoryItems.length,
      practiceItems: practiceItems.length,
      reviewItems: reviewItems.length,
      assessmentItems: assessmentItems.length,
      totalMinutes,
      completedMinutes,
      efficiency:
        totalMinutes > 0 ? (completedMinutes / totalMinutes) * 100 : 0,
    };
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Study Planner</h1>
          <p className="text-gray-600">
            Create and manage your personalized study plans
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowPlanForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Brain className="h-4 w-4" />
            <span>Generate AI-Adaptive Plan</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {plans?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Active Plans</div>
        </div>

        <div className="card text-center">
          <BookOpen className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {plans?.reduce((acc, plan) => acc + plan.items.length, 0) || 0}
          </div>
          <div className="text-sm text-gray-600">Study Items</div>
        </div>

        <div className="card text-center">
          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {plans?.reduce(
              (acc, plan) =>
                acc + plan.items.filter((item: any) => item.completed).length,
              0
            ) || 0}
          </div>
          <div className="text-sm text-gray-600">Completed Items</div>
        </div>

        <div className="card text-center">
          <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {plans?.length
              ? Math.round(
                  plans.reduce(
                    (acc, plan) => acc + calculatePlanProgress(plan),
                    0
                  ) / plans.length
                )
              : 0}
            %
          </div>
          <div className="text-sm text-gray-600">Avg Progress</div>
        </div>
      </div>

      {/* Study Plans */}
      {!plans?.length ? (
        <div className="card text-center py-12">
          <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Study Plans Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first AI-adaptive study plan to get started with
            personalized, intelligent learning paths.
          </p>
          <button
            onClick={() => setShowPlanForm(true)}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <Brain className="h-4 w-4" />
            <span>Generate Your First AI-Adaptive Plan</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const progress = calculatePlanProgress(plan);
            const planStatus = getPlanStatus(plan);

            return (
              <div key={plan.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {plan.goalSummary}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          planStatus.color === "gray"
                            ? "bg-gray-100 text-gray-700"
                            : planStatus.color === "blue"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {planStatus.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{plan.items.length} study items</span>
                      <span>{newPlan.duration} days</span>
                      <span>{newPlan.dailyHours}h daily</span>
                      {plan.metadata?.adaptiveLevel && (
                        <>
                          <span>•</span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              getAdaptiveLevelBadge(plan.metadata.adaptiveLevel)
                                .color
                            }`}
                          >
                            {
                              getAdaptiveLevelBadge(plan.metadata.adaptiveLevel)
                                .text
                            }
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedPlan(plan)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <BookOpen className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Progress
                    </span>
                    <span className="text-sm text-gray-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Study Items Preview */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    Study Items
                  </h4>
                  <div className="space-y-1">
                    {plan.items.slice(0, 3).map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-2 text-sm"
                      >
                        {item.completed ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                        <span
                          className={
                            item.completed
                              ? "line-through text-gray-500"
                              : "text-gray-700"
                          }
                        >
                          {item.title}
                        </span>
                        {item.targetMins && (
                          <span className="text-gray-500">
                            ({item.targetMins}min)
                          </span>
                        )}
                      </div>
                    ))}
                    {plan.items.length > 3 && (
                      <div className="text-sm text-gray-500">
                        +{plan.items.length - 3} more items
                      </div>
                    )}
                  </div>
                </div>

                {/* Plan Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Created: {new Date(plan.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedPlan(plan)}
                      className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Study Plan Generator Modal */}
      {showPlanForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold">Generate AI Study Plan</h3>
            </div>

            <form onSubmit={handleGeneratePlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subjects <span className="text-red-500">*</span>
                </label>
                <select
                  multiple
                  value={newPlan.subjects}
                  onChange={(e) => {
                    setNewPlan({
                      ...newPlan,
                      subjects: Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      ),
                    });
                    if (planFormErrors.subjects) {
                      setPlanFormErrors({ ...planFormErrors, subjects: "" });
                    }
                  }}
                  className={`input-field h-32 ${
                    planFormErrors.subjects ? "border-red-500" : ""
                  }`}
                  required
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
                {planFormErrors.subjects && (
                  <p className="mt-1 text-xs text-red-600">
                    {planFormErrors.subjects}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    value={newPlan.duration}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 7;
                      setNewPlan({ ...newPlan, duration: value });
                      if (planFormErrors.duration) {
                        setPlanFormErrors({ ...planFormErrors, duration: "" });
                      }
                    }}
                    className={`input-field ${
                      planFormErrors.duration ? "border-red-500" : ""
                    }`}
                    min="1"
                    max="365"
                    required
                  />
                  {planFormErrors.duration && (
                    <p className="mt-1 text-xs text-red-600">
                      {planFormErrors.duration}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Hours
                  </label>
                  <input
                    type="number"
                    value={newPlan.dailyHours}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 2;
                      setNewPlan({ ...newPlan, dailyHours: value });
                      if (planFormErrors.dailyHours) {
                        setPlanFormErrors({
                          ...planFormErrors,
                          dailyHours: "",
                        });
                      }
                    }}
                    className={`input-field ${
                      planFormErrors.dailyHours ? "border-red-500" : ""
                    }`}
                    min="0.5"
                    max="12"
                    step="0.5"
                    required
                  />
                  {planFormErrors.dailyHours && (
                    <p className="mt-1 text-xs text-red-600">
                      {planFormErrors.dailyHours}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Level
                </label>
                <select
                  value={newPlan.currentLevel}
                  onChange={(e) => {
                    setNewPlan({ ...newPlan, currentLevel: e.target.value });
                    if (planFormErrors.currentLevel) {
                      setPlanFormErrors({
                        ...planFormErrors,
                        currentLevel: "",
                      });
                    }
                  }}
                  className={`input-field ${
                    planFormErrors.currentLevel ? "border-red-500" : ""
                  }`}
                  required
                >
                  <option value="beginner">
                    Beginner (Extended theory sessions)
                  </option>
                  <option value="intermediate">
                    Intermediate (Balanced approach)
                  </option>
                  <option value="advanced">
                    Advanced (Focused practice & review)
                  </option>
                </select>
                {planFormErrors.currentLevel && (
                  <p className="mt-1 text-xs text-red-600">
                    {planFormErrors.currentLevel}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Learning Goals (Optional)
                </label>
                <textarea
                  value={newPlan.goals.join(", ")}
                  onChange={(e) =>
                    setNewPlan({
                      ...newPlan,
                      goals: e.target.value
                        .split(",")
                        .map((g) => g.trim())
                        .filter((g) => g),
                    })
                  }
                  className="input-field h-20"
                  placeholder="Enter your learning goals separated by commas..."
                />
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Brain className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-blue-900">
                      AI-Adaptive Study Planning
                    </div>
                    <div className="text-blue-700 mt-1">
                      Our advanced AI analyzes your skill level, learning
                      patterns, and goals to create adaptive study paths.
                      Features include difficulty-based topic ordering,
                      milestone assessments, and personalized session types
                      (theory, practice, review).
                    </div>
                  </div>
                </div>
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
                  disabled={
                    !newPlan.subjects.length || generatePlanMutation.isPending
                  }
                >
                  {generatePlanMutation.isPending
                    ? "Generating Adaptive Plan..."
                    : "Generate AI-Adaptive Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Details Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Study Plan Details
                </h3>
                <p className="text-gray-600">{selectedPlan.goalSummary}</p>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Plan Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {calculatePlanProgress(selectedPlan)}%
                </div>
                <div className="text-sm text-blue-700">Progress</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {selectedPlan.items.filter((item) => item.completed).length}
                </div>
                <div className="text-sm text-green-700">Completed</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  {selectedPlan.items.length}
                </div>
                <div className="text-sm text-purple-700">Total Items</div>
              </div>
              {selectedPlan.metadata?.adaptiveLevel && (
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div
                    className={`text-lg font-bold ${
                      getAdaptiveLevelBadge(
                        selectedPlan.metadata.adaptiveLevel
                      ).color.split(" ")[1]
                    }`}
                  >
                    {
                      getAdaptiveLevelBadge(selectedPlan.metadata.adaptiveLevel)
                        .text
                    }
                  </div>
                  <div className="text-sm text-yellow-700">AI Adaptive</div>
                </div>
              )}
            </div>

            {/* Advanced Stats */}
            {(() => {
              const stats = calculateAdvancedStats(selectedPlan);
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Book className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-gray-900">
                      {stats.theoryItems}
                    </div>
                    <div className="text-xs text-gray-600">Theory</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <PenTool className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-gray-900">
                      {stats.practiceItems}
                    </div>
                    <div className="text-xs text-gray-600">Practice</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <RefreshCw className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-gray-900">
                      {stats.reviewItems}
                    </div>
                    <div className="text-xs text-gray-600">Review</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Award className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-gray-900">
                      {stats.assessmentItems}
                    </div>
                    <div className="text-xs text-gray-600">Assessment</div>
                  </div>
                </div>
              );
            })()}

            {/* Study Items */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">
                Study Items
              </h4>
              <div className="space-y-3">
                {selectedPlan.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <button
                        onClick={() =>
                          handlePlanItemToggle(
                            selectedPlan.id,
                            item.id,
                            !item.completed
                          )
                        }
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          item.completed
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 hover:border-blue-500"
                        }`}
                      >
                        {item.completed && <CheckCircle className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="flex-1">
                      <div
                        className={`font-medium ${
                          item.completed
                            ? "line-through text-gray-500"
                            : "text-gray-900"
                        }`}
                      >
                        {item.title}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        {item.subjectId && subjects && (
                          <span>
                            {
                              subjects.find((s) => s.id === item.subjectId)
                                ?.name
                            }
                          </span>
                        )}
                        {item.targetMins && (
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{item.targetMins} minutes</span>
                          </span>
                        )}
                        {item.dayIndex !== undefined && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                            Day {item.dayIndex + 1}
                          </span>
                        )}
                        {item.metadata?.sessionType && (
                          <span className="flex items-center space-x-1">
                            {getSessionTypeIcon(item.metadata.sessionType)}
                            <span className="capitalize">
                              {item.metadata.sessionType}
                            </span>
                          </span>
                        )}
                        {item.metadata?.difficulty && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(
                              item.metadata.difficulty
                            )}`}
                          >
                            Level {item.metadata.difficulty}
                          </span>
                        )}
                        {item.metadata?.isMilestone && (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs flex items-center space-x-1">
                            <Award className="h-3 w-3" />
                            <span>Milestone</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStartSession(item.id, item.title)}
                        className={`p-2 rounded transition-colors ${
                          activeSession?.itemId === item.id
                            ? "text-red-600 bg-red-50 hover:bg-red-100"
                            : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        }`}
                        title={
                          activeSession?.itemId === item.id
                            ? "Stop study session"
                            : "Start study session"
                        }
                      >
                        {activeSession?.itemId === item.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedPlan(null)}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {generatePlanMutation.isPending && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <Brain className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-semibold mb-2">
              Generating Your Study Plan
            </h3>
            <p className="text-gray-600">
              AI is analyzing your skill level, learning patterns, and goals to
              create an adaptive study plan...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlanner;
