export type Trace = {
  traceId: string;
  spanId: string | null;
  parentSpanId: string | null;
};

export type Auth =
  | { mode: "none"; token: null }
  | { mode: "token"; token: string };

export type RpcRequest = {
  v: 1;
  kind: "request";
  id: string;
  method: string;
  params: Record<string, unknown>;
  trace: Trace;
  auth: Auth | null;
};

export type RpcError = {
  code: string;
  message: string;
  details: Record<string, unknown> | null;
  retryable: boolean;
};

export type RpcResponse = {
  v: 1;
  kind: "response";
  id: string;
  ok: boolean;
  result: Record<string, unknown> | null;
  error: RpcError | null;
  trace: Trace;
};

export type RpcEvent = {
  v: 1;
  kind: "event";
  topic: string;
  data: Record<string, unknown>;
  trace: Trace;
};

export type RpcEnvelope = RpcRequest | RpcResponse | RpcEvent;

export function isRequest(x: any): x is RpcRequest {
  return x && x.v === 1 && x.kind === "request" && typeof x.method === "string";
}
