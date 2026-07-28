import crypto from 'node:crypto';
import { adminClient } from './supabase-server';

const tokenHash = token => crypto.createHash('sha256').update(String(token)).digest('hex');
const mapJob = row => row && ({ id: row.id, name: row.name, flow: row.flow, status: row.status, createdAt: row.created_at, finishedAt: row.finished_at, note: row.note, options: row.options || {}, agent: row.agent_name });
const mapAgent = row => row && ({ deviceName: row.device_name, connectedAt: row.connected_at, lastSeenAt: row.last_seen_at, online: Date.now() - new Date(row.last_seen_at).getTime() < 30_000, googleConnected: Boolean(row.google_connected) });

export async function listUserJobs(userId) {
  const { data, error } = await adminClient().from('web_jobs').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error; return (data || []).map(mapJob);
}
export async function createUserJob(userId, input) {
  const flow = ['gas', 'migration', 'android'].includes(input.flow) ? input.flow : 'gas';
  const name = String(input.name || '').trim().slice(0, 80); if (!name) throw new Error('Nama proyek wajib diisi.');
  const { data, error } = await adminClient().from('web_jobs').insert({ user_id: userId, name, flow, status: 'queued', note: 'Menunggu CLI WebToNative milik Anda mengambil job ini.', options: { template: String(input.template || 'auto').slice(0, 40), aiEnabled: Boolean(input.aiEnabled) } }).select('*').single();
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
export async function claimJob(token, supportedFlows = ['gas']) {
  const agent = await requireAgent(token); const db = adminClient();
  const { data: job, error } = await db.from('web_jobs').select('*').eq('user_id', agent.userId).eq('status', 'queued').in('flow', supportedFlows).order('created_at', { ascending: true }).limit(1).maybeSingle();
  if (error) throw error; if (!job) return null;
  const { data: claimed, error: updateError } = await db.from('web_jobs').update({ status: 'running', agent_name: agent.device_name, note: `Sedang diproses oleh ${agent.device_name}.` }).eq('id', job.id).eq('status', 'queued').select('*').maybeSingle();
  if (updateError) throw updateError; return mapJob(claimed);
}
export async function updateJob(token, id, status, note) {
  const agent = await requireAgent(token); if (!['success', 'failed'].includes(status)) throw new Error('Status job tidak valid.');
  const { data, error } = await adminClient().from('web_jobs').update({ status, note: String(note || '').slice(0, 300), finished_at: new Date().toISOString() }).eq('id', id).eq('user_id', agent.userId).select('*').maybeSingle();
  if (error || !data) throw new Error('Job tidak ditemukan.'); return mapJob(data);
}
