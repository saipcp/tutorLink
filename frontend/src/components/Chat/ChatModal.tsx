import React, { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { messagingApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import type { Message } from "../../types";

interface Props {
  conversationId: string | undefined;
  recipientId?: string; // used when starting a new convo
  open: boolean;
  onClose: () => void;
}

const ChatModal: React.FC<Props> = ({
  conversationId,
  recipientId,
  open,
  onClose,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    socket,
    joinConversation,
    leaveConversation,
    sendTyping,
    markConversationRead,
    typingStatus,
  } = useSocket();
  const [convId, setConvId] = useState<string | undefined>(conversationId);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setConvId(conversationId);
  }, [conversationId]);

  useEffect(() => {
    if (open && convId) {
      joinConversation(convId);
      markConversationRead(convId);
    }
    return () => {
      if (convId) leaveConversation(convId);
    };
  }, [open, convId, joinConversation, leaveConversation, markConversationRead]);

  const { data: messages } = useQuery({
    queryKey: ["messages", convId],
    queryFn: () =>
      convId ? messagingApi.getMessages(convId) : Promise.resolve([]),
    enabled: !!convId && open,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (payload: {
      body: string;
      conversationId?: string;
      recipientId?: string;
    }) => {
      const resp = await messagingApi.sendMessage(
        payload.conversationId,
        payload.body,
        payload.recipientId
      );
      return resp;
    },
    onSuccess: (resp: any, vars) => {
      if (!convId && resp && resp.conversationId) {
        setConvId(resp.conversationId);
      }
      queryClient.invalidateQueries(["conversations"]);
      queryClient.invalidateQueries(["messages", convId]);
      setInput("");
    },
  });

  const handleTyping = (value: string) => {
    setInput(value);
    if (!convId) return;
    sendTyping(convId, true);
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(
      () => sendTyping(convId, false),
      1200
    );
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    await sendMutation.mutateAsync({
      body: input.trim(),
      conversationId: convId,
      recipientId,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-4 flex flex-col h-[70vh]">
        <div className="flex items-center justify-between mb-3 border-b pb-2">
          <h3 className="text-lg font-semibold">Chat</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{user?.firstName}</span>
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-3">
          {(messages as Message[] | undefined)?.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.senderId === user?.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg px-3 py-2 max-w-[70%] ${
                  m.senderId === user?.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{m.body}</div>
                <div className="text-xs opacity-60 mt-1 text-right">
                  {new Date(m.sentAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
          {typingStatus &&
            convId &&
            typingStatus[convId] &&
            Array.from(typingStatus[convId]).filter(
              (u: string) => u !== user?.id
            ).length > 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-700">
                  Someone is typing…
                </div>
              </div>
            )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <input
            value={input}
            onChange={(e) => handleTyping(e.target.value)}
            className="input-field flex-1"
            placeholder="Write a message…"
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={!input.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;
