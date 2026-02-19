import type { RpcError } from "./envelope.js";

export function rpcError(
  code: string,
  message: string,
  details: Record<string, unknown> | null = null,
  retryable = false
): RpcError {
  return { code, message, details, retryable };
}
