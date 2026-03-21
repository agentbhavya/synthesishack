#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { randomBytes, createHmac } from "crypto";
import { CredentialVault } from "./vault.js";
import { ExecutionEngine } from "./executor.js";

const RC_FILE = join(homedir(), ".cloakrc");

interface CloakConfig { masterSecret: string; vaultPath?: string; }

export function loadConfig(): CloakConfig | null {
  if (!existsSync(RC_FILE)) return null;
  return JSON.parse(readFileSync(RC_FILE, "utf8")) as CloakConfig;
}

function saveConfig(config: CloakConfig): void {
  writeFileSync(RC_FILE, JSON.stringify(config, null, 2), { encoding: "utf8", mode: 0o600 });
}

function getVault(): CredentialVault {
  const config = loadConfig();
  if (!config) { console.error("Run `cloak-vault init` first."); process.exit(1); throw new Error(); }
  return new CredentialVault(config.masterSecret, config.vaultPath);
}

// ── Commands ────────────────────────────────────────────────────────────────

async function cmdInit() {
  const existing = loadConfig();
  const secret = existing?.masterSecret ?? randomBytes(24).toString("hex");

  saveConfig({ masterSecret: secret });

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║              CLOAK VAULT — INITIALISED                  ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
  console.log(`Config saved to: ${RC_FILE}`);
  console.log(`Master secret:   ${secret}\n`);
  console.log("── Claude Desktop Config ──────────────────────────────────");
  console.log("Paste this into your claude_desktop_config.json:\n");
  console.log(JSON.stringify({
    mcpServers: {
      cloak: {
        command: "npx",
        args: ["cloak-vault", "serve"],
        env: { CLOAK_MASTER_SECRET: secret }
      }
    }
  }, null, 2));
  console.log("\n── Claude Desktop Config path ─────────────────────────────");
  const platform = process.platform;
  if (platform === "darwin") console.log("~/Library/Application Support/Claude/claude_desktop_config.json");
  else if (platform === "win32") console.log("%APPDATA%\\Claude\\claude_desktop_config.json");
  else console.log("~/.config/Claude/claude_desktop_config.json");
  console.log("\nRun `cloak-vault store <service> <token>` to seal your first credential.\n");
}

function cmdStore(args: string[]) {
  const [service, credential] = args;
  if (!service || !credential) { console.error("Usage: cloak-vault store <service> <credential>"); process.exit(1); }
  getVault().store(service, credential);
  console.log(`✓ Credential for "${service}" sealed with AES-256-GCM.`);
}

function cmdList() {
  const services = getVault().listServices();
  if (services.length === 0) { console.log("No credentials sealed yet. Run: cloak-vault store <service> <token>"); return; }
  console.log("\nSealed credentials:");
  services.forEach(s => console.log(`  • ${s}`));
  console.log();
}

function cmdRemove(args: string[]) {
  const [service] = args;
  if (!service) { console.error("Usage: cloak-vault remove <service>"); process.exit(1); }
  const removed = getVault().remove(service);
  console.log(removed ? `✓ Credential for "${service}" removed.` : `No credential found for "${service}".`);
}

async function cmdExecute(args: string[]) {
  const [service, action, ...rest] = args;
  if (!service || !action) { console.error("Usage: cloak-vault execute <service> <action> [key=value ...]"); process.exit(1); }
  const params: Record<string, string> = {};
  for (const kv of rest) { const [k, v] = kv.split("="); if (k && v !== undefined) params[k] = v; }
  const vault = getVault();
  const engine = new ExecutionEngine(vault);
  const result = await engine.execute(service, action, params);
  if (result.success) {
    console.log("\n✓ Success:");
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.error(`\n✗ Error: ${result.error}`);
  }
}

async function cmdServe() {
  const { startMcpServer } = await import("./mcp.js");
  await startMcpServer();
}

function printHelp() {
  console.log(`
cloak-vault — Zero-exposure credential vault for AI agents

COMMANDS:
  init                          Set up your vault, generate master secret
  store <service> <token>       Seal a credential (AES-256-GCM encrypted)
  list                          List sealed service names
  remove <service>              Remove a sealed credential
  execute <service> <action>    Execute an action (credential stays hidden)
    [key=value ...]             Optional params (e.g. owner=myorg repo=myrepo)
  serve                         Start MCP stdio server (for Claude Desktop)

EXAMPLES:
  cloak-vault init
  cloak-vault store github ghp_yourtoken
  cloak-vault store stripe sk_test_yourkey
  cloak-vault list
  cloak-vault execute github list_repos
  cloak-vault execute github create_issue owner=myorg repo=myrepo title="Bug found"
  cloak-vault serve
`);
}

// ── Entry point ──────────────────────────────────────────────────────────────

const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case "init":    cmdInit(); break;
  case "store":   cmdStore(args); break;
  case "list":    cmdList(); break;
  case "remove":  cmdRemove(args); break;
  case "execute": cmdExecute(args); break;
  case "serve":   cmdServe(); break;
  default:        printHelp();
}
