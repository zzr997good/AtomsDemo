import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Comment, CollaboratorRole, Collaborator } from "@/lib/types";
import { getRoleLabel, getRoleColor } from "@/lib/collaboration";

interface CommentSectionProps {
  comments: Comment[];
  currentUser: { name: string; role: CollaboratorRole; id: string };
  targetType: "module" | "plan" | "code";
  targetId?: string;
  onAddComment: (comment: Comment) => void;
  collaborators?: Collaborator[];
}

export function CommentSection({
  comments,
  currentUser,
  targetType,
  targetId,
  onAddComment,
}: CommentSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");

  const filteredComments = comments.filter(
    (c) => c.targetType === targetType && (targetId ? c.targetId === targetId : true)
  );

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: `comment-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      content: newComment.trim(),
      targetType,
      targetId,
      timestamp: Date.now(),
    };
    onAddComment(comment);
    setNewComment("");
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    return `${Math.floor(diff / 3600000)}小时前`;
  };

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-[10px] text-[#64748b] hover:text-[#94a3b8] transition-colors"
      >
        <MessageSquare className="w-3 h-3" />
        <span>
          {filteredComments.length > 0
            ? `${filteredComments.length} 条评论`
            : "添加评论"}
        </span>
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2 pl-2 border-l-2 border-[#3d3d5c]">
          {filteredComments.map((comment) => (
            <div key={comment.id} className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-[#e2e8f0]">
                  {comment.authorName}
                </span>
                <span
                  className="text-[9px] px-1 py-0.5 rounded font-medium"
                  style={{
                    backgroundColor: `${getRoleColor(comment.authorRole)}20`,
                    color: getRoleColor(comment.authorRole),
                  }}
                >
                  {getRoleLabel(comment.authorRole)}
                </span>
                <span className="text-[9px] text-[#64748b]">
                  {formatTime(comment.timestamp)}
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                {comment.content}
              </p>
            </div>
          ))}

          {/* Input */}
          <div className="flex gap-1.5 items-center">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="输入评论..."
              className="flex-1 px-2 py-1 bg-[#1e1e2e] border border-[#3d3d5c] rounded text-[11px] text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/50"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button
              onClick={handleSubmit}
              disabled={!newComment.trim()}
              className="p-1 rounded bg-[#7c3aed] text-white disabled:opacity-40 hover:bg-[#6d28d9] transition-colors"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}