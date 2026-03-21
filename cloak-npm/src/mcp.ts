import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { CredentialVault } from "./vault.js";
import { ExecutionEngine, SERVICE_ACTIONS } from "./executor.js";
import { loadConfig } from "./cli.js";

export async function startMcpServer() {
  const config = loadConfig();
  if (!config) {
    process.stderr.write("Run `cloak-vault init` first to configure your vault.\n");
    process.exit(1);
    return;
  }

  const vault = new CredentialVault(config.masterSecret, config.vaultPath);
  const executor = new ExecutionEngine(vault);
  const server = new McpServer({ name: "cloak-vault", version: "0.1.0" });

  server.tool("store_credential",
    "Store an encrypted API credential. Call this once to seal a key — the agent never sees it again.",
    { service: z.string().min(1), credential: z.string().min(1) },
    async ({ service, credential }) => {
      vault.store(service, credential);
      return { content: [{ type: "text", text: `Credential for "${service}" sealed successfully.` }] };
    }
  );

  server.tool("list_services",
    "List services that have sealed credentials. Returns names only — no secrets.",
    {},
    async () => {
      const services = vault.listServices();
      const text = services.length === 0
        ? "No credentials sealed yet."
        : `Sealed services:\n${services.map(s => `  • ${s}`).join("\n")}`;
      return { content: [{ type: "text", text }] };
    }
  );

  server.tool("execute_with_credential",
    "Execute an action using a sealed credential. The credential is decrypted internally — you receive only the result.",
    {
      service: z.string().min(1),
      action: z.string().min(1),
      params: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
    },
    async ({ service, action, params }) => {
      const result = await executor.execute(service, action, params ?? {});
      if (!result.success) return { content: [{ type: "text", text: `Error: ${result.error}` }] };
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    }
  );

  server.tool("list_actions",
    "List available actions for a service.",
    { service: z.string().min(1) },
    async ({ service }) => {
      const actions = SERVICE_ACTIONS[service.toLowerCase()];
      if (!actions) return { content: [{ type: "text", text: `No actions registered for "${service}".` }] };
      const text = actions.map(a => `  • ${a.id} — ${a.label}${a.params.length ? ` (params: ${a.params.join(", ")})` : ""}`).join("\n");
      return { content: [{ type: "text", text: `Actions for ${service}:\n${text}` }] };
    }
  );

  server.tool("remove_credential",
    "Remove a sealed credential from the vault.",
    { service: z.string().min(1) },
    async ({ service }) => {
      const removed = vault.remove(service);
      return { content: [{ type: "text", text: removed ? `Credential for "${service}" removed.` : `No credential found for "${service}".` }] };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
