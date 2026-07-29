import { NextResponse } from 'next/server';
import { adminClient, requireUser } from '../../../lib/supabase-server';
import { readStoredVault } from '../../../lib/vault-store';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await requireUser(request);
    const { data, error } = await adminClient().from('connected_services').select('id, provider, label, account_hint, created_at, updated_at').eq('user_id', user.id).order('updated_at', { ascending: false });
    if (error) throw error;
    const connections = data || [];
    // API key tetap tidak pernah dibaca server. Metadata pada payload hanya
    // memberi tahu UI bahwa ada konfigurasi AI yang terenkripsi di vault.
    if (!connections.some((item) => item.provider === 'ai')) {
      try {
        const stored = await readStoredVault(adminClient(), user.id);
        if (stored?.payload?.containsAiProvider) {
          connections.push({ id: 'vault-ai', provider: 'ai', label: 'AI Provider', account_hint: 'Disimpan di Vault E2EE', updated_at: stored.updatedAt, virtual: true });
        }
      } catch { /* vault belum dipasang atau belum ada: tidak menghalangi daftar koneksi lain */ }
    }
    return NextResponse.json({ connections });
  } catch (error) { return NextResponse.json({ error: error.message || 'Koneksi tidak dapat dimuat.' }, { status: 401 }); }
}

export async function POST(request) {
  try {
    const user = await requireUser(request);
    const input = await request.json();
    const provider = ['google_apps_script', 'vercel', 'ai'].includes(input.provider) ? input.provider : null;
    const label = String(input.label || '').trim().slice(0, 80);
    const accountHint = String(input.accountHint || '').trim().slice(0, 120);
    const vaultPayload = input.vaultPayload;
    const validVault = vaultPayload?.scheme === 'webtonative-e2ee-v1' && vaultPayload.kdf === 'PBKDF2-SHA-256' && Number(vaultPayload.iterations) >= 200000 && [vaultPayload.salt, vaultPayload.iv, vaultPayload.ciphertext].every(value => typeof value === 'string' && value.length > 8);
    if (!provider || !label || !accountHint || !validVault) throw new Error('Lengkapi data koneksi dan enkripsi vault terlebih dahulu di perangkat Anda.');
    const { data, error } = await adminClient().from('connected_services').insert({ user_id: user.id, provider, label, account_hint: accountHint, secret_payload: vaultPayload }).select('id, provider, label, account_hint, created_at, updated_at').single();
    if (error) throw error;
    return NextResponse.json({ connection: data }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error.message || 'Koneksi gagal disimpan.' }, { status: 400 }); }
}
