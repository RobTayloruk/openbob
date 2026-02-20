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

export type TodoItem = {
  todoId: string;
  text: string;
  done: boolean;
  createdAt: string;
  completedAt: string | null;
};

export type Session = {
  sessionId: string;
  title: string;
  createdAt: string;
  messages: Message[];
  todos: TodoItem[];
};

export class SessionStore {
  private sessions = new Map<string, Session>();

  create(title = "New Session") {
    const sessionId = newId("s");
    return this.getOrCreate(sessionId, title);
  }

  rename(sessionId: string, title: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    session.title = title;
    return session;
  }

  getOrCreate(sessionId: string, title = "Session") {
    const existing = this.sessions.get(sessionId);
    if (existing) return existing;
    const s: Session = { sessionId, title, createdAt: nowIso(), messages: [], todos: [] };
    this.sessions.set(sessionId, s);
    return s;
  }

  list() {
    return [...this.sessions.values()].map((s) => ({
      sessionId: s.sessionId,
      title: s.title,
      createdAt: s.createdAt,
      messageCount: s.messages.length,
      todoCount: s.todos.length
    }));
  }

  addMessage(sessionId: string, role: MessageRole, text: string): Message {
    const s = this.getOrCreate(sessionId);
    const m: Message = { messageId: newId("m"), sessionId, role, text, createdAt: nowIso() };
    s.messages.push(m);
    return m;
  }

  addTodo(sessionId: string, text: string): TodoItem {
    const session = this.getOrCreate(sessionId);
    const todo: TodoItem = { todoId: newId("t"), text, done: false, createdAt: nowIso(), completedAt: null };
    session.todos.push(todo);
    return todo;
  }

  completeTodo(sessionId: string, todoId: string): TodoItem | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    const todo = session.todos.find((item) => item.todoId === todoId);
    if (!todo) return null;
    todo.done = true;
    todo.completedAt = nowIso();
    return todo;
  }

  clearTodos(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return 0;
    const count = session.todos.length;
    session.todos = [];
    return count;
  }

  get(sessionId: string) {
    return this.sessions.get(sessionId) ?? null;
  }
}
