-- Jalankan sekali di Supabase SQL Editor sebelum men-deploy dashboard.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text not null unique check (username ~ '^[a-z0-9_.-]{3,32}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    new.email,
    lower(coalesce(
      nullif(new.raw_user_meta_data->>'username', ''),
      'user_' || replace(substr(new.id::text, 1, 8), '-', '')
    ))
  );
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Email profil mengikuti perubahan email yang sudah dikonfirmasi oleh Supabase Auth.
create or replace function public.handle_user_email_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email, updated_at = now() where id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed after update of email on auth.users for each row execute procedure public.handle_user_email_change();

create table if not exists public.connected_services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('google_apps_script', 'vercel', 'ai')),
  label text not null,
  account_hint text not null,
  secret_payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Vault lintas perangkat. payload selalu ciphertext AES-GCM dari browser;
-- service-role/backend tidak memiliki Master Password atau plaintext.
create table if not exists public.encrypted_vaults (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Metadata audit, tanpa plaintext, tanpa IP mentah, dan tanpa fingerprint rinci.
create table if not exists public.vault_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event text not null check (event in ('read', 'write')),
  user_agent text not null,
  ip_hash text not null,
  country_code text,
  region_code text,
  occurred_at timestamptz not null default now()
);
create index if not exists vault_activity_user_time_idx on public.vault_activity_logs(user_id, occurred_at desc);

-- Distributed rate limit yang atomik, aman untuk banyak instance serverless.
create table if not exists public.vault_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0)
);
create or replace function public.take_vault_rate_limit(p_rate_key text, p_limit integer default 5)
returns boolean language plpgsql security definer set search_path = public as $$
declare current_window timestamptz; current_count integer;
begin
  select window_started_at, request_count into current_window, current_count from public.vault_rate_limits where rate_key = p_rate_key for update;
  if not found then
    insert into public.vault_rate_limits(rate_key, window_started_at, request_count) values (p_rate_key, now(), 1);
    return true;
  end if;
  if current_window < now() - interval '1 minute' then
    update public.vault_rate_limits set window_started_at = now(), request_count = 1 where rate_key = p_rate_key;
    return true;
  end if;
  if current_count >= p_limit then return false; end if;
  update public.vault_rate_limits set request_count = request_count + 1 where rate_key = p_rate_key;
  return true;
end;
$$;
create table if not exists public.web_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  flow text not null check (flow in ('gas', 'migration', 'android', 'service_login')),
  status text not null default 'queued' check (status in ('queued', 'running', 'success', 'failed', 'ready')),
  note text not null default '', options jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  agent_name text, created_at timestamptz not null default now(), finished_at timestamptz
);
-- Berlaku juga untuk database yang sudah dibuat sebelum service-login ditambahkan.
alter table public.web_jobs drop constraint if exists web_jobs_flow_check;
alter table public.web_jobs add constraint web_jobs_flow_check check (flow in ('gas', 'migration', 'android', 'service_login'));
alter table public.web_jobs add column if not exists result jsonb not null default '{}'::jsonb;
create table if not exists public.cli_pairings (
  id uuid primary key default gen_random_uuid(), code text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null, used_at timestamptz
);
create table if not exists public.cli_agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_name text not null, token_hash text not null unique,
  google_connected boolean not null default false,
  connected_at timestamptz not null default now(), last_seen_at timestamptz not null default now()
);
create index if not exists web_jobs_user_created_idx on public.web_jobs(user_id, created_at desc);
create index if not exists cli_agents_user_seen_idx on public.cli_agents(user_id, last_seen_at desc);

alter table public.profiles enable row level security;
alter table public.connected_services enable row level security;
alter table public.encrypted_vaults enable row level security;
alter table public.vault_activity_logs enable row level security;
alter table public.vault_rate_limits enable row level security;
alter table public.web_jobs enable row level security;
alter table public.cli_pairings enable row level security;
alter table public.cli_agents enable row level security;
create policy "profile own read" on public.profiles for select using (auth.uid() = id);
create policy "profile own update" on public.profiles for update using (auth.uid() = id);
-- Koneksi, job, dan agent diproses oleh route server memakai service-role key.
-- Tidak ada policy select untuk credential: browser tidak pernah menerima payload rahasia.
