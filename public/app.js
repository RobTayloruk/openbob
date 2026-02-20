let ws;
let rpcId = 1;
let pending = new Map();
let activeSessionId = "s_main";
let reconnectTimer = null;

const sessionList = document.querySelector("#sessionList");
const messagesEl = document.querySelector("#messages");
const sessionTitle = document.querySelector("#sessionTitle");
const connectionState = document.querySelector("#connectionState");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const newSessionBtn = document.querySelector("#newSessionBtn");
const errorText = document.querySelector("#errorText");

connect();

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";
  await sendMessage(text);
});

newSessionBtn.addEventListener("click", async () => {
  const created = await rpc("gateway.sessions.create", { title: `Session ${new Date().toLocaleTimeString()}` });
  activeSessionId = created.session.sessionId;
  await refreshSessions();
  await loadSession(activeSessionId);
});

document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", async () => {
    chatInput.value = button.dataset.command ?? "";
    await sendMessage(chatInput.value);
  });
});

async function sendMessage(text) {
  try {
    await rpc("gateway.sessions.sendMessage", { sessionId: activeSessionId, text });
    await loadSession(activeSessionId);
  } catch (error) {
    showError((error instanceof Error ? error.message : String(error)) || "Failed to send message");
  }
}

function connect() {
  updateState("Connecting...");
  ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`);

  ws.addEventListener("open", async () => {
    updateState("Connected");
    hideError();
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    try {
      await rpc("gateway.events.subscribe", { topics: ["session.*", "run.*"] });
      await refreshSessions();
      await loadSession(activeSessionId);
    } catch (error) {
      showError(`Initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  ws.addEventListener("close", () => {
    updateState("Disconnected");
    for (const { reject } of pending.values()) reject(new Error("Socket disconnected"));
    pending = new Map();
    reconnectTimer = window.setTimeout(connect, 1200);
  });

  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.kind === "response") {
      const resolver = pending.get(msg.id);
      if (!resolver) return;
      pending.delete(msg.id);
      if (msg.ok) resolver.resolve(msg.result ?? {});
      else resolver.reject(new Error(msg.error?.message ?? "RPC error"));
    }

    if (msg.kind === "event" && (msg.topic === "session.message" || msg.topic === "run.finished")) {
      loadSession(activeSessionId).catch((error) => showError(String(error)));
    }
  });
}

async function refreshSessions() {
  const result = await rpc("gateway.sessions.list", {});
  sessionList.innerHTML = "";

  for (const session of result.sessions) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.textContent = `${session.title} (${session.messageCount})`;
    btn.addEventListener("click", async () => {
      activeSessionId = session.sessionId;
      await loadSession(activeSessionId);
    });
    li.append(btn);
    sessionList.append(li);
  }
}

async function loadSession(sessionId) {
  const result = await rpc("gateway.sessions.get", { sessionId });
  const session = result.session;
  if (!session) return;

  sessionTitle.textContent = session.title;
  messagesEl.innerHTML = "";
  for (const message of session.messages) {
    messagesEl.append(renderMessage(message));
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
  await refreshSessions();
}

function renderMessage(message) {
  const box = document.createElement("article");
  box.className = `message ${message.role}`;

  const role = document.createElement("div");
  role.className = "role";
  role.textContent = message.role;

  const text = document.createElement("pre");
  text.textContent = message.text;
  text.style.margin = "0";
  text.style.whiteSpace = "pre-wrap";

  box.append(role, text);
  return box;
}

function rpc(method, params) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return Promise.reject(new Error("Socket is not connected"));

  const id = String(rpcId++);
  const payload = { v: 1, kind: "request", id, method, params, trace: { traceId: "ui", spanId: null, parentSpanId: null } };
  ws.send(JSON.stringify(payload));

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Request timed out for ${method}`));
    }, 8000);

    pending.set(id, {
      resolve: (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      reject: (error) => {
        window.clearTimeout(timeout);
        reject(error);
      }
    });
  });
}

function updateState(text) {
  connectionState.textContent = text;
}

function showError(text) {
  errorText.hidden = false;
  errorText.textContent = text;
}

function hideError() {
  errorText.hidden = true;
  errorText.textContent = "";
}
