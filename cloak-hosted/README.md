# Cloak — Hosted Cloud Service

Zero-exposure credential vault for AI agents. Multi-user SaaS built on Next.js + Supabase.

## What it does

- Users sign up and store API keys (GitHub, Slack, Stripe) encrypted per-user with AES-256-GCM
- AI agents invoke actions (list repos, post messages, check balance) without ever seeing credentials
- Every action is logged to a tamper-evident audit trail

## Deploy in 10 minutes

### 1. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Open SQL Editor → paste the contents of `supabase-schema.sql` → Run
3. Authentication → Providers → Email → enable **Email/Password**

### 2. Deploy to Vercel

```bash
git clone <this-repo>
cd cloak-hosted
npx vercel deploy
```

### 3. Set environment variables

In Vercel project settings → Environment Variables:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public key |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → service_role key |
| `CLOAK_SERVER_SECRET` | Any random 32+ character string |

## Local development

```bash
cp .env.example .env.local
# Fill in your Supabase credentials in .env.local
npm install
npm run dev
```

Visit `http://localhost:3000`

## API routes

All require `Authorization: Bearer <supabase_access_token>`:

| Method | Path | Description |
|---|---|---|
| GET | `/api/services` | List sealed service names |
| POST | `/api/credentials` | Store encrypted credential |
| DELETE | `/api/credentials/:service` | Remove credential |
| POST | `/api/execute` | Execute action, returns result |
| GET | `/api/audit` | Fetch audit log (last 50) |
| GET | `/api/actions/:service` | List available actions |

## Security model

- Credentials encrypted with AES-256-GCM before storage
- Per-user encryption key derived as `HMAC(CLOAK_SERVER_SECRET, userId)` — never stored
- Row Level Security (RLS) enforces data isolation at the database level
- Audit log records every invocation; credentials never appear in logs
