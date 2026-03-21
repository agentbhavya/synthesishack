# cloak-vault

Zero-exposure credential vault for AI agents. One command to seal your API keys — your agent invokes them without ever reading the secret.

## Install

```bash
npx cloak-vault init
```

That's it. Follow the prompts and paste the output into your Claude Desktop config.

## What it does

- Encrypts your API keys locally with AES-256-GCM + Scrypt key derivation
- Exposes an MCP server that Claude Desktop calls
- Your agent invokes GitHub, Slack, and Stripe actions — the credential is decrypted in-memory and never appears in model context

## Commands

```bash
npx cloak-vault init                          # First-time setup — generates config
npx cloak-vault store github ghp_xxx...       # Seal a credential
npx cloak-vault store slack xoxb-...
npx cloak-vault store stripe sk_live_...
npx cloak-vault list                          # Show sealed services
npx cloak-vault remove github                 # Delete a credential
npx cloak-vault execute github list_repos     # Test an action directly
npx cloak-vault serve                         # Start MCP server (Claude Desktop calls this)
```

## Claude Desktop setup

After running `init`, paste the printed JSON into your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cloak-vault": {
      "command": "npx",
      "args": ["cloak-vault", "serve"]
    }
  }
}
```

Then restart Claude Desktop. You'll see `cloak-vault` in the tools list.

## Supported services & actions

| Service | Action | Params |
|---|---|---|
| github | `get_user` | — |
| github | `list_repos` | — |
| github | `create_issue` | `owner`, `repo`, `title`, `body` |
| slack | `list_channels` | — |
| slack | `post_message` | `channel`, `text` |
| stripe | `get_balance` | — |
| stripe | `list_customers` | `limit` |

## Security

- Master secret stored in `~/.cloakrc` (mode 600)
- Vault stored in `~/.cloak/vault.json` (AES-256-GCM encrypted)
- Credentials are never logged or returned to the model
- Decryption happens in-process, result only
