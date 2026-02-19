import { newId } from "../util/ids.js";
import { nowIso } from "../util/time.js";

export type MessageRole = "user" | "assistant" | "system" | "tool";

export type Message = {
  messageId: string;
  sessionId: string;
  role: MessageRole;
  text: string;
  createdAt: string;
};

export type Session = {
  sessionId: string;
  title: string;
  createdAt: string;
  messages: Message[];
};

export class SessionStore {
  private sessions = new Map<string, Session>();

  getOrCreate(sessionId: string, title = "Session") {
    const existing = this.sessions.get(sessionId);
    if (existing) return existing;
    const s: Session = { sessionId, title, createdAt: nowIso(), messages: [] };
    this.sessions.set(sessionId, s);
    return s;
  }

  list() {
    return [...this.sessions.values()].map((s) => ({
      sessionId: s.sessionId,
      title: s.title,
      createdAt: s.createdAt,
      messageCount: s.messages.length
    }));
  }

  addMessage(sessionId: string, role: MessageRole, text: string): Message {
    const s = this.getOrCreate(sessionId);
    const m: Message = { messageId: newId("m"), sessionId, role, text, createdAt: nowIso() };
    s.messages.push(m);
    return m;
  }

  get(sessionId: string) {
    return this.sessions.get(sessionId) ?? null;
  }
}
