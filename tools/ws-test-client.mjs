import WebSocket from "ws";

const url = "ws://127.0.0.1:7337/ws";
const ws = new WebSocket(url);

function send(obj) {
  ws.send(JSON.stringify(obj));
}

ws.on("open", () => {
  console.log("[ws] connected:", url);

  send({
    v: 1,
    kind: "request",
    id: "1",
    method: "gateway.events.subscribe",
    params: { topics: ["run.*", "session.message"] },
    trace: { traceId: "t1", spanId: null, parentSpanId: null },
    auth: { mode: "none", token: null }
  });

  setTimeout(() => {
    send({
      v: 1,
      kind: "request",
      id: "2",
      method: "gateway.sessions.sendMessage",
      params: { sessionId: "s_main", text: "hello from ws test" },
      trace: { traceId: "t2", spanId: null, parentSpanId: null },
      auth: { mode: "none", token: null }
    });
  }, 250);
});

ws.on("message", (raw) => {
  console.log("[ws] message:", raw.toString());
});

ws.on("close", () => console.log("[ws] closed"));
ws.on("error", (e) => console.error("[ws] error:", e));
