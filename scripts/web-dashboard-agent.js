#!/usr/bin/env node
import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sessionPath = path.join(root, 'webtonative-agent.json');
const args = process.argv.slice(2);
const valueOf = name => args[args.indexOf(name) + 1] || '';
const mode = args[0] === 'claim' ? 'claim' : args[0] === 'wait' ? 'wait' : 'connect';

function normalizeUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('URL dashboard harus HTTP atau HTTPS.');
  return url.origin;
}

async function connect() {
  const url = normalizeUrl(valueOf('--url'));
  const code = valueOf('--code').trim().toUpperCase();
  if (!code) throw new Error('Isi kode dengan --code KODE_DARI_DASHBOARD.');
  const response = await fetch(`${url}/api/agents/connect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, deviceName: os.hostname() }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Koneksi ke dashboard gagal.');
  await fs.writeJson(sessionPath, { dashboardUrl: url, token: data.token, deviceName: data.deviceName, connectedAt: new Date().toISOString() }, { spaces: 2 });
  console.log(`✔ CLI terhubung sebagai ${data.deviceName}.`);
  console.log('Agent langsung aktif dan akan menunggu job dari Web Tools.');
  await waitForJob();
}

async function claim({ silent = false } = {}) {
  if (!await fs.pathExists(sessionPath)) throw new Error('CLI belum terhubung. Jalankan npm run connect-web -- --url URL --code KODE.');
  const session = await fs.readJson(sessionPath);
  const response = await fetch(`${session.dashboardUrl}/api/agents/jobs`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ supportedFlows: ['gas'] }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Tidak dapat mengambil job.');
  if (!data.job) { if (!silent) console.log('Tidak ada job yang menunggu.'); return false; }
  console.log(`✔ Job diambil: ${data.job.name}`);
  console.log(`  Alur: ${data.job.flow}`);
  console.log('➤ Menjalankan generator otomatis di background agent...');
  const result = await new Promise(resolve => {
    const child = spawn(process.execPath, [path.join(root, 'index.js')], { cwd: root, env: { ...process.env, WEBTONATIVE_JOB: JSON.stringify(data.job) }, stdio: 'inherit', windowsHide: true });
    child.on('error', error => resolve({ ok: false, message: error.message }));
    child.on('exit', code => resolve({ ok: code === 0, message: code === 0 ? 'Job selesai dibuat dan dideploy oleh CLI lokal.' : `Generator berhenti dengan kode ${code}.` }));
  });
  await fetch(`${session.dashboardUrl}/api/agents/jobs`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ id: data.job.id, status: result.ok ? 'success' : 'failed', note: result.message }) });
  if (!result.ok) throw new Error(result.message);
  console.log('✔ Status job di dashboard diperbarui: success.');
  return true;
}

async function waitForJob() {
  const until = Date.now() + 10 * 60 * 1000;
  console.log('Menunggu job dari Web Tools selama maksimal 10 menit…');
  while (Date.now() < until) {
    const handled = await claim({ silent: true });
    if (handled) return;
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  console.log('Tidak ada job baru selama 10 menit. Agent berhenti; jalankan npm run agent lagi saat siap menerima job.');
}

(mode === 'claim' ? claim() : mode === 'wait' ? waitForJob() : connect()).catch(error => { console.error(`✘ ${error.message}`); process.exitCode = 1; });
