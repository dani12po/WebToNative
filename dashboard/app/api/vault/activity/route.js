import { NextResponse } from 'next/server';
import { adminClient, requireUser } from '../../../../lib/supabase-server';
import { enforceVaultRateLimit, vaultRequestMetadata } from '../../../../lib/vault-guard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Hanya metadata yang kembali: tidak ada ciphertext, IP mentah, token, atau UA
// penuh yang dibutuhkan untuk membedakan fingerprint perangkat.
export async function GET(request) {
  try {
    const user = await requireUser(request);
    const database = adminClient();
    const metadata = vaultRequestMetadata(request, user.id);
    await enforceVaultRateLimit(database, user.id, metadata);
    const { data, error } = await database.from('vault_logs')
      .select('action_type, user_agent, country_code, region_code, accessed_at')
      .eq('user_id', user.id).order('accessed_at', { ascending: false }).limit(20);
    if (error) throw error;
    const response = NextResponse.json({ activity: data || [] });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  } catch (error) {
    const response = NextResponse.json({ error: error.message || 'Aktivitas vault tidak dapat dimuat.' }, { status: error.status || 401 });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  }
}
