const encoder = new TextEncoder();
const decoder = new TextDecoder();
const ITERATIONS = 310000;
const VAULT_SCHEME = 'webtonative-e2ee-v2';
const VAULT_AAD_PREFIX = 'webtonative:project-vault:v2:';

function toBase64(bytes) { let binary = ''; bytes.forEach((byte) => { binary += String.fromCharCode(byte); }); return btoa(binary); }
function fromBase64(value) { return Uint8Array.from(atob(value), (char) => char.charCodeAt(0)); }
async function deriveKey(password, salt) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export function validateVaultPassword(password) {
  const value = String(password || '');
  if (value.length < 8) return 'Master Password minimal 8 karakter.';
  if (!/[A-Z]/.test(value)) return 'Master Password harus mengandung minimal satu huruf besar.';
  if (!/\d/.test(value)) return 'Master Password harus mengandung minimal satu angka.';
  if (!/[^A-Za-z0-9\s]/.test(value)) return 'Master Password harus mengandung minimal satu simbol.';
  return '';
}
function requirePassword(password) {
  const error = validateVaultPassword(password);
  if (error) throw new Error(`${error} Password ini tidak disimpan oleh WebToNative.`);
}
export function generateRecoveryKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const value = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
  return value.match(/.{1,4}/g).join('-');
}
export async function hashRecoveryKey(recoveryKey) {
  const normalized = String(recoveryKey || '').toUpperCase().replace(/[^A-Z2-9]/g, '');
  if (normalized.length !== 32) throw new Error('Recovery Key harus terdiri dari 32 karakter.');
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(normalized));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
function requirePayload(payload) {
  if (!payload || payload.scheme !== VAULT_SCHEME || payload.kdf !== 'PBKDF2-SHA-256' || Number(payload.iterations) < 200000) throw new Error('Format vault tidak didukung atau rusak.');
  if (![payload.salt, payload.iv, payload.ciphertext].every((value) => typeof value === 'string' && value.length > 8)) throw new Error('Payload vault tidak lengkap.');
}

// Dokumen ini sengaja dienkripsi seluruhnya di browser. API hanya menerima objek
// hasil fungsi ini; plaintext dan Master Password tidak pernah dikirim ke server.
export async function encryptVaultDocument(document, password, userId) {
  requirePassword(password);
  if (!userId) throw new Error('Identitas akun diperlukan untuk mengunci vault.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const aad = encoder.encode(`${VAULT_AAD_PREFIX}${userId}`);
  const plaintext = encoder.encode(JSON.stringify({ version: 1, ...document }));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad }, key, plaintext);
  return {
    scheme: VAULT_SCHEME,
    kdf: 'PBKDF2-SHA-256',
    iterations: ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(encrypted)),
    aad: VAULT_AAD_PREFIX,
    // Hanya metadata boolean; API key tetap sepenuhnya berada di ciphertext.
    containsAiProvider: Array.isArray(document?.aiProviders) && document.aiProviders.some((item) => String(item?.apiKey || '').trim().length > 0),
    updatedAt: new Date().toISOString()
  };
}

export async function decryptVaultDocument(payload, password, userId) {
  requirePassword(password);
  if (!userId) throw new Error('Identitas akun diperlukan untuk membuka vault.');
  requirePayload(payload);
  const key = await deriveKey(password, fromBase64(payload.salt));
  const aad = encoder.encode(`${VAULT_AAD_PREFIX}${userId}`);
  try {
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(payload.iv), additionalData: aad }, key, fromBase64(payload.ciphertext));
    const document = JSON.parse(decoder.decode(plaintext));
    if (!document || typeof document !== 'object') throw new Error('Isi vault tidak valid.');
    return document;
  } catch {
    throw new Error('Master Password salah atau vault ini bukan milik akun ini.');
  }
}
export async function encryptVaultSecret(secret, password) {
  requirePassword(password); const salt = crypto.getRandomValues(new Uint8Array(16)); const iv = crypto.getRandomValues(new Uint8Array(12)); const key = await deriveKey(password, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(String(secret)));
  return { scheme: 'webtonative-e2ee-v1', kdf: 'PBKDF2-SHA-256', iterations: ITERATIONS, salt: toBase64(salt), iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(ciphertext)) };
}
export async function decryptVaultSecret(payload, password) {
  requirePassword(password); if (!payload || payload.scheme !== 'webtonative-e2ee-v1') throw new Error('Format vault tidak didukung. Simpan ulang koneksi ini dengan vault terbaru.');
  const key = await deriveKey(password, fromBase64(payload.salt)); const value = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(payload.iv) }, key, fromBase64(payload.ciphertext)); return decoder.decode(value);
}
