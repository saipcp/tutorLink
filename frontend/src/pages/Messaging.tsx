import React, { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  Send,
  Search,
  MessageCircle,
  Plus,
  Check,
  CheckCheck,
  X,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { messagingApi } from "../services/api";
import type { User as UserType, Message } from "../types";

interface ConversationWithDetails {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt?: string;
  lastMessage?: Message | null;
  members: UserType[];
  unreadCount?: number;
}

const Messaging: React.FC = () => {
  const { user } = useAuth();
  const { socket, onlineUsers, typingStatus, joinConversation, leaveConversation, sendTyping } = useSocket();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    searchParams.get("conversation") || null
  );
  const [messageInput, setMessageInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<UserType | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const data = await messagingApi.getConversations(user?.id || "");
      return data as ConversationWithDetails[];
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnReconnect: false, // Prevent refetch on reconnect
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return [];
      const data = await messagingApi.getMessages(selectedConversationId);
      return data as Message[];
    },
    enabled: !!selectedConversationId,
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnReconnect: false, // Prevent refetch on reconnect
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
  });

  // Fetch all users for new conversation
  const { data: allUsers } = useQuery({
    queryKey: ["allUsersForMessaging"],
    queryFn: async () => {
      try {
        return await messagingApi.getUsersForMessaging();
      } catch (error) {
        console.error("Error fetching users for messaging:", error);
        return [];
      }
    },
    enabled: showNewConversation && !!user,
  });

  // Filter users for new conversation (exclude current user)
  const availableUsers = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter((u: UserType) => u.id !== user?.id);
  }, [allUsers, user]);

  // Filter conversations by search term
  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    if (!searchTerm.trim()) return conversations;

    const term = searchTerm.toLowerCase();
    return conversations.filter((conv) => {
      const memberNames = conv.members
        .map((m) => `${m.firstName} ${m.lastName}`.toLowerCase())
        .join(" ");
      const lastMessageText = conv.lastMessage?.body?.toLowerCase() || "";
      return memberNames.includes(term) || lastMessageText.includes(term);
    });
  }, [conversations, searchTerm]);

  // Get current conversation details
  const currentConversation = useMemo(() => {
    return conversations?.find((c) => c.id === selectedConversationId);
  }, [conversations, selectedConversationId]);

  // Get other members of current conversation
  const otherMembers = useMemo(() => {
    return currentConversation?.members || [];
  }, [currentConversation]);

  // Handle URL query parameter for conversation on mount
  useEffect(() => {
    const conversationParam = searchParams.get("conversation");
    if (conversationParam && conversationParam !== selectedConversationId) {
      setSelectedConversationId(conversationParam);
    }
  }, []); // Only run on mount

  // Update URL when conversation is selected
  useEffect(() => {
    const currentParam = searchParams.get("conversation");
    if (selectedConversationId && selectedConversationId !== currentParam) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set("conversation", selectedConversationId);
      setSearchParams(newSearchParams, { replace: true });
    } else if (!selectedConversationId && currentParam) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("conversation");
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [selectedConversationId, setSearchParams]);

  // Join conversation room when selected
  useEffect(() => {
    if (selectedConversationId && socket) {
      joinConversation(selectedConversationId);
      return () => {
        leaveConversation(selectedConversationId);
      };
    }
  }, [selectedConversationId, socket, joinConversation, leaveConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing indicator
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Only send typing indicator if we have an active conversation (not just a selected recipient)
    if (messageInput.trim() && selectedConversationId) {
      setIsTyping(true);
      sendTyping(selectedConversationId, true);

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTyping(selectedConversationId, false);
      }, 1000);
    } else {
      setIsTyping(false);
      if (selectedConversationId) {
        sendTyping(selectedConversationId, false);
      }
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageInput, selectedConversationId, sendTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !user) return;

    const messageBody = messageInput.trim();
    setMessageInput("");

    let convId = selectedConversationId;
    let tempMessageId: string | null = null;

    try {
      // If starting new conversation
      if (!convId && selectedRecipient) {
        const newConv = await messagingApi.createConversation(selectedRecipient.id);
        convId = newConv.conversationId;
        setSelectedConversationId(convId);
        setShowNewConversation(false);
        setSelectedRecipient(null);
        // No need to invalidate - we'll update cache optimistically when message is sent
      }

      if (!convId) return;

      // Create optimistic message
      tempMessageId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempMessageId,
        conversationId: convId,
        senderId: user.id,
        body: messageBody,
        sentAt: new Date().toISOString(),
        isRead: false,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      };

      // Optimistically add message to cache
      queryClient.setQueryData(["messages", convId], (old: Message[] | undefined) => {
        return old ? [...old, optimisticMessage] : [optimisticMessage];
      });

      // Optimistically update conversations list to show last message immediately
      queryClient.setQueryData(["conversations"], (old: ConversationWithDetails[] | undefined) => {
        if (!old) return old;
        return old.map((conv) => {
          if (conv.id === convId) {
            return {
              ...conv,
              lastMessage: optimisticMessage,
              updatedAt: optimisticMessage.sentAt,
            };
          }
          return conv;
        });
      });

      // Send message
      const sentMessage = await messagingApi.sendMessage(convId, messageBody);

      // Replace optimistic message with real one, avoiding duplicates
      queryClient.setQueryData(["messages", convId], (old: Message[] | undefined) => {
        if (!old) return [sentMessage];
        // Remove both the temp message and any duplicate real message, then add the real one
        const filtered = old.filter((m) => m.id !== tempMessageId && m.id !== sentMessage.id);
        return [...filtered, sentMessage];
      });

      // Update conversations list with real message
      queryClient.setQueryData(["conversations"], (old: ConversationWithDetails[] | undefined) => {
        if (!old) return old;
        return old.map((conv) => {
          if (conv.id === convId) {
            return {
              ...conv,
              lastMessage: sentMessage,
              updatedAt: sentMessage.sentAt,
            };
          }
          return conv;
        });
      });

      // Only invalidate in background to sync with server, but don't trigger immediate refetch
      // The optimistic update already shows the correct state
      queryClient.invalidateQueries({ 
        queryKey: ["conversations"],
        refetchType: 'none' // Don't trigger immediate refetch, just mark as stale
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      if (convId && tempMessageId) {
        queryClient.setQueryData(["messages", convId], (old: Message[] | undefined) => {
          return old ? old.filter((m) => m.id !== tempMessageId) : old;
        });
        
        // Revert optimistic conversation update on error
        queryClient.setQueryData(["conversations"], (old: ConversationWithDetails[] | undefined) => {
          if (!old) return old;
          return old.map((conv) => {
            if (conv.id === convId && conv.lastMessage?.id === tempMessageId) {
              // Find the previous last message (excluding the failed one)
              const messages = queryClient.getQueryData<Message[]>(["messages", convId]) || [];
              const previousLastMessage = messages.length > 0 
                ? messages[messages.length - 1] 
                : null;
              return {
                ...conv,
                lastMessage: previousLastMessage || conv.lastMessage,
              };
            }
            return conv;
          });
        });
      }
      // Restore message input on error
      setMessageInput(messageBody);
    }
  };

  const handleStartConversation = async (recipient: UserType) => {
    try {
      // Check if conversation already exists
      const existingConv = conversations?.find((conv) =>
        conv.members.some((m) => m.id === recipient.id)
      );

      if (existingConv) {
        setSelectedConversationId(existingConv.id);
        setShowNewConversation(false);
        setSelectedRecipient(null);
      } else {
        // Clear previous conversation selection when starting new conversation
        setSelectedConversationId(null);
        setSelectedRecipient(recipient);
        setShowNewConversation(false);
        // Will create conversation when first message is sent
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getUnreadCount = (conversation: ConversationWithDetails) => {
    // Count unread messages (where sender is not current user and isRead is false)
    return conversation.lastMessage &&
      conversation.lastMessage.senderId !== user?.id &&
      !conversation.lastMessage.isRead
      ? 1
      : 0;
  };

  const getConversationName = (conversation: ConversationWithDetails) => {
    if (conversation.title) return conversation.title;
    if (conversation.members.length === 1) {
      const member = conversation.members[0];
      return `${member.firstName} ${member.lastName}`;
    }
    return conversation.members.map((m) => m.firstName).join(", ");
  };

  const getConversationAvatar = (conversation: ConversationWithDetails) => {
    if (conversation.members.length === 1) {
      const member = conversation.members[0];
      return member.avatar || null;
    }
    return null;
  };

  const getConversationInitials = (conversation: ConversationWithDetails) => {
    if (conversation.members.length === 1) {
      const member = conversation.members[0];
      return `${member.firstName[0]}${member.lastName[0]}`;
    }
    return null;
  };

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-gray-50 rounded-lg overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Messages</h2>
            <button
              onClick={() => setShowNewConversation(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="New conversation"
            >
              <Plus className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <div className="p-4 text-center text-gray-500">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchTerm ? "No conversations found" : "No conversations yet"}
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const isSelected = conversation.id === selectedConversationId;
              const unreadCount = getUnreadCount(conversation);
              const otherMember = conversation.members[0];
              const isOnline = otherMember ? onlineUsers[otherMember.id] : false;

              return (
                <button
                  key={conversation.id}
                  onClick={() => {
                    setSelectedConversationId(conversation.id);
                    setSelectedRecipient(null); // Clear new conversation recipient when selecting existing conversation
                  }}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                    isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      {getConversationAvatar(conversation) ? (
                        <img
                          src={getConversationAvatar(conversation) || ""}
                          alt={getConversationName(conversation)}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            // Hide broken image and show initials fallback
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const initials = getConversationInitials(conversation);
                            if (initials) {
                              const fallback = document.createElement('div');
                              fallback.className = 'w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium';
                              fallback.textContent = initials;
                              target.parentElement?.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                          {getConversationInitials(conversation) || <Users className="h-6 w-6" />}
                        </div>
                      )}
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {getConversationName(conversation)}
                        </h3>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatTime(conversation.lastMessage.sentAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage
                            ? conversation.lastMessage.senderId === user.id
                              ? `You: ${conversation.lastMessage.body}`
                              : conversation.lastMessage.body
                            : "No messages yet"}
                        </p>
                        {unreadCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full flex-shrink-0">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {(selectedConversationId && currentConversation) || selectedRecipient ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedRecipient ? (
                  <>
                    {selectedRecipient.avatar ? (
                      <img
                        src={selectedRecipient.avatar}
                        alt={`${selectedRecipient.firstName} ${selectedRecipient.lastName}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                        {selectedRecipient.firstName[0]}
                        {selectedRecipient.lastName[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedRecipient.firstName} {selectedRecipient.lastName}
                      </h3>
                    </div>
                  </>
                ) : currentConversation ? (
                  <>
                    {getConversationAvatar(currentConversation) ? (
                      <img
                        src={getConversationAvatar(currentConversation) || ""}
                        alt={getConversationName(currentConversation)}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          // Hide broken image and show initials fallback
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const initials = getConversationInitials(currentConversation);
                          if (initials) {
                            const fallback = document.createElement('div');
                            fallback.className = 'w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-xs';
                            fallback.textContent = initials;
                            target.parentElement?.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-xs">
                        {getConversationInitials(currentConversation) || <Users className="h-5 w-5" />}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {getConversationName(currentConversation)}
                      </h3>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedRecipient && !selectedConversationId ? (
                <div className="text-center text-gray-500 mt-8">
                  Start a new conversation with {selectedRecipient.firstName} {selectedRecipient.lastName}
                </div>
              ) : selectedConversationId && messagesLoading ? (
                <div className="text-center text-gray-500">Loading messages...</div>
              ) : selectedConversationId && messages && messages.length > 0 ? (
                <>
                  {messages.map((message, index) => {
                    const isOwnMessage = message.senderId === user.id;
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const showAvatar =
                      !prevMessage || prevMessage.senderId !== message.senderId;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex gap-2 max-w-[70%] ${
                            isOwnMessage ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          {showAvatar && !isOwnMessage && (
                            <div className="flex-shrink-0">
                              {message.avatar ? (
                                <img
                                  src={message.avatar}
                                  alt={`${message.firstName} ${message.lastName}`}
                                  className="w-8 h-8 rounded-full object-cover"
                                  onError={(e) => {
                                    // Hide broken image and show initials fallback
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const initials = `${message.firstName?.[0] || "U"}${message.lastName?.[0] || ""}`;
                                    const fallback = document.createElement('div');
                                    fallback.className = 'w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs';
                                    fallback.textContent = initials;
                                    target.parentElement?.appendChild(fallback);
                                  }}
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs">
                                  {message.firstName?.[0] || "U"}
                                  {message.lastName?.[0] || ""}
                                </div>
                              )}
                            </div>
                          )}
                          {showAvatar && isOwnMessage && <div className="w-8" />}
                          <div className="flex flex-col">
                            {showAvatar && !isOwnMessage && (
                              <span className="text-xs text-gray-600 mb-1">
                                {message.firstName} {message.lastName}
                              </span>
                            )}
                            <div
                              className={`px-4 py-2 rounded-lg ${
                                isOwnMessage
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                            </div>
                            <div
                              className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                                isOwnMessage ? "justify-end" : "justify-start"
                              }`}
                            >
                              <span>{formatMessageTime(message.sentAt)}</span>
                              {isOwnMessage && (
                                <span>
                                  {message.isRead ? (
                                    <CheckCheck className="h-3 w-3 text-blue-500" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {selectedConversationId &&
                    typingStatus[selectedConversationId] &&
                    typingStatus[selectedConversationId].size > 0 && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 px-4 py-2 rounded-lg">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            />
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="text-center text-gray-500 mt-8">
                  No messages yet. Start the conversation!
                </div>
              )}
            </div>

            {/* Message Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-gray-200"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">or start a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">New Conversation</h3>
              <button
                onClick={() => {
                  setShowNewConversation(false);
                  setSelectedRecipient(null);
                  setUserSearchTerm("");
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                {availableUsers.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No users available</p>
                ) : (
                  availableUsers
                    .filter((u: UserType) => {
                      if (!userSearchTerm.trim()) return true;
                      const term = userSearchTerm.toLowerCase();
                      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
                      const email = u.email?.toLowerCase() || "";
                      const role = u.role?.toLowerCase() || "";
                      return fullName.includes(term) || email.includes(term) || role.includes(term);
                    })
                    .map((u: UserType) => (
                    <button
                      key={u.id}
                      onClick={() => handleStartConversation(u)}
                      className="w-full p-3 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3"
                    >
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt={`${u.firstName} ${u.lastName}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                          {u.firstName[0]}
                          {u.lastName[0]}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">{u.role}</p>
                      </div>
                      {onlineUsers[u.id] && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messaging;
