import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabase-server';
import { requireAgent } from '../../../../lib/platform';
import { readStoredVault } from '../../../../lib/vault-store';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
    const agent = await requireAgent(token);
    const db = adminClient();
    const { data, error } = await db.from('connected_services').select('provider, secret_payload, updated_at').eq('user_id', agent.userId).eq('provider', 'ai').order('updated_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    let stored = null;
    try { stored = await readStoredVault(db, agent.userId); } catch { /* legacy v1 fallback below */ }
    const vaultPayload = stored?.payload?.containsAiProvider ? stored.payload : (data?.secret_payload?.scheme === 'webtonative-e2ee-v1' ? data.secret_payload : null);
    return NextResponse.json({ vaultPayload, vaultUserId: agent.userId, updatedAt: stored?.updatedAt || data?.updated_at || null });
  } catch (error) { return NextResponse.json({ error: error.message || 'Koneksi CLI tidak sah.' }, { status: 401 }); }
}
