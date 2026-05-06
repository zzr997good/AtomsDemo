export type CollaboratorRole = "coworker" | "mentor" | "leader" | "stakeholder";

export interface Collaborator {
  id: string;
  email: string;
  name: string;
  role: CollaboratorRole;
  status: "invited" | "joined" | "offline";
  isOnline: boolean;
  avatarColor: string;
  joinedAt?: number;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: CollaboratorRole;
  content: string;
  targetType: "module" | "plan" | "code";
  targetId?: string;
  timestamp: number;
}

export interface PlanAnnotation {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: CollaboratorRole;
  avatarColor: string;
  type: "comment" | "suggestion" | "modification";
  /** Which section of the plan this annotation targets (e.g., "Auth 认证模块") */
  targetSection: string;
  content: string;
  timestamp: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "collaborator";
  content: string;
  timestamp: number;
  authorId?: string;
  authorName?: string;
  authorRole?: CollaboratorRole;
  avatarColor?: string;
  mention?: string; // @mentioned collaborator id
}

export interface ModuleInterface {
  name: string;
  type: "input" | "output";
}

export interface Module {
  id: string;
  name: string;
  status: "red" | "yellow" | "green";
  testCoverage: number;
  interfaces: ModuleInterface[];
  dependencies: string[]; // ids of modules this depends on
  comments?: Comment[];
}

export interface CodeFile {
  name: string;
  path: string;
  content: string;
  language: string;
  editingBy?: string; // collaborator id currently editing
}

export type Phase = "idle" | "planning" | "architecture" | "building" | "complete";

export interface AppState {
  phase: Phase;
  messages: Message[];
  modules: Module[];
  codeFiles: CodeFile[];
  currentBuildStep: number;
  planMarkdown: string;
  collaborators: Collaborator[];
}