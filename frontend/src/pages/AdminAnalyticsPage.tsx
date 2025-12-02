import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Users,
  BookOpen,
  Star,
  TrendingUp,
  DollarSign,
  Calendar,
  Award,
  Activity,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { adminApi, subjectsApi, sessionsApi, reviewsApi } from "../services/api";
import type { Session } from "../types";

// Simple Bar Chart Component
const BarChart: React.FC<{
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
}> = ({ data, maxValue }) => {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);
  const hasData = data.some((d) => d.value > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No data available
      </div>
    );
  }

  return (
    <div className="flex items-end justify-between gap-2 h-48">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div className="relative w-full h-40 bg-gray-100 rounded-t">
            {item.value > 0 && (
              <div
                className={`absolute bottom-0 w-full rounded-t transition-all duration-500 ${
                  item.color || "bg-blue-500"
                }`}
                style={{ height: `${Math.max((item.value / max) * 100, 2)}%` }}
              />
            )}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700 whitespace-nowrap">
              {item.value}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-600 text-center">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
};

// Simple Pie Chart Component
const PieChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  size?: number;
}> = ({ data, size = 200 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400 text-sm">No data</span>
        </div>
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600">{item.label}</span>
              <span className="font-medium text-gray-900">0 (0%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  let currentAngle = -90;

  const paths = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const x1 = 100 + 90 * Math.cos((startAngle * Math.PI) / 180);
    const y1 = 100 + 90 * Math.sin((startAngle * Math.PI) / 180);
    const x2 = 100 + 90 * Math.cos((endAngle * Math.PI) / 180);
    const y2 = 100 + 90 * Math.sin((endAngle * Math.PI) / 180);
    const largeArc = angle > 180 ? 1 : 0;

    currentAngle += angle;

    return (
      <path
        key={index}
        d={`M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={item.color}
        stroke="white"
        strokeWidth="2"
      />
    );
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 200 200">
        {paths}
      </svg>
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-600">{item.label}</span>
            <span className="font-medium text-gray-900">
              {item.value} ({((item.value / total) * 100).toFixed(2)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Line Chart Component
const LineChart: React.FC<{
  data: { label: string; value: number }[];
  color?: string;
}> = ({ data, color = "blue" }) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const hasData = data.some((d) => d.value > 0);
  
  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No data available
      </div>
    );
  }

  const points = data
    .map(
      (item, index) =>
        `${(index / Math.max(data.length - 1, 1)) * 100},${
          100 - (item.value / maxValue) * 100
        }`
    )
    .join(" ");

  const colorClasses = {
    blue: "stroke-blue-500",
    green: "stroke-green-500",
    purple: "stroke-purple-500",
    orange: "stroke-orange-500",
  };

  return (
    <div className="h-48">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polyline
          points={points}
          fill="none"
          strokeWidth="2"
          className={colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}
        />
        {data.map((item, index) => {
          const x = (index / Math.max(data.length - 1, 1)) * 100;
          const y = 100 - (item.value / maxValue) * 100;
          return (
            <g key={index}>
              <circle cx={x} cy={y} r="2" fill="currentColor" />
              {item.value > 0 && (
                <text
                  x={x}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="3"
                  fill="currentColor"
                  className="text-gray-600"
                >
                  {item.value}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between text-xs text-gray-600 mt-2">
        {data.map((item, index) => (
          <span key={index}>{item.label}</span>
        ))}
      </div>
    </div>
  );
};

const AdminAnalyticsPage: React.FC = () => {
  const { user } = useAuth();

  // Fetch admin stats
  const { data: adminStats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => adminApi.getAdminStats(),
  });

  // Fetch all users
  const { data: allUsers } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => adminApi.getAllUsers(),
  });

  // Fetch all sessions
  const { data: allSessions } = useQuery({
    queryKey: ["allSessions"],
    queryFn: () => adminApi.getAllSessions(),
  });

  // Fetch subjects
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.getAllSubjects(),
  });

  // Fetch reviews
  const { data: reviews } = useQuery({
    queryKey: ["allReviews"],
    queryFn: async () => {
      if (!allUsers) return [];
      const tutorIds = allUsers
        .filter((u) => u.role === "tutor")
        .map((u) => u.id);
      const allReviews = await Promise.all(
        tutorIds.map((id) =>
          reviewsApi.getReviewsByTutorId(id).catch(() => [])
        )
      );
      return allReviews.flat();
    },
    enabled: !!allUsers,
  });

  // Calculate additional metrics
  const metrics = useMemo(() => {
    const stats = adminStats || {
      totalUsers: 0,
      students: 0,
      tutors: 0,
      admins: 0,
      totalSessions: 0,
      completedSessions: 0,
      totalSubjects: 0,
      totalReviews: 0,
      averageRating: 0,
    };

    const sessions = (allSessions as Session[]) || [];
    const completedSessions = sessions.filter(
      (s) => s.status === "completed"
    ).length;
    const bookedSessions = sessions.filter(
      (s) => s.status === "booked"
    ).length;
    const cancelledSessions = sessions.filter(
      (s) => s.status === "canceled"
    ).length;

    // Calculate revenue from completed sessions
    const totalRevenue = sessions
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => {
        const price = typeof s.price === "number" ? s.price : 0;
        return sum + price;
      }, 0);

    // Session status distribution
    const sessionStatusData = [
      { label: "Completed", value: completedSessions, color: "bg-green-500" },
      { label: "Booked", value: bookedSessions, color: "bg-blue-500" },
      { label: "Cancelled", value: cancelledSessions, color: "bg-red-500" },
    ];

    // User role distribution
    const userRoleData = [
      {
        label: "Students",
        value: stats.students,
        color: "#3b82f6",
      },
      {
        label: "Tutors",
        value: stats.tutors,
        color: "#10b981",
      },
      {
        label: "Admins",
        value: stats.admins,
        color: "#8b5cf6",
      },
    ];

    // Popular subjects (from sessions)
    const subjectCounts: Record<string, number> = {};
    sessions.forEach((session) => {
      if (session.subjectId) {
        const subject = subjects?.find((s) => s.id === session.subjectId);
        if (subject) {
          subjectCounts[subject.name] = (subjectCounts[subject.name] || 0) + 1;
        }
      }
    });

    const popularSubjects = Object.entries(subjectCounts)
      .map(([name, count]) => ({ label: name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Monthly session trends (last 6 months)
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const monthName = date.toLocaleString("default", { month: "short" });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthSessions = sessions.filter((s) => {
        const sessionDate = new Date(s.startAt || s.createdAt);
        return sessionDate >= monthStart && sessionDate <= monthEnd;
      }).length;

      return { label: monthName, value: monthSessions };
    });

    // Rating distribution
    const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
      label: `${rating}★`,
      value:
        reviews?.filter((r) => Math.round(r.rating) === rating).length || 0,
      color: rating >= 4 ? "bg-green-500" : rating >= 3 ? "bg-yellow-500" : "bg-red-500",
    }));

    const averageSessionPrice =
      completedSessions > 0 && totalRevenue > 0
        ? (totalRevenue / completedSessions).toFixed(2)
        : "0.00";

    return {
      ...stats,
      completedSessions,
      bookedSessions,
      cancelledSessions,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      sessionStatusData,
      userRoleData,
      popularSubjects,
      monthlyData,
      ratingDistribution,
      completionRate:
        stats.totalSessions > 0
          ? ((completedSessions / stats.totalSessions) * 100).toFixed(2)
          : "0.00",
      averageSessionPrice,
    };
  }, [adminStats, allSessions, subjects, reviews]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Platform Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into your platform performance
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-blue-600 truncate">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900 mt-1 truncate break-words">
                {metrics.totalSessions}
              </p>
              <p className="text-xs text-blue-600 mt-1 truncate">
                {metrics.completedSessions} completed
              </p>
            </div>
            <BarChart3 className="h-12 w-12 text-blue-500 opacity-50 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-green-600 truncate">Active Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-1 truncate break-words">
                {metrics.totalUsers}
              </p>
              <p className="text-xs text-green-600 mt-1 truncate">
                {metrics.students} students, {metrics.tutors} tutors
              </p>
            </div>
            <Users className="h-12 w-12 text-green-500 opacity-50 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-purple-600 truncate">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-1 truncate break-words">
                ${metrics.totalRevenue.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-purple-600 mt-1 truncate">
                Avg: ${metrics.averageSessionPrice}/session
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-purple-500 opacity-50 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-yellow-600 truncate">Avg Rating</p>
              <p className="text-3xl font-bold text-gray-900 mt-1 truncate break-words">
                {metrics.averageRating > 0
                  ? metrics.averageRating.toFixed(2)
                  : "0.00"}
              </p>
              <p className="text-xs text-yellow-600 mt-1 truncate">
                {metrics.totalReviews} total reviews
              </p>
            </div>
            <Star className="h-12 w-12 text-yellow-500 opacity-50 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution Pie Chart */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              User Distribution
            </h3>
          </div>
          <PieChart data={metrics.userRoleData} />
        </div>

        {/* Session Status Chart */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Session Status Distribution
            </h3>
          </div>
          <BarChart data={metrics.sessionStatusData} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Session Trends */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Monthly Session Trends
            </h3>
          </div>
          <LineChart data={metrics.monthlyData} color="blue" />
        </div>

        {/* Rating Distribution */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Rating Distribution
            </h3>
          </div>
          <BarChart data={metrics.ratingDistribution} />
        </div>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Popular Subjects */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Popular Subjects
            </h3>
          </div>
          <div className="space-y-3">
            {metrics.popularSubjects.length > 0 ? (
              metrics.popularSubjects.map((subject, index) => (
                <div key={index} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-600 flex-shrink-0 min-w-[100px]">
                    {subject.label}
                  </span>
                  <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{
                          width: `${
                            (subject.value /
                              Math.max(...metrics.popularSubjects.map((s) => s.value), 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right flex-shrink-0">
                      {subject.value}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No session data available</p>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Performance Metrics
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <span className="text-sm font-medium text-gray-900">
                  {metrics.completionRate}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-green-500 rounded-full"
                  style={{ width: `${metrics.completionRate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Subjects Available</span>
                <span className="text-sm font-medium text-gray-900">
                  {metrics.totalSubjects}
                </span>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Total Topics</span>
                <span className="text-sm font-medium text-gray-900">
                  {subjects?.reduce((acc, s) => acc + (s.topics?.length || 0), 0) || 0}
                </span>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Avg Sessions/User</span>
                <span className="text-sm font-medium text-gray-900">
                  {metrics.totalUsers > 0
                    ? (metrics.totalSessions / metrics.totalUsers).toFixed(2)
                    : "0.00"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Quick Statistics
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Booked Sessions</span>
              <span className="text-sm font-bold text-blue-600">
                {metrics.bookedSessions}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Cancelled Sessions</span>
              <span className="text-sm font-bold text-red-600">
                {metrics.cancelledSessions}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Students</span>
              <span className="text-sm font-bold text-green-600">
                {metrics.students}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Tutors</span>
              <span className="text-sm font-bold text-purple-600">
                {metrics.tutors}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Admins</span>
              <span className="text-sm font-bold text-gray-600">
                {metrics.admins}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
