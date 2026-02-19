import type { EventBus } from "../events/bus.js";
import type { SessionStore } from "../sessions/store.js";
import { nowIso } from "../util/time.js";
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

  const assistantText = `OpenBoB (bootstrap) heard: "${userText}"`;
  const msg = sessions.addMessage(run.sessionId, "assistant", assistantText);
  bus.publish("session.message", { sessionId: run.sessionId, messageId: msg.messageId, role: msg.role });

  run.status = "completed";
  run.finishedAt = nowIso();
  bus.publish("run.finished", { runId: run.runId, status: run.status, finishedAt: run.finishedAt, error: null });
}
