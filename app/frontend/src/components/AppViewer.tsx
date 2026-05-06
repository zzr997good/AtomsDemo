import { Phase, CodeFile, PlanAnnotation } from "@/lib/types";
import { PlanEdit } from "@/lib/projectStore";
import { FileCode2, Eye, Terminal, CheckCircle2, Pencil, Check, MessageSquare, History } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getRoleColor, getRoleLabel } from "@/lib/collaboration";

interface AppViewerProps {
  phase: Phase;
  planMarkdown: string;
  codeFiles: CodeFile[];
  buildComplete: boolean;
  onPlanChange?: (newPlan: string) => void;
  planAnnotations?: PlanAnnotation[];
  planEdits?: PlanEdit[];
  currentUserId?: string;
}

function AnnotationBadge({ annotation }: { annotation: PlanAnnotation }) {
  const roleColor = getRoleColor(annotation.authorRole);
  const typeLabels = {
    comment: "💬 评论",
    suggestion: "💡 建议",
    modification: "✏️ 修改",
  };
  const typeBgColors = {
    comment: "bg-blue-500/10 border-blue-500/30",
    suggestion: "bg-amber-500/10 border-amber-500/30",
    modification: "bg-emerald-500/10 border-emerald-500/30",
  };

  return (
    <div
      className={`my-2 ml-4 p-3 rounded-lg border ${typeBgColors[annotation.type]} animate-in fade-in slide-in-from-right-2 duration-500`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
          style={{ backgroundColor: roleColor }}
        >
          {annotation.authorName[0]}
        </div>
        <span className="text-xs font-medium" style={{ color: roleColor }}>
          {annotation.authorName}
        </span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: `${roleColor}20`, color: roleColor }}
        >
          {getRoleLabel(annotation.authorRole)}
        </span>
        <span className="text-[10px] text-[#64748b] ml-auto">
          {typeLabels[annotation.type]}
        </span>
      </div>
      <p className="text-xs text-[#e2e8f0] leading-relaxed pl-7">
        {annotation.content}
      </p>
    </div>
  );
}

