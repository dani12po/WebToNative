import { NextResponse } from 'next/server';
import { adminClient, requireUser } from '../../../../../lib/supabase-server';
import { enforceVaultRateLimit, isRecoveryKeyHash, isValidVaultPayload, readSmallJson, vaultRequestMetadata, writeVaultActivity } from '../../../../../lib/vault-guard';
import { verifyRecoveryTicket } from '../../../../../lib/recovery-ticket';
import { resetStoredVault } from '../../../../../lib/vault-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const user = await requireUser(request);
    const database = adminClient();
    const metadata = vaultRequestMetadata(request, user.id);
    await enforceVaultRateLimit(database, user.id, metadata);
    const { resetTicket, payload, recoveryKeyHash } = await readSmallJson(request);
    if (!isValidVaultPayload(payload) || !isRecoveryKeyHash(recoveryKeyHash)) throw new Error('Payload reset vault tidak valid.');
    const ticket = verifyRecoveryTicket(resetTicket, user.id);
    const data = await resetStoredVault(database, user.id, ticket.vaultId, payload, recoveryKeyHash);
    if (!data) throw new Error('Vault tidak dapat direset. Mulai verifikasi Recovery Key lagi.');
    await writeVaultActivity(database, user.id, data.id, 'RECOVERY_RESET', metadata);
    const response = NextResponse.json({ reset: true, updatedAt: data.updatedAt });
    response.headers.set('Cache-Control', 'no-store, max-age=0'); return response;
  } catch (error) {
    const response = NextResponse.json({ error: error.message || 'Reset vault gagal.' }, { status: error.status || 400 });
    response.headers.set('Cache-Control', 'no-store, max-age=0'); return response;
  }
}
