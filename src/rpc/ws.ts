import type WebSocket from "ws";
import { isRequest, type RpcEvent, type RpcRequest, type RpcResponse, type Trace } from "./envelope.js";
import { rpcError } from "./errors.js";
import type { EventBus } from "../events/bus.js";

type Handler = (req: RpcRequest, ctx: { emit: (ev: RpcEvent) => void }) => Promise<Record<string, unknown> | null>;

export function attachWsRpc(
  ws: WebSocket,
  opts: {
    handlers: Record<string, Handler>;
    bus: EventBus;
    topicsMatcherFactory: (patterns: string[]) => (topic: string) => boolean;
  }
) {
  let subscribed: ((topic: string) => boolean) | null = null;
  const trace: Trace = { traceId: "ws", spanId: null, parentSpanId: null };

  const unsub = opts.bus.subscribe((topic, data) => {
    if (!subscribed) return;
    if (!subscribed(topic)) return;
    const ev: RpcEvent = { v: 1, kind: "event", topic, data, trace };
    safeSend(ws, ev);
  });

  ws.on("close", () => unsub());

  ws.on("message", async (raw) => {
    let msg: unknown;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return safeSend(ws, mkResp("?", false, null, rpcError("INVALID_REQUEST", "Invalid JSON"), trace));
    }

    if (!isRequest(msg)) {
      return safeSend(ws, mkResp("?", false, null, rpcError("INVALID_REQUEST", "Not a request envelope"), trace));
    }

    if (msg.method === "gateway.events.subscribe") {
      const topics = Array.isArray((msg.params as any)?.topics) ? ((msg.params as any).topics as string[]) : null;
      if (!topics) {
        return safeSend(ws, mkResp(msg.id, false, null, rpcError("INVALID_PARAMS", "Expected params.topics: string[]"), msg.trace));
      }
      subscribed = opts.topicsMatcherFactory(topics);
      return safeSend(ws, mkResp(msg.id, true, { ok: true }, null, msg.trace));
    }

    if (msg.method === "gateway.events.unsubscribe") {
      subscribed = null;
      return safeSend(ws, mkResp(msg.id, true, { ok: true }, null, msg.trace));
    }

    const handler = opts.handlers[msg.method];
    if (!handler) {
      return safeSend(ws, mkResp(msg.id, false, null, rpcError("NOT_FOUND", `Unknown method: ${msg.method}`), msg.trace));
    }

    try {
      const result = await handler(msg, { emit: (ev) => safeSend(ws, ev) });
      return safeSend(ws, mkResp(msg.id, true, result, null, msg.trace));
    } catch (e: any) {
      return safeSend(ws, mkResp(msg.id, false, null, rpcError("INTERNAL", e?.message ?? "Unhandled error", null, false), msg.trace));
    }
  });
}

function mkResp(id: string, ok: boolean, result: Record<string, unknown> | null, error: any, trace: Trace): RpcResponse {
  return { v: 1, kind: "response", id, ok, result, error, trace };
}

function safeSend(ws: WebSocket, obj: any) {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(obj));
}
