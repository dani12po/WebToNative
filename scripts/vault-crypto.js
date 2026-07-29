import crypto from 'node:crypto';

const V2_AAD_PREFIX = 'webtonative:project-vault:v2:';

export function decryptVaultPayload(payload, password, userId = '') {
  if (!password || password.length < 8) throw new Error('Master Password diperlukan untuk menyinkronkan rahasia ke CLI ini.');
  if (!payload || payload.kdf !== 'PBKDF2-SHA-256') throw new Error('Payload vault tidak didukung. Simpan ulang dari dashboard.');
  const key = crypto.pbkdf2Sync(password, Buffer.from(payload.salt, 'base64'), Number(payload.iterations), 32, 'sha256');
  const ciphertext = Buffer.from(payload.ciphertext, 'base64'); const tag = ciphertext.subarray(ciphertext.length - 16); const body = ciphertext.subarray(0, ciphertext.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv, 'base64'));
  if (payload.scheme === 'webtonative-e2ee-v2') {
    if (!userId) throw new Error('Identitas akun diperlukan untuk membuka vault v2.');
    decipher.setAAD(Buffer.from(`${V2_AAD_PREFIX}${userId}`, 'utf8'));
  } else if (payload.scheme !== 'webtonative-e2ee-v1') {
    throw new Error('Format vault tidak didukung. Simpan ulang dari dashboard.');
  }
  decipher.setAuthTag(tag);
  const value = Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8');
  return payload.scheme === 'webtonative-e2ee-v2' ? JSON.parse(value) : value;
}
