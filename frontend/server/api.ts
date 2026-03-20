/**
 * Cloak HTTP API Server
 * Wraps the vault + executor for the web dashboard.
 * Run: node --experimental-strip-types server/api.ts
 */

import express from "express";
import cors from "cors";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const PORT = 3001;
const MASTER_SECRET =
  process.env["CLOAK_MASTER_SECRET"] ?? "cloak-dev-secret-passphrase";

// ── Vault ─────────────────────────────────────────────────────────────────────

const DEFAULT_VAULT_DIR = join(homedir(), ".cloak");
const VAULT_FILE =
  process.env["CLOAK_VAULT_PATH"] ?? join(DEFAULT_VAULT_DIR, "vault.json");
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

interface EncryptedEntry {
  iv: string;
  salt: string;
  tag: string;
  data: string;
}
type VaultStore = Record<string, EncryptedEntry>;

function deriveKey(secret: string, salt: Buffer): Buffer {
  return scryptSync(secret, salt, KEY_LENGTH);
}

function encrypt(plaintext: string): EncryptedEntry {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(MASTER_SECRET, salt);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return {
    iv: iv.toString("hex"),
    salt: salt.toString("hex"),
    tag: cipher.getAuthTag().toString("hex"),
    data: encrypted.toString("hex"),
  };
}

function decrypt(entry: EncryptedEntry): string {
  const salt = Buffer.from(entry.salt, "hex");
  const iv = Buffer.from(entry.iv, "hex");
  const tag = Buffer.from(entry.tag, "hex");
  const data = Buffer.from(entry.data, "hex");
  const key = deriveKey(MASTER_SECRET, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8"
  );
}

function loadVault(): VaultStore {
  if (!existsSync(VAULT_FILE)) return {};
  try {
    return JSON.parse(readFileSync(VAULT_FILE, "utf8")) as VaultStore;
  } catch {
    return {};
  }
}

function saveVault(store: VaultStore): void {
  mkdirSync(join(VAULT_FILE, ".."), { recursive: true });
  writeFileSync(VAULT_FILE, JSON.stringify(store, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
}

// ── Execution Handlers ────────────────────────────────────────────────────────

interface ExecutionResult {
  success: boolean;
  status?: number;
  data?: unknown;
  error?: string;
}

type Params = Record<string, string | number | boolean | null | undefined>;

async function githubHandler(
  token: string,
  action: string,
  params: Params
): Promise<ExecutionResult> {
  const base = "https://api.github.com";
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "Cloak-MCP/1.0",
  };
  let url = "";
  let method = "GET";
  let body: Record<string, unknown> | undefined;

  switch (action) {
    case "get_user":
      url = `${base}/user`;
      break;
    case "list_repos":
      url = `${base}/user/repos?per_page=30`;
      break;
    case "create_issue": {
      const owner = String(params["owner"] ?? "");
      const repo = String(params["repo"] ?? "");
      const title = String(params["title"] ?? "");
      if (!owner || !repo || !title)
        return { success: false, error: "owner, repo and title are required" };
      url = `${base}/repos/${owner}/${repo}/issues`;
      method = "POST";
      body = { title, body: params["body"] ?? "" };
      break;
    }
    default:
      return { success: false, error: `Unknown GitHub action: "${action}"` };
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10_000),
  });
  const data = await res.json();
  return { success: res.ok, status: res.status, data };
}

async function slackHandler(
  token: string,
  action: string,
  params: Params
): Promise<ExecutionResult> {
  const base = "https://slack.com/api";
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  let url = "";
  let method = "GET";
  let body: Record<string, unknown> | undefined;

  switch (action) {
    case "list_channels":
      url = `${base}/conversations.list`;
      break;
    case "post_message":
      url = `${base}/chat.postMessage`;
      method = "POST";
      body = { channel: params["channel"], text: params["text"] };
      break;
    default:
      return { success: false, error: `Unknown Slack action: "${action}"` };
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10_000),
  });
  const data = await res.json();
  return { success: res.ok, status: res.status, data };
}

