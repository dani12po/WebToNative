import crypto from 'node:crypto';
import { adminClient } from './supabase-server';
import { readStoredVault } from './vault-store';

const tokenHash = token => crypto.createHash('sha256').update(String(token)).digest('hex');
const mapJob = row => row && ({ id: row.id, name: row.name, flow: row.options?.serviceLogin ? 'service_login' : row.flow, status: row.status, createdAt: row.created_at, finishedAt: row.finished_at, note: row.note, options: row.options || {}, result: row.result || {}, agent: row.agent_name });
const mapAgent = row => row && ({ deviceName: row.device_name, connectedAt: row.connected_at, lastSeenAt: row.last_seen_at, online: Date.now() - new Date(row.last_seen_at).getTime() < 30_000, googleConnected: Boolean(row.google_connected) });

export async function listUserJobs(userId) {
  const { data, error } = await adminClient().from('web_jobs').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error; return (data || []).map(mapJob);
}
export async function createUserJob(userId, input) {
  const requestedFlow = ['gas', 'migration', 'android', 'service_login'].includes(input.flow) ? input.flow : 'gas';
  // Database versi lama hanya mengenal gas/migration/android. Job login disimpan
  // sebagai gas dengan penanda khusus agar tetap bekerja sebelum schema diperbarui.
  const flow = requestedFlow === 'service_login' ? 'gas' : requestedFlow;
  const sourcePath = String(input.sourcePath || '').trim().slice(0, 500);
  if (['migration', 'android'].includes(requestedFlow) && !sourcePath) throw new Error('Direktori proyek sumber wajib diisi untuk migrasi atau Android native.');
  const sourceName = sourcePath.replace(/\\/g, '/').split('/').filter(Boolean).pop();
  const name = (['migration', 'android'].includes(requestedFlow) ? sourceName : String(input.name || '').trim()).slice(0, 80);
  if (!name) throw new Error('Nama proyek wajib diisi.');
  const options = requestedFlow === 'service_login'
    ? { service: ['gas', 'vercel'].includes(input.service) ? input.service : 'gas', serviceLogin: true }
    : { template: String(input.template || 'auto').slice(0, 40), aiEnabled: Boolean(input.aiEnabled), sourcePath: sourcePath || null };
  const { data, error } = await adminClient().from('web_jobs').insert({ user_id: userId, name, flow, status: 'queued', note: 'Menunggu CLI WebToNative milik Anda mengambil job ini.', options }).select('*').single();
  if (error) throw error; return mapJob(data);
}
export async function createPairing(userId) {
  const code = Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error } = await adminClient().from('cli_pairings').insert({ code, user_id: userId, expires_at: expiresAt });
  if (error) throw error; return { code, expiresAt };
}
export async function connectAgent({ code, deviceName }) {
  const db = adminClient(); const cleanCode = String(code || '').toUpperCase();
  const { data: pairing, error } = await db.from('cli_pairings').select('*').eq('code', cleanCode).is('used_at', null).gt('expires_at', new Date().toISOString()).maybeSingle();
  if (error || !pairing) throw new Error('Kode koneksi tidak valid atau sudah kedaluwarsa.');
  const token = crypto.randomUUID(); const now = new Date().toISOString();
  const { error: updateError } = await db.from('cli_pairings').update({ used_at: now }).eq('id', pairing.id).is('used_at', null);
  if (updateError) throw updateError;
  const { data, error: agentError } = await db.from('cli_agents').insert({ user_id: pairing.user_id, device_name: String(deviceName || 'Komputer lokal').slice(0, 80), token_hash: tokenHash(token), connected_at: now, last_seen_at: now }).select('*').single();
  if (agentError) throw agentError; return { token, ...mapAgent(data), userId: pairing.user_id };
}
export async function requireAgent(token) {
  const db = adminClient(); const { data, error } = await db.from('cli_agents').select('*').eq('token_hash', tokenHash(token)).maybeSingle();
  if (error || !data) throw new Error('Sesi CLI tidak sah. Hubungkan ulang perangkat dari dashboard.');
  const now = new Date().toISOString(); await db.from('cli_agents').update({ last_seen_at: now }).eq('id', data.id);
  return { ...data, userId: data.user_id, token: undefined, lastSeenAt: now, deviceName: data.device_name };
}
export async function listUserAgents(userId) {
  const { data, error } = await adminClient().from('cli_agents').select('*').eq('user_id', userId).order('last_seen_at', { ascending: false });
  if (error) throw error; return (data || []).map(mapAgent);
}
export async function markAgentServiceConnected(token, service) {
  const agent = await requireAgent(token);
  const provider = service === 'gas' ? 'google_apps_script' : service === 'vercel' ? 'vercel' : null;
  if (!provider) throw new Error('Layanan tidak valid.');
  const db = adminClient();
  if (provider === 'google_apps_script') await db.from('cli_agents').update({ google_connected: true }).eq('token_hash', tokenHash(token));

  const label = provider === 'google_apps_script' ? 'Google Apps Script' : 'Vercel';
  const accountHint = `Sesi OAuth lokal di ${agent.deviceName}`;
  const safeMarker = { scheme: 'local-oauth-session-v1', tokenStored: false, connectedAt: new Date().toISOString() };
  const { data: existing, error: findError } = await db.from('connected_services').select('id').eq('user_id', agent.userId).eq('provider', provider).order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (findError) throw findError;
  const query = existing
    ? db.from('connected_services').update({ label, account_hint: accountHint, secret_payload: safeMarker, updated_at: new Date().toISOString() }).eq('id', existing.id)
    : db.from('connected_services').insert({ user_id: agent.userId, provider, label, account_hint: accountHint, secret_payload: safeMarker });
  const { error } = await query;
  if (error) throw error;
  return { provider, label, accountHint };
}
export async function assertJobReadiness(userId, flow, { requireAi = false } = {}) {
  const requirements = {
    gas: [{ provider: 'google_apps_script', label: 'Google Apps Script' }],
    migration: [{ provider: 'google_apps_script', label: 'Google Apps Script' }, { provider: 'vercel', label: 'Vercel' }],
    android: [{ provider: 'vercel', label: 'Vercel' }]
  };
  const requirement = requirements[flow] ? [...requirements[flow]] : null;
  if (requirement && requireAi) requirement.push({ provider: 'ai', label: 'AI Provider' });
  if (!requirement) return;

  const db = adminClient();
  const { data: agents, error: agentError } = await db.from('cli_agents').select('last_seen_at').eq('user_id', userId).order('last_seen_at', { ascending: false }).limit(1);
  if (agentError) throw agentError;
  const lastSeen = agents?.[0]?.last_seen_at ? new Date(agents[0].last_seen_at).getTime() : 0;
  if (!lastSeen || Date.now() - lastSeen >= 30_000) throw new Error('Hubungkan dan jalankan CLI lokal terlebih dahulu sebelum membuat aplikasi.');

  const { data: connections, error: connectionError } = await db.from('connected_services').select('provider').eq('user_id', userId).in('provider', requirement.map(item => item.provider));
  if (connectionError) throw connectionError;
  const connected = new Set((connections || []).map(item => item.provider));
  if (requireAi && !connected.has('ai')) {
    try {
      const stored = await readStoredVault(db, userId);
      if (stored?.payload?.containsAiProvider) connected.add('ai');
    } catch { /* readiness message below will explain that AI is not configured */ }
  }
  const missing = requirement.filter(item => !connected.has(item.provider)).map(item => item.label);
  if (missing.length) throw new Error(`Hubungkan layanan ${missing.join(' dan ')} di Pengaturan sebelum membuat aplikasi ini.`);
}
export async function claimJob(token, supportedFlows = ['gas']) {
  const agent = await requireAgent(token); const db = adminClient();
  const { data: job, error } = await db.from('web_jobs').select('*').eq('user_id', agent.userId).eq('status', 'queued').in('flow', supportedFlows).order('created_at', { ascending: true }).limit(1).maybeSingle();
  if (error) throw error; if (!job) return null;
  const { data: claimed, error: updateError } = await db.from('web_jobs').update({ status: 'running', agent_name: agent.device_name, note: `Sedang diproses oleh ${agent.device_name}.` }).eq('id', job.id).eq('status', 'queued').select('*').maybeSingle();
  if (updateError) throw updateError; return mapJob(claimed);
}
function safeJobResult(input) {
  const value = input && typeof input === 'object' ? input : {};
  const text = key => String(value[key] || '').trim().slice(0, 500);
  const url = key => {
    const candidate = text(key);
    try { return new URL(candidate).protocol === 'https:' ? candidate : null; } catch { return null; }
  };
  return { localPath: text('localPath') || null, sourcePath: text('sourcePath') || null, apkPath: text('apkPath') || null, deploymentId: text('deploymentId') || null, webAppUrl: url('webAppUrl'), editorUrl: url('editorUrl') };
}

export async function updateJob(token, id, status, note, result) {
  const agent = await requireAgent(token); if (!['success', 'failed'].includes(status)) throw new Error('Status job tidak valid.');
  const { data, error } = await adminClient().from('web_jobs').update({ status, note: String(note || '').slice(0, 300), result: safeJobResult(result), finished_at: new Date().toISOString() }).eq('id', id).eq('user_id', agent.userId).select('*').maybeSingle();
  if (error || !data) throw new Error('Job tidak ditemukan.'); return mapJob(data);
}
