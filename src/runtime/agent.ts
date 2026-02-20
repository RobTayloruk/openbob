import type { EventBus } from "../events/bus.js";
import type { SessionStore } from "../sessions/store.js";
import { nowIso } from "../util/time.js";
import { evaluateExpression } from "./math.js";
import type { Run } from "./run.js";

export async function runAgent(opts: {
  bus: EventBus;
  sessions: SessionStore;
  run: Run;
  userText: string;
}) {
  const { bus, sessions, run, userText } = opts;

  run.status = "running";
  run.startedAt = nowIso();
  bus.publish("run.started", { runId: run.runId, sessionId: run.sessionId, startedAt: run.startedAt });

  bus.publish("run.delta", { runId: run.runId, kind: "text", text: "Thinking..." });

  const assistantText = buildResponse(sessions, run.sessionId, userText);
  const msg = sessions.addMessage(run.sessionId, "assistant", assistantText);
  bus.publish("session.message", { sessionId: run.sessionId, messageId: msg.messageId, role: msg.role });

  run.status = "completed";
  run.finishedAt = nowIso();
  bus.publish("run.finished", { runId: run.runId, status: run.status, finishedAt: run.finishedAt, error: null });
}

function buildResponse(sessions: SessionStore, sessionId: string, userText: string) {
  const text = userText.trim();

  if (text === "/help") {
    return [
      "OpenBoB command palette:",
      "• /help - show available commands",
      "• /time - show server time",
      "• /calc <expression> - basic math",
      "• /todo add <task>",
      "• /todo done <todoId>",
      "• /todo list",
      "• /todo clear"
    ].join("\n");
  }

  if (text === "/time") {
    return `Server time: ${nowIso()}`;
  }

  if (text.startsWith("/calc ")) {
    const expr = text.slice(6).trim();
    try {
      const result = evaluateExpression(expr);
      return `Result: ${result}`;
    } catch (error) {
      return `Could not evaluate that expression: ${(error as Error).message}`;
    }
  }

  if (text.startsWith("/todo")) {
    const session = sessions.getOrCreate(sessionId, "Main");
    const [, action, ...parts] = text.split(" ");

    if (action === "add") {
      const task = parts.join(" ").trim();
      if (!task) return "Usage: /todo add <task>";
      const todo = sessions.addTodo(sessionId, task);
      return `Added todo ${todo.todoId}: ${todo.text}`;
    }

    if (action === "done") {
      const todoId = parts[0]?.trim();
      if (!todoId) return "Usage: /todo done <todoId>";
      const todo = sessions.completeTodo(sessionId, todoId);
      return todo ? `Completed ${todo.todoId}: ${todo.text}` : `Todo ${todoId} was not found.`;
    }

    if (action === "list") {
      if (!session.todos.length) return "No todos yet. Add one with /todo add <task>.";
      return ["Todos:", ...session.todos.map((todo) => `• ${todo.todoId} [${todo.done ? "x" : " "}] ${todo.text}`)].join("\n");
    }

    if (action === "clear") {
      const count = sessions.clearTodos(sessionId);
      return `Cleared ${count} todos.`;
    }

    return "Usage: /todo add|done|list|clear";
  }

  return `OpenBoB says: ${text}\n\nTry /help for slash commands.`;
}
