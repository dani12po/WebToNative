import crypto from 'node:crypto';

function key() {
  const value = process.env.WEBTONATIVE_SECRETS_KEY;
  if (!value) throw new Error('WEBTONATIVE_SECRETS_KEY belum diatur. Gunakan kunci acak minimal 32 karakter.');
  return crypto.createHash('sha256').update(value).digest();
}

export function encryptSecret(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  return { ciphertext: encrypted.toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64') };
}

export function decryptSecret(payload) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(payload.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(payload.ciphertext, 'base64')), decipher.final()]).toString('utf8');
}

export function createEncryptedBackup(connection, password) {
  if (String(password || '').length < 10) throw new Error('Password backup minimal 10 karakter.');
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const backupKey = crypto.scryptSync(String(password), salt, 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', backupKey, iv);
  const clear = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), provider: connection.provider, label: connection.label, accountHint: connection.account_hint, secret: decryptSecret(connection.secret_payload) });
  const encrypted = Buffer.concat([cipher.update(clear, 'utf8'), cipher.final()]);
  return { format: 'webtonative-encrypted-connection', version: 1, kdf: 'scrypt', salt: salt.toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: encrypted.toString('base64') };
}
