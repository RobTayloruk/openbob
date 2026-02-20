# OpenBoB

OpenBoB is a local AI-style chat gateway and dashboard inspired by ClawdBot, with a cleaner UI and extra built-in tools.

## Features
- Real-time WebSocket RPC gateway
- Multi-session chat UI with quick command chips and connection status
- Slash command toolkit:
  - `/help`
  - `/time`
  - `/calc <expression>` (safe parser, no `eval`)
  - `/todo add|done|list|clear`
- Live event streaming (`session.*`, `run.*`)
- JSON-schema validated config

## Run
```bash
npm install
npm run dev
```

Then open:
- App: http://127.0.0.1:7337/
- Health: http://127.0.0.1:7337/health
- WS RPC: ws://127.0.0.1:7337/ws

## Build
```bash
npm run build
npm run start
```

## Quick RPC test
```bash
npm run test:ws
```
