#!/usr/bin/env node
import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { decryptVaultPayload } from './vault-crypto.js';
import { runWebJob } from '../index.js';

const agentModuleUrl = import.meta.url;
const sourceRoot = agentModuleUrl ? path.resolve(path.dirname(fileURLToPath(agentModuleUrl)), '..') : process.cwd();
const root = process.env.WEBTONATIVE_WORKSPACE_ROOT || (process.pkg ? process.cwd() : sourceRoot);
const sessionPath = path.join(root, 'webtonative-agent.json');
// Hanya memuat ciphertext, salt, iv, serta metadata. Tidak pernah berisi
// Master Password, API key plaintext, atau token OAuth.
const vaultCachePath = path.join(root, 'webtonative-vault-cache.json');
const launcherPath = path.join(root, 'WebToNative-Agent.cmd');
const args = process.argv.slice(2);
const valueOf = name => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] || '' : '';
};
const mode = args[0] === 'claim' ? 'claim' : args[0] === 'wait' ? 'wait' : 'connect';
let runtimeVaultPassword = '';
let runtimeVaultDocument = null;
let lastSyncedAiUpdatedAt = '';
const reportedLocalServices = new Set();

// Master Password hanya dipakai di RAM proses agent ini. Input tidak dicetak
// ke terminal dan tidak ditulis ke session file, log, atau environment.
function askHiddenPassword(prompt = 'Masukkan Master Password vault: ') {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) return resolve('');
    let value = '';
    const cleanup = () => {
      process.stdin.off('data', onData);
      process.stdin.setRawMode?.(false);
      process.stdin.pause();
    };
    const onData = (buffer) => {
      const key = buffer.toString('utf8');
      if (key === '\u0003') { cleanup(); process.stdout.write('\n'); return resolve(''); }
      if (key === '\r' || key === '\n') { cleanup(); process.stdout.write('\n'); return resolve(value); }
      if (key === '\u0008' || key === '\u007f') { value = value.slice(0, -1); return; }
      if (!key.startsWith('\u001b')) value += key;
    };
    process.stdout.write(prompt);
    process.stdin.setRawMode?.(true);
    process.stdin.resume();
    process.stdin.on('data', onData);
  });
}

async function syncAiConnection(session) {
  let data = null;
  try {
    const response = await fetch(`${session.dashboardUrl}/api/agents/connections`, { headers: { Authorization: `Bearer ${session.token}` } });
    if (response.ok) data = await response.json();
  } catch {
    // Fallback aman: cache lokal hanya berisi ciphertext E2EE, bukan plaintext.
  }
  if (data?.vaultPayload) {
    // Agen versi lama mungkin belum menyimpan userId di file session. Ambil
    // identitas yang sudah terverifikasi oleh endpoint agent sekali ini agar
    // cache tidak mungkin dipakai oleh pairing akun lain di folder yang sama.
    if (data.vaultUserId && !session.userId) {
      session.userId = data.vaultUserId;
      await fs.writeJson(sessionPath, session, { spaces: 2 });
    }
    await fs.writeJson(vaultCachePath, {
      version: 1,
      userId: data.vaultUserId,
      payload: data.vaultPayload,
      updatedAt: data.updatedAt || new Date().toISOString(),
      cachedAt: new Date().toISOString()
    }, { spaces: 2 });
  } else if (await fs.pathExists(vaultCachePath)) {
    const cached = await fs.readJson(vaultCachePath).catch(() => null);
    if (cached?.payload && (!cached.userId || cached.userId === session.userId)) {
      data = { vaultPayload: cached.payload, vaultUserId: cached.userId || session.userId || '', updatedAt: cached.updatedAt || null, cached: true };
    }
  }
  if (!data?.vaultPayload) return;
  if (data.updatedAt && data.updatedAt === lastSyncedAiUpdatedAt && runtimeVaultDocument) return;
  let password = valueOf('--vault-password') || process.env.WEBTONATIVE_VAULT_PASSWORD || runtimeVaultPassword;
  while (!password) {
    console.log('Konfigurasi AI terenkripsi ditemukan.');
    password = await askHiddenPassword();
    if (!password) { console.log('Sinkronisasi API key dilewati. Agent tetap menunggu job.'); return; }
  }
  let decrypted;
  while (true) {
    try {
      decrypted = decryptVaultPayload(data.vaultPayload, password, data.vaultUserId);
      runtimeVaultPassword = password;
      break;
    } catch (error) {
      runtimeVaultPassword = '';
      console.log(`Master Password tidak dapat membuka vault: ${error.message}`);
      password = await askHiddenPassword('Coba lagi (Ctrl+C untuk melewati): ');
      if (!password) { console.log('Sinkronisasi API key dilewati. Agent tetap menunggu job.'); return; }
    }
  }
  const aiProvider = typeof decrypted === 'string' ? { apiKey: decrypted } : decrypted?.aiProviders?.find((item) => String(item?.apiKey || '').trim());
  if (!aiProvider?.apiKey) { console.log('Vault berhasil dibuka, tetapi belum ada API key AI yang tersimpan.'); return; }
  runtimeVaultDocument = typeof decrypted === 'string' ? { aiProviders: [aiProvider] } : decrypted;
  lastSyncedAiUpdatedAt = data.updatedAt || new Date().toISOString();
  console.log(`✔ Vault terenkripsi ${data.cached ? 'dimuat dari cache lokal' : 'disinkronkan dan di-cache lokal'}. API key hanya aktif di RAM agent.`);
}

