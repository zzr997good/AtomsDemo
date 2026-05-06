import { useState } from "react";
import { X, UserPlus, Users, Send, Check } from "lucide-react";
import { Collaborator, CollaboratorRole } from "@/lib/types";
import { DEMO_ACCOUNTS, UserInfo, getRegisteredUsers, getUserColor } from "@/lib/auth";
import { getRoleLabel, getRoleColor } from "@/lib/collaboration";

interface InvitePanelProps {
  isOpen: boolean;
  onClose: () => void;
  collaborators: Collaborator[];
  onInvite: (collaborators: Collaborator[]) => void;
  projectId?: string;
  currentUser?: UserInfo | null;
}

const roles: CollaboratorRole[] = ["coworker", "mentor", "leader", "stakeholder"];

export function InvitePanel({ isOpen, onClose, collaborators, onInvite, currentUser }: InvitePanelProps) {
  const [selectedRole, setSelectedRole] = useState<CollaboratorRole>("coworker");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  // Get all available users (demo + registered) excluding current user and already-in collaborators
  const allUsers: UserInfo[] = [...DEMO_ACCOUNTS];
  try {
    const registered = getRegisteredUsers();
    for (const r of registered) {
      allUsers.push({ id: r.id, email: r.email, name: r.name, color: r.color });
    }
  } catch { /* ignore */ }

  const existingIds = new Set(collaborators.map((c) => c.id));
  const availableUsers = allUsers.filter(
    (u) => u.id !== currentUser?.id && !existingIds.has(u.id)
  );

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleInvite = () => {
    if (selectedUsers.size === 0) return;

    const newCollabs: Collaborator[] = [];
    selectedUsers.forEach((uid) => {
      const account = allUsers.find((a) => a.id === uid);
      if (account) {
        newCollabs.push({
          id: account.id,
          email: account.email,
          name: account.name || account.email.split("@")[0],
          role: selectedRole,
          status: "invited",
          isOnline: false,
          avatarColor: account.color || getUserColor(account.id),
        });
      }
    });

    onInvite(newCollabs);
    setSelectedUsers(new Set());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#2d2d3d] rounded-xl border border-[#3d3d5c] shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3d3d5c]">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#7c3aed]" />
            <h2 className="text-base font-semibold text-[#e2e8f0]">邀请协作者</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#3d3d5c] text-[#64748b] hover:text-[#e2e8f0] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role selection */}
        <div className="p-4 pb-2">
          <label className="text-xs text-[#94a3b8] mb-2 block">邀请身份</label>
          <div className="grid grid-cols-2 gap-2">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  selectedRole === role
                    ? "border-[#7c3aed] bg-[#7c3aed]/10 text-[#c084fc]"
                    : "border-[#3d3d5c] text-[#94a3b8] hover:border-[#64748b]"
                }`}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: getRoleColor(role) }}
                />
                {getRoleLabel(role)}
              </button>
            ))}
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto p-4 pt-2">
          <label className="text-xs text-[#94a3b8] mb-2 block">选择要邀请的用户</label>

          {availableUsers.length === 0 ? (
            <div className="text-center py-8 text-[#64748b]">
              <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">所有用户都已在项目中</p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableUsers.map((account) => {
                const isSelected = selectedUsers.has(account.id);
                return (
                  <button
                    key={account.id}
                    onClick={() => toggleUser(account.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                      isSelected
                        ? "border-[#7c3aed] bg-[#7c3aed]/10"
                        : "border-[#3d3d5c] hover:border-[#64748b] bg-[#1e1e2e]"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: account.color || getUserColor(account.id) }}
                    >
                      {(account.name || account.email)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-xs font-medium text-[#e2e8f0]">{account.name || account.email.split("@")[0]}</div>
                      <div className="text-[10px] text-[#64748b] truncate">{account.email}</div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#7c3aed] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Current collaborators */}
          {collaborators.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#3d3d5c]">
              <h3 className="text-xs font-medium text-[#94a3b8] mb-2">
                已在项目中 ({collaborators.length})
              </h3>
              <div className="space-y-2">
                {collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center gap-2 px-3 py-2 bg-[#1e1e2e] rounded-lg opacity-60"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: collab.avatarColor }}
                    >
                      {collab.name[0].toUpperCase()}
                    </div>
                    <span className="text-xs text-[#e2e8f0]">{collab.name}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-auto"
                      style={{
                        backgroundColor: `${getRoleColor(collab.role)}20`,
                        color: getRoleColor(collab.role),
                      }}
                    >
                      {getRoleLabel(collab.role)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#3d3d5c]">
          <button
            onClick={handleInvite}
            disabled={selectedUsers.size === 0}
            className="w-full py-2.5 bg-[#7c3aed] text-white text-sm font-medium rounded-lg hover:bg-[#6d28d9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            邀请 {selectedUsers.size > 0 ? `(${selectedUsers.size})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}