import { createHash } from 'node:crypto';

const MAX_BODY_BYTES = 50 * 1024;
const MAX_REQUESTS_PER_MINUTE = 5;
const localRateWindows = new Map();

export function assertJsonRequest(request) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) throw new Error('Content-Type harus application/json.');
  const declaredSize = Number(request.headers.get('content-length') || 0);
  if (declaredSize > MAX_BODY_BYTES) throw new Error('Payload vault melebihi batas 50 KB.');
}

export async function readSmallJson(request) {
  assertJsonRequest(request);
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) throw new Error('Payload vault melebihi batas 50 KB.');
  try { return JSON.parse(body); } catch { throw new Error('JSON vault tidak valid.'); }
}

function isBase64(value, minLength, maxLength) {
  return typeof value === 'string' && value.length >= minLength && value.length <= maxLength
    && value.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

export function isValidVaultPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  if (payload.scheme !== 'webtonative-e2ee-v2' || payload.kdf !== 'PBKDF2-SHA-256') return false;
  if (!Number.isInteger(payload.iterations) || payload.iterations < 200000 || payload.iterations > 2000000) return false;
  // AES-GCM 256 uses a 16-byte salt, 12-byte IV, and ciphertext that includes
  // the 16-byte authentication tag. The server validates shape only, never content.
  return isBase64(payload.salt, 24, 24) && isBase64(payload.iv, 16, 16)
    && isBase64(payload.ciphertext, 24, 48 * 1024)
    && payload.aad === 'webtonative:project-vault:v2:';
}

export function isRecoveryKeyHash(value) { return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value); }

function clientIp(request) {
  return request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || 'unknown';
}

export function vaultRequestMetadata(request, userId) {
  // Instalasi lama sudah memiliki WEBTONATIVE_SECRETS_KEY. Gunakan hanya sebagai
  // fallback server-side agar upgrade tidak memutus akses vault; produksi baru
  // tetap dianjurkan memakai secret rate-limit terpisah.
  const pepper = process.env.VAULT_RATE_LIMIT_SECRET || process.env.WEBTONATIVE_SECRETS_KEY;
  if (!pepper || pepper.length < 32) { const error = new Error('Konfigurasikan VAULT_RATE_LIMIT_SECRET (atau WEBTONATIVE_SECRETS_KEY lama) minimal 32 karakter.'); error.status = 503; throw error; }
  const ipHash = createHash('sha256').update(`${pepper}:${clientIp(request)}`).digest('hex');
  const userAgent = (request.headers.get('user-agent') || 'unknown').slice(0, 300);
  const country = (request.headers.get('x-vercel-ip-country') || '').slice(0, 8) || null;
  const region = (request.headers.get('x-vercel-ip-country-region') || '').slice(0, 16) || null;
  return { rateKey: `${userId}:${ipHash}`, ipHash, userAgent, country, region };
}

export async function enforceVaultRateLimit(database, userId, metadata) {
  const { data, error } = await database.rpc('take_vault_rate_limit', {
    p_rate_key: metadata.rateKey,
    p_limit: MAX_REQUESTS_PER_MINUTE
  });
  // Installasi lama belum tentu menjalankan migrasi RPC rate-limit. Jangan
  // memblokir seluruh vault saat upgrade: gunakan pembatas in-memory sebagai
  // fallback sementara. Pada deployment multi-instance, RPC tetap diprioritaskan.
  if (error) {
    const unsupported = error.code === 'PGRST202' || error.code === '42883' || error.code === '42P01'
      || /function|rate_limit|does not exist/i.test(String(error.message || ''));
    if (!unsupported) { const failure = new Error('Rate limit vault tidak tersedia.'); failure.status = 503; throw failure; }
    const now = Date.now();
    const current = localRateWindows.get(metadata.rateKey);
    const window = !current || current.startedAt + 60_000 <= now ? { startedAt: now, count: 0 } : current;
    if (window.count >= MAX_REQUESTS_PER_MINUTE) {
      const failure = new Error('Terlalu banyak permintaan vault. Coba lagi dalam satu menit.');
      failure.status = 429;
      throw failure;
    }
    window.count += 1;
    localRateWindows.set(metadata.rateKey, window);
    return;
  }
  if (data !== true) {
    const error = new Error('Terlalu banyak permintaan vault. Coba lagi dalam satu menit.');
    error.status = 429;
    throw error;
  }
}

export async function writeVaultActivity(database, userId, vaultId, event, metadata) {
  const { error } = await database.from('vault_logs').insert({
    user_id: userId,
    vault_id: vaultId,
    action_type: event,
    user_agent: metadata.userAgent,
    ip_address_hash: metadata.ipHash,
    country_code: metadata.country,
    region_code: metadata.region
  });
  if (!error) return;
  // Skema dashboard sebelum Major Update memakai vault_activity_logs. Audit
  // gagal tidak boleh menghalangi user membuka ciphertext miliknya sendiri.
  const missingModernLog = error.code === '42P01' || error.code === 'PGRST205' || /vault_logs|relation/i.test(String(error.message || ''));
  if (missingModernLog) {
    await database.from('vault_activity_logs').insert({
      user_id: userId,
      event: event === 'READ' ? 'read' : 'write',
      user_agent: metadata.userAgent,
      ip_hash: metadata.ipHash,
      country_code: metadata.country,
      region_code: metadata.region
    });
    return;
  }
  // Metadata audit adalah best-effort. Data E2EE tetap tidak boleh hilang atau
  // tidak dapat dibuka hanya karena log perangkat sedang tidak tersedia.
  console.warn('Vault activity log unavailable:', error.code || error.message);
}
