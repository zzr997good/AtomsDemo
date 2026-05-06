import { Collaborator, CollaboratorRole, Comment } from "./types";

const avatarColors = [
  "#f43f5e", "#ec4899", "#a855f7", "#6366f1",
  "#3b82f6", "#06b6d4", "#14b8a6", "#22c55e",
  "#eab308", "#f97316",
];

let colorIndex = 0;
function getNextColor(): string {
  const color = avatarColors[colorIndex % avatarColors.length];
  colorIndex++;
  return color;
}

export function createCollaborator(
  email: string,
  role: CollaboratorRole,
  name?: string
): Collaborator {
  const displayName = name || email.split("@")[0];
  return {
    id: `collab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    email,
    name: displayName,
    role,
    status: "invited",
    isOnline: false,
    avatarColor: getNextColor(),
  };
}

export function createBatchCollaborators(
  entries: { email: string; role: CollaboratorRole; name?: string }[]
): Collaborator[] {
  return entries.map((e) => createCollaborator(e.email, e.role, e.name));
}

export function simulateJoin(collaborator: Collaborator): Collaborator {
  return {
    ...collaborator,
    status: "joined",
    isOnline: true,
    joinedAt: Date.now(),
  };
}

export function getRoleLabel(role: CollaboratorRole): string {
  const labels: Record<CollaboratorRole, string> = {
    coworker: "协作者",
    mentor: "导师",
    leader: "负责人",
    stakeholder: "利益相关方",
  };
  return labels[role];
}

export function getRoleColor(role: CollaboratorRole): string {
  const colors: Record<CollaboratorRole, string> = {
    coworker: "#3b82f6",
    mentor: "#a855f7",
    leader: "#f97316",
    stakeholder: "#22c55e",
  };
  return colors[role];
}

// Mock collaborators for demo
export const mockCollaborators: Collaborator[] = [
  {
    id: "collab-1",
    email: "alice@team.com",
    name: "Alice",
    role: "leader",
    status: "joined",
    isOnline: true,
    avatarColor: "#f97316",
    joinedAt: Date.now() - 60000,
  },
  {
    id: "collab-2",
    email: "bob@team.com",
    name: "Bob",
    role: "coworker",
    status: "joined",
    isOnline: true,
    avatarColor: "#3b82f6",
    joinedAt: Date.now() - 30000,
  },
  {
    id: "collab-3",
    email: "carol@team.com",
    name: "Carol",
    role: "mentor",
    status: "invited",
    isOnline: false,
    avatarColor: "#a855f7",
  },
];

export const mockComments: Comment[] = [
  {
    id: "comment-1",
    authorId: "collab-1",
    authorName: "Alice",
    authorRole: "leader",
    content: "Auth 模块建议使用 OAuth2.0 方案，支持第三方登录",
    targetType: "module",
    targetId: "mod-auth",
    timestamp: Date.now() - 45000,
  },
  {
    id: "comment-2",
    authorId: "collab-2",
    authorName: "Bob",
    authorRole: "coworker",
    content: "Task 模块的优先级字段建议用枚举而不是数字",
    targetType: "module",
    targetId: "mod-task",
    timestamp: Date.now() - 20000,
  },
];

// Plan annotation templates - collaborators will suggest changes to the plan
import { PlanAnnotation } from "./types";

interface PlanAnnotationTemplate {
  targetSection: string;
  content: string;
  type: PlanAnnotation["type"];
}

const planAnnotationTemplates: Record<string, PlanAnnotationTemplate[]> = {
  "collab-1": [
    {
      targetSection: "Auth 认证模块",
      content: "建议增加 OAuth2.0 第三方登录（Google/GitHub），提升用户体验",
      type: "suggestion",
    },
    {
      targetSection: "数据库表结构",
      content: "users 表应该加上 avatar_url 和 display_name 字段",
      type: "modification",
    },
    {
      targetSection: "技术栈",
      content: "前端状态管理建议用 Zustand，比 Context 更轻量",
      type: "suggestion",
    },
    {
      targetSection: "Notification 通知模块",
      content: "通知推送可以考虑 WebSocket 实时推送，而不是轮询",
      type: "suggestion",
    },
  ],
  "collab-2": [
    {
      targetSection: "Task 任务模块",
      content: "priority 字段建议改为枚举类型: 'low' | 'medium' | 'high' | 'urgent'，比数字更语义化",
      type: "modification",
    },
    {
      targetSection: "Category 分类模块",
      content: "分类支持嵌套层级会更灵活，加个 parent_id 字段",
      type: "suggestion",
    },
    {
      targetSection: "数据库表结构",
      content: "tasks 表加索引: CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);",
      type: "modification",
    },
    {
      targetSection: "模块设计",
      content: "建议增加一个 Dashboard 模块，展示任务统计和进度概览",
      type: "suggestion",
    },
  ],
  "collab-3": [
    {
      targetSection: "技术栈",
      content: "测试框架建议加上 Vitest + Testing Library，保证代码质量",
      type: "comment",
    },
    {
      targetSection: "Auth 认证模块",
      content: "安全方面：密码策略需要至少8位，包含大小写和数字",
      type: "comment",
    },
  ],
};

// Track which annotations have been used per collaborator
const usedAnnotationIndices: Record<string, number> = {};

/**
 * Generate a plan annotation from a collaborator in response to user's question.
 * Returns null if no more annotations are available for that collaborator.
 */
export function generatePlanAnnotation(
  collaborator: Collaborator
): PlanAnnotation | null {
  const templates = planAnnotationTemplates[collaborator.id];
  if (!templates || templates.length === 0) return null;

  const currentIndex = usedAnnotationIndices[collaborator.id] ?? 0;
  if (currentIndex >= templates.length) {
    // Reset to cycle through again
    usedAnnotationIndices[collaborator.id] = 0;
    return generatePlanAnnotation(collaborator);
  }

  const template = templates[currentIndex];
  usedAnnotationIndices[collaborator.id] = currentIndex + 1;

  return {
    id: `plan-ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    authorId: collaborator.id,
    authorName: collaborator.name,
    authorRole: collaborator.role,
    avatarColor: collaborator.avatarColor,
    type: template.type,
    targetSection: template.targetSection,
    content: template.content,
    timestamp: Date.now(),
  };
}