function EditHistoryPanel({ edits }: { edits: PlanEdit[] }) {
  if (edits.length === 0) return null;

  const recentEdits = edits.slice(-5).reverse();

  return (
    <div className="border-t border-[#3d3d5c] p-4">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-3.5 h-3.5 text-[#94a3b8]" />
        <span className="text-xs font-medium text-[#94a3b8]">修改记录</span>
      </div>
      <div className="space-y-2">
        {recentEdits.map((edit) => (
          <div
            key={edit.id}
            className="flex items-center gap-2 p-2 rounded-lg"
            style={{ borderLeft: `3px solid ${edit.userColor}` }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
              style={{ backgroundColor: edit.userColor }}
            >
              {edit.userName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-medium" style={{ color: edit.userColor }}>
                {edit.userName}
              </span>
              <span className="text-[10px] text-[#64748b] ml-2">
                修改了方案
              </span>
            </div>
            <span className="text-[10px] text-[#4a5568] shrink-0">
              {formatTime(edit.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return new Date(ts).toLocaleDateString();
}

export function AppViewer({ phase, planMarkdown, codeFiles, buildComplete, onPlanChange, planAnnotations = [], planEdits = [], currentUserId }: AppViewerProps) {
  const [activeTab, setActiveTab] = useState<"plan" | "code" | "preview">("plan");
  const [selectedFile, setSelectedFile] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(planMarkdown);
  const [showHistory, setShowHistory] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const planScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditContent(planMarkdown);
    }
  }, [planMarkdown, isEditing]);

  useEffect(() => {
    if (planAnnotations.length > 0 && planScrollRef.current && activeTab === "plan") {
      setTimeout(() => {
        planScrollRef.current?.scrollTo({
          top: planScrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 300);
    }
  }, [planAnnotations.length, activeTab]);

  useEffect(() => {
    if (phase === "building" && codeFiles.length > 0 && activeTab === "plan") {
      setActiveTab("code");
    }
    if (phase === "complete") {
      setActiveTab("preview");
    }
  }, [phase, codeFiles.length]);

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
    setEditContent(planMarkdown);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  }, [planMarkdown]);

  const handleSaveEdit = useCallback(() => {
    setIsEditing(false);
    if (onPlanChange && editContent !== planMarkdown) {
      onPlanChange(editContent);
    }
  }, [editContent, planMarkdown, onPlanChange]);

  const annotationsBySection = planAnnotations.reduce<Record<string, PlanAnnotation[]>>((acc, ann) => {
    if (!acc[ann.targetSection]) {
      acc[ann.targetSection] = [];
    }
    acc[ann.targetSection].push(ann);
    return acc;
  }, {});

  const renderPlanWithAnnotations = () => {
    const lines = planMarkdown.split("\n");
    const sections: { heading: string; content: string; level: number }[] = [];
    let currentSection = { heading: "", content: "", level: 0 };

    for (const line of lines) {
      const h3Match = line.match(/^### (.+)/);
      const h2Match = line.match(/^## (.+)/);
      const h1Match = line.match(/^# (.+)/);

      if (h1Match || h2Match || h3Match) {
        if (currentSection.heading || currentSection.content) {
          sections.push({ ...currentSection });
        }
        const heading = h3Match?.[1] || h2Match?.[1] || h1Match?.[1] || "";
        const level = h3Match ? 3 : h2Match ? 2 : 1;
        currentSection = { heading, content: line + "\n", level };
      } else {
        currentSection.content += line + "\n";
      }
    }
    if (currentSection.heading || currentSection.content) {
      sections.push(currentSection);
    }

    return sections.map((section, idx) => {
      const sectionAnnotations = annotationsBySection[section.heading] || [];

      return (
        <div key={idx} className="relative">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {section.content}
          </ReactMarkdown>

          {sectionAnnotations.length > 0 && (
            <div className="space-y-1 mb-4">
              {sectionAnnotations.map((ann) => (
                <AnnotationBadge key={ann.id} annotation={ann} />
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  const markdownComponents = {
    h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-xl font-bold text-[#e2e8f0] mb-4 mt-0">{children}</h1>,
    h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-lg font-semibold text-[#c084fc] mb-3 mt-6">{children}</h2>,
    h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-base font-medium text-[#60a5fa] mb-2 mt-4">{children}</h3>,
    p: ({ children }: { children?: React.ReactNode }) => <p className="text-sm text-[#cbd5e1] mb-3 leading-relaxed">{children}</p>,
    ul: ({ children }: { children?: React.ReactNode }) => <ul className="text-sm text-[#cbd5e1] mb-3 pl-4 space-y-1 list-disc">{children}</ul>,
    ol: ({ children }: { children?: React.ReactNode }) => <ol className="text-sm text-[#cbd5e1] mb-3 pl-4 space-y-1 list-decimal">{children}</ol>,
    li: ({ children }: { children?: React.ReactNode }) => <li className="text-sm text-[#cbd5e1]">{children}</li>,
    code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
      const isBlock = className?.includes("language-");
      if (isBlock) {
        return (
          <pre className="bg-[#1a1a2e] border border-[#3d3d5c] rounded-lg p-4 overflow-x-auto my-3">
            <code className="text-xs font-mono text-[#e2e8f0]">{children}</code>
          </pre>
        );
      }
      return <code className="bg-[#3d3d5c] px-1.5 py-0.5 rounded text-xs text-[#f0abfc] font-mono">{children}</code>;
    },
    pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    strong: ({ children }: { children?: React.ReactNode }) => <strong className="text-[#e2e8f0] font-semibold">{children}</strong>,
    hr: () => <hr className="border-[#3d3d5c] my-4" />,
    table: ({ children }: { children?: React.ReactNode }) => <table className="w-full text-sm border-collapse my-3">{children}</table>,
    th: ({ children }: { children?: React.ReactNode }) => <th className="border border-[#3d3d5c] px-3 py-1.5 text-left text-[#c084fc] bg-[#2d2d3d]">{children}</th>,
    td: ({ children }: { children?: React.ReactNode }) => <td className="border border-[#3d3d5c] px-3 py-1.5 text-[#cbd5e1]">{children}</td>,
  };

  // Find the last edit not by current user (to show "updated by X" indicator)
  const lastOtherEdit = planEdits.filter((e) => e.userId !== currentUserId).slice(-1)[0];

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e]">
      {/* Tab bar */}
      <div className="flex items-center border-b border-[#3d3d5c] px-2">
        <button
          onClick={() => setActiveTab("plan")}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 ${
            activeTab === "plan"
              ? "text-[#e2e8f0] border-[#7c3aed]"
              : "text-[#64748b] border-transparent hover:text-[#94a3b8]"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          方案
          {planAnnotations.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-amber-500/30 text-amber-300 rounded text-[10px]">
              {planAnnotations.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("code")}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 ${
            activeTab === "code"
              ? "text-[#e2e8f0] border-[#7c3aed]"
              : "text-[#64748b] border-transparent hover:text-[#94a3b8]"
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5" />
          代码
          {codeFiles.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-[#7c3aed]/30 text-[#c084fc] rounded text-[10px]">
              {codeFiles.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 ${
            activeTab === "preview"
              ? "text-[#e2e8f0] border-[#7c3aed]"
              : "text-[#64748b] border-transparent hover:text-[#94a3b8]"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          预览
        </button>

        {/* Status indicators */}
        <div className="ml-auto flex items-center gap-2 pr-2">
          {activeTab === "plan" && phase !== "idle" && (
            <>
              <button
                onClick={isEditing ? handleSaveEdit : handleStartEdit}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors hover:bg-[#3d3d5c]"
              >
                {isEditing ? (
                  <>
                    <Check className="w-3 h-3 text-[#22c55e]" />
                    <span className="text-[#22c55e]">保存</span>
                  </>
                ) : (
                  <>
                    <Pencil className="w-3 h-3 text-[#94a3b8]" />
                    <span className="text-[#94a3b8]">编辑</span>
                  </>
                )}
              </button>
              {planEdits.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors hover:bg-[#3d3d5c] ${
                    showHistory ? "text-[#7c3aed]" : "text-[#94a3b8]"
                  }`}
                >
                  <History className="w-3 h-3" />
                  <span>{planEdits.length}</span>
                </button>
              )}
            </>
          )}
          {planAnnotations.length > 0 && activeTab === "plan" && (
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] text-amber-400">
                {planAnnotations.length} 条批注
              </span>
            </div>
          )}
          {phase === "building" && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#eab308] animate-pulse" />
              <span className="text-[10px] text-[#eab308]">构建中...</span>
            </div>
          )}
          {phase === "complete" && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
              <span className="text-[10px] text-[#22c55e]">构建完成</span>
            </div>
          )}
        </div>
      </div>

      {/* "Updated by" banner */}
      {lastOtherEdit && activeTab === "plan" && !isEditing && (
        <div
          className="px-4 py-2 flex items-center gap-2 border-b"
          style={{ borderColor: `${lastOtherEdit.userColor}40`, backgroundColor: `${lastOtherEdit.userColor}08` }}
        >
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
            style={{ backgroundColor: lastOtherEdit.userColor }}
          >
            {lastOtherEdit.userName[0]}
          </div>
          <span className="text-[11px]" style={{ color: lastOtherEdit.userColor }}>
            {lastOtherEdit.userName} 修改了方案
          </span>
          <span className="text-[10px] text-[#64748b]">
            {formatTime(lastOtherEdit.timestamp)}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden">
          {activeTab === "plan" && (
            <div className="h-full overflow-y-auto p-6" ref={planScrollRef}>
              {phase === "idle" ? (
                <div className="text-center text-[#64748b] mt-12">
                  <Terminal className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">等待需求确认...</p>
                  <p className="text-xs mt-2">在左侧对话中描述你想构建的应用</p>
                </div>
              ) : isEditing ? (
                <div className="h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#3d3d5c]">
                    <Pencil className="w-3.5 h-3.5 text-[#7c3aed]" />
                    <span className="text-xs text-[#94a3b8]">编辑模式 - 直接修改 Markdown 内容</span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 w-full bg-[#2d2d3d] text-[#e2e8f0] text-sm font-mono leading-6 p-4 rounded-lg border border-[#3d3d5c] focus:border-[#7c3aed] focus:outline-none resize-none"
                    spellCheck={false}
                  />
                </div>
              ) : planAnnotations.length > 0 ? (
                <div className="relative">
                  {renderPlanWithAnnotations()}
                </div>
              ) : (
                <div
                  className="prose prose-invert prose-sm max-w-none cursor-pointer hover:bg-[#2d2d3d]/30 rounded-lg p-2 -m-2 transition-colors group relative"
                  onClick={handleStartEdit}
                >
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-1 bg-[#3d3d5c] rounded text-[10px] text-[#94a3b8]">
                    <Pencil className="w-3 h-3" />
                    点击编辑
                  </div>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {planMarkdown}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}

          {activeTab === "code" && (
            <div className="h-full flex">
              <div className="w-48 border-r border-[#3d3d5c] overflow-y-auto py-2">
                {codeFiles.length === 0 ? (
                  <p className="text-xs text-[#64748b] px-3 py-2">等待代码生成...</p>
                ) : (
                  codeFiles.map((file, idx) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(idx)}
                      className={`w-full text-left px-3 py-1.5 text-xs font-mono flex items-center gap-1.5 transition-colors ${
                        selectedFile === idx
                          ? "bg-[#7c3aed]/20 text-[#e2e8f0]"
                          : "text-[#94a3b8] hover:bg-[#2d2d3d]"
                      }`}
                    >
                      <FileCode2 className="w-3 h-3 shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </button>
                  ))
                )}
              </div>
              <div className="flex-1 overflow-auto p-4">
                {codeFiles.length > 0 && codeFiles[selectedFile] && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#3d3d5c]">
                      <span className="text-xs text-[#64748b] font-mono">
                        {codeFiles[selectedFile].path}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#3b82f6]/20 text-[#60a5fa] rounded">
                        {codeFiles[selectedFile].language}
                      </span>
                    </div>
                    <pre className="text-xs font-mono text-[#e2e8f0] leading-5 whitespace-pre-wrap">
                      {codeFiles[selectedFile].content}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="h-full flex items-center justify-center p-6">
              {buildComplete ? (
                <div className="w-full max-w-md mx-auto">
                  <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
                    <div className="bg-gradient-to-r from-[#7c3aed] to-[#6366f1] px-4 py-3 flex items-center justify-between">
                      <span className="text-white font-semibold text-sm">📋 TaskFlow</span>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                          <span className="text-white text-[10px]">🔔</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                          <span className="text-white text-[10px]">👤</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-800 font-medium text-xs">今日任务</span>
                        <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">3 项待办</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <div className="w-4 h-4 rounded border-2 border-[#22c55e] bg-[#22c55e] flex items-center justify-center">
                            <span className="text-white text-[8px]">✓</span>
                          </div>
                          <span className="text-xs text-gray-400 line-through">完成项目设计文档</span>
                          <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">已完成</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <div className="w-4 h-4 rounded border-2 border-[#eab308]" />
                          <span className="text-xs text-gray-700">Review PR #42</span>
                          <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">进行中</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <div className="w-4 h-4 rounded border-2 border-[#ef4444]" />
                          <span className="text-xs text-gray-700">修复登录页面 Bug</span>
                          <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded">紧急</span>
                        </div>
                      </div>
                      <button className="w-full py-2 bg-[#7c3aed] text-white text-xs rounded-lg font-medium">
                        + 添加新任务
                      </button>
                    </div>
                  </div>
                  <div className="text-center mt-6">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                      <p className="text-sm text-[#22c55e] font-medium">应用构建完成</p>
                    </div>
                    <p className="text-xs text-[#64748b] mt-1">点击上方 Publish 按钮部署到线上</p>
                  </div>
                </div>
              ) : phase === "building" ? (
                <div className="text-center text-[#eab308]">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-[#eab308] border-t-transparent animate-spin" />
                  <p className="text-sm">正在构建应用...</p>
                  <p className="text-xs text-[#64748b] mt-1">请稍候，构建完成后将自动显示预览</p>
                </div>
              ) : (
                <div className="text-center text-[#64748b]">
                  <Terminal className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">预览将在构建完成后可用</p>
                  <p className="text-xs mt-1">在对话中输入"开始构建"启动构建流程</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Edit history panel */}
        {showHistory && activeTab === "plan" && (
          <EditHistoryPanel edits={planEdits} />
        )}
      </div>
    </div>
  );
}