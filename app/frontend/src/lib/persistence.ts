import { client } from "./api";
import { Message, PlanAnnotation, Collaborator, Module, Comment, Phase } from "./types";

/**
 * Persistence layer using Atoms Cloud backend via web-sdk.
 * Handles saving and loading of messages, annotations, and session state.
 */

// ─── Messages ───────────────────────────────────────────────────────────────

export async function saveMessage(msg: Message): Promise<void> {
  try {
    await client.entities.messages.create({
      data: {
        msg_id: msg.id,
        role: msg.role,
        content: msg.content,
        author_id: msg.authorId || "",
        author_name: msg.authorName || "",
        author_role: msg.authorRole || "",
        avatar_color: msg.avatarColor || "",
        mention: msg.mention || "",
        msg_timestamp: msg.timestamp,
      },
    });
  } catch (e) {
    console.warn("Failed to save message:", e);
  }
}

export async function loadMessages(): Promise<Message[]> {
  try {
    const response = await client.entities.messages.query({
      query: {},
      sort: "msg_timestamp",
      limit: 200,
    });
    const items = response?.data?.items || [];
    return items.map((item: any) => ({
      id: item.msg_id,
      role: item.role as Message["role"],
      content: item.content,
      timestamp: item.msg_timestamp || 0,
      authorId: item.author_id || undefined,
      authorName: item.author_name || undefined,
      authorRole: item.author_role || undefined,
      avatarColor: item.avatar_color || undefined,
      mention: item.mention || undefined,
    }));
  } catch (e) {
    console.warn("Failed to load messages:", e);
    return [];
  }
}

// ─── Plan Annotations ───────────────────────────────────────────────────────

export async function saveAnnotation(ann: PlanAnnotation): Promise<void> {
  try {
    await client.entities.plan_annotations.create({
      data: {
        annotation_id: ann.id,
        author_id: ann.authorId,
        author_name: ann.authorName,
        author_role: ann.authorRole,
        avatar_color: ann.avatarColor,
        type: ann.type,
        target_section: ann.targetSection,
        content: ann.content,
        ann_timestamp: ann.timestamp,
      },
    });
  } catch (e) {
    console.warn("Failed to save annotation:", e);
  }
}

export async function loadAnnotations(): Promise<PlanAnnotation[]> {
  try {
    const response = await client.entities.plan_annotations.query({
      query: {},
      sort: "ann_timestamp",
      limit: 100,
    });
    const items = response?.data?.items || [];
    return items.map((item: any) => ({
      id: item.annotation_id,
      authorId: item.author_id,
      authorName: item.author_name,
      authorRole: item.author_role,
      avatarColor: item.avatar_color,
      type: item.type as PlanAnnotation["type"],
      targetSection: item.target_section,
      content: item.content,
      timestamp: item.ann_timestamp || 0,
    }));
  } catch (e) {
    console.warn("Failed to load annotations:", e);
    return [];
  }
}

// ─── App Session State ──────────────────────────────────────────────────────

export interface SessionState {
  id?: number;
  phase: Phase;
  planMarkdown: string;
  buildComplete: boolean;
  collaborators: Collaborator[];
  modules: Module[];
  comments: Comment[];
}

export async function saveSessionState(state: SessionState): Promise<void> {
  try {
    const data = {
      phase: state.phase,
      plan_markdown: state.planMarkdown,
      build_complete: state.buildComplete,
      collaborators_json: JSON.stringify(state.collaborators),
      modules_json: JSON.stringify(state.modules),
      comments_json: JSON.stringify(state.comments),
    };

    if (state.id) {
      await client.entities.app_sessions.update({
        id: String(state.id),
        data,
      });
    } else {
      await client.entities.app_sessions.create({ data });
    }
  } catch (e) {
    console.warn("Failed to save session state:", e);
  }
}

export async function loadSessionState(): Promise<SessionState | null> {
  try {
    const response = await client.entities.app_sessions.query({
      query: {},
      sort: "-created_at",
      limit: 1,
    });
    const items = response?.data?.items || [];
    if (items.length === 0) return null;

    const item = items[0];
    return {
      id: item.id,
      phase: (item.phase || "idle") as Phase,
      planMarkdown: item.plan_markdown || "",
      buildComplete: item.build_complete || false,
      collaborators: item.collaborators_json ? JSON.parse(item.collaborators_json) : [],
      modules: item.modules_json ? JSON.parse(item.modules_json) : [],
      comments: item.comments_json ? JSON.parse(item.comments_json) : [],
    };
  } catch (e) {
    console.warn("Failed to load session state:", e);
    return null;
  }
}