import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { subjectsApi } from "../services/api";
import type { Subject } from "../types";

const AdminSubjectsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Admin data queries
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.getAllSubjects(),
  });

  // Mutations
  const createSubjectMutation = useMutation({
    mutationFn: (subjectData: { name: string; topics: string[] }) =>
      subjectsApi.createSubject(subjectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });

  // State for forms and search
  const [searchTerm, setSearchTerm] = useState("");
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [subjectFormErrors, setSubjectFormErrors] = useState<
    Record<string, string>
  >({});
  const [newSubject, setNewSubject] = useState({
    name: "",
    topics: [] as string[],
  });
  // raw input to allow typing commas and spaces naturally
  const [newSubjectInput, setNewSubjectInput] = useState("");

  // Filter subjects by search term (partial matching)
  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    if (!searchTerm.trim()) return subjects;

    const term = searchTerm.toLowerCase();
    return subjects.filter((subject) => {
      const name = subject.name?.toLowerCase() || "";
      const topics = subject.topics
        ?.map((t) => t.name?.toLowerCase() || "")
        .join(" ") || "";
      return name.includes(term) || topics.includes(term);
    });
  }, [subjects, searchTerm]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subject Catalog</h1>
          <p className="text-gray-600">Manage subjects and topics</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setNewSubjectInput(newSubject.topics.join(", "));
              setShowSubjectForm(true);
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <BookOpen className="h-4 w-4" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* Subjects Section */}
      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Subject Catalog
            </h3>
            <BookOpen className="h-5 w-5 text-gray-400" />
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search subjects or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredSubjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "No subjects found matching your search" : "No subjects found"}
              </div>
            ) : (
              filteredSubjects.map((subject) => (
              <div
                key={subject.id}
                className="p-3 rounded-lg border border-gray-200"
              >
                <div className="font-medium text-gray-900 mb-1">
                  {subject.name}
                </div>
                <div className="text-sm text-gray-600">
                  {subject.topics.length} topics
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {subject.topics.map((topic) => (
                    <span
                      key={topic.id}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                    >
                      {topic.name}
                    </span>
                  ))}
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Subject Modal */}
      {showSubjectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Subject</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const errors: Record<string, string> = {};

                // parse topics from raw input
                const parts = newSubjectInput
                  .split(/[;,\n]+/)
                  .map((t) => t.trim())
                  .filter(Boolean);

                if (!newSubject.name.trim()) {
                  errors.name = "Subject name is required";
                } else if (newSubject.name.trim().length < 2) {
                  errors.name = "Subject name must be at least 2 characters";
                } else if (newSubject.name.trim().length > 100) {
                  errors.name = "Subject name must be less than 100 characters";
                }

                setSubjectFormErrors(errors);
                if (Object.keys(errors).length > 0) {
                  return;
                }
                await createSubjectMutation.mutateAsync({
                  name: newSubject.name,
                  topics: parts,
                });
                setNewSubject({ name: "", topics: [] });
                setNewSubjectInput("");
                setShowSubjectForm(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => {
                    setNewSubject({ ...newSubject, name: e.target.value });
                    if (subjectFormErrors.name) {
                      setSubjectFormErrors({ ...subjectFormErrors, name: "" });
                    }
                  }}
                  className={`input-field ${
                    subjectFormErrors.name ? "border-red-500" : ""
                  }`}
                  placeholder="Enter subject name"
                  required
                />
                {subjectFormErrors.name && (
                  <p className="mt-1 text-xs text-red-600">
                    {subjectFormErrors.name}
                  </p>
                )}
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
                    setNewSubjectInput("");
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createSubjectMutation.isPending}
                >
                  {createSubjectMutation.isPending
                    ? "Adding..."
                    : "Add Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubjectsPage;
