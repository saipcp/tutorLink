import React, { useState } from "react";
import { Brain } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../services/api";

const AdminAIPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const queryClient = useQueryClient();

  const { data: aiSettings, isLoading } = useQuery({
    queryKey: ["admin_ai_settings"],
    queryFn: () => adminApi.getSetting("ai"),
  });

  const [form, setForm] = useState<any>(
    aiSettings?.value || {
      aitutorEnabled: false,
      planGeneratorEnabled: false,
      matchingEnabled: false,
      model: "gpt-4",
    }
  );

  // keep form in sync when data arrives
  React.useEffect(() => {
    if (aiSettings && aiSettings.value) setForm(aiSettings.value);
  }, [aiSettings]);

  const saveMutation = useMutation({
    mutationFn: (payload: any) => adminApi.updateSetting("ai", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_ai_settings"] });
      alert("AI settings saved");
    },
    onError: (err) => {
      console.error("Failed saving AI settings", err);
      alert("Failed to save AI settings");
    },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Settings</h1>
          <p className="text-gray-600">Configure AI settings and features</p>
        </div>
      </div>

      {/* AI Settings Section */}
      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">AI Settings</h3>
            <Brain className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(form);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">AiTutor</h4>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={!!form?.aitutorEnabled}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            aitutorEnabled: e.target.checked,
                          })
                        }
                      />
                      <span className="text-sm text-gray-600">Enabled</span>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Configure the AiTutor assistant behavior and availability.
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      Study Plan Generator
                    </h4>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={!!form?.planGeneratorEnabled}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            planGeneratorEnabled: e.target.checked,
                          })
                        }
                      />
                      <span className="text-sm text-gray-600">Enabled</span>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Enable/disable AI-generated study plans and adjust algorithm
                    parameters below.
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-gray-200 md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      Smart Matching
                    </h4>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={!!form?.matchingEnabled}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            matchingEnabled: e.target.checked,
                          })
                        }
                      />
                      <span className="text-sm text-gray-600">Enabled</span>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Toggle AI-driven tutor-student matching improvements.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <label className="text-sm text-gray-700">Model</label>
                    <select
                      value={form?.model || "gpt-4"}
                      onChange={(e) =>
                        setForm({ ...form, model: e.target.value })
                      }
                      className="input-field md:col-span-2"
                    >
                      <option value="gpt-4">gpt-4</option>
                      <option value="gpt-4o">gpt-4o</option>
                      <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? "Saving..." : "Save AI Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAIPage;
