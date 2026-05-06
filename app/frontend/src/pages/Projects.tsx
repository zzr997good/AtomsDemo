import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout, UserInfo, DEMO_ACCOUNTS } from "@/lib/auth";
import {
  getUserProjects,
  getOwnedProjects,
  getJoinedProjects,
  getUserPendingInvitations,
  acceptInvitation,
  declineInvitation,
  createProject,
  Invitation,
  Project,
} from "@/lib/projectStore";
import { LogOut, Plus, FolderOpen, Users, Bell, Check, X, Sparkles } from "lucide-react";

export default function Projects() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
  const [joinedProjects, setJoinedProjects] = useState<Project[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const wasLoggedOut = sessionStorage.getItem("atoms_logged_out");
      if (wasLoggedOut === "true") {
        navigate("/login", { replace: true });
        return;
      }
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          refreshData(currentUser);
        } else {
          navigate("/login", { replace: true });
        }
      } catch {
        navigate("/login", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const refreshData = (u: UserInfo) => {
    setOwnedProjects(getOwnedProjects(u.id));
    setJoinedProjects(getJoinedProjects(u.id));
    setPendingInvitations(getUserPendingInvitations(u.id));
  };

  const handleLogout = () => {
    sessionStorage.setItem("atoms_logged_out", "true");
    logout();
    window.location.href = "/login";
  };

  const handleAcceptInvitation = (inv: Invitation) => {
    acceptInvitation(inv.id);
    if (user) refreshData(user);
  };

  const handleDeclineInvitation = (inv: Invitation) => {
    declineInvitation(inv.id);
    if (user) refreshData(user);
  };

  const handleCreateProject = () => {
    if (!user || !newProjectName.trim()) return;
    const project = createProject(user, newProjectName.trim(), newProjectDesc.trim());
    setShowNewProject(false);
    setNewProjectName("");
    setNewProjectDesc("");
    navigate(`/project/${project.id}`);
  };

  const handleOpenProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1e1e2e]">
        <div className="w-8 h-8 rounded bg-[#7c3aed] flex items-center justify-center animate-pulse">
          <span className="text-white text-sm font-bold">A</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen w-screen bg-[#1e1e2e] overflow-y-auto">
      {/* Header */}
      <div className="border-b border-[#3d3d5c] px-6 py-4 flex items-center sticky top-0 bg-[#1e1e2e] z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#7c3aed] flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className="text-sm font-semibold text-[#e2e8f0]">Atoms</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: user.color || "#7c3aed" }}
            >
              {(user.name || user.email)[0].toUpperCase()}
            </div>
            <span className="text-sm text-[#e2e8f0]">{user.name || user.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded hover:bg-[#3d3d5c] text-[#64748b] hover:text-[#e2e8f0] transition-colors"
            title="退出登录"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-amber-400">
                待处理邀请 ({pendingInvitations.length})
              </h2>
            </div>
            <div className="space-y-3">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: inv.fromUserColor }}
                  >
                    {inv.fromUserName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#e2e8f0]">
                      <span className="font-medium" style={{ color: inv.fromUserColor }}>
                        {inv.fromUserName}
                      </span>
                      {" "}邀请你加入项目
                    </p>
                    <p className="text-xs text-[#94a3b8] mt-0.5">
                      「{inv.projectName}」· 身份: {inv.role === "coworker" ? "协作者" : inv.role === "leader" ? "负责人" : inv.role}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAcceptInvitation(inv)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#22c55e]/20 text-[#22c55e] text-xs font-medium hover:bg-[#22c55e]/30 transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      接受
                    </button>
                    <button
                      onClick={() => handleDeclineInvitation(inv)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors"
                    >
                      <X className="w-3 h-3" />
                      拒绝
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Projects */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-[#7c3aed]" />
              <h2 className="text-sm font-semibold text-[#e2e8f0]">我的项目</h2>
            </div>
            <button
              onClick={() => setShowNewProject(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7c3aed] text-white text-xs font-medium hover:bg-[#6d28d9] transition-colors"
            >
              <Plus className="w-3 h-3" />
              新建项目
            </button>
          </div>

          {showNewProject && (
            <div className="mb-4 p-4 rounded-xl border border-[#3d3d5c] bg-[#2d2d3d]">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="项目名称"
                className="w-full px-3 py-2 bg-[#1e1e2e] border border-[#3d3d5c] rounded-lg text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50 mb-2"
                autoFocus
              />
              <input
                type="text"
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="项目描述（可选）"
                className="w-full px-3 py-2 bg-[#1e1e2e] border border-[#3d3d5c] rounded-lg text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50 mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                  className="px-4 py-2 bg-[#7c3aed] text-white text-xs font-medium rounded-lg hover:bg-[#6d28d9] disabled:opacity-40 transition-colors"
                >
                  创建
                </button>
                <button
                  onClick={() => setShowNewProject(false)}
                  className="px-4 py-2 text-[#94a3b8] text-xs font-medium rounded-lg hover:bg-[#3d3d5c] transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {ownedProjects.length === 0 && !showNewProject ? (
            <div className="text-center py-12 border border-dashed border-[#3d3d5c] rounded-xl">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-[#64748b]" />
              <p className="text-sm text-[#64748b]">还没有项目</p>
              <p className="text-xs text-[#4a5568] mt-1">点击"新建项目"开始你的第一个共创</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {ownedProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleOpenProject(project.id)}
                  className="w-full text-left p-4 rounded-xl border border-[#3d3d5c] hover:border-[#7c3aed] bg-[#2d2d3d] hover:bg-[#2d2d3d]/80 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#7c3aed]/20 flex items-center justify-center text-[#7c3aed] group-hover:bg-[#7c3aed]/30 transition-colors">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#e2e8f0]">{project.name}</div>
                      {project.description && (
                        <div className="text-xs text-[#64748b] mt-0.5 truncate">{project.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {project.collaboratorIds.length > 1 && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#3d3d5c]">
                          <Users className="w-3 h-3 text-[#94a3b8]" />
                          <span className="text-[10px] text-[#94a3b8]">{project.collaboratorIds.length}</span>
                        </div>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        project.phase === "idle" ? "bg-[#64748b]/20 text-[#64748b]" :
                        project.phase === "complete" ? "bg-[#22c55e]/20 text-[#22c55e]" :
                        "bg-[#7c3aed]/20 text-[#c084fc]"
                      }`}>
                        {project.phase === "idle" ? "未开始" :
                         project.phase === "complete" ? "已完成" : "进行中"}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Joined Projects (from invitations) */}
        {joinedProjects.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-[#3b82f6]" />
              <h2 className="text-sm font-semibold text-[#e2e8f0]">参与的共创项目</h2>
            </div>
            <div className="grid gap-3">
              {joinedProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleOpenProject(project.id)}
                  className="w-full text-left p-4 rounded-xl border border-[#3d3d5c] hover:border-[#3b82f6] bg-[#2d2d3d] hover:bg-[#2d2d3d]/80 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ backgroundColor: project.ownerColor }}
                    >
                      {project.ownerName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#e2e8f0]">{project.name}</div>
                      <div className="text-xs text-[#64748b] mt-0.5">
                        由 <span style={{ color: project.ownerColor }}>{project.ownerName}</span> 创建
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#3d3d5c]">
                        <Users className="w-3 h-3 text-[#94a3b8]" />
                        <span className="text-[10px] text-[#94a3b8]">{project.collaboratorIds.length}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}