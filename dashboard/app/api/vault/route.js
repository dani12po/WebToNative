import { NextResponse } from 'next/server';
import { adminClient, requireUser } from '../../../lib/supabase-server';
import { enforceVaultRateLimit, isRecoveryKeyHash, isValidVaultPayload, readSmallJson, vaultRequestMetadata, writeVaultActivity } from '../../../lib/vault-guard';
import { readStoredVault, saveStoredVault } from '../../../lib/vault-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function noStore(response) {
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}

function errorResponse(error, fallbackStatus) {
  const status = error.status || fallbackStatus;
  return noStore(NextResponse.json({ error: error.message || 'Permintaan vault gagal.' }, { status }));
}

export async function GET(request) {
  try {
    const user = await requireUser(request);
    const database = adminClient();
    const metadata = vaultRequestMetadata(request, user.id);
    await enforceVaultRateLimit(database, user.id, metadata);
    const stored = await readStoredVault(database, user.id);
    if (!stored) return noStore(NextResponse.json({ error: 'Vault belum dibuat.' }, { status: 404 }));
    await writeVaultActivity(database, user.id, stored.id, 'READ', metadata);
    return noStore(NextResponse.json({ vault: { payload: stored.payload, updatedAt: stored.updatedAt } }));
  } catch (error) {
    return errorResponse(error, 500);
  }
}

export async function PUT(request) {
  try {
    const user = await requireUser(request);
    const database = adminClient();
    const metadata = vaultRequestMetadata(request, user.id);
    await enforceVaultRateLimit(database, user.id, metadata);
    const { payload, recoveryKeyHash } = await readSmallJson(request);
    if (!isValidVaultPayload(payload)) throw new Error('Payload vault terenkripsi tidak valid.');
    if (recoveryKeyHash !== undefined && !isRecoveryKeyHash(recoveryKeyHash)) throw new Error('Recovery Key verifier tidak valid.');
    const existing = await readStoredVault(database, user.id);
    const finalRecoveryHash = recoveryKeyHash || existing?.recoveryKeyHash;
    if (!finalRecoveryHash) throw new Error('Recovery Key diperlukan saat membuat vault pertama.');
    const saved = await saveStoredVault(database, user.id, payload, finalRecoveryHash);
    await writeVaultActivity(database, user.id, saved.id, 'UPDATE', metadata);
    return noStore(NextResponse.json({ saved: true, updatedAt: saved.updatedAt }));
  } catch (error) {
    return errorResponse(error, 400);
  }
}

// POST disediakan untuk klien non-browser/versi lama. Semantik dan pengamanan
// identik dengan PUT; tidak ada jalur longgar khusus POST.
export async function POST(request) {
  return PUT(request);
}