async function stripeHandler(
  apiKey: string,
  action: string,
  params: Params
): Promise<ExecutionResult> {
  const base = "https://api.stripe.com/v1";
  const auth = "Basic " + Buffer.from(apiKey + ":").toString("base64");
  const headers: Record<string, string> = {
    Authorization: auth,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  let url = "";

  switch (action) {
    case "get_balance":
      url = `${base}/balance`;
      break;
    case "list_customers":
      url = `${base}/customers?limit=${params["limit"] ?? 10}`;
      break;
    default:
      return { success: false, error: `Unknown Stripe action: "${action}"` };
  }

  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(10_000),
  });
  const data = await res.json();
  return { success: res.ok, status: res.status, data };
}

const SERVICE_HANDLERS: Record<
  string,
  (t: string, a: string, p: Params) => Promise<ExecutionResult>
> = {
  github: githubHandler,
  slack: slackHandler,
  stripe: stripeHandler,
};

// Audit log (in-memory for demo)
const auditLog: Array<{
  ts: string;
  service: string;
  action: string;
  success: boolean;
}> = [];

// ── Express App ───────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// GET /api/services
app.get("/api/services", (_req, res) => {
  const vault = loadVault();
  const services = Object.keys(vault).map((name) => ({
    name,
    handler: name in SERVICE_HANDLERS ? "supported" : "custom",
  }));
  res.json({ services });
});

// POST /api/credentials
app.post("/api/credentials", (req, res) => {
  const { service, credential } = req.body as {
    service?: string;
    credential?: string;
  };
  if (!service || !credential) {
    res.status(400).json({ error: "service and credential are required" });
    return;
  }
  const vault = loadVault();
  vault[service.toLowerCase()] = encrypt(credential);
  saveVault(vault);
  res.json({ message: `Credential for "${service}" stored successfully.` });
});

// DELETE /api/credentials/:service
app.delete("/api/credentials/:service", (req, res) => {
  const { service } = req.params;
  const vault = loadVault();
  if (!(service.toLowerCase() in vault)) {
    res.status(404).json({ error: `No credential found for "${service}"` });
    return;
  }
  delete vault[service.toLowerCase()];
  saveVault(vault);
  res.json({ message: `Credential for "${service}" removed.` });
});

// POST /api/execute
app.post("/api/execute", async (req, res) => {
  const { service, action, params } = req.body as {
    service?: string;
    action?: string;
    params?: Params;
  };
  if (!service || !action) {
    res.status(400).json({ error: "service and action are required" });
    return;
  }

  const vault = loadVault();
  const entry = vault[service.toLowerCase()];
  if (!entry) {
    res
      .status(404)
      .json({ error: `No credential stored for service: "${service}"` });
    return;
  }

  let credential: string;
  try {
    credential = decrypt(entry);
  } catch {
    res.status(500).json({ error: "Failed to decrypt credential." });
    return;
  }

  const handler = SERVICE_HANDLERS[service.toLowerCase()];
  if (!handler) {
    res.status(400).json({
      error: `No handler for service "${service}". Supported: ${Object.keys(SERVICE_HANDLERS).join(", ")}`,
    });
    return;
  }

  const result = await handler(credential, action, params ?? {});
  auditLog.unshift({
    ts: new Date().toISOString(),
    service,
    action,
    success: result.success,
  });
  if (auditLog.length > 50) auditLog.pop();

  res.json(result);
});

// GET /api/audit
app.get("/api/audit", (_req, res) => {
  res.json({ log: auditLog });
});

// GET /api/actions/:service
app.get("/api/actions/:service", (req, res) => {
  const actions: Record<string, Array<{ id: string; label: string; params: string[] }>> = {
    github: [
      { id: "get_user", label: "Get Authenticated User", params: [] },
      { id: "list_repos", label: "List Repositories", params: [] },
      { id: "create_issue", label: "Create Issue", params: ["owner", "repo", "title", "body"] },
    ],
    slack: [
      { id: "list_channels", label: "List Channels", params: [] },
      { id: "post_message", label: "Post Message", params: ["channel", "text"] },
    ],
    stripe: [
      { id: "get_balance", label: "Get Balance", params: [] },
      { id: "list_customers", label: "List Customers", params: ["limit"] },
    ],
  };
  const svc = req.params.service?.toLowerCase();
  res.json({ actions: actions[svc] ?? [] });
});

app.listen(PORT, () => {
  console.log(`[Cloak API] Running on http://localhost:${PORT}`);
  console.log(
    `[Cloak API] Vault: ${VAULT_FILE}`
  );
});
