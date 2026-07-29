-- Menyimpan output build aman yang boleh ditampilkan pada dashboard.
-- Jalankan sekali di Supabase SQL Editor untuk database yang sudah ada.
alter table public.web_jobs
  add column if not exists result jsonb not null default '{}'::jsonb;
