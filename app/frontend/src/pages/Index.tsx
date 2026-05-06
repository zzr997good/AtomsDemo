import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChatPanel } from "@/components/ChatPanel";
import { ModuleGraph } from "@/components/ModuleGraph";
import { AppViewer } from "@/components/AppViewer";
import { InvitePanel } from "@/components/InvitePanel";
import { CollaboratorBar } from "@/components/CollaboratorBar";
import { Message, Module, CodeFile, Phase, Collaborator, Comment, PlanAnnotation } from "@/lib/types";
import {
  matchResponse,
  defaultModules,
  planMarkdown as defaultPlanMarkdown,
  mockCodeFiles,
  buildTimeline,
} from "@/lib/mockEngine";
import { getCurrentUser, logout, UserInfo, getUserColor } from "@/lib/auth";
import {
  getProjectById,
  updateProject,
  getProjectMessages,
  addProjectMessage,
  getProjectComments,
  addProjectComment,
  getProjectAnnotations,
  addProjectAnnotation,
  getPlanEdits,
  addPlanEdit,
  getProjectCollaborators,
  createInvitation,
  ensureDefaultProject,
  Project,
  PlanEdit,
} from "@/lib/projectStore";
import { LogOut, ArrowLeft } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  // Auth state
  const [user, setUser] = useState<UserInfo | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Project state
  const [project, setProject] = useState<Project | null>(null);

  // App state
  const [messages, setMessages] = useState<Message[]>([]);
  const [modules, setModules] = useState<Module[]>(defaultModules);
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([]);
  const [phase, setPhase] = useState<Phase>("architecture");
  const [isTyping, setIsTyping] = useState(false);
  const [buildComplete, setBuildComplete] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(defaultPlanMarkdown);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [planAnnotations, setPlanAnnotations] = useState<PlanAnnotation[]>([]);
  const [planEdits, setPlanEdits] = useState<PlanEdit[]>([]);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const buildTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const wasLoggedOut = sessionStorage.getItem("atoms_logged_out");
      if (wasLoggedOut === "true") {
        setAuthLoading(false);
        navigate("/login", { replace: true });
        return;
      }
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          navigate("/login", { replace: true });
        }
      } catch {
        navigate("/login", { replace: true });
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  // Load project data after auth
  useEffect(() => {
    if (authLoading || !user) return;

    let proj: Project | null = null;
    if (projectId) {
      proj = getProjectById(projectId) || null;
    }
    if (!proj) {
      // Ensure user has a default project
      proj = ensureDefaultProject(user);
      navigate(`/project/${proj.id}`, { replace: true });
      return;
    }

    setProject(proj);

    // Load project-specific data
    setPhase(proj.phase || "architecture");
    setCurrentPlan(proj.planMarkdown || defaultPlanMarkdown);
    setBuildComplete(proj.buildComplete || false);
    setModules(proj.modules.length > 0 ? proj.modules : defaultModules);

    // Load messages
    const savedMessages = getProjectMessages(proj.id);
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
    } else {
      setMessages(getDefaultMessages(proj));
    }

    // Load comments
    const savedComments = getProjectComments(proj.id);
    setComments(savedComments);

    // Load annotations
    const savedAnnotations = getProjectAnnotations(proj.id);
    setPlanAnnotations(savedAnnotations);

    // Load plan edits
    const savedEdits = getPlanEdits(proj.id);
    setPlanEdits(savedEdits);

    // Load collaborators
    const collabs = getProjectCollaborators(proj.id);
    setCollaborators(collabs);
  }, [authLoading, user, projectId, navigate]);

  const handleLogout = useCallback(async () => {
    sessionStorage.setItem("atoms_logged_out", "true");
    try {
      await logout();
    } catch { /* continue */ }
    window.location.href = "/login";
  }, []);

  // Current user info for comments
  const currentUser = {
    id: user?.id || "user-self",
    name: user?.name || user?.email?.split("@")[0] || "Me",
    role: "leader" as const,
  };

  const addMessage = useCallback((role: "user" | "assistant" | "collaborator", content: string, extra?: Partial<Message>) => {
    if (!project) return;
    const msg: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      role,
      content,
      timestamp: Date.now(),
      ...extra,
    };
    setMessages((prev) => [...prev, msg]);
    addProjectMessage(project.id, msg);
  }, [project]);

  const handleInvite = useCallback((newCollabs: Collaborator[]) => {
    if (!project || !user) return;

    // Create invitations in shared storage
    newCollabs.forEach((collab) => {
      createInvitation(
        project.id,
        project.name,
        user,
        { id: collab.id, email: collab.email, name: collab.name, color: collab.avatarColor },
        collab.role
      );
    });

    setCollaborators((prev) => [...prev, ...newCollabs]);

    // Simulate joining after delay (for demo feel)
    newCollabs.forEach((collab, i) => {
      setTimeout(() => {
        setCollaborators((prev) =>
          prev.map((c) => (c.id === collab.id ? { ...c, status: "joined" as const, isOnline: true, joinedAt: Date.now() } : c))
        );
        const joinMsg: Message = {
          id: `msg-join-${collab.id}-${Date.now()}`,
          role: "collaborator",
          content: `大家好！我加入了共创空间 👋`,
          timestamp: Date.now(),
          authorId: collab.id,
          authorName: collab.name,
          authorRole: collab.role,
          avatarColor: collab.avatarColor,
        };
        setMessages((prev) => [...prev, joinMsg]);
        addProjectMessage(project.id, joinMsg);
      }, 2000 + i * 1500);
    });
  }, [project, user]);

  const handleAddComment = useCallback((comment: Comment) => {
    if (!project || !user) return;
    setComments((prev) => [...prev, comment]);
    addProjectComment(project.id, comment, user.color || getUserColor(user.id));
  }, [project, user]);

  const handlePlanChange = useCallback((newPlan: string) => {
    if (!project || !user) return;
    const oldPlan = currentPlan;
    setCurrentPlan(newPlan);

    // Track the edit
    addPlanEdit(project.id, user, oldPlan, newPlan);
    setPlanEdits(getPlanEdits(project.id));

    // Update project
    updateProject(project.id, { planMarkdown: newPlan });
  }, [project, user, currentPlan]);

  const startBuild = useCallback(() => {
    buildTimersRef.current.forEach(clearTimeout);
    buildTimersRef.current = [];

    buildTimeline.forEach((step) => {
      const timer = setTimeout(() => {
        setModules((prev) =>
          prev.map((m) =>
            m.id === step.moduleId
              ? { ...m, status: step.status, testCoverage: step.testCoverage }
              : m
          )
        );
        if (step.codeFileIndex !== null) {
          setCodeFiles((prev) => {
            const file = mockCodeFiles[step.codeFileIndex!];
            if (!prev.find((f) => f.path === file.path)) {
              return [...prev, file];
            }
            return prev;
          });
        }
        const lastStep = buildTimeline[buildTimeline.length - 1];
        if (step === lastStep) {
          setTimeout(() => {
            setPhase("complete");
            setBuildComplete(true);
            if (project) {
              updateProject(project.id, { phase: "complete", buildComplete: true });
            }
            addMessage(
              "assistant",
              "🎉 所有模块构建完成！\n\n✅ Auth 认证 - 测试覆盖 95%\n✅ Task 任务 - 测试覆盖 88%\n✅ Category 分类 - 测试覆盖 92%\n✅ Notification 通知 - 测试覆盖 90%\n\n应用已准备好部署，你可以在预览面板查看效果。"
            );
          }, 500);
        }
      }, step.delay);
      buildTimersRef.current.push(timer);
    });
  }, [addMessage, project]);

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!user) return;

      // Add user message with their color
      addMessage("user", content, {
        authorId: user.id,
        authorName: user.name || user.email?.split("@")[0],
        avatarColor: user.color || getUserColor(user.id),
      });

      setIsTyping(true);
      const typingDelay = 800 + Math.random() * 1200;

      setTimeout(() => {
        setIsTyping(false);
        const result = matchResponse(content, phase);

        if (result) {
          addMessage("assistant", result.response);

          if (result.nextPhase) {
            setPhase(result.nextPhase);
            if (project) {
              updateProject(project.id, { phase: result.nextPhase });
            }
            if (result.nextPhase === "architecture") {
              setModules(defaultModules);
            }
            if (result.nextPhase === "building") {
              startBuild();
            }
          }
        }

        // Simulate collaborator response
        const otherCollabs = collaborators.filter((c) => c.isOnline && c.id !== user.id);
        if (otherCollabs.length > 0 && Math.random() > 0.4) {
          const randomCollab = otherCollabs[Math.floor(Math.random() * otherCollabs.length)];
          const collabResponses = [
            "这个方案看起来不错 👍",
            "我同意这个设计思路",
            "建议我们先做核心功能，其他的后续迭代",
            "接口设计需要考虑一下扩展性",
            "性能方面有没有什么考量？",
          ];
          setTimeout(() => {
            addMessage("collaborator", collabResponses[Math.floor(Math.random() * collabResponses.length)], {
              authorId: randomCollab.id,
              authorName: randomCollab.name,
              authorRole: randomCollab.role,
              avatarColor: randomCollab.avatarColor,
            });
          }, typingDelay + 1500 + Math.random() * 2000);
        }
      }, typingDelay);
    },
    [addMessage, startBuild, phase, collaborators, user, project]
  );

  const showModuleGraph = phase === "architecture" || phase === "building" || phase === "complete";
  const isGroupChat = collaborators.length > 1;

  // Auth loading state
  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1e1e2e]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#7c3aed] flex items-center justify-center animate-pulse">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <span className="text-sm text-[#94a3b8]">加载中...</span>
        </div>
      </div>
    );
  }

  if (!user || !project) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1e1e2e]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#7c3aed] flex items-center justify-center animate-pulse">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <span className="text-sm text-[#94a3b8]">加载项目...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#1e1e2e] overflow-hidden">
      {/* Top bar */}
      <div className="h-12 border-b border-[#3d3d5c] flex items-center px-4 shrink-0">
        <button
          onClick={() => navigate("/projects")}
          className="p-1.5 rounded hover:bg-[#3d3d5c] text-[#64748b] hover:text-[#e2e8f0] transition-colors mr-2"
          title="返回项目列表"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#7c3aed] flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className="text-sm font-semibold text-[#e2e8f0]">Atoms</span>
        </div>
        <div className="ml-4 flex items-center gap-2">
          <span className="text-xs text-[#64748b]">项目:</span>
          <span className="text-xs text-[#94a3b8] font-mono">{project.name}</span>
        </div>

        {/* Collaborator bar */}
        <div className="ml-6">
          <CollaboratorBar
            collaborators={collaborators}
            onInviteClick={() => setShowInvitePanel(true)}
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            phase === "idle" ? "bg-[#64748b]/20 text-[#64748b]" :
            phase === "planning" ? "bg-[#3b82f6]/20 text-[#60a5fa]" :
            phase === "architecture" ? "bg-[#a855f7]/20 text-[#c084fc]" :
            phase === "building" ? "bg-[#eab308]/20 text-[#eab308]" :
            "bg-[#22c55e]/20 text-[#22c55e]"
          }`}>
            {phase === "idle" ? "等待输入" :
             phase === "planning" ? "需求确认" :
             phase === "architecture" ? "架构设计" :
             phase === "building" ? "构建中" :
             "已完成"}
          </span>
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[#3d3d5c]">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: user.color || getUserColor(user.id) }}
            >
              <span className="text-[10px] text-white font-bold">
                {(user.name || user.email)[0].toUpperCase()}
              </span>
            </div>
            <span className="text-[11px] text-[#94a3b8] max-w-[120px] truncate">
              {user.name || user.email}
            </span>
            <button
              onClick={handleLogout}
              className="p-1 rounded hover:bg-[#3d3d5c] text-[#64748b] hover:text-[#e2e8f0] transition-colors"
              title="退出登录"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Chat Panel - left */}
        <div className={`${showModuleGraph ? "w-[30%]" : "w-[40%]"} min-w-0 shrink-0 transition-all duration-300`}>
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
            collaborators={collaborators}
            isGroupChat={isGroupChat}
          />
        </div>

        {/* Module Graph - middle */}
        {showModuleGraph && (
          <div className="w-[25%] min-w-0 shrink-0 transition-all duration-300">
            <ModuleGraph
              modules={modules}
              visible={showModuleGraph}
              comments={comments}
              currentUser={currentUser}
              onAddComment={handleAddComment}
            />
          </div>
        )}

        {/* App Viewer - right */}
        <div className={`${showModuleGraph ? "w-[45%]" : "w-[60%]"} min-w-0 shrink-0 transition-all duration-300`}>
          <AppViewer
            phase={phase}
            planMarkdown={currentPlan}
            codeFiles={codeFiles}
            buildComplete={buildComplete}
            onPlanChange={handlePlanChange}
            planAnnotations={planAnnotations}
            planEdits={planEdits}
            currentUserId={user.id}
          />
        </div>
      </div>

      {/* Invite Panel Modal */}
      <InvitePanel
        isOpen={showInvitePanel}
        onClose={() => setShowInvitePanel(false)}
        collaborators={collaborators}
        onInvite={handleInvite}
        projectId={project.id}
        currentUser={user}
      />
    </div>
  );
}

// Default demo messages for a project
function getDefaultMessages(project: Project): Message[] {
  return [
    {
      id: "msg-init-1",
      role: "user",
      content: `帮我做一个${project.name}`,
      timestamp: Date.now() - 5000,
      authorId: project.ownerId,
      authorName: project.ownerName,
      avatarColor: project.ownerColor,
    },
    {
      id: "msg-init-2",
      role: "assistant",
      content: "好的，我来帮你构建这个应用。让我先确认一下需求：\n\n1. 用户可以创建、编辑、删除任务\n2. 任务有优先级和截止日期\n3. 支持任务分类和标签\n\n这个方向对吗？还是你有其他想法？",
      timestamp: Date.now() - 4000,
    },
    {
      id: "msg-init-3",
      role: "user",
      content: "确认，开始吧",
      timestamp: Date.now() - 3000,
      authorId: project.ownerId,
      authorName: project.ownerName,
      avatarColor: project.ownerColor,
    },
    {
      id: "msg-init-4",
      role: "assistant",
      content: "很好！我来拆分任务：\n\n**模块拆分：**\n1. 🔐 Auth 模块 - 用户认证\n2. 📋 Task 模块 - 任务 CRUD\n3. 🏷️ Category 模块 - 分类管理\n4. 🔔 Notification 模块 - 提醒通知\n\n每个模块的接口和依赖关系已经在右侧展示。确认后我开始构建？",
      timestamp: Date.now() - 2000,
    },
  ];
}