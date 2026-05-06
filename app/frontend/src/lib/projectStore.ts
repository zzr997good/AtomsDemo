/**
 * Project Store - localStorage-based shared storage for multi-user collaboration demo.
 * 
 * All users share the same localStorage (same browser), so data written by Alice
 * is visible when Bob logs in. This simulates a real-time collaborative backend.
 */

import { Message, PlanAnnotation, Collaborator, Module, Comment, Phase, CollaboratorRole } from "./types";
import { DEMO_ACCOUNTS, getUserColor, UserInfo } from "./auth";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  ownerColor: string;
  createdAt: number;
  phase: Phase;
  planMarkdown: string;
  buildComplete: boolean;
  modules: Module[];
  collaboratorIds: string[]; // user ids who are part of this project
}

export interface Invitation {
  id: string;
  projectId: string;
  projectName: string;
  fromUserId: string;
  fromUserName: string;
  fromUserColor: string;
  toUserId: string;
  toUserName: string;
  role: CollaboratorRole;
  status: "pending" | "accepted" | "declined";
  createdAt: number;
}

export interface PlanEdit {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userColor: string;
  oldContent: string;
  newContent: string;
  timestamp: number;
}

export interface ProjectMessage extends Message {
  projectId: string;
}

export interface ProjectComment extends Comment {
  projectId: string;
  userColor: string;
}

// ─── Storage Keys ───────────────────────────────────────────────────────────

const PROJECTS_KEY = "atoms_projects";
const INVITATIONS_KEY = "atoms_invitations";
const PROJECT_MESSAGES_KEY = "atoms_project_messages";
const PROJECT_COMMENTS_KEY = "atoms_project_comments";
const PLAN_EDITS_KEY = "atoms_plan_edits";
const PLAN_ANNOTATIONS_KEY = "atoms_plan_annotations_v2";

// ─── Helper ─────────────────────────────────────────────────────────────────

function getStorage<T>(key: string): T[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Projects ───────────────────────────────────────────────────────────────

export function getProjects(): Project[] {
  return getStorage<Project>(PROJECTS_KEY);
}

export function getProjectById(projectId: string): Project | undefined {
  return getProjects().find((p) => p.id === projectId);
}

export function getUserProjects(userId: string): Project[] {
  const all = getProjects();
  return all.filter((p) => p.ownerId === userId || p.collaboratorIds.includes(userId));
}

export function getOwnedProjects(userId: string): Project[] {
  return getProjects().filter((p) => p.ownerId === userId);
}

export function getJoinedProjects(userId: string): Project[] {
  return getProjects().filter((p) => p.ownerId !== userId && p.collaboratorIds.includes(userId));
}

export function createProject(owner: UserInfo, name: string, description: string): Project {
  const projects = getProjects();
  const project: Project = {
    id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    description,
    ownerId: owner.id,
    ownerName: owner.name || owner.email.split("@")[0],
    ownerColor: owner.color || getUserColor(owner.id),
    createdAt: Date.now(),
    phase: "idle",
    planMarkdown: "",
    buildComplete: false,
    modules: [],
    collaboratorIds: [owner.id],
  };
  projects.push(project);
  setStorage(PROJECTS_KEY, projects);
  return project;
}

export function updateProject(projectId: string, updates: Partial<Project>): void {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx >= 0) {
    projects[idx] = { ...projects[idx], ...updates };
    setStorage(PROJECTS_KEY, projects);
  }
}

export function ensureDefaultProject(user: UserInfo): Project {
  const owned = getOwnedProjects(user.id);
  if (owned.length > 0) return owned[0];
  return createProject(user, "任务管理应用", "一个多人协作的任务管理应用");
}

// ─── Invitations ────────────────────────────────────────────────────────────

export function getInvitations(): Invitation[] {
  return getStorage<Invitation>(INVITATIONS_KEY);
}

export function getUserPendingInvitations(userId: string): Invitation[] {
  return getInvitations().filter((inv) => inv.toUserId === userId && inv.status === "pending");
}

export function createInvitation(
  projectId: string,
  projectName: string,
  fromUser: UserInfo,
  toUser: UserInfo,
  role: CollaboratorRole
): Invitation {
  const invitations = getInvitations();
  
  // Check if already invited
  const existing = invitations.find(
    (inv) => inv.projectId === projectId && inv.toUserId === toUser.id && inv.status === "pending"
  );
  if (existing) return existing;

  const invitation: Invitation = {
    id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    projectId,
    projectName,
    fromUserId: fromUser.id,
    fromUserName: fromUser.name || fromUser.email.split("@")[0],
    fromUserColor: fromUser.color || getUserColor(fromUser.id),
    toUserId: toUser.id,
    toUserName: toUser.name || toUser.email.split("@")[0],
    role,
    status: "pending",
    createdAt: Date.now(),
  };
  invitations.push(invitation);
  setStorage(INVITATIONS_KEY, invitations);
  return invitation;
}

