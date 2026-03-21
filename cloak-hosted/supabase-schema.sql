-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

create table if not exists vaults (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  service text not null,
  encrypted_entry jsonb not null,
  created_at timestamptz default now(),
  unique(user_id, service)
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  service text not null,
  action text not null,
  success boolean not null,
  ts timestamptz default now()
);

-- Row Level Security: users can only access their own data
alter table vaults enable row level security;
create policy "own vaults" on vaults for all using (auth.uid() = user_id);

alter table audit_logs enable row level security;
create policy "own logs" on audit_logs for all using (auth.uid() = user_id);
