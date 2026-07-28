const globalStore = globalThis;

if (!globalStore.webToNativeJobs) {
  globalStore.webToNativeJobs = [
    {
      id: 'welcome-job',
      name: 'Demo — Kasir Digital',
      flow: 'migration',
      status: 'ready',
      createdAt: new Date().toISOString(),
      note: 'Hubungkan CLI lokal untuk mengeksekusi job ini.'
    }
  ];
}

if (!globalStore.webToNativePairings) globalStore.webToNativePairings = new Map();
if (!globalStore.webToNativeAgents) globalStore.webToNativeAgents = new Map();

export function listJobs() {
  return globalStore.webToNativeJobs.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createJob(input) {
  const flow = ['gas', 'migration', 'android'].includes(input.flow) ? input.flow : 'gas';
  const name = String(input.name || '').trim().slice(0, 80);
  if (!name) throw new Error('Nama proyek wajib diisi.');
  const job = {
    id: `job-${crypto.randomUUID()}`,
    name,
    flow,
    status: 'queued',
    createdAt: new Date().toISOString(),
    note: 'Menunggu CLI WebToNative milik Anda mengambil job ini.',
    options: {
      template: String(input.template || 'auto').slice(0, 40),
      aiEnabled: Boolean(input.aiEnabled)
    }
  };
  globalStore.webToNativeJobs.push(job);
  return job;
}

export function createPairing() {
  const code = Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
  const expiresAt = Date.now() + 10 * 60 * 1000;
  globalStore.webToNativePairings.set(code, { expiresAt, used: false });
  return { code, expiresAt: new Date(expiresAt).toISOString() };
}

export function connectAgent({ code, deviceName }) {
  const pairing = globalStore.webToNativePairings.get(String(code || '').toUpperCase());
  if (!pairing || pairing.used || pairing.expiresAt < Date.now()) throw new Error('Kode koneksi tidak valid atau sudah kedaluwarsa.');
  pairing.used = true;
  const token = crypto.randomUUID();
  const agent = { token, deviceName: String(deviceName || 'Komputer lokal').slice(0, 80), connectedAt: new Date().toISOString(), lastSeenAt: new Date().toISOString() };
  globalStore.webToNativeAgents.set(token, agent);
  return agent;
}

export function requireAgent(token) {
  const agent = globalStore.webToNativeAgents.get(String(token || ''));
  if (!agent) throw new Error('Sesi CLI tidak sah. Hubungkan ulang perangkat dari dashboard.');
  agent.lastSeenAt = new Date().toISOString();
  return agent;
}

export function listAgents() {
  const now = Date.now();
  return [...globalStore.webToNativeAgents.values()].map(agent => ({
    deviceName: agent.deviceName,
    connectedAt: agent.connectedAt,
    lastSeenAt: agent.lastSeenAt,
    online: now - new Date(agent.lastSeenAt).getTime() < 30_000
  }));
}

export function claimJob(token, supportedFlows = ['gas']) {
  const agent = requireAgent(token);
  const job = globalStore.webToNativeJobs.find(item => item.status === 'queued' && supportedFlows.includes(item.flow));
  if (!job) return null;
  job.status = 'running';
  job.agent = agent.deviceName;
  job.note = `Sedang diproses oleh ${agent.deviceName}.`;
  return job;
}

export function updateJob(token, id, status, note) {
  requireAgent(token);
  const job = globalStore.webToNativeJobs.find(item => item.id === id);
  if (!job) throw new Error('Job tidak ditemukan.');
  if (!['success', 'failed'].includes(status)) throw new Error('Status job tidak valid.');
  job.status = status;
  job.note = String(note || '').slice(0, 300);
  job.finishedAt = new Date().toISOString();
  return job;
}
