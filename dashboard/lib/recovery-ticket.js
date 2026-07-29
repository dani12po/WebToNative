import { createHmac, timingSafeEqual } from 'node:crypto';

function secret() {
  const value = process.env.VAULT_RECOVERY_TOKEN_SECRET;
  if (!value || value.length < 32) throw new Error('VAULT_RECOVERY_TOKEN_SECRET minimal 32 karakter belum dikonfigurasi.');
  return value;
}
function signature(value) { return createHmac('sha256', secret()).update(value).digest('base64url'); }

// Tiket singkat ini bukan sesi login. Ia hanya mengizinkan satu reset vault
// maksimal lima menit setelah Recovery Key valid pada akun yang sama.
export function createRecoveryTicket(userId, vaultId) {
  const body = Buffer.from(JSON.stringify({ userId, vaultId, purpose: 'vault-reset', exp: Date.now() + 5 * 60 * 1000 })).toString('base64url');
  return `${body}.${signature(body)}`;
}
export function verifyRecoveryTicket(ticket, userId) {
  const [body, received] = String(ticket || '').split('.');
  if (!body || !received) throw new Error('Tiket pemulihan tidak valid.');
  const expected = signature(body);
  const valid = received.length === expected.length && timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  if (!valid) throw new Error('Tiket pemulihan tidak valid.');
  let data;
  try { data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch { throw new Error('Tiket pemulihan rusak.'); }
  if (data.purpose !== 'vault-reset' || data.userId !== userId || !data.vaultId || Number(data.exp) < Date.now()) throw new Error('Tiket pemulihan sudah kedaluwarsa.');
  return data;
}
