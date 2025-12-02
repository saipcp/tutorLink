import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  Calendar,
  BookOpen,
  MessageSquare,
  CheckSquare,
  BarChart3,
  Users,
  Settings,
  Brain,
  Bot,
  User,
  Star,
  CreditCard,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const studentNavigation = [
    {
      name: "Dashboard",
      href: "/student",
      icon: Home,
      current:
        location.pathname === "/student" ||
        location.pathname === "/student/dashboard",
    },
    {
      name: "Find Tutors",
      href: "/browse",
      icon: Search,
      current: location.pathname === "/browse",
    },
    {
      name: "My Sessions",
      href: "/student/sessions",
      icon: Calendar,
      current: location.pathname.startsWith("/student/sessions"),
    },
    {
      name: "Study Planner",
      href: "/student/study-planner",
      icon: BookOpen,
      current: location.pathname.startsWith("/student/study-planner"),
    },
    {
      name: "Tasks",
      href: "/tasks",
      icon: CheckSquare,
      current: location.pathname === "/tasks",
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageSquare,
      current: location.pathname === "/messages",
    },
    {
      name: "AI Tutor",
      href: "/aitutor",
      icon: Bot,
      current: location.pathname === "/aitutor",
    },
    {
      name: "Reviews",
      href: "/student/reviews",
      icon: Star,
      current: location.pathname.startsWith("/student/reviews"),
    },
  ];

  const tutorNavigation = [
    {
      name: "Dashboard",
      href: "/tutor",
      icon: Home,
      current:
        location.pathname === "/tutor" ||
        location.pathname === "/tutor/dashboard",
    },
    {
      name: "My Schedule",
      href: "/tutor/schedule",
      icon: Calendar,
      current: location.pathname.startsWith("/tutor/schedule"),
    },
    {
      name: "Students",
      href: "/tutor/students",
      icon: Users,
      current: location.pathname.startsWith("/tutor/students"),
    },
    {
      name: "Tasks",
      href: "/tasks",
      icon: CheckSquare,
      current: location.pathname === "/tasks",
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageSquare,
      current: location.pathname === "/messages",
    },
    {
      name: "AI Tutor",
      href: "/aitutor",
      icon: Bot,
      current: location.pathname === "/aitutor",
    },
    {
      name: "Reviews",
      href: "/tutor/reviews",
      icon: Star,
      current: location.pathname.startsWith("/tutor/reviews"),
    },
  ];

  const adminNavigation = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: Home,
      current:
        location.pathname === "/admin/dashboard" ||
        location.pathname === "/admin",
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
      current: location.pathname.startsWith("/admin/users"),
    },
    {
      name: "Subjects",
      href: "/admin/subjects",
      icon: BookOpen,
      current: location.pathname.startsWith("/admin/subjects"),
    },
    {
      name: "Students",
      href: "/admin/students",
      icon: Users,
      current: location.pathname.startsWith("/admin/students"),
    },
    {
      name: "Study Planner",
      href: "/admin/study-planner",
      icon: BookOpen,
      current: location.pathname.startsWith("/admin/study-planner"),
    },
    {
      name: "Tasks",
      href: "/tasks",
      icon: CheckSquare,
      current: location.pathname === "/tasks",
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageSquare,
      current: location.pathname === "/messages",
    },
    {
      name: "AI Tutor",
      href: "/aitutor",
      icon: Bot,
      current: location.pathname === "/aitutor",
    },
    {
      name: "Reviews",
      href: "/admin/reviews",
      icon: Star,
      current: location.pathname.startsWith("/admin/reviews"),
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      current: location.pathname.startsWith("/admin/analytics"),
    },
    {
      name: "AI Settings",
      href: "/admin/ai",
      icon: Brain,
      current: location.pathname.startsWith("/admin/ai"),
    },
  ];

  const getNavigation = () => {
    switch (user.role) {
      case "student":
        return studentNavigation.map((item) => {
          // If item has explicit current check, use it (don't override)
          if (item.current !== undefined) {
            return item;
          }
          // For Dashboard, only match exact paths
          if (item.href === "/student") {
            return {
              ...item,
              current: location.pathname === "/student" || location.pathname === "/student/dashboard",
            };
          }
          // For other items, use startsWith
          return {
            ...item,
            current: location.pathname.startsWith(item.href),
          };
        });
      case "tutor":
        return tutorNavigation.map((item) => {
          // If item has explicit current check, use it (don't override with startsWith)
          // This prevents Dashboard from matching /tutor/students
          if (item.current !== undefined) {
            return item;
          }
          // For Dashboard, only match exact paths (not sub-paths)
          if (item.href === "/tutor") {
            return {
              ...item,
              current: location.pathname === "/tutor" || location.pathname === "/tutor/dashboard",
            };
          }
          // For other items, use startsWith
          return {
            ...item,
            current: location.pathname.startsWith(item.href),
          };
        });
      case "admin":
        return adminNavigation.map((item) => {
          // If item has explicit current check, use it (don't override)
          if (item.current !== undefined) {
            return item;
          }
          // For Dashboard, only match exact paths
          if (item.href === "/admin/dashboard" || item.href === "/admin") {
            return {
              ...item,
              current: location.pathname === "/admin/dashboard" || location.pathname === "/admin",
            };
          }
          // For other items, use startsWith
          return {
            ...item,
            current: location.pathname.startsWith(item.href),
          };
        });
      default:
        return [];
    }
  };

  const navigation = getNavigation();

  const getRolePrefix = () => {
    switch (user.role) {
      case "student":
        return "/student";
      case "tutor":
        return "/tutor";
      case "admin":
        return "/admin";
      default:
        return "/student";
    }
  };

  const commonNavigation = [
    {
      name: "Profile",
      href: `${getRolePrefix()}/profile`,
      icon: User,
      current: location.pathname.startsWith(`${getRolePrefix()}/profile`),
    },
    {
      name: "Payment",
      href: `${getRolePrefix()}/payment`,
      icon: CreditCard,
      current: location.pathname.startsWith(`${getRolePrefix()}/payment`),
    },
    {
      name: "Settings",
      href: `${getRolePrefix()}/settings`,
      icon: Settings,
      current: location.pathname.startsWith(`${getRolePrefix()}/settings`),
    },
  ];

  return (
    <div className="w-64 h-full bg-white border-r border-secondary-200">
      <div className="flex flex-col h-full pb-4 overflow-y-auto">
        <nav className="mt-2 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  item.current
                    ? "bg-primary-50 text-primary-700 border-r-2 border-primary-700"
                    : "text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900"
                }`}
              >
                <Icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    item.current
                      ? "text-primary-700"
                      : "text-secondary-400 group-hover:text-secondary-500"
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Common navigation */}
        <div className="flex-shrink-0 border-t border-secondary-200 pt-4">
          <nav className="px-2 space-y-1">
            {commonNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    item.current
                      ? "bg-primary-50 text-primary-700 border-r-2 border-primary-700"
                      : "text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900"
                  }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      item.current
                        ? "text-primary-700"
                        : "text-secondary-400 group-hover:text-secondary-500"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
