import { useState, useRef, useEffect } from "react";
import { Message, Collaborator } from "@/lib/types";
import { Send, AtSign } from "lucide-react";
import { getRoleLabel, getRoleColor } from "@/lib/collaboration";

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isTyping: boolean;
  collaborators?: Collaborator[];
  isGroupChat?: boolean;
}

export function ChatPanel({ messages, onSendMessage, isTyping, collaborators = [], isGroupChat = false }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
    setShowMentions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    // Show mentions dropdown when @ is typed
    if (value.endsWith("@") && collaborators.length > 0) {
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (collab: Collaborator) => {
    setInput((prev) => prev.replace(/@$/, `@${collab.name} `));
    setShowMentions(false);
  };

  const onlineCount = collaborators.filter((c) => c.isOnline).length;

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] border-r border-[#3d3d5c]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#3d3d5c] flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
        <span className="text-sm font-medium text-[#e2e8f0]">
          {isGroupChat ? "共创群聊" : "Atoms Agent"}
        </span>
        {isGroupChat && onlineCount > 0 && (
          <span className="text-[10px] text-[#64748b] ml-auto">
            {onlineCount + 1} 人在线
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-[#94a3b8] mt-8">
            <p className="text-lg mb-2">👋 你好！我是 Atoms Agent</p>
            <p className="text-sm">告诉我你想构建什么应用，我来帮你规划和实现。</p>
            <p className="text-xs mt-4 text-[#64748b]">试试输入：帮我做一个任务管理应用</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : msg.role === "collaborator" ? "justify-start" : "justify-start"}`}
          >
            {msg.role === "collaborator" && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white mr-2 mt-1 shrink-0"
                style={{ backgroundColor: msg.avatarColor || "#6366f1" }}
              >
                {msg.authorName?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div className="max-w-[85%]">
              {msg.role === "collaborator" && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[11px] font-medium text-[#e2e8f0]">
                    {msg.authorName}
                  </span>
                  {msg.authorRole && (
                    <span
                      className="text-[9px] px-1 py-0.5 rounded font-medium"
                      style={{
                        backgroundColor: `${getRoleColor(msg.authorRole)}20`,
                        color: getRoleColor(msg.authorRole),
                      }}
                    >
                      {getRoleLabel(msg.authorRole)}
                    </span>
                  )}
                </div>
              )}
              <div
                className={`rounded-lg px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[#7c3aed] text-white"
                    : msg.role === "collaborator"
                    ? "bg-[#1e3a5f] text-[#e2e8f0] border border-[#2d5a8c]"
                    : "bg-[#2d2d3d] text-[#e2e8f0] border border-[#3d3d5c]"
                }`}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#2d2d3d] border border-[#3d3d5c] rounded-lg px-4 py-2.5">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[#94a3b8] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-[#94a3b8] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-[#94a3b8] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mentions dropdown */}
      {showMentions && collaborators.length > 0 && (
        <div className="mx-4 mb-1 bg-[#2d2d3d] border border-[#3d3d5c] rounded-lg overflow-hidden shadow-lg">
          {collaborators
            .filter((c) => c.status === "joined")
            .map((collab) => (
              <button
                key={collab.id}
                onClick={() => insertMention(collab)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#3d3d5c] transition-colors text-left"
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: collab.avatarColor }}
                >
                  {collab.name[0].toUpperCase()}
                </div>
                <span className="text-xs text-[#e2e8f0]">{collab.name}</span>
                <span
                  className="text-[9px] px-1 py-0.5 rounded font-medium ml-auto"
                  style={{
                    backgroundColor: `${getRoleColor(collab.role)}20`,
                    color: getRoleColor(collab.role),
                  }}
                >
                  {getRoleLabel(collab.role)}
                </span>
              </button>
            ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-[#3d3d5c]">
        <div className="flex gap-2 items-end">
          {isGroupChat && (
            <button
              onClick={() => setShowMentions(!showMentions)}
              className="p-2.5 text-[#64748b] hover:text-[#94a3b8] transition-colors"
              title="@提及协作者"
            >
              <AtSign className="w-4 h-4" />
            </button>
          )}
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isGroupChat ? "在群聊中发言... 输入@提及协作者" : "输入你的需求..."}
            rows={1}
            className="flex-1 bg-[#2d2d3d] border border-[#3d3d5c] rounded-lg px-3 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] resize-none focus:outline-none focus:border-[#7c3aed] transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}