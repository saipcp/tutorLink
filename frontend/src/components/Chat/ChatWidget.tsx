import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { messagingApi } from "../../services/api";
import ChatModal from "./ChatModal";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";

const ConversationPreview: React.FC<any> = ({ conv, onOpen, onlineUsers }) => {
  const other = conv.members?.[0];
  return (
    <div
      onClick={() => onOpen(conv.id, other?.id)}
      className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* presence */}
          <div
            className={`w-2 h-2 rounded-full ${
              onlineUsers && other && onlineUsers[other.id]
                ? "bg-green-500"
                : "bg-gray-300"
            }`}
          />
          <div>
            <div className="font-medium text-gray-900">
              {other ? `${other.firstName} ${other.lastName}` : "Conversation"}
            </div>
            <div className="text-xs text-gray-500 truncate max-w-[180px]">
              {conv.lastMessage?.body || "No messages yet"}
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {conv.updatedAt
            ? new Date(conv.updatedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </div>
      </div>
    </div>
  );
};

const ChatWidget: React.FC = () => {
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => messagingApi.getConversations(user?.id || ""),
    enabled: !!user?.id,
  });

  const [open, setOpen] = useState(false);
  const [activeConv, setActiveConv] = useState<string | undefined>(undefined);
  const [recipientId, setRecipientId] = useState<string | undefined>(undefined);

  const handleOpen = (convId?: string, recipient?: string) => {
    setActiveConv(convId);
    setRecipientId(recipient);
    setOpen(true);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Messages</h3>
        <div className="text-xs text-gray-500">Recent</div>
      </div>

      <div className="space-y-2">
        {conversations.slice(0, 3).map((c: any) => (
          <ConversationPreview
            key={c.id}
            conv={c}
            onOpen={handleOpen}
            onlineUsers={onlineUsers}
          />
        ))}

        {conversations.length === 0 && (
          <div className="text-sm text-gray-500">
            No conversations yet — start a new message from a profile.
          </div>
        )}
      </div>

      <ChatModal
        open={open}
        conversationId={activeConv}
        recipientId={recipientId}
        onClose={() => setOpen(false)}
      />
    </div>
  );
};

export default ChatWidget;