function aiConfigFromVault() {
  const item = runtimeVaultDocument?.aiProviders?.find((entry) => String(entry?.apiKey || '').trim());
  if (!item?.apiKey) return null;
  const raw = String(item.provider || '').trim();
  const [providerPart, ...modelParts] = raw.split(/[/:]/).map(value => value.trim()).filter(Boolean);
  const provider = ['openai', 'groq', 'nvidia', 'openrouter', 'custom'].includes((providerPart || '').toLowerCase()) ? providerPart.toLowerCase() : 'openai';
  const defaults = { openai: 'gpt-4o-mini', groq: 'llama-3.3-70b-versatile', nvidia: 'meta/llama-3.1-8b-instruct', openrouter: 'openai/gpt-4o-mini' };
  return [`provider=${provider}`, `api_key=${String(item.apiKey).trim()}`, `model=${modelParts.join('/') || defaults[provider] || 'gpt-4o-mini'}`].join('\n');
}

// Generator lama membaca api.txt. Agent membuat file sementara di %TEMP%
// hanya ketika job berjalan lalu menghapusnya kembali; workspace tetap bersih.
async function runWithEphemeralAiConfig(action) {
  const config = aiConfigFromVault();
  if (!config) return action();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'webtonative-ai-'));
  const configPath = path.join(tempDir, 'api.txt');
  const previous = process.env.WEBTONATIVE_AI_CONFIG_PATH;
  try {
    await fs.writeFile(configPath, `${config}\n`, { encoding: 'utf8', mode: 0o600 });
    process.env.WEBTONATIVE_AI_CONFIG_PATH = configPath;
    return await action();
  } finally {
    if (previous === undefined) delete process.env.WEBTONATIVE_AI_CONFIG_PATH;
    else process.env.WEBTONATIVE_AI_CONFIG_PATH = previous;
    await fs.remove(tempDir);
  }
}

function normalizeUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('URL dashboard harus HTTP atau HTTPS.');
  return url.origin;
}

function runInteractive(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32', windowsHide: false });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${command} berhenti dengan kode ${code}.`)));
  });
}

async function openBrowser(url) {
  if (process.platform === 'win32') return runInteractive('cmd.exe', ['/c', 'start', '', url]);
  if (process.platform === 'darwin') return runInteractive('open', [url]);
  return runInteractive('xdg-open', [url]);
}

async function reportServiceConnection(session, service) {
  const response = await fetch(`${session.dashboardUrl}/api/agents/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
    body: JSON.stringify({ service })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Status layanan tidak dapat disimpan di dashboard.');
}

// clasp dan Vercel menyimpan token OAuth di profil OS pengguna, bukan di folder
// proyek. Deteksi marker lokal ini memungkinkan agent yang dipindahkan ke folder
// lain pada komputer yang sama langsung memakai sesi resmi yang sudah ada tanpa
// menyalin credential atau token mentah ke workspace.
async function detectLocalServiceSessions(session) {
  const home = os.homedir();
  const appData = process.env.APPDATA || '';
  const candidates = {
    gas: [path.join(home, '.clasprc.json')],
    vercel: [path.join(home, '.vercel', 'auth.json'), path.join(appData, 'com.vercel.cli', 'auth.json')]
  };
  for (const [service, paths] of Object.entries(candidates)) {
    if (reportedLocalServices.has(service)) continue;
    if (await Promise.any(paths.map(async (candidate) => (await fs.pathExists(candidate)) ? true : Promise.reject(new Error('not found')))).catch(() => false)) {
      try {
        await reportServiceConnection(session, service);
        reportedLocalServices.add(service);
        console.log(`✔ Sesi ${service === 'gas' ? 'Google Apps Script' : 'Vercel'} lokal terdeteksi dari profil komputer ini.`);
      } catch {
        // Reporting gagal tidak membatalkan agent; CLI resmi tetap sumber kebenaran.
      }
    }
  }
}

async function runServiceLogin(session, service) {
  if (service === 'gas') {
    console.log('Membuka pengaturan Google Apps Script API di browser...');
    await openBrowser('https://script.google.com/home/usersettings');
    console.log('Selesaikan aktivasi API bila diperlukan, lalu lanjutkan otorisasi clasp di browser.');
    try { await runInteractive('clasp', ['login']); }
    catch { await runInteractive('npx', ['--yes', '@google/clasp@latest', 'login']); }
    await fs.writeJson(path.join(root, 'authsesion.json'), { provider: 'google_apps_script', connectedAt: new Date().toISOString(), session: 'managed-by-clasp' }, { spaces: 2 });
    await reportServiceConnection(session, service);
    return 'Google Apps Script berhasil diautentikasi di komputer lokal.';
  }
  if (service === 'vercel') {
    console.log('Membuka proses login Vercel resmi...');
    try { await runInteractive('npx', ['vercel', 'login']); }
    catch { await runInteractive('npx', ['--yes', 'vercel@latest', 'login']); }
    await fs.writeJson(path.join(root, 'vercel-session.json'), { provider: 'vercel', connectedAt: new Date().toISOString(), session: 'managed-by-vercel-cli' }, { spaces: 2 });
    await reportServiceConnection(session, service);
    return 'Vercel berhasil diautentikasi di komputer lokal.';
  }
  throw new Error('Layanan login tidak dikenal.');
}

async function writeWindowsLauncher() {
  if (process.platform !== 'win32') return;
  const binaryName = 'WebToNative-Agent-win-x64.exe';
  const content = `@echo off\r\n"%~dp0${binaryName}" wait\r\n`;
  await fs.writeFile(launcherPath, content, 'utf8');
}

async function connect() {
  const url = normalizeUrl(valueOf('--url'));
  const code = valueOf('--code').trim().toUpperCase();
  if (!code) throw new Error('Isi kode dengan --code KODE_DARI_DASHBOARD.');
  const response = await fetch(`${url}/api/agents/connect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, deviceName: os.hostname() }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Koneksi ke dashboard gagal.');
  await fs.writeJson(sessionPath, { dashboardUrl: url, token: data.token, userId: data.userId || '', deviceName: data.deviceName, connectedAt: new Date().toISOString() }, { spaces: 2 });
  await writeWindowsLauncher();
  await detectLocalServiceSessions({ dashboardUrl: url, token: data.token });
  await syncAiConnection({ dashboardUrl: url, token: data.token });
  console.log(`✔ CLI terhubung sebagai ${data.deviceName}.`);
  console.log('Agent langsung aktif dan akan menunggu job dari Web Tools.');
  await waitForJob();
}

