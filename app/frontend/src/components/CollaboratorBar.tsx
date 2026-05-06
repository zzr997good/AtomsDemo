import { useState } from "react";
import { Collaborator } from "@/lib/types";
import { getRoleLabel, getRoleColor } from "@/lib/collaboration";
import { UserPlus, ChevronDown } from "lucide-react";

interface CollaboratorBarProps {
  collaborators: Collaborator[];
  onInviteClick: () => void;
}

export function CollaboratorBar({ collaborators, onInviteClick }: CollaboratorBarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const onlineCollabs = collaborators.filter((c) => c.isOnline);
  const joinedCollabs = collaborators.filter((c) => c.status === "joined");

  return (
    <div className="relative flex items-center gap-2">
      {/* Avatar stack */}
      <div
        className="flex items-center cursor-pointer"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="flex -space-x-1.5">
          {onlineCollabs.slice(0, 4).map((collab) => (
            <div
              key={collab.id}
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#1e1e2e] relative"
              style={{ backgroundColor: collab.avatarColor }}
              title={`${collab.name} (${getRoleLabel(collab.role)})`}
            >
              {collab.name[0].toUpperCase()}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#22c55e] rounded-full border border-[#1e1e2e]" />
            </div>
          ))}
          {onlineCollabs.length > 4 && (
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium text-[#94a3b8] bg-[#3d3d5c] border-2 border-[#1e1e2e]">
              +{onlineCollabs.length - 4}
            </div>
          )}
        </div>
        {joinedCollabs.length > 0 && (
          <div className="flex items-center ml-1">
            <span className="text-[10px] text-[#94a3b8]">
              {onlineCollabs.length}人在线
            </span>
            <ChevronDown className="w-3 h-3 text-[#64748b] ml-0.5" />
          </div>
        )}
      </div>

      {/* Invite button */}
      <button
        onClick={onInviteClick}
        className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#7c3aed]/10 text-[#c084fc] hover:bg-[#7c3aed]/20 transition-colors text-[10px] font-medium"
      >
        <UserPlus className="w-3 h-3" />
        邀请
      </button>

      {/* Dropdown */}
      {showDropdown && joinedCollabs.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute top-full right-0 mt-2 z-50 w-64 bg-[#2d2d3d] border border-[#3d3d5c] rounded-lg shadow-xl overflow-hidden">
            <div className="p-2 border-b border-[#3d3d5c]">
              <span className="text-[10px] text-[#64748b] font-medium">
                共创空间成员 ({collaborators.length})
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              {collaborators.map((collab) => (
                <div
                  key={collab.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#1e1e2e] transition-colors"
                >
                  <div className="relative">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                      style={{ backgroundColor: collab.avatarColor }}
                    >
                      {collab.name[0].toUpperCase()}
                    </div>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#2d2d3d] ${
                        collab.isOnline ? "bg-[#22c55e]" : "bg-[#64748b]"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-[#e2e8f0] truncate">
                        {collab.name}
                      </span>
                      <span
                        className="text-[9px] px-1 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor: `${getRoleColor(collab.role)}20`,
                          color: getRoleColor(collab.role),
                        }}
                      >
                        {getRoleLabel(collab.role)}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#64748b]">
                      {collab.isOnline ? "在线" : "离线"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}