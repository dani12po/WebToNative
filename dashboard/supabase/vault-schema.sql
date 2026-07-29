-- WebToNative Zero-Knowledge Vault schema (PostgreSQL / Supabase)
-- Jalankan setelah schema.sql utama. Tidak ada Master Password atau plaintext
-- dalam tabel ini: kolom vault hanya menerima hasil enkripsi browser.

create extension if not exists pgcrypto;

-- Pembatas request atomik untuk endpoint vault. Aman untuk banyak instance
-- Vercel; API memiliki fallback lokal jika migrasi ini belum tersedia.
create table if not exists public.vault_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0)
);
create or replace function public.take_vault_rate_limit(p_rate_key text, p_limit integer default 5)
returns boolean language plpgsql security definer set search_path = public as $$
declare current_window timestamptz; current_count integer;
begin
  select window_started_at, request_count into current_window, current_count
  from public.vault_rate_limits where rate_key = p_rate_key for update;
  if not found then
    insert into public.vault_rate_limits(rate_key, window_started_at, request_count)
    values (p_rate_key, now(), 1);
    return true;
  end if;
  if current_window < now() - interval '1 minute' then
    update public.vault_rate_limits
      set window_started_at = now(), request_count = 1 where rate_key = p_rate_key;
    return true;
  end if;
  if current_count >= p_limit then return false; end if;
  update public.vault_rate_limits set request_count = request_count + 1 where rate_key = p_rate_key;
  return true;
end;
$$;

create table if not exists public.user_vaults (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  ciphertext text not null check (length(ciphertext) between 24 and 49152),
  salt varchar(128) not null check (length(salt) between 16 and 128),
  iv varchar(64) not null check (length(iv) between 16 and 64),
  recovery_key_hash char(64) check (recovery_key_hash ~ '^[a-f0-9]{64}$'),
  -- Menjaga versi scheme, kdf, iterations, serta AAD tanpa menyimpan plaintext.
  encryption_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_vaults add column if not exists recovery_key_hash char(64);
create unique index if not exists user_vaults_user_id_uidx on public.user_vaults(user_id);
create index if not exists user_vaults_updated_at_idx on public.user_vaults(updated_at desc);

create table if not exists public.vault_logs (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.user_vaults(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null check (action_type in ('READ', 'UPDATE', 'RECOVERY_RESET')),
  user_agent varchar(300) not null,
  -- Untuk privasi, aplikasi menyimpan HMAC/SHA-256 dari IP + server pepper,
  -- bukan IP mentah. Nilai ini tetap bisa mendeteksi perangkat/jaringan baru.
  ip_address_hash char(64) not null,
  country_code varchar(8),
  region_code varchar(16),
  accessed_at timestamptz not null default now()
);
alter table public.vault_logs drop constraint if exists vault_logs_action_type_check;
alter table public.vault_logs add constraint vault_logs_action_type_check check (action_type in ('READ', 'UPDATE', 'RECOVERY_RESET'));
create index if not exists vault_logs_vault_accessed_idx on public.vault_logs(vault_id, accessed_at desc);
create index if not exists vault_logs_user_accessed_idx on public.vault_logs(user_id, accessed_at desc);

-- Server memakai service-role; browser tidak boleh query ciphertext atau log
-- langsung dari Supabase.
alter table public.user_vaults enable row level security;
alter table public.vault_logs enable row level security;
alter table public.vault_rate_limits enable row level security;

-- Migrasi non-destruktif dari format payload JSON lama, hanya bila tabel lama
-- memang ada. Ini membuat file aman dijalankan pada project Supabase baru.
do $$
begin
  if to_regclass('public.encrypted_vaults') is not null then
    insert into public.user_vaults (user_id, ciphertext, salt, iv, encryption_metadata, created_at, updated_at)
    select user_id,
           payload->>'ciphertext',
           payload->>'salt',
           payload->>'iv',
           (payload - 'ciphertext' - 'salt' - 'iv'),
           created_at,
           updated_at
    from public.encrypted_vaults
    where payload ? 'ciphertext' and payload ? 'salt' and payload ? 'iv'
    on conflict (user_id) do nothing;
  end if;
end $$;
