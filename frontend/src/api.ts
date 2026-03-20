const BASE = "/api";

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

export const api = {
  async listServices(): Promise<Service[]> {
    const res = await fetch(`${BASE}/services`);
    const json = await res.json() as { services: Service[] };
    return json.services;
  },

  async storeCredential(service: string, credential: string): Promise<string> {
    const res = await fetch(`${BASE}/credentials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service, credential }),
    });
    const json = await res.json() as { message?: string; error?: string };
    if (!res.ok) throw new Error(json.error ?? "Failed to store credential");
    return json.message ?? "Stored.";
  },

  async removeCredential(service: string): Promise<void> {
    const res = await fetch(`${BASE}/credentials/${service}`, {
      method: "DELETE",
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service, action, params }),
    });
    return res.json() as Promise<ExecutionResult>;
  },

  async getActions(service: string): Promise<ActionDef[]> {
    const res = await fetch(`${BASE}/actions/${service}`);
    const json = await res.json() as { actions: ActionDef[] };
    return json.actions;
  },

  async getAuditLog(): Promise<AuditEntry[]> {
    const res = await fetch(`${BASE}/audit`);
    const json = await res.json() as { log: AuditEntry[] };
    return json.log;
  },
};
