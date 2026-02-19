# OpenBoB (bootstrap)

This is a runnable starter gateway for OpenBoB:
- HTTP /health
- WebSocket RPC at /ws
- Event streaming (subscribe/unsubscribe)
- Sessions + minimal run loop
- Config + JSON Schema validation (Ajv)

## Run (Windows 10)
```powershell
npm i
npm run dev
```

Health:
http://127.0.0.1:7337/health

WS RPC:
ws://127.0.0.1:7337/ws

## Quick WS test
```powershell
npm run test:ws
```

## Config
Edit gateway.json and restart.

