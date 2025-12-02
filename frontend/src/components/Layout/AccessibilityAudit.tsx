import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  Scan,
  Accessibility,
  Monitor,
  Keyboard,
  Volume2,
  MousePointer,
} from "lucide-react";
import { aiApi } from "../../services/api";

interface AccessibilityIssue {
  type: "error" | "warning" | "info";
  title: string;
  description: string;
  suggestion: string;
}

interface AccessibilityAuditResult {
  score: number;
  issues: AccessibilityIssue[];
  suggestions: string[];
  grade: string;
}

const AccessibilityAudit: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<AccessibilityAuditResult | null>(null);
  const [auditContent, setAuditContent] = useState("");

  const runAccessibilityAudit = async () => {
    if (!auditContent.trim()) {
      setResults({
        score: 0,
        issues: [
          {
            type: "error",
            title: "No Content to Audit",
            description:
              "Please enter some content to audit for accessibility issues.",
            suggestion:
              "Add text content, HTML, or describe what you want to audit.",
          },
        ],
        suggestions: ["Enter content to analyze"],
        grade: "F",
      });
      return;
    }

    setIsRunning(true);

    try {
      // Simulate audit delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Use the existing AI API for accessibility audit
      const auditResult = await aiApi.accessibilityAudit(auditContent);

      const grade =
        auditResult.score >= 90
          ? "A"
          : auditResult.score >= 80
          ? "B"
          : auditResult.score >= 70
          ? "C"
          : auditResult.score >= 60
          ? "D"
          : "F";

      setResults({
        ...auditResult,
        grade,
      });
    } catch (error) {
      console.error("Accessibility audit failed:", error);
      setResults({
        score: 0,
        issues: [
          {
            type: "error",
            title: "Audit Failed",
            description: "Unable to complete the accessibility audit.",
            suggestion: "Please try again or check your content format.",
          },
        ],
        suggestions: ["Retry the audit"],
        grade: "F",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-green-100 text-green-800";
      case "B":
        return "bg-blue-100 text-blue-800";
      case "C":
        return "bg-yellow-100 text-yellow-800";
      case "D":
        return "bg-orange-100 text-orange-800";
      case "F":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Accessibility className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Accessibility Audit
        </h2>
      </div>

      <div className="card">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Content to Audit
          </h3>
          <textarea
            value={auditContent}
            onChange={(e) => setAuditContent(e.target.value)}
            placeholder="Enter HTML, text content, or describe what you want to audit for accessibility issues..."
            className="input-field h-40 resize-none"
            disabled={isRunning}
          />
          <p className="text-sm text-gray-600 mt-2">
            Enter website content, HTML code, or describe your content to check
            for accessibility compliance.
          </p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={runAccessibilityAudit}
            disabled={isRunning}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <Scan className="h-4 w-4 animate-spin" />
                <span>Running Audit...</span>
              </>
            ) : (
              <>
                <Scan className="h-4 w-4" />
                <span>Run Accessibility Audit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {results && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="card">
            <div className="text-center">
              <div className="mb-4">
                <div
                  className={`text-6xl font-bold ${getScoreColor(
                    results.score
                  )}`}
                >
                  {results.score}
                </div>
                <div className="text-lg text-gray-600">Accessibility Score</div>
              </div>

              <div className="flex items-center justify-center space-x-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(
                    results.grade
                  )}`}
                >
                  Grade {results.grade}
                </span>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Monitor className="h-4 w-4" />
                  <span>WCAG Compliance Check</span>
                </div>
              </div>
            </div>
          </div>

          {/* Issues Found */}
          {results.issues.length > 0 && (
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  Issues Found ({results.issues.length})
                </h3>
              </div>

              <div className="space-y-4">
                {results.issues.map((issue, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start space-x-3">
                      {getIssueIcon(issue.type)}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {issue.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {issue.description}
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                          <div className="flex items-start space-x-2">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-blue-900 text-sm">
                                Suggestion
                              </div>
                              <div className="text-blue-700 text-sm mt-1">
                                {issue.suggestion}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* General Suggestions */}
          {results.suggestions.length > 0 && (
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  Recommendations
                </h3>
              </div>

              <div className="space-y-3">
                {results.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accessibility Guidelines */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Info className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Accessibility Guidelines
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Keyboard className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Keyboard Navigation
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Ensure all interactive elements are accessible via
                      keyboard.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Eye className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900">Visual Design</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Maintain proper contrast ratios and visual hierarchy.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Volume2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Screen Readers
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Provide alt text for images and proper semantic markup.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MousePointer className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Motor Accessibility
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Ensure clickable areas are large enough and well-spaced.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityAudit;
