# AGENTS.md — Cloak

Cloak is a private AI agent vault. It lets AI agents take authorized actions on external services — GitHub, Stripe, Slack, Venice AI — without ever seeing the API keys they need. Credentials are stored AES-256-GCM encrypted per user. The AI brain (Venice AI) orchestrates which actions to take via natural language. The credential never leaves Cloak; only the result reaches the agent.

**Hackathon:** The Synthesis (March 2026)
**Repo:** https://github.com/TpgGirls/synthesishack
**Team:** tpg's Team — tpg, bb007, Claude Code Agent, Claude
**Live backend:** https://cloak-hosted.vercel.app
**Live frontend:** https://frontend-cyan-nine-88.vercel.app
**Tracks:** Venice AI · Self Protocol · Slice (ERC-8128) · Synthesis Open Track

---

## Repo Structure

```
/
├── src/                  # Original MCP server (TypeScript, Claude Desktop)
├── cloak-hosted/         # Next.js SaaS — live backend on Vercel + Supabase
├── cloak-npm/            # npx cloak-vault CLI + MCP server (npm package)
├── frontend/             # React + Vite dashboard (connects to cloak-hosted)
├── package.json          # Root — MCP server deps
├── tsconfig.json
├── cloak-architecture.png
└── README.md
```

---

## Architecture

```
User (browser / CLI)
        │
        ▼
frontend/               ← Vite React UI (auth-gated, Supabase login)
        │  /api/* proxied to cloak-hosted
        ▼
cloak-hosted/           ← Next.js API routes on Vercel
  ├── /api/credentials  ← Store / delete encrypted credentials
  ├── /api/execute      ← Zero-exposure action execution
  ├── /api/chat         ← Venice AI orchestration (Oracle)
  ├── /api/audit        ← Per-user execution log
  └── lib/vault.ts      ← AES-256-GCM encryption, Supabase storage
        │
        ├── Venice AI   ← Brain: decides which tools to call (llama-3.3-70b)
        ├── GitHub API  ← list repos, create issues
        ├── Slack API   ← post messages, list channels
        └── Stripe API  ← get balance, list customers
```

---

## What's Built

### cloak-hosted (Next.js, Vercel + Supabase)
The production SaaS backend. Multi-user, auth-gated, persistent audit log.

- **Vault tab** — store/delete encrypted API keys (AES-256-GCM, per-user key)
- **Execute tab** — manually invoke any service action without exposing the key
- **Audit tab** — full execution history per user (Supabase DB)
- **Oracle tab** — natural language agent powered by Venice AI

  > *"List my GitHub repos and post a summary to Slack"*
  >
  > Venice AI receives tool definitions for all connected services, decides which to call, Cloak executes them using stored credentials, Venice synthesizes the result. The raw keys never leave the vault.

### frontend (Vite + React)
Connects to `cloak-hosted` as its backend (no separate API server).

- Supabase email/password auth — session token injected into every API call
- Oracle tab — same Venice AI chat interface as cloak-hosted dashboard
- Proxy: `/api/*` → `localhost:3000` (cloak-hosted) in dev; `VITE_API_BASE` for prod

### src/ (MCP server)
Original single-user vault for Claude Desktop / Cursor via stdio.

- Tools: `store_credential`, `list_services`, `execute_with_credential`, `remove_credential`
- Stores to `~/.cloak/vault.json` (AES-256-GCM encrypted)

### cloak-npm (CLI)
`npx cloak-vault` — zero-install local vault for developers.

---

## Setup

### cloak-hosted (backend)

```bash
cd cloak-hosted
cp .env.example .env   # fill in Supabase + CLOAK_SERVER_SECRET

npm install
npm run dev            # localhost:3000
```

### frontend

```bash
cd frontend
cp .env.example .env   # fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY

npm install
npm run dev            # localhost:5173 — proxies /api to localhost:3000
```

### MCP server (Claude Desktop)

```bash
npm install
npm run build
```

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cloak": {
      "command": "node",
      "args": ["/path/to/synthesishack/dist/index.js"],
      "env": {
        "CLOAK_MASTER_SECRET": "your-secret-passphrase-min-16-chars"
      }
    }
  }
}
```

---

## Environment Variables

### cloak-hosted (.env)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key (server-side only) |
| `CLOAK_SERVER_SECRET` | Yes | Master secret for per-user key derivation (HMAC) |

### frontend (.env)

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Same Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Same Supabase anon key |
| `VITE_API_BASE` | No | Full URL of cloak-hosted for production (e.g. `https://cloak-hosted.vercel.app/api`) |

### src/ MCP server

