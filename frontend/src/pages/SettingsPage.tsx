import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Bell,
  Shield,
  Save,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usersApi, userSettingsApi, tutorsApi } from "../services/api";

const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as "profile" | "notifications" | "privacy" | null;
  
  const [activeTab, setActiveTab] = useState<
    "profile" | "notifications" | "privacy"
  >(tabParam || "profile");

  // Update activeTab when URL parameter changes
  useEffect(() => {
    if (tabParam && ["profile", "notifications", "privacy"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Update URL when tab changes
  const handleTabChange = (tab: "profile" | "notifications" | "privacy") => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Fetch user settings (notifications & privacy)
  const { data: userSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => userSettingsApi.getUserSettings(),
  });

  // Fetch tutor profile for bio
  const { data: tutorProfile } = useQuery({
    queryKey: ["tutorProfile", user?.id],
    queryFn: () => tutorsApi.getTutorByUserId(user!.id),
    enabled: user?.role === "tutor" && !!user?.id,
  });

  const bio = tutorProfile?.bio || "";

  const [settings, setSettings] = useState({
    profile: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      bio: bio,
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      sessionReminders: true,
      newMessages: true,
      weeklyReports: false,
    },
    privacy: {
      profileVisibility: "public" as "public" | "students" | "private",
      showOnlineStatus: true,
      allowMessages: true,
      dataSharing: false,
    },
  });

  // Update settings when data loads
  useEffect(() => {
    if (user) {
      setSettings((prev) => ({
        ...prev,
        profile: {
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phone: user.phone || "",
          bio: bio,
        },
      }));
    }
  }, [user, bio]);

  useEffect(() => {
    if (userSettings) {
      setSettings((prev) => ({
        ...prev,
        notifications: {
          emailNotifications: userSettings.emailNotifications ?? true,
          pushNotifications: userSettings.pushNotifications ?? true,
          sessionReminders: userSettings.sessionReminders ?? true,
          newMessages: userSettings.newMessages ?? true,
          weeklyReports: userSettings.weeklyReports ?? false,
        },
        privacy: {
          profileVisibility: userSettings.profileVisibility || "public",
          showOnlineStatus: userSettings.showOnlineStatus ?? true,
          allowMessages: userSettings.allowMessages ?? true,
          dataSharing: userSettings.dataSharing ?? false,
        },
      }));
    }
  }, [userSettings]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      bio?: string;
    }) => {
      if (!user) throw new Error("No user logged in");
      
      // Update user profile
      const userUpdates: any = {};
      if (profileData.firstName !== undefined) userUpdates.firstName = profileData.firstName;
      if (profileData.lastName !== undefined) userUpdates.lastName = profileData.lastName;
      if (profileData.email !== undefined) userUpdates.email = profileData.email;
      if (profileData.phone !== undefined) userUpdates.phone = profileData.phone;

      const promises: Promise<any>[] = [];
      
      // Update user profile if there are user updates
      if (Object.keys(userUpdates).length > 0) {
        promises.push(updateProfile(userUpdates));
      }
      
      // Update bio for tutors
      if (profileData.bio !== undefined && user.role === "tutor") {
        promises.push(tutorsApi.updateTutorProfile({ bio: profileData.bio }));
      }

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
      queryClient.invalidateQueries({ queryKey: ["tutorProfile"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      alert("Profile settings saved successfully!");
    },
    onError: (error: any) => {
      alert(error.message || "Failed to save profile settings");
    },
  });

  // User settings update mutation
  const updateUserSettingsMutation = useMutation({
    mutationFn: (settingsData: {
      emailNotifications?: boolean;
      pushNotifications?: boolean;
      sessionReminders?: boolean;
      newMessages?: boolean;
      weeklyReports?: boolean;
      profileVisibility?: "public" | "students" | "private";
      showOnlineStatus?: boolean;
      allowMessages?: boolean;
      dataSharing?: boolean;
    }) => userSettingsApi.updateUserSettings(settingsData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
      alert("Settings saved successfully!");
    },
    onError: (error: any) => {
      alert(error.message || "Failed to save settings");
    },
  });

  const handleSave = async () => {
    if (activeTab === "profile") {
      await updateProfileMutation.mutateAsync(settings.profile);
    } else if (activeTab === "notifications") {
      await updateUserSettingsMutation.mutateAsync(settings.notifications);
    } else if (activeTab === "privacy") {
      await updateUserSettingsMutation.mutateAsync(settings.privacy);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
  ];

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">
            Manage your account preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={
            updateProfileMutation.isPending ||
            updateUserSettingsMutation.isPending ||
            isLoadingSettings
          }
          className="btn-primary flex items-center space-x-2 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>
            {updateProfileMutation.isPending || updateUserSettingsMutation.isPending
              ? "Saving..."
              : "Save Changes"}
          </span>
        </button>
      </div>

      {/* Settings Tabs */}
      <div className="card">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile Settings */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {isLoadingSettings && !user ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading profile...</p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Profile Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={settings.profile.firstName}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          profile: {
                            ...settings.profile,
                            firstName: e.target.value,
                          },
                        })
                      }
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={settings.profile.lastName}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          profile: {
                            ...settings.profile,
                            lastName: e.target.value,
                          },
                        })
                      }
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          profile: { ...settings.profile, email: e.target.value },
                        })
                      }
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={settings.profile.phone}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          profile: { ...settings.profile, phone: e.target.value },
                        })
                      }
                      className="input-field"
                    />
                  </div>
                </div>
                {user?.role === "tutor" && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      value={settings.profile.bio}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          profile: { ...settings.profile, bio: e.target.value },
                        })
                      }
                      rows={4}
                      className="input-field"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            {isLoadingSettings ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading notification settings...</p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Notification Preferences
                </h3>
                <div className="space-y-4">
                {[
                  {
                    key: "emailNotifications",
                    label: "Email Notifications",
                    desc: "Receive updates via email",
                  },
                  {
                    key: "pushNotifications",
                    label: "Push Notifications",
                    desc: "Get notified in your browser",
                  },
                  {
                    key: "sessionReminders",
                    label: "Session Reminders",
                    desc: "Reminders before tutoring sessions",
                  },
                  {
                    key: "newMessages",
                    label: "New Messages",
                    desc: "Notifications for new messages",
                  },
                  {
                    key: "weeklyReports",
                    label: "Weekly Reports",
                    desc: "Weekly progress summaries",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {item.label}
                      </div>
                      <div className="text-sm text-gray-600">{item.desc}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          settings.notifications[
                            item.key as keyof typeof settings.notifications
                          ]
                        }
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            notifications: {
                              ...settings.notifications,
                              [item.key]: e.target.checked,
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Privacy Settings */}
        {activeTab === "privacy" && (
          <div className="space-y-6">
            {isLoadingSettings ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading privacy settings...</p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Privacy & Security
                </h3>
                <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Visibility
                  </label>
                    <select
                      value={settings.privacy.profileVisibility}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          privacy: {
                            ...settings.privacy,
                            profileVisibility: e.target.value as "public" | "students" | "private",
                          },
                        })
                      }
                      className="input-field"
                    >
                      <option value="public">Public</option>
                      <option value="students">Students Only</option>
                      <option value="private">Private</option>
                    </select>
                </div>
                {[
                  {
                    key: "showOnlineStatus",
                    label: "Show Online Status",
                    desc: "Let others see when you're online",
                  },
                  {
                    key: "allowMessages",
                    label: "Allow Direct Messages",
                    desc: "Receive messages from other users",
                  },
                  {
                    key: "dataSharing",
                    label: "Data Sharing",
                    desc: "Share anonymous usage data to improve the platform",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {item.label}
                      </div>
                      <div className="text-sm text-gray-600">{item.desc}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          settings.privacy[
                            item.key as keyof typeof settings.privacy
                          ] as boolean
                        }
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            privacy: {
                              ...settings.privacy,
                              [item.key]: e.target.checked,
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default SettingsPage;
