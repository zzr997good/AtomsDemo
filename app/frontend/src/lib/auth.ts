import { client } from "./api";

/**
 * Auth module - Demo mode with multiple mock accounts + custom registration.
 * Each demo user can log in with a different account to simulate collaboration.
 */

export interface UserInfo {
  id: string;
  email: string;
  name?: string;
  color?: string;
}

// Fixed color assignments for demo accounts
export const USER_COLORS: Record<string, string> = {
  "user-1": "#f97316", // Alice - orange
  "user-2": "#3b82f6", // Bob - blue
  "user-3": "#22c55e", // Charlie - green
  "user-4": "#a855f7", // Diana - purple
  "user-5": "#ec4899", // Eve - pink
};

const CUSTOM_COLORS = ["#06b6d4", "#eab308", "#ef4444", "#14b8a6", "#6366f1"];

export const DEMO_ACCOUNTS: UserInfo[] = [
  { id: "user-1", email: "alice@demo.com", name: "Alice", color: "#f97316" },
  { id: "user-2", email: "bob@demo.com", name: "Bob", color: "#3b82f6" },
  { id: "user-3", email: "charlie@demo.com", name: "Charlie", color: "#22c55e" },
  { id: "user-4", email: "diana@demo.com", name: "Diana", color: "#a855f7" },
  { id: "user-5", email: "eve@demo.com", name: "Eve", color: "#ec4899" },
];

const DEMO_LOGIN_KEY = "atoms_demo_logged_in";
const DEMO_USER_KEY = "atoms_demo_user";
const REGISTERED_USERS_KEY = "atoms_registered_users";

export function getUserColor(userId: string): string {
  if (USER_COLORS[userId]) return USER_COLORS[userId];
  // For custom users, derive a color from their id
  const hash = userId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return CUSTOM_COLORS[hash % CUSTOM_COLORS.length];
}

export async function getCurrentUser(): Promise<UserInfo | null> {
  // First try real auth
  try {
    const response = await client.auth.me();
    if (response?.data) {
      return {
        id: response.data.id || response.data.sub || "",
        email: response.data.email || "",
        name: response.data.name || response.data.email?.split("@")[0] || "",
      };
    }
  } catch {
    // Real auth not available, check demo login
  }

  // Check if demo user is logged in
  if (localStorage.getItem(DEMO_LOGIN_KEY) === "true") {
    const stored = localStorage.getItem(DEMO_USER_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as UserInfo;
      } catch {
        // Fall through
      }
    }
    return DEMO_ACCOUNTS[0];
  }

  return null;
}

export function demoLogin(user?: UserInfo): void {
  const account = user || DEMO_ACCOUNTS[0];
  // Ensure color is set
  if (!account.color) {
    account.color = getUserColor(account.id);
  }
  localStorage.setItem(DEMO_LOGIN_KEY, "true");
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(account));
  sessionStorage.removeItem("atoms_logged_out");
}

// ─── Custom Registration ────────────────────────────────────────────────────

export interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  password: string; // stored in localStorage for demo only
  color: string;
}

export function getRegisteredUsers(): RegisteredUser[] {
  try {
    const stored = localStorage.getItem(REGISTERED_USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function registerUser(email: string, password: string, name: string): { success: boolean; error?: string; user?: UserInfo } {
  const existing = getRegisteredUsers();
  if (existing.find((u) => u.email === email)) {
    return { success: false, error: "该邮箱已注册" };
  }
  // Also check demo accounts
  if (DEMO_ACCOUNTS.find((a) => a.email === email)) {
    return { success: false, error: "该邮箱已被使用" };
  }

  const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const color = CUSTOM_COLORS[existing.length % CUSTOM_COLORS.length];
  const newUser: RegisteredUser = { id, email, name, password, color };
  existing.push(newUser);
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(existing));

  const userInfo: UserInfo = { id, email, name, color };
  return { success: true, user: userInfo };
}

export function customLogin(email: string, password: string): { success: boolean; error?: string; user?: UserInfo } {
  const users = getRegisteredUsers();
  const found = users.find((u) => u.email === email);
  if (!found) {
    return { success: false, error: "账号不存在，请先注册" };
  }
  if (found.password !== password) {
    return { success: false, error: "密码错误" };
  }
  const userInfo: UserInfo = { id: found.id, email: found.email, name: found.name, color: found.color };
  return { success: true, user: userInfo };
}

export async function loginRedirect(): Promise<void> {
  await client.auth.toLogin();
}

export async function logout(): Promise<void> {
  localStorage.removeItem(DEMO_LOGIN_KEY);
  localStorage.removeItem(DEMO_USER_KEY);
  try {
    await client.auth.logout();
  } catch {
    // Ignore if real auth not available
  }
}

// Legacy compatibility
export function ensureSession(): { email: string } | null {
  return { email: "demo@atoms.dev" };
}