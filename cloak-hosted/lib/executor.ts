import type { CloudVault } from "./vault";

export interface ExecutionParams {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ExecutionResult {
  success: boolean;
  status?: number;
  data?: unknown;
  error?: string;
}

// Service action catalogue — used by the actions API route and by the Oracle
// to build Venice tool definitions dynamically.
export const SERVICE_ACTIONS: Record<
  string,
  Array<{ id: string; label: string; params: string[] }>
> = {
  github: [
    { id: "get_user",      label: "Get Authenticated User", params: [] },
    { id: "list_repos",    label: "List Repositories",      params: [] },
    { id: "create_issue",  label: "Create Issue",           params: ["owner", "repo", "title", "body"] },
  ],
  slack: [
    { id: "list_channels", label: "List Channels",  params: [] },
    { id: "post_message",  label: "Post Message",   params: ["channel", "text"] },
  ],
  stripe: [
    { id: "get_balance",     label: "Get Balance",      params: [] },
    { id: "list_customers",  label: "List Customers",   params: ["limit"] },
  ],
  venice: [
    { id: "chat",          label: "Chat Completion",  params: ["prompt", "model"] },
    { id: "image_gen",     label: "Generate Image",   params: ["prompt", "model"] },
    { id: "list_models",   label: "List Models",      params: [] },
  ],
  self: [
    { id: "verify_proof",    label: "Verify Identity Proof", params: ["proof"] },
    { id: "check_nullifier", label: "Check Nullifier Used",  params: ["nullifier"] },
  ],
};

type ServiceHandler = (
  credential: string,
  action: string,
  params: ExecutionParams
) => Promise<ExecutionResult>;

async function githubHandler(
  token: string, action: string, params: ExecutionParams
): Promise<ExecutionResult> {
  const base = "https://api.github.com";
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "Cloak-Vault/1.0",
  };
  let url = "", method = "GET";
  let body: Record<string, unknown> | undefined;
  switch (action) {
    case "list_repos": url = `${base}/user/repos?per_page=30`; break;
    case "get_user":   url = `${base}/user`; break;
    case "create_issue": {
      const owner = String(params["owner"] ?? "");
      const repo  = String(params["repo"]  ?? "");
      if (!owner || !repo) return { success: false, error: "owner and repo required" };
      url = `${base}/repos/${owner}/${repo}/issues`;
      method = "POST";
      body = { title: params["title"], body: params["body"] };
      break;
    }
    default: return { success: false, error: `Unknown GitHub action: "${action}"` };
  }
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { success: res.ok, status: res.status, data: await res.json() };
}

async function slackHandler(
  token: string, action: string, params: ExecutionParams
): Promise<ExecutionResult> {
  const base = "https://slack.com/api";
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  let url = "", method = "GET";
  let body: Record<string, unknown> | undefined;
  switch (action) {
    case "post_message":
      url = `${base}/chat.postMessage`; method = "POST";
      body = { channel: params["channel"], text: params["text"] };
      break;
    case "list_channels": url = `${base}/conversations.list`; break;
    default: return { success: false, error: `Unknown Slack action: "${action}"` };
  }
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { success: res.ok, status: res.status, data: await res.json() };
}

async function stripeHandler(
  apiKey: string, action: string, params: ExecutionParams
): Promise<ExecutionResult> {
  const base = "https://api.stripe.com/v1";
  const headers: Record<string, string> = {
    Authorization: "Basic " + Buffer.from(apiKey + ":").toString("base64"),
    "Content-Type": "application/x-www-form-urlencoded",
  };
  let url = "";
  switch (action) {
    case "list_customers": url = `${base}/customers?limit=${params["limit"] ?? 10}`; break;
    case "get_balance":    url = `${base}/balance`; break;
    default: return { success: false, error: `Unknown Stripe action: "${action}"` };
  }
  const res = await fetch(url, { method: "GET", headers });
  return { success: res.ok, status: res.status, data: await res.json() };
}

async function veniceHandler(
  apiKey: string, action: string, params: ExecutionParams
): Promise<ExecutionResult> {
  const base = "https://api.venice.ai/api/v1";
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  switch (action) {
    case "chat": {
      const prompt = String(params["prompt"] ?? "");
      const model  = String(params["model"]  ?? "llama-3.3-70b");
      if (!prompt) return { success: false, error: "prompt required" };
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST", headers,
        body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }] }),
      });
      const d = await res.json() as { choices?: Array<{ message?: { content?: string } }>; model?: string };
      return { success: res.ok, status: res.status, data: { response: d.choices?.[0]?.message?.content ?? "", model: d.model ?? model } };
    }
    case "image_gen": {
      const prompt = String(params["prompt"] ?? "");
      const model  = String(params["model"]  ?? "fluently-xl");
      if (!prompt) return { success: false, error: "prompt required" };
      const res = await fetch(`${base}/image/generate`, {
        method: "POST", headers,
        body: JSON.stringify({ model, prompt }),
      });
      return { success: res.ok, status: res.status, data: await res.json() };
    }
    case "list_models": {
      const res = await fetch(`${base}/models`, { headers: { Authorization: `Bearer ${apiKey}` } });
      return { success: res.ok, status: res.status, data: await res.json() };
    }
    default: return { success: false, error: `Unknown Venice action: "${action}"` };
  }
}

async function selfHandler(
  appScope: string, action: string, params: ExecutionParams
): Promise<ExecutionResult> {
  const base = "https://api.self.xyz";
  const headers: Record<string, string> = { "Content-Type": "application/json", "X-App-Scope": appScope };
  switch (action) {
    case "verify_proof": {
      const proof = params["proof"];
      if (!proof) return { success: false, error: "proof required (JSON string from Self app)" };
      let proofData: unknown;
      try { proofData = typeof proof === "string" ? JSON.parse(proof) : proof; }
      catch { return { success: false, error: "proof must be valid JSON" }; }
      const res = await fetch(`${base}/v1/verify`, {
        method: "POST", headers,
        body: JSON.stringify({ proof: proofData, scope: appScope }),
      });
      return { success: res.ok, status: res.status, data: await res.json() };
    }
    case "check_nullifier": {
      const nullifier = String(params["nullifier"] ?? "");
      if (!nullifier) return { success: false, error: "nullifier required" };
      const res = await fetch(`${base}/v1/nullifier/${nullifier}`, { headers });
      return { success: res.ok, status: res.status, data: await res.json() };
    }
    default: return { success: false, error: `Unknown Self action: "${action}"` };
  }
}

const SERVICE_HANDLERS: Record<string, ServiceHandler> = {
  github: githubHandler,
  slack:  slackHandler,
  stripe: stripeHandler,
  venice: veniceHandler,
  self:   selfHandler,
};

/**
 * Execute a service action using the credential stored in the vault for the given user.
 * The plaintext credential is retrieved, used for the API call, and immediately discarded.
 * It is never returned or logged.
 */
export async function executeWithVault(
  vault: CloudVault,
  service: string,
  action: string,
  params: ExecutionParams
): Promise<ExecutionResult> {
  let credential: string;
  try {
    credential = await vault.retrieve(service);
  } catch {
    return { success: false, error: `No credential found for service: "${service}"` };
  }
  try {
    const handler = SERVICE_HANDLERS[service.toLowerCase()];
    if (!handler) {
      return {
        success: false,
        error: `No handler registered for service: "${service}". Supported: ${Object.keys(SERVICE_HANDLERS).join(", ")}`,
      };
    }
    return await handler(credential, action, params);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