export function acceptInvitation(invitationId: string): void {
  const invitations = getInvitations();
  const idx = invitations.findIndex((inv) => inv.id === invitationId);
  if (idx < 0) return;

  invitations[idx].status = "accepted";
  setStorage(INVITATIONS_KEY, invitations);

  // Add user to project collaborators
  const projects = getProjects();
  const projIdx = projects.findIndex((p) => p.id === invitations[idx].projectId);
  if (projIdx >= 0) {
    if (!projects[projIdx].collaboratorIds.includes(invitations[idx].toUserId)) {
      projects[projIdx].collaboratorIds.push(invitations[idx].toUserId);
      setStorage(PROJECTS_KEY, projects);
    }
  }
}

export function declineInvitation(invitationId: string): void {
  const invitations = getInvitations();
  const idx = invitations.findIndex((inv) => inv.id === invitationId);
  if (idx >= 0) {
    invitations[idx].status = "declined";
    setStorage(INVITATIONS_KEY, invitations);
  }
}

// ─── Project Messages ───────────────────────────────────────────────────────

export function getProjectMessages(projectId: string): ProjectMessage[] {
  return getStorage<ProjectMessage>(PROJECT_MESSAGES_KEY).filter((m) => m.projectId === projectId);
}

export function addProjectMessage(projectId: string, msg: Message): void {
  const messages = getStorage<ProjectMessage>(PROJECT_MESSAGES_KEY);
  messages.push({ ...msg, projectId });
  setStorage(PROJECT_MESSAGES_KEY, messages);
}

// ─── Project Comments ───────────────────────────────────────────────────────

export function getProjectComments(projectId: string): ProjectComment[] {
  return getStorage<ProjectComment>(PROJECT_COMMENTS_KEY).filter((c) => c.projectId === projectId);
}

export function addProjectComment(projectId: string, comment: Comment, userColor: string): void {
  const comments = getStorage<ProjectComment>(PROJECT_COMMENTS_KEY);
  comments.push({ ...comment, projectId, userColor });
  setStorage(PROJECT_COMMENTS_KEY, comments);
}

// ─── Plan Edits (Track who modified what) ───────────────────────────────────

export function getPlanEdits(projectId: string): PlanEdit[] {
  return getStorage<PlanEdit>(PLAN_EDITS_KEY).filter((e) => e.projectId === projectId);
}

export function addPlanEdit(projectId: string, user: UserInfo, oldContent: string, newContent: string): void {
  const edits = getStorage<PlanEdit>(PLAN_EDITS_KEY);
  edits.push({
    id: `edit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    projectId,
    userId: user.id,
    userName: user.name || user.email.split("@")[0],
    userColor: user.color || getUserColor(user.id),
    oldContent,
    newContent,
    timestamp: Date.now(),
  });
  setStorage(PLAN_EDITS_KEY, edits);
}

// ─── Plan Annotations (per project) ────────────────────────────────────────

export function getProjectAnnotations(projectId: string): PlanAnnotation[] {
  const all = getStorage<PlanAnnotation & { projectId: string }>(PLAN_ANNOTATIONS_KEY);
  return all.filter((a) => a.projectId === projectId);
}

export function addProjectAnnotation(projectId: string, annotation: PlanAnnotation): void {
  const all = getStorage<PlanAnnotation & { projectId: string }>(PLAN_ANNOTATIONS_KEY);
  all.push({ ...annotation, projectId });
  setStorage(PLAN_ANNOTATIONS_KEY, all);
}

// ─── Get collaborator info for a project ────────────────────────────────────

export function getProjectCollaborators(projectId: string): Collaborator[] {
  const project = getProjectById(projectId);
  if (!project) return [];

  const allAccounts = [...DEMO_ACCOUNTS];
  // Also check registered users
  try {
    const registered = JSON.parse(localStorage.getItem("atoms_registered_users") || "[]");
    for (const r of registered) {
      allAccounts.push({ id: r.id, email: r.email, name: r.name, color: r.color });
    }
  } catch { /* ignore */ }

  return project.collaboratorIds.map((uid) => {
    const account = allAccounts.find((a) => a.id === uid);
    const isOwner = uid === project.ownerId;
    return {
      id: uid,
      email: account?.email || `${uid}@demo.com`,
      name: account?.name || uid,
      role: isOwner ? "leader" as CollaboratorRole : "coworker" as CollaboratorRole,
      status: "joined" as const,
      isOnline: true,
      avatarColor: account?.color || getUserColor(uid),
      joinedAt: project.createdAt,
    };
  });
}