| Variable | Required | Description |
|---|---|---|
| `CLOAK_MASTER_SECRET` | Yes | Master passphrase for vault encryption (min 16 chars) |
| `CLOAK_VAULT_PATH` | No | Custom vault file path (default: `~/.cloak/vault.json`) |
| `SELF_STRICT_MODE` | No | Set `true` to require verified Self Agent ID for all executions |

---

## Supported Services

| Service | Actions | Key type |
|---|---|---|
| **GitHub** | get_user, list_repos, create_issue | Personal Access Token |
| **Slack** | list_channels, post_message | Bot Token (xoxb-) |
| **Stripe** | get_balance, list_customers | Secret Key (sk_) |
| **Venice AI** | chat, image_gen, list_models | API Key |
| **Self Protocol** | verify_proof, check_nullifier | App Scope string |

---

## Tech Stack

| Layer | Technology | Status |
|---|---|---|
| MCP server | `@modelcontextprotocol/sdk`, TypeScript (ESM) | ✅ Built |
| Encryption | AES-256-GCM + scrypt, Node.js crypto | ✅ Built |
| Hosted backend | Next.js 16, Vercel | ✅ Live |
| Database + auth | Supabase (PostgreSQL + email/password) | ✅ Built |
| AI orchestration | Venice AI — llama-3.3-70b, tool calling | ✅ Built |
| Agent identity | Self Protocol ZK proof verification | ✅ In executor (verify_proof, check_nullifier) |
| Dashboard UI | React 18, Vite, Tailwind CSS | ✅ Built |
| Web3 auth | Slice ERC-8128 (wallet signing, Celo mainnet) | ✅ Built |

---

## Partner Integration Notes

### Venice AI ✅
Venice is the **orchestration brain** in the Oracle tab. Flow:

1. User sends natural language request
2. Backend builds tool definitions from the user's connected services
3. Calls Venice (`llama-3.3-70b`) with tools + message
4. Venice returns `tool_calls` → Cloak executes each via the encrypted vault
5. Results fed back to Venice → final natural language response returned

Venice also works as a **direct vault service**: store a Venice API key and use the Execute tab to call `chat`, `image_gen`, or `list_models` manually.

### Self Protocol ✅ (executor layer)
Self Protocol is implemented in the executor as a vault service:
- `verify_proof` — POST a ZK proof (from Self mobile app) to `api.self.xyz/v1/verify`
- `check_nullifier` — verify a nullifier hasn't been used

Full identity gating (`SELF_STRICT_MODE`) — requiring Self verification before any `execute_with_credential` call — is the next step.

### Slice ERC-8128 ✅
Slice is implemented as the **AI agent authentication layer** — all API routes in `cloak-hosted` now accept wallet-signed HTTP requests in addition to Supabase JWTs.

How it works:
1. Agent signs every HTTP request with a Celo wallet (RFC 9421 + Ethereum ECDSA)
2. Cloak verifies the signature via `@slicekit/erc8128` + viem on Celo mainnet (chain 42220)
3. The wallet address (lowercased) becomes the `userId` for vault encryption
4. Nonces are stored in-memory with 5-minute TTL to prevent replay attacks

Discovery document live at: `https://cloak-hosted.vercel.app/.well-known/erc8128`

All 6 API routes support dual auth: ERC-8128 wallet signatures OR Supabase Bearer token.

---

## Security Rules

- The agent must **never** receive a raw credential value — only action results
- `store_credential` and `remove_credential` are human-only — gate at the MCP layer
- AES-256-GCM encryption at rest is non-negotiable — no plaintext in the vault file
- Self Protocol ZK verification must pass before `execute_with_credential` when `SELF_STRICT_MODE=true`
- All vault access events are logged to Supabase `audit_logs` (append-only per user)
- CORS is open on `/api/*` for hackathon — restrict to specific origins before production

---

## Code Style

- TypeScript strict mode
- ESM modules (`"type": "module"` in package.json)
- All credential handling must go through the vault module — never inline secrets
- No credential values in logs, ever
- Keep MCP tool definitions in `src/` — one file per service integration

---

## PR Instructions

- Title format: `[cloak] <what you did>`
- Run `npm run build` before pushing — ensure it compiles clean
- No secrets in any commit — use `.env` and confirm `.gitignore` covers it
- Document any new MCP tool or supported service in this file

---

## Agents Working on This Project

| Agent | Model | Harness | Human Partner |
|---|---|---|---|
| tpg | claude-sonnet-4-6 | openclaw | Gnana Lakshmi (@gyanlakshmi) |
| bb007 | — | — | Bhavya |
| Claude | claude-sonnet-4-6 | claude.ai | Nivedita Vivek (@viveknivedita) |
