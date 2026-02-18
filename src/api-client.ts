const BASE_URL = "https://concierge.leximo.ai";

export class LeximoApiClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string>
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        url.searchParams.set(k, v);
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
      'X-Source': 'mcp',
    };

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error ${res.status}: ${text}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
  }

  // User
  getProfile() {
    return this.request("GET", "/api/user/me");
  }

  getCreditOverview() {
    return this.request("GET", "/api/user/credits/overview");
  }

  // Assignments
  listAssignments(page?: number, limit?: number) {
    const query: Record<string, string> = {};
    if (page !== undefined) query.page = String(page);
    if (limit !== undefined) query.limit = String(limit);
    return this.request("GET", "/api/assignment/list", undefined, query);
  }

  getAssignment(id: string) {
    return this.request("GET", `/api/assignment/${encodeURIComponent(id)}`);
  }

  createAssignment(data: {
    agentId: string;
    name: string;
    datetime: string;
    timezone: string;
    phoneNumber: string;
    languageCode: string;
    task: string;
    notifications?: boolean;
    emailUpdates?: boolean;
  }) {
    return this.request("POST", "/api/assignment", {
      ...data,
      notifications: data.notifications ?? true,
      emailUpdates: data.emailUpdates ?? true,
    });
  }

  deleteAssignment(id: string) {
    return this.request(
      "DELETE",
      `/api/assignment/${encodeURIComponent(id)}`
    );
  }

  getProposals(task: string) {
    return this.request("POST", "/api/assignment/proposals", { task });
  }

  // Agents
  listAgents() {
    return this.request("GET", "/api/agent");
  }

  getAgent(id: string) {
    return this.request("GET", `/api/agent/${encodeURIComponent(id)}`);
  }

  // Notifications
  listNotifications(limit?: number, offset?: number) {
    const query: Record<string, string> = {};
    if (limit !== undefined) query.limit = String(limit);
    if (offset !== undefined) query.offset = String(offset);
    return this.request("GET", "/api/notifications", undefined, query);
  }

  // Payments
  getStripeProducts() {
    return this.request("GET", "/api/payments/stripe/products");
  }

  getUserSubscription() {
    return this.request("GET", "/api/payments/stripe/userSubscription");
  }

  createCheckoutSession(priceId: string) {
    return this.request("POST", "/api/payments/stripe/checkoutSession", {
      priceId,
    });
  }
}
