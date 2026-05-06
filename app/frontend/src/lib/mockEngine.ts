import { Message, Module, CodeFile, Phase } from "./types";

let messageIdCounter = 0;
function createMessage(role: "user" | "assistant", content: string): Message {
  return {
    id: `msg-${++messageIdCounter}`,
    role,
    content,
    timestamp: Date.now(),
  };
}

// Predefined conversation script with phase guards
// Each entry has an optional `fromPhase` that restricts when it can match
export const conversationScript: {
  trigger: string[];
  response: string;
  nextPhase?: Phase;
  fromPhase?: Phase[]; // only match when current phase is one of these
}[] = [
  {
    trigger: ["任务管理", "todo", "task", "待办"],
    response:
      "好的，我来帮你构建一个任务管理应用。让我先确认一下需求：\n\n1. 用户可以创建、编辑、删除任务\n2. 任务有优先级和截止日期\n3. 支持任务分类和标签\n\n这个方向对吗？还是你有其他想法？",
    nextPhase: "planning",
    fromPhase: ["idle"],
  },
  {
    trigger: ["构建", "build", "开始构建", "执行", "go"],
    response:
      "开始构建！我会按照依赖顺序逐步完成各模块：\n\n⏳ Auth 模块 → Task 模块 → Category 模块 → Notification 模块\n\n你可以在右侧查看实时代码生成，中间面板观察各模块的构建进度。",
    nextPhase: "building",
    fromPhase: ["architecture"],
  },
  {
    trigger: ["对", "是的", "确认", "yes", "ok", "好"],
    response:
      "很好！我来拆分任务：\n\n**模块拆分：**\n1. 🔐 Auth 模块 - 用户认证\n2. 📋 Task 模块 - 任务 CRUD\n3. 🏷️ Category 模块 - 分类管理\n4. 🔔 Notification 模块 - 提醒通知\n\n每个模块的接口和依赖关系已经在右侧展示。确认后我开始构建？",
    nextPhase: "architecture",
    fromPhase: ["planning"],
  },
];

export const defaultModules: Module[] = [
  {
    id: "auth",
    name: "Auth 认证",
    status: "red",
    testCoverage: 0,
    interfaces: [
      { name: "login()", type: "input" },
      { name: "register()", type: "input" },
      { name: "getSession()", type: "output" },
      { name: "logout()", type: "input" },
    ],
    dependencies: [],
  },
  {
    id: "task",
    name: "Task 任务",
    status: "red",
    testCoverage: 0,
    interfaces: [
      { name: "createTask()", type: "input" },
      { name: "updateTask()", type: "input" },
      { name: "deleteTask()", type: "input" },
      { name: "getTasks()", type: "output" },
    ],
    dependencies: ["auth"],
  },
  {
    id: "category",
    name: "Category 分类",
    status: "red",
    testCoverage: 0,
    interfaces: [
      { name: "createCategory()", type: "input" },
      { name: "getCategories()", type: "output" },
      { name: "assignCategory()", type: "input" },
    ],
    dependencies: ["auth"],
  },
  {
    id: "notification",
    name: "Notification 通知",
    status: "red",
    testCoverage: 0,
    interfaces: [
      { name: "scheduleReminder()", type: "input" },
      { name: "getNotifications()", type: "output" },
      { name: "markRead()", type: "input" },
    ],
    dependencies: ["task"],
  },
];

