import type { EventBus } from "../events/bus.js";
import type { RpcRequest } from "../rpc/envelope.js";
import type { SessionStore } from "./store.js";
import type { GatewayConfig } from "../config/load.js";
import { createRun } from "../runtime/run.js";
import { runAgent } from "../runtime/agent.js";

type Handler = (req: RpcRequest, ctx: { emit: (ev: any) => void }) => Promise<Record<string, unknown> | null>;

export function createGatewayHandlers(opts: { bus: EventBus; sessions: SessionStore; config: GatewayConfig }): Record<string, Handler> {
  const { bus, sessions } = opts;

  return {
    "gateway.sessions.list": async () => ({ sessions: sessions.list() }),

    "gateway.sessions.create": async (req) => {
      const titleRaw = typeof (req.params as any)?.title === "string" ? (req.params as any).title : "New Session";
      const title = titleRaw.trim() || "New Session";
      const session = sessions.create(title);
      return { session };
    },

    "gateway.sessions.rename": async (req) => {
      const sessionId = typeof (req.params as any)?.sessionId === "string" ? (req.params as any).sessionId : null;
      const titleRaw = typeof (req.params as any)?.title === "string" ? (req.params as any).title : null;
      const title = titleRaw?.trim() ?? null;
      if (!sessionId || !title) throw new Error("INVALID_PARAMS: sessionId and title required");
      const session = sessions.rename(sessionId, title);
      if (!session) throw new Error("NOT_FOUND: session not found");
      return { session };
    },

    "gateway.sessions.get": async (req) => {
      const sessionId = typeof (req.params as any).sessionId === "string" ? (req.params as any).sessionId : null;
      if (!sessionId) throw new Error("INVALID_PARAMS: sessionId required");
      return { session: sessions.get(sessionId) };
    },

    "gateway.sessions.sendMessage": async (req) => {
      const sessionId = typeof (req.params as any).sessionId === "string" ? (req.params as any).sessionId : "s_main";
      const text = typeof (req.params as any).text === "string" ? (req.params as any).text : null;
      if (!text) throw new Error("INVALID_PARAMS: text required");

      sessions.getOrCreate(sessionId, "Main");
      const userMsg = sessions.addMessage(sessionId, "user", text);
      bus.publish("session.message", { sessionId, messageId: userMsg.messageId, role: userMsg.role });

      const run = createRun(sessionId);
      void runAgent({ bus, sessions, run, userText: text });

      return { ok: true, sessionId, messageId: userMsg.messageId, runId: run.runId };
    }
  };
}
