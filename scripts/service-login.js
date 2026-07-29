#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import fs from 'fs-extra';
import open from 'open';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const service = (process.argv[process.argv.indexOf('--service') + 1] || '').toLowerCase();
const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${command} berhenti dengan kode ${code}.`)));
});

async function main() {
  if (service === 'gas') {
    console.log('Membuka Google Apps Script API settings...');
    await open('https://script.google.com/home/usersettings');
    console.log('Aktifkan Apps Script API bila belum aktif, lalu selesaikan login clasp di browser.');
    await run('clasp', ['login']);
    await fs.writeJson(path.join(root, 'authsesion.json'), { provider: 'google_apps_script', connectedAt: new Date().toISOString(), session: 'managed-by-clasp' }, { spaces: 2 });
    console.log('Google Apps Script terhubung secara lokal. Sesi OAuth dikelola oleh clasp.');
    return;
  }
  if (service === 'vercel') {
    console.log('Menjalankan login Vercel resmi...');
    await run('npx', ['vercel', 'login']);
    await fs.writeJson(path.join(root, 'vercel-session.json'), { provider: 'vercel', connectedAt: new Date().toISOString(), session: 'managed-by-vercel-cli' }, { spaces: 2 });
    console.log('Vercel terhubung secara lokal. Sesi OAuth dikelola oleh Vercel CLI.');
    return;
  }
  throw new Error('Gunakan --service gas atau --service vercel.');
}

main().catch(error => { console.error(`✘ ${error.message}`); process.exitCode = 1; });
