// Compatibility layer for dashboards that already ran the original schema.sql
// but have not yet installed vault-schema.sql. It keeps the new E2EE payload
// encrypted in the previous JSON vault table and upgrades transparently once
// user_vaults is available. No plaintext is handled here.

function missingRelation(error, relation) {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === '42P01' || error?.code === 'PGRST205'
    || (message.includes('relation') && message.includes(relation));
}

function vaultSchemaMissingError() {
  const error = new Error('Database vault belum disiapkan. Jalankan dashboard/supabase/vault-schema.sql sekali di Supabase SQL Editor, lalu coba lagi.');
  error.status = 503;
  return error;
}

export async function readStoredVault(database, userId) {
  const modern = await database
    .from('user_vaults')
    .select('id, ciphertext, salt, iv, encryption_metadata, recovery_key_hash, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (!modern.error) {
    if (!modern.data) return null;
    return {
      storage: 'modern',
      id: modern.data.id,
      recoveryKeyHash: modern.data.recovery_key_hash,
      payload: { ...modern.data.encryption_metadata, ciphertext: modern.data.ciphertext, salt: modern.data.salt, iv: modern.data.iv },
      updatedAt: modern.data.updated_at
    };
  }
  if (!missingRelation(modern.error, 'user_vaults')) throw modern.error;

  const legacy = await database.from('encrypted_vaults').select('user_id, payload, updated_at').eq('user_id', userId).maybeSingle();
  if (legacy.error) {
    if (missingRelation(legacy.error, 'encrypted_vaults')) throw vaultSchemaMissingError();
    throw legacy.error;
  }
  if (!legacy.data) return null;
  const { recoveryKeyHash, ...payload } = legacy.data.payload || {};
  return { storage: 'legacy', id: legacy.data.user_id, recoveryKeyHash: recoveryKeyHash || null, payload, updatedAt: legacy.data.updated_at };
}

export async function saveStoredVault(database, userId, payload, recoveryKeyHash) {
  const { ciphertext, salt, iv, ...encryptionMetadata } = payload;
  const now = new Date().toISOString();
  const modern = await database
    .from('user_vaults')
    .upsert({ user_id: userId, ciphertext, salt, iv, encryption_metadata: encryptionMetadata, recovery_key_hash: recoveryKeyHash, updated_at: now }, { onConflict: 'user_id' })
    .select('id, updated_at')
    .single();
  if (!modern.error) return { storage: 'modern', id: modern.data.id, updatedAt: modern.data.updated_at };
  if (!missingRelation(modern.error, 'user_vaults')) throw modern.error;

  const legacyPayload = { ...payload, recoveryKeyHash };
  const legacy = await database
    .from('encrypted_vaults')
    .upsert({ user_id: userId, payload: legacyPayload, updated_at: now }, { onConflict: 'user_id' })
    .select('user_id, updated_at')
    .single();
  if (legacy.error) {
    if (missingRelation(legacy.error, 'encrypted_vaults')) throw vaultSchemaMissingError();
    throw legacy.error;
  }
  return { storage: 'legacy', id: legacy.data.user_id, updatedAt: legacy.data.updated_at };
}

export async function resetStoredVault(database, userId, vaultId, payload, recoveryKeyHash) {
  const stored = await readStoredVault(database, userId);
  if (!stored || stored.id !== vaultId) return null;
  return saveStoredVault(database, userId, payload, recoveryKeyHash);
}
