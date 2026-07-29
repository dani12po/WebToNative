import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { adminClient, requireUser } from '../../../../../lib/supabase-server';
import { enforceVaultRateLimit, isRecoveryKeyHash, readSmallJson, vaultRequestMetadata } from '../../../../../lib/vault-guard';
import { createRecoveryTicket } from '../../../../../lib/recovery-ticket';
import { readStoredVault } from '../../../../../lib/vault-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const user = await requireUser(request);
    const database = adminClient();
    const metadata = vaultRequestMetadata(request, user.id);
    await enforceVaultRateLimit(database, user.id, metadata);
    const { recoveryKeyHash } = await readSmallJson(request);
    if (!isRecoveryKeyHash(recoveryKeyHash)) throw new Error('Recovery Key tidak valid.');
    const stored = await readStoredVault(database, user.id);
    if (!stored?.recoveryKeyHash) throw new Error('Tidak ada Recovery Key untuk vault ini.');
    const left = Buffer.from(stored.recoveryKeyHash, 'utf8'); const right = Buffer.from(recoveryKeyHash, 'utf8');
    const matches = left.length === right.length && timingSafeEqual(left, right);
    if (!matches) {
      const response = NextResponse.json({ error: 'Recovery Key tidak cocok.' }, { status: 403 });
      response.headers.set('Cache-Control', 'no-store, max-age=0'); return response;
    }
    const response = NextResponse.json({ resetTicket: createRecoveryTicket(user.id, stored.id), expiresInSeconds: 300 });
    response.headers.set('Cache-Control', 'no-store, max-age=0'); return response;
  } catch (error) {
    const response = NextResponse.json({ error: error.message || 'Verifikasi pemulihan gagal.' }, { status: error.status || 400 });
    response.headers.set('Cache-Control', 'no-store, max-age=0'); return response;
  }
}
