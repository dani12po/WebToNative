import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey && serviceKey);

export function adminClient() {
  if (!isSupabaseConfigured) throw new Error('Supabase belum dikonfigurasi. Lengkapi dashboard/.env.local terlebih dahulu.');
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function requireUser(request) {
  if (!isSupabaseConfigured) { const error = new Error('Supabase belum dikonfigurasi.'); error.status = 503; throw error; }
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) { const error = new Error('Silakan masuk terlebih dahulu.'); error.status = 401; throw error; }
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) { const authError = new Error('Sesi masuk tidak valid. Silakan masuk kembali.'); authError.status = 401; throw authError; }
  return data.user;
}