async function claim({ silent = false } = {}) {
  if (!await fs.pathExists(sessionPath)) throw new Error('CLI belum terhubung. Jalankan WebToNative Agent dengan perintah connect dan kode pairing dari dashboard.');
  const session = await fs.readJson(sessionPath);
  await detectLocalServiceSessions(session);
  await syncAiConnection(session);
  const response = await fetch(`${session.dashboardUrl}/api/agents/jobs`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ supportedFlows: ['gas', 'migration', 'android', 'service_login'] }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Tidak dapat mengambil job.');
  if (!data.job) { if (!silent) console.log('Tidak ada job yang menunggu.'); return false; }
  console.log(`✔ Job diambil: ${data.job.name}`);
  console.log(`  Alur: ${data.job.flow}`);
  console.log('➤ Menjalankan generator otomatis di background agent...');
  const result = await (async () => {
    try {
      if (data.job.options?.serviceLogin || data.job.flow === 'service_login') {
        const message = await runServiceLogin(session, data.job.options?.service || 'gas');
        return { ok: true, message };
      }
      if (['gas', 'migration', 'android'].includes(data.job.flow)) {
        const output = await runWithEphemeralAiConfig(() => runWebJob(data.job));
        const labels = { gas: 'Web App GAS', migration: 'Migrasi Next.js', android: 'Android native' };
        return { ok: true, message: `${labels[data.job.flow]} selesai diproses oleh CLI lokal.`, result: output || {} };
      }
      if (process.pkg) throw new Error(`Agent binary belum mendukung alur ${data.job.flow}.`);
      const child = spawn(process.execPath, [path.join(sourceRoot, 'scripts', 'service-login.js'), '--service', data.job.options?.service || 'gas'], { cwd: root, env: { ...process.env, WEBTONATIVE_JOB: JSON.stringify(data.job) }, stdio: 'inherit', windowsHide: true });
      const code = await new Promise(resolve => child.on('exit', resolve));
      return { ok: code === 0, message: code === 0 ? 'Job layanan selesai.' : `Generator berhenti dengan kode ${code}.` };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  })();
  await fetch(`${session.dashboardUrl}/api/agents/jobs`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ id: data.job.id, status: result.ok ? 'success' : 'failed', note: result.message, result: result.result || {} }) });
  if (!result.ok) throw new Error(result.message);
  console.log('✔ Status job di dashboard diperbarui: success.');
  return true;
}

async function waitForJob() {
  let until = Date.now() + 10 * 60 * 1000;
  console.log('Menunggu job dari Web Tools selama maksimal 10 menit…');
  while (Date.now() < until) {
    const handled = await claim({ silent: true });
    if (handled) {
      until = Date.now() + 10 * 60 * 1000;
      console.log('Agent tetap aktif dan kembali menunggu job baru selama maksimal 10 menit.');
      continue;
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  console.log('Tidak ada job baru selama 10 menit. Agent berhenti; jalankan .\\WebToNative-Agent.cmd untuk menunggu job lagi.');
}

(mode === 'claim' ? claim() : mode === 'wait' ? waitForJob() : connect()).catch(error => { console.error(`✘ ${error.message}`); process.exitCode = 1; });