export const planMarkdown = `# 任务管理应用 - 架构方案

## 技术栈
- **前端**: React + TypeScript + Tailwind CSS
- **后端**: Atoms Cloud (Auth + Database + Edge Functions)
- **数据库**: PostgreSQL

## 模块设计

### Auth 认证模块
- 用户注册/登录
- Session 管理
- Row Level Security

### Task 任务模块
- CRUD 操作
- 优先级排序
- 截止日期管理

### Category 分类模块
- 标签创建与管理
- 任务-分类关联

### Notification 通知模块
- 截止日期提醒
- 任务状态变更通知

## 数据库表结构
\`\`\`sql
CREATE TABLE users (id UUID PRIMARY KEY, email TEXT, created_at TIMESTAMP);
CREATE TABLE tasks (id UUID PRIMARY KEY, user_id UUID REFERENCES users, title TEXT, status TEXT, priority INT, due_date DATE);
CREATE TABLE categories (id UUID PRIMARY KEY, user_id UUID REFERENCES users, name TEXT, color TEXT);
CREATE TABLE notifications (id UUID PRIMARY KEY, user_id UUID REFERENCES users, task_id UUID REFERENCES tasks, message TEXT, read BOOLEAN);
\`\`\`
`;

export const mockCodeFiles: CodeFile[] = [
  {
    name: "auth.ts",
    path: "src/modules/auth.ts",
    language: "typescript",
    content: `import { supabase } from '../lib/supabase';

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.session;
}

export async function register(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data.user;
}

export async function logout() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}`,
  },
  {
    name: "tasks.ts",
    path: "src/modules/tasks.ts",
    language: "typescript",
    content: `import { supabase } from '../lib/supabase';

interface Task {
  id?: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  priority: number;
  due_date?: string;
  category_id?: string;
}

export async function createTask(task: Task) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, categories(*)')
    .order('priority', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
  if (error) throw error;
}`,
  },
  {
    name: "categories.ts",
    path: "src/modules/categories.ts",
    language: "typescript",
    content: `import { supabase } from '../lib/supabase';

interface Category {
  id?: string;
  name: string;
  color: string;
}

export async function createCategory(category: Category) {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function assignCategory(taskId: string, categoryId: string) {
  const { error } = await supabase
    .from('tasks')
    .update({ category_id: categoryId })
    .eq('id', taskId);
  if (error) throw error;
}`,
  },
  {
    name: "notifications.ts",
    path: "src/modules/notifications.ts",
    language: "typescript",
    content: `import { supabase } from '../lib/supabase';

export async function scheduleReminder(taskId: string, message: string) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({ task_id: taskId, message, read: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, tasks(title)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function markRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
  if (error) throw error;
}`,
  },
];

// Build simulation timeline
export interface BuildStep {
  moduleId: string;
  status: "yellow" | "green";
  testCoverage: number;
  codeFileIndex: number | null;
  delay: number; // ms after build starts
}

export const buildTimeline: BuildStep[] = [
  { moduleId: "auth", status: "yellow", testCoverage: 30, codeFileIndex: 0, delay: 1000 },
  { moduleId: "auth", status: "green", testCoverage: 95, codeFileIndex: null, delay: 3000 },
  { moduleId: "task", status: "yellow", testCoverage: 20, codeFileIndex: 1, delay: 4500 },
  { moduleId: "category", status: "yellow", testCoverage: 15, codeFileIndex: 2, delay: 5500 },
  { moduleId: "task", status: "green", testCoverage: 88, codeFileIndex: null, delay: 7000 },
  { moduleId: "category", status: "green", testCoverage: 92, codeFileIndex: null, delay: 8500 },
  { moduleId: "notification", status: "yellow", testCoverage: 25, codeFileIndex: 3, delay: 9500 },
  { moduleId: "notification", status: "green", testCoverage: 90, codeFileIndex: null, delay: 11500 },
];

export function matchResponse(input: string, currentPhase: Phase): {
  response: string;
  nextPhase?: Phase;
} | null {
  const lowerInput = input.toLowerCase();
  for (const script of conversationScript) {
    // Skip entries that don't match the current phase
    if (script.fromPhase && !script.fromPhase.includes(currentPhase)) {
      continue;
    }
    if (script.trigger.some((t) => lowerInput.includes(t))) {
      return { response: script.response, nextPhase: script.nextPhase };
    }
  }
  return {
    response:
      "我可以帮你构建各种应用。试试告诉我你想做什么，比如「帮我做一个任务管理应用」。",
  };
}