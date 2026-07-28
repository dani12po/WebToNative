import { NextResponse } from 'next/server';
import { adminClient, requireUser } from '../../../lib/supabase-server';
import { encryptSecret } from '../../../lib/secrets';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await requireUser(request);
    const { data, error } = await adminClient().from('connected_services').select('id, provider, label, account_hint, created_at, updated_at').eq('user_id', user.id).order('updated_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ connections: data || [] });
  } catch (error) { return NextResponse.json({ error: error.message || 'Koneksi tidak dapat dimuat.' }, { status: 401 }); }
}

export async function POST(request) {
  try {
    const user = await requireUser(request);
    const input = await request.json();
    const provider = ['google_apps_script', 'vercel', 'ai'].includes(input.provider) ? input.provider : null;
    const label = String(input.label || '').trim().slice(0, 80);
    const accountHint = String(input.accountHint || '').trim().slice(0, 120);
    const secret = String(input.secret || '').trim();
    if (!provider || !label || !accountHint || !secret) throw new Error('Lengkapi jenis layanan, label, akun, dan credential.');
    const { data, error } = await adminClient().from('connected_services').insert({ user_id: user.id, provider, label, account_hint: accountHint, secret_payload: encryptSecret(secret) }).select('id, provider, label, account_hint, created_at, updated_at').single();
    if (error) throw error;
    return NextResponse.json({ connection: data }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error.message || 'Koneksi gagal disimpan.' }, { status: 400 }); }
}
