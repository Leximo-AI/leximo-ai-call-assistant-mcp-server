#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { LeximoApiClient } from "./api-client.js";

const token = process.env.LEXIMO_API_TOKEN;
if (!token) {
  console.error(
    "LEXIMO_API_TOKEN environment variable is required. Get your token from https://concierge.leximo.ai"
  );
  process.exit(1);
}

const client = new LeximoApiClient(token);

const server = new McpServer({
  name: "leximo-ai-call-assistant",
  version: "1.0.0",
});

// Helper to format tool results
function success(data: unknown): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function error(message: string): { content: Array<{ type: "text"; text: string }>; isError: true } {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true as const,
  };
}

async function handleTool<T>(fn: () => Promise<T>) {
  try {
    const result = await fn();
    return success(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return error(msg);
  }
}

// ─── User Profile ────────────────────────────────────────────────

server.tool(
  "get_profile",
  "Get the authenticated user's profile information including email, credits, and account details",
  {},
  async () => handleTool(() => client.getProfile())
);

// ─── Credits & Subscription ──────────────────────────────────────

server.tool(
  "get_credits",
  "Get credit balance, monthly allowance, usage history, and subscription summary for the authenticated user",
  {},
  async () => handleTool(() => client.getCreditOverview())
);

server.tool(
  "get_subscription",
  "Get the active Stripe subscription details for the authenticated user",
  {},
  async () => handleTool(() => client.getUserSubscription())
);

server.tool(
  "get_plans",
  "List available subscription plans with pricing information",
  {},
  async () => handleTool(() => client.getStripeProducts())
);

server.tool(
  "create_checkout_session",
  "Create a Stripe checkout session to subscribe to a plan. Returns a URL the user should open in their browser to complete payment.",
  {
    priceId: z.string().describe("Stripe price ID from the get_plans tool"),
  },
  async ({ priceId }) => handleTool(() => client.createCheckoutSession(priceId))
);

// ─── Agents ──────────────────────────────────────────────────────

server.tool(
  "list_agents",
  "List all available AI calling agents. IMPORTANT: Always call this BEFORE creating an assignment. Present the returned agents to the user so they can choose which one should make the call, or recommend one based on the user's task. The agent's ID is required for create_assignment.",
  {},
  async () => handleTool(() => client.listAgents())
);

server.tool(
  "get_agent",
  "Get details of a specific AI calling agent by ID",
  {
    id: z.string().describe("Agent identifier"),
  },
  async ({ id }) => handleTool(() => client.getAgent(id))
);

// ─── Assignments ─────────────────────────────────────────────────

server.tool(
  "list_assignments",
  "List assignments (call tasks) for the authenticated user with pagination. Returns data, total, page, limit, and totalPages.",
  {
    page: z.number().optional().default(1).describe("Page number (default: 1)"),
    limit: z.number().optional().default(20).describe("Items per page (default: 20)"),
  },
  async ({ page, limit }) => handleTool(() => client.listAssignments(page, limit))
);

server.tool(
  "get_assignment",
  "Get a single assignment by its ID, including call results, transcript, and recording URL",
  {
    id: z.string().describe("Assignment identifier"),
  },
  async ({ id }) => handleTool(() => client.getAssignment(id))
);

server.tool(
  "create_assignment",
  `Create a new phone call assignment. Do NOT call this tool immediately. Follow this workflow:
1. Gather info: Ask the user for any missing details — phone number, desired call time, timezone, and language. Do NOT guess or fabricate values.
2. Select agent: Call list_agents to show available agents. Recommend one based on the task or let the user choose.
3. Improve task: Call get_assignment_proposals with the user's task description, then present the enhanced version for the user to approve or edit.
4. Confirm: Summarize all parameters (agent, name, datetime, timezone, phone number, language, task) and get user confirmation before calling this tool.
Only call create_assignment after completing all steps above.`,
  {
    agentId: z
      .string()
      .describe(
        "ID of the AI agent to use. Call list_agents first to see available agents."
      ),
    name: z.string().describe("Name for this assignment (e.g. the business or person being called)"),
    datetime: z
      .string()
      .describe(
        "When to make the call, in ISO 8601 format (e.g. 2025-06-15T14:30:00)"
      ),
    timezone: z
      .string()
      .describe("Timezone for the datetime (e.g. America/New_York, Europe/London)"),
    phoneNumber: z
      .string()
      .describe("Phone number to call in international format (e.g. +1234567890)"),
    languageCode: z
      .string()
      .describe("Language code for the call (e.g. en, es, fr, de)"),
    task: z
      .string()
      .describe(
        "Description of what the AI agent should do during the call (e.g. 'Book a table for 2 at 7pm on Friday')"
      ),
  },
  async (params) => handleTool(() => client.createAssignment(params))
);

server.tool(
  "delete_assignment",
  "Delete an assignment by its ID",
  {
    id: z.string().describe("Assignment identifier"),
  },
  async ({ id }) => handleTool(() => client.deleteAssignment(id))
);

server.tool(
  "get_assignment_proposals",
  "Get AI-generated enhancement proposals for a task description. IMPORTANT: Always call this BEFORE create_assignment to improve the task instructions. Pass the user's task description and present the enhanced suggestions to the user for approval before proceeding with assignment creation.",
  {
    task: z
      .string()
      .describe("Natural language description of the assignment task"),
  },
  async ({ task }) => handleTool(() => client.getProposals(task))
);

// ─── Notifications ───────────────────────────────────────────────

server.tool(
  "list_notifications",
  "Get paginated list of notifications for the current user. Includes call completion events and system notifications.",
  {
    limit: z.number().optional().default(20).describe("Maximum number of notifications to return (default: 20, max: 100)"),
    offset: z.number().optional().default(0).describe("Number of notifications to skip (default: 0)"),
  },
  async ({ limit, offset }) => handleTool(() => client.listNotifications(limit, offset))
);

// ─── Start Server ────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
