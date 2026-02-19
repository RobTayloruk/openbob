import http from "node:http";
import path from "node:path";
import { WebSocketServer } from "ws";
import { attachWsRpc } from "./rpc/ws.js";
import { EventBus } from "./events/bus.js";
import { createTopicsMatcher } from "./events/topics.js";
import { SessionStore } from "./sessions/store.js";
import { createGatewayHandlers } from "./sessions/api.js";
import { loadConfig } from "./config/load.js";

const cfgPath = process.env.OPENBOB_CONFIG ?? path.resolve(process.cwd(), "gateway.json");
const cfg = loadConfig(cfgPath);

const HOST = cfg.gateway.bind;
const PORT = cfg.gateway.port;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, config: path.basename(cfgPath) }));
    return;
  }
  if (req.url === "/config") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(cfg, null, 2));
    return;
  }
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("Not Found");
});

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  if (req.url !== "/ws") {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

const bus = new EventBus();
const sessions = new SessionStore();
const handlers = createGatewayHandlers({ bus, sessions, config: cfg });

wss.on("connection", (ws) => {
  attachWsRpc(ws, { handlers, bus, topicsMatcherFactory: createTopicsMatcher });
});

server.listen(PORT, HOST, () => {
  console.log(`[openbob] config: ${cfgPath}`);
  console.log(`[openbob] listening on http://${HOST}:${PORT}`);
  console.log(`[openbob] ws rpc on ws://${HOST}:${PORT}/ws`);
});
