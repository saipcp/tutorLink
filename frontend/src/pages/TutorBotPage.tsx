import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  Lightbulb,
  Target,
  Clock,
  Loader2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { aiApi } from "../services/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const AiTutorPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello! I'm your AI Tutor at TutorLink! 👋

I'm here to help you succeed in your learning journey. As your AI tutor, I can assist you with:

• 📚 **Academic Tutoring**: Get explanations, solve problems, and understand concepts across all subjects
• 📅 **Study Planning**: Create personalized study schedules and organize your learning
• 💡 **Learning Strategies**: Discover effective study techniques and exam preparation methods
• 🎯 **Goal Setting**: Set and achieve your academic objectives
• ✏️ **Homework Help**: Get step-by-step guidance on assignments and practice problems
• 📖 **Subject Support**: Deep dive into Mathematics, Science, English, History, and more
• 🚀 **Platform Guidance**: Learn how to make the most of TutorLink's features

I work alongside TutorLink's human tutors to provide you with comprehensive support. Whether you need quick help or in-depth explanations, I'm here for you!

What would you like to learn or work on today?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTopicsDropdown, setShowTopicsDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationHistoryRef = useRef<ChatMessage[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const popularTopics = [
    "How do I create an effective study schedule?",
    "Explain calculus concepts",
    "Best note-taking methods",
    "How to prepare for exams?",
    "Time management tips for students",
    "Memory techniques for studying",
    "How to stay motivated while studying?",
    "Practice problems for algebra",
    "Study strategies for different learning styles",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTopicsDropdown(false);
      }
    };

    if (showTopicsDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTopicsDropdown]);

  // Update conversation history when messages change
  useEffect(() => {
    conversationHistoryRef.current = messages.filter(
      (msg) => msg.id !== "welcome"
    );
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || !user) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setError(null);
    setIsLoading(true);

    try {
      // Prepare conversation history for context
      const history = conversationHistoryRef.current.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await aiApi.chatWithAiTutor(
        userMessage.content,
        history
      );

      const aiMessage: ChatMessage = {
        id: response.messageId,
        role: "assistant",
        content: response.response,
        timestamp: response.timestamp,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error("Error chatting with AiTutor:", err);
      setError(
        err?.message ||
          "Sorry, I'm having trouble responding right now. Please try again."
      );

      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: "assistant",
        content:
          "I apologize, but I'm experiencing technical difficulties. Please try again in a moment, or consider booking a session with one of our human tutors.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
    setShowTopicsDropdown(false);
  };

  const handleTopicSelect = (topic: string) => {
    setInputMessage(topic);
    setShowTopicsDropdown(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Tutor</h1>
            <p className="text-gray-600">Your AI-powered tutor at TutorLink</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Online</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() =>
            handleQuickAction("Help me create a study schedule")
          }
          className="card text-left p-4 hover:bg-blue-50 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Study Planning</h3>
          </div>
          <p className="text-sm text-gray-600">
            Get help creating effective study schedules
          </p>
        </button>

        <button
          onClick={() => handleQuickAction("Explain a math concept")}
          className="card text-left p-4 hover:bg-green-50 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <BookOpen className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Subject Help</h3>
          </div>
          <p className="text-sm text-gray-600">
            Get explanations and examples for any subject
          </p>
        </button>

        <button
          onClick={() => handleQuickAction("Give me study tips")}
          className="card text-left p-4 hover:bg-purple-50 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Lightbulb className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Study Tips</h3>
          </div>
          <p className="text-sm text-gray-600">
            Learn effective study techniques and strategies
          </p>
        </button>

        <button
          onClick={() => handleQuickAction("Help me set learning goals")}
          className="card text-left p-4 hover:bg-orange-50 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
              <Target className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Goal Setting</h3>
          </div>
          <p className="text-sm text-gray-600">
            Set and achieve your learning objectives
          </p>
        </button>
      </div>

      {/* Chat Interface */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
          <Bot className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-gray-900">Chat with AI Tutor</span>
        </div>

        {/* Messages */}
        <div className="h-[500px] overflow-y-auto mb-4 space-y-4 pr-2">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {message.role === "assistant" ? (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex flex-col min-w-0">
                    <div
                      className={`px-4 py-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div 
                        className={`text-sm leading-relaxed ${
                          message.role === "user" ? "text-white" : "text-gray-900"
                        }`}
                        style={{ 
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          overflowWrap: "break-word"
                        }}
                      >
                        {message.content.split('\n').map((line, index, array) => {
                          // Handle markdown-style bold (**text**)
                          const parts = line.split(/(\*\*.*?\*\*)/g);
                          return (
                            <React.Fragment key={index}>
                              {parts.map((part, partIndex) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                  const boldText = part.slice(2, -2);
                                  return (
                                    <strong key={partIndex} className={message.role === "user" ? "text-white font-semibold" : "text-gray-900 font-semibold"}>
                                      {boldText}
                                    </strong>
                                  );
                                }
                                return <span key={partIndex}>{part}</span>;
                              })}
                              {index < array.length - 1 && <br />}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                    <span
                      className={`text-xs text-gray-500 mt-1 ${
                        message.role === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-gray-100 px-4 py-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                    <span className="text-sm text-gray-600">AI Tutor is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2 relative">
          <div className="flex-1 relative" ref={dropdownRef}>
            <div className="relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask AI Tutor anything about your studies..."
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowTopicsDropdown(!showTopicsDropdown)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Popular topics"
              >
                <ChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    showTopicsDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {/* Popular Topics Dropdown */}
            {showTopicsDropdown && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                <div className="p-2">
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                    <Sparkles className="h-3 w-3" />
                    Popular Topics
                  </div>
                  {popularTopics.map((topic, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleTopicSelect(topic)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Send</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiTutorPage;

