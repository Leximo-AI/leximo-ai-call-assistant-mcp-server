# Leximo AI Call Assistant — MCP Server

[![npm version](https://img.shields.io/npm/v/leximo-ai-call-assistant-mcp-server)](https://www.npmjs.com/package/leximo-ai-call-assistant-mcp-server)
[![Node >=18](https://img.shields.io/node/v/leximo-ai-call-assistant-mcp-server)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that lets you schedule AI phone calls and manage [Leximo](https://leximo.ai) assignments directly from Claude Desktop or Claude Code — no app switching needed.

---

## Quick Install

### Claude Code (one command)

```bash
claude mcp add leximo -e LEXIMO_API_TOKEN=your-token -- npx -y leximo-ai-call-assistant-mcp-server
```

Replace `your-token` with your API token from [concierge.leximo.ai/profile](https://concierge.leximo.ai/profile).

### Claude Code (plugin marketplace)

```
/plugin marketplace add leximo-ai/leximo-ai-call-assistant-mcp-server
```

Then install the plugin:

```
/plugin install leximo-ai-call-assistant
```

---

## Manual Setup

### 1. Get your API token

1. Go to [concierge.leximo.ai](https://concierge.leximo.ai) and sign in
2. Open your [profile page](https://concierge.leximo.ai/profile)
3. Copy your JWT access token

### 2. Configure Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "leximo": {
      "command": "npx",
      "args": ["-y", "leximo-ai-call-assistant-mcp-server"],
      "env": {
        "LEXIMO_API_TOKEN": "your-token"
      }
    }
  }
}
```

### 3. Configure Claude Code (manual)

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "leximo": {
      "command": "npx",
      "args": ["-y", "leximo-ai-call-assistant-mcp-server"],
      "env": {
        "LEXIMO_API_TOKEN": "your-token"
      }
    }
  }
}
```

---

## Hosted deployment

A hosted deployment is available on [Fronteir AI](https://fronteir.ai/mcp/leximo-ai-leximo-ai-call-assistant-mcp-server).

## Features

- **Assignments** — Create, list, view, and delete AI phone call assignments
- **AI Agents** — Browse available calling agents and pick the right one
- **Task Proposals** — Get AI-generated improvements for your call instructions
- **Credits** — Check your credit balance and usage history
- **Subscriptions** — View your plan, browse available plans, and subscribe
- **Notifications** — View call completion events and system notifications

---

## Available Tools

| Tool | Description |
|------|-------------|
| `get_profile` | Get your user profile and account details |
| `get_credits` | Check credit balance, usage history, and subscription summary |
| `get_subscription` | View active subscription details |
| `get_plans` | List available subscription plans with pricing |
| `create_checkout_session` | Get a checkout URL to subscribe to a plan |
| `list_agents` | List available AI calling agents |
| `get_agent` | Get details of a specific agent |
| `list_assignments` | List all your assignments (paginated) |
| `get_assignment` | View a specific assignment with results and transcript |
| `create_assignment` | Create a new phone call assignment |
| `delete_assignment` | Delete an assignment |
| `get_assignment_proposals` | Get AI suggestions to improve your task description |
| `list_notifications` | Get call completion events and notifications |

---

## Example Prompts

Once configured, ask Claude things like:

- _"Show me my Leximo assignments"_
- _"Create a call to +1234567890 to book a restaurant for 2 at 7pm Friday"_
- _"How many credits do I have left?"_
- _"What subscription plans are available?"_
- _"Show me the transcript from my last call"_
- _"What agents are available and which one is best for restaurant bookings?"_

---

## Development

```bash
npm install
npm run build      # Compile TypeScript
npm start          # Run compiled server
npm run dev        # Run with tsx (hot reload)
```

### Test with MCP Inspector

```bash
LEXIMO_API_TOKEN=your-token npx @modelcontextprotocol/inspector node dist/index.js
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `LEXIMO_API_TOKEN` | Yes | JWT token from [concierge.leximo.ai/profile](https://concierge.leximo.ai/profile) |

Copy `.env.example` to `.env` for local development.

---

## License

[MIT](LICENSE) © [Leximo](https://leximo.ai)
