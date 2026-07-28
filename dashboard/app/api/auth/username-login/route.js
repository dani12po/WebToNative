import { NextResponse } from 'next/server';
import { adminClient, isSupabaseConfigured } from '../../../../lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    if (!isSupabaseConfigured) return NextResponse.json({ error: 'Konfigurasi Supabase server belum lengkap. Periksa .env.local atau environment variable deployment.' }, { status: 503 });
    const { username, password } = await request.json();
    const identifier = String(username || '').trim().toLowerCase();
    if (!identifier || !password) throw new Error('Username atau email dan password wajib diisi.');
    const isEmail = identifier.includes('@');
    const { data: profile, error } = isEmail
      ? { data: { email: identifier }, error: null }
      : await adminClient().from('profiles').select('email').eq('username', identifier).maybeSingle();
    if (error) {
      const detail = String(error.message || '');
      if (detail.includes('profiles') || error.code === '42P01' || error.code === 'PGRST205') return NextResponse.json({ error: 'Tabel profil Supabase belum tersedia. Jalankan dashboard/supabase/schema.sql melalui Supabase SQL Editor.' }, { status: 503 });
      console.error('Supabase profile lookup failed:', error.code || 'unknown');
      return NextResponse.json({ error: 'Server tidak dapat membaca profil akun. Periksa SUPABASE_SERVICE_ROLE_KEY di konfigurasi deployment.' }, { status: 503 });
    }
    if (!profile?.email) return NextResponse.json({ error: 'Username belum terdaftar. Gunakan email akun Anda atau pilih Daftar untuk membuat akun baru.' }, { status: 401 });
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: profile.email, password })
    });
    const session = await response.json();
    if (!response.ok || !session.access_token) return NextResponse.json({ error: 'Password tidak sesuai atau email akun belum diverifikasi.' }, { status: 401 });
    // Users created manually in Supabase may not yet have a profile row. Once
    // they can sign in with their email, ensure they are usable by the UI too.
    if (session.user?.id && session.user?.email) {
      await adminClient().from('profiles').upsert({
        id: session.user.id,
        email: session.user.email,
        username: identifier.includes('@') ? `user_${String(session.user.id).slice(0, 8)}` : identifier
      }, { onConflict: 'id', ignoreDuplicates: true });
    }
    return NextResponse.json({ session });
  } catch (error) { return NextResponse.json({ error: error.message || 'Login gagal.' }, { status: 500 }); }
}
