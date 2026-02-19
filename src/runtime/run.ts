import { newId } from "../util/ids.js";
import { nowIso } from "../util/time.js";

export type RunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type Run = {
  runId: string;
  sessionId: string;
  status: RunStatus;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export function createRun(sessionId: string): Run {
  return {
    runId: newId("r"),
    sessionId,
    status: "queued",
    createdAt: nowIso(),
    startedAt: null,
    finishedAt: null
  };
}
