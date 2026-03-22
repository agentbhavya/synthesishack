// Points at /api — proxied to cloak-hosted (localhost:3000) in dev,
// or set VITE_API_BASE to the full Vercel URL for production.
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "/api";

// Auth token — set by App.tsx after Supabase login
let _token: string | null = null;
export function setAuthToken(token: string | null) {
  _token = token;
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (_token) h["Authorization"] = `Bearer ${_token}`;
  return h;
}

export interface Service {
  name: string;
  handler: "supported" | "custom";
}

export interface ActionDef {
  id: string;
  label: string;
  params: string[];
}

export interface AuditEntry {
  ts: string;
  service: string;
  action: string;
  success: boolean;
}

export interface ExecutionResult {
  success: boolean;
  status?: number;
  data?: unknown;
  error?: string;
}

export interface ChatResponse {
  response: string;
  toolsUsed: string[];
  error?: string;
}

export const api = {
  // cloak-hosted returns Service[] directly (not { services: [] })
  async listServices(): Promise<Service[]> {
    const res = await fetch(`${BASE}/services`, { headers: authHeaders() });
    const json = await res.json();
    return Array.isArray(json) ? json : (json.services ?? []);
  },

  async storeCredential(service: string, credential: string): Promise<string> {
    const res = await fetch(`${BASE}/credentials`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ service, credential }),
    });
    const json = await res.json() as { message?: string; error?: string };
    if (!res.ok) throw new Error(json.error ?? "Failed to store credential");
    return json.message ?? "Stored.";
  },

  async removeCredential(service: string): Promise<void> {
    const res = await fetch(`${BASE}/credentials/${service}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) {
      const json = await res.json() as { error?: string };
      throw new Error(json.error ?? "Failed to remove credential");
    }
  },

  async execute(
    service: string,
    action: string,
    params: Record<string, string>
  ): Promise<ExecutionResult> {
    const res = await fetch(`${BASE}/execute`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ service, action, params }),
    });
    return res.json() as Promise<ExecutionResult>;
  },

  async getActions(service: string): Promise<ActionDef[]> {
    const res = await fetch(`${BASE}/actions/${service}`, { headers: authHeaders() });
    const json = await res.json() as { actions?: ActionDef[] };
    return json.actions ?? [];
  },

  // cloak-hosted returns AuditEntry[] directly (not { log: [] })
  async getAuditLog(): Promise<AuditEntry[]> {
    const res = await fetch(`${BASE}/audit`, { headers: authHeaders() });
    const json = await res.json();
    return Array.isArray(json) ? json : (json.log ?? []);
  },

  async chat(messages: Array<{ role: string; content: string }>): Promise<ChatResponse> {
    const res = await fetch(`${BASE}/chat`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ messages }),
    });
    return res.json() as Promise<ChatResponse>;
  },
};
