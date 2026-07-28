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
create table if not exists public.web_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  flow text not null check (flow in ('gas', 'migration', 'android')),
  status text not null default 'queued' check (status in ('queued', 'running', 'success', 'failed', 'ready')),
  note text not null default '', options jsonb not null default '{}'::jsonb,
  agent_name text, created_at timestamptz not null default now(), finished_at timestamptz
);
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
alter table public.web_jobs enable row level security;
alter table public.cli_pairings enable row level security;
alter table public.cli_agents enable row level security;
create policy "profile own read" on public.profiles for select using (auth.uid() = id);
create policy "profile own update" on public.profiles for update using (auth.uid() = id);
-- Koneksi, job, dan agent diproses oleh route server memakai service-role key.
-- Tidak ada policy select untuk credential: browser tidak pernah menerima payload rahasia.
