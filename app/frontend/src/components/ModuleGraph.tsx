import { Module, Comment, CollaboratorRole } from "@/lib/types";
import { CheckCircle2, Circle, Loader2, ArrowDown } from "lucide-react";
import { CommentSection } from "./CommentSection";

interface ModuleGraphProps {
  modules: Module[];
  visible: boolean;
  comments?: Comment[];
  currentUser?: { name: string; role: CollaboratorRole; id: string };
  onAddComment?: (comment: Comment) => void;
}

function getStatusColor(status: Module["status"]) {
  switch (status) {
    case "green":
      return { bg: "bg-[#22c55e]/20", border: "border-[#22c55e]", text: "text-[#22c55e]" };
    case "yellow":
      return { bg: "bg-[#eab308]/20", border: "border-[#eab308]", text: "text-[#eab308]" };
    case "red":
      return { bg: "bg-[#ef4444]/20", border: "border-[#ef4444]", text: "text-[#ef4444]" };
  }
}

function StatusIcon({ status }: { status: Module["status"] }) {
  switch (status) {
    case "green":
      return <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />;
    case "yellow":
      return <Loader2 className="w-4 h-4 text-[#eab308] animate-spin" />;
    case "red":
      return <Circle className="w-4 h-4 text-[#ef4444]" />;
  }
}

export function ModuleGraph({ modules, visible, comments = [], currentUser, onAddComment }: ModuleGraphProps) {
  if (!visible) {
    return (
      <div className="flex flex-col h-full bg-[#1e1e2e] border-r border-[#3d3d5c] items-center justify-center">
        <p className="text-[#64748b] text-sm text-center px-4">
          模块结构图将在任务拆分后显示
        </p>
      </div>
    );
  }

  const completedCount = modules.filter((m) => m.status === "green").length;
  const totalCount = modules.length;
  const overallProgress = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] border-r border-[#3d3d5c]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#3d3d5c]">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#e2e8f0]">模块结构</span>
          <span className="text-xs text-[#94a3b8]">{completedCount}/{totalCount} 完成</span>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-[#2d2d3d] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#22c55e] rounded-full transition-all duration-700"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Module nodes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {modules.map((module, index) => {
          const colors = getStatusColor(module.status);
          const moduleComments = comments.filter(
            (c) => c.targetType === "module" && c.targetId === module.id
          );
          return (
            <div key={module.id}>
              <div
                className={`rounded-lg border ${colors.border} ${colors.bg} p-3 transition-all duration-500`}
              >
                {/* Module header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={module.status} />
                    <span className="text-sm font-medium text-[#e2e8f0]">
                      {module.name}
                    </span>
                  </div>
                  <span className={`text-xs font-mono ${colors.text}`}>
                    {module.status === "red" ? "待开始" : module.status === "yellow" ? "构建中" : "已完成"}
                  </span>
                </div>

                {/* Interfaces */}
                <div className="space-y-1 mb-2">
                  {module.interfaces.map((iface) => (
                    <div key={iface.name} className="flex items-center gap-1.5 text-xs">
                      <span className={`px-1 rounded text-[10px] font-mono ${
                        iface.type === "input"
                          ? "bg-[#3b82f6]/20 text-[#60a5fa]"
                          : "bg-[#a855f7]/20 text-[#c084fc]"
                      }`}>
                        {iface.type === "input" ? "IN" : "OUT"}
                      </span>
                      <span className="text-[#94a3b8] font-mono">{iface.name}</span>
                    </div>
                  ))}
                </div>

                {/* Test coverage */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#64748b]">测试覆盖</span>
                  <div className="flex-1 h-1 bg-[#2d2d3d] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        module.testCoverage >= 80
                          ? "bg-[#22c55e]"
                          : module.testCoverage >= 40
                          ? "bg-[#eab308]"
                          : "bg-[#ef4444]"
                      }`}
                      style={{ width: `${module.testCoverage}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#94a3b8] font-mono w-8 text-right">
                    {module.testCoverage}%
                  </span>
                </div>

                {/* Dependencies */}
                {module.dependencies.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#3d3d5c]/50">
                    <span className="text-[10px] text-[#64748b]">
                      依赖: {module.dependencies.map((d) => modules.find((m) => m.id === d)?.name).join(", ")}
                    </span>
                  </div>
                )}

                {/* Comments section */}
                {currentUser && onAddComment && (
                  <CommentSection
                    comments={moduleComments}
                    currentUser={currentUser}
                    targetType="module"
                    targetId={module.id}
                    onAddComment={onAddComment}
                  />
                )}
              </div>

              {/* Connection arrow */}
              {index < modules.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="w-3 h-3 text-[#3d3d5c]" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}