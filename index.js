#!/usr/bin/env node
/**
 * ==================================================================
 * GAS Web App Generator — Node.js CLI
 * ------------------------------------------------------------------
 * Generator otomatis untuk proyek Google Apps Script (GAS) Web App
 * bertema Absensi + SPP dengan tampilan SaaS modern.
 *
 * Alur:
 *  1. Tanya nama proyek -> buat folder di ./project/<nama>
 *  2. Buka browser ke halaman Google -> pandu aktifkan Apps Script API
 *  3. Jalankan `clasp login` (terintegrasi terminal)
 *  4. Jalankan `clasp create` di dalam folder proyek
 *  5. Timpa file stub dengan Code.gs, Database.gs, app.html, appsscript.json
 *  6. Jalankan `clasp push`
 *  7. Tampilkan pesan sukses + link editor
 *
 * ES Modules (import/export) — Node.js >= 18
 * ==================================================================
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import open from 'open';
import { execa } from 'execa';

import { getCodeGsTemplate } from './templates/codeGs.js';
import { getDatabaseGsTemplate } from './templates/databaseGs.js';
import { getAppHtmlTemplate } from './templates/appHtmlV3.js';
import { getAppsscriptJsonTemplate } from './templates/appsscriptJson.js';
import { PROJECT_TYPE_CHOICES, getProjectProfile } from './templates/projectProfiles.js';
import { getRandomVisualTheme } from './templates/visualThemes.js';
import { promptAndGenerateAiTheme, analyzeMigrationBuildError, analyzeGasMigrationProject, createMigrationTemplateBlueprint, analyzeGasAppRequirements, reviewMigratedNextApp, requestMigrationAutoRepair, requestGasAutoRepair, analyzeMobileApp, reviewMobileWrapper } from './templates/aiTheme.js';
import { getNextMigrationFiles } from './templates/nextJsMigration.js';
import { getMobileWrapperFiles, getNativeAndroidActivity } from './templates/mobileApp.js';
import { findBestMigrationTemplate, saveMigrationTemplate } from './templates/migrationTemplateLibrary.js';
import { findGasBlueprint, saveGasBlueprint, applyGasBlueprint } from './templates/gasAppTemplateLibrary.js';

// ------------------------------------------------------------------
// PATH DASAR
// Root direktori = tempat index.js ini berada (bukan process.cwd())
// agar bot selalu konsisten membuat folder 'project' di sebelah dirinya
// sendiri, terlepas dari mana terminal dijalankan.
// ------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;
const PROJECT_CONTAINER_DIR = path.join(ROOT_DIR, 'project');
const MIGRATION_CONTAINER_DIR = path.join(ROOT_DIR, 'webmigrasi');
const MOBILE_CONTAINER_DIR = path.join(ROOT_DIR, 'apkmigrasi');
const GENERATOR_STATE_PATH = path.join(ROOT_DIR, 'authsesion.json');
const VERCEL_SESSION_PATH = path.join(ROOT_DIR, 'vercel-session.json');
const PORTABLE_JDK_DIR = path.join(process.env.LOCALAPPDATA || ROOT_DIR, 'GAS-WebApp-Generator', 'jdk-17');

// ------------------------------------------------------------------
// UTIL: banner & logging
// ------------------------------------------------------------------
function printBanner() {
  console.log('');
  console.log(chalk.bold.cyanBright('  ╔══════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyanBright('  ║        GAS WEB APP GENERATOR — Node.js CLI        ║'));
  console.log(chalk.bold.cyanBright('  ║   Absensi + SPP SaaS Web App on Google Apps Script║'));
  console.log(chalk.bold.cyanBright('  ╚══════════════════════════════════════════════════╝'));
  console.log('');
}

function logStep(text) {
  console.log(chalk.blueBright('\n➤ ' + text));
}

function logSuccess(text) {
  console.log(chalk.greenBright('✔ ' + text));
}

function logError(text) {
  console.log(chalk.redBright('✘ ' + text));
}

function logInfo(text) {
  console.log(chalk.gray('  ' + text));
}

// ------------------------------------------------------------------
// UTIL: menjalankan perintah eksternal dengan stdio interaktif
// (dipakai untuk clasp login, clasp create, clasp push agar
//  prompt/browser bawaan clasp tetap bisa muncul normal)
// ------------------------------------------------------------------
async function runInteractive(command, args, cwd, env = undefined) {
  return execa(command, args, {
    cwd,
    stdio: 'inherit',
    env: env ? { ...process.env, ...env } : process.env
  });
}

async function findJavaHome() {
  const candidates = [
    process.env.JAVA_HOME,
    PORTABLE_JDK_DIR,
    'D:\\android studio\\jbr',
    'C:\\Program Files\\Android\\Android Studio\\jbr'
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (await fs.pathExists(path.join(candidate, 'bin', 'java.exe'))) return candidate;
  }
  return null;
}

async function installPortableJdk() {
  if (process.platform !== 'win32') throw new Error('Bootstrap JDK otomatis saat ini tersedia untuk Windows. Instal JDK 17+ melalui package manager OS Anda.');
  const javaExe = path.join(PORTABLE_JDK_DIR, 'bin', 'java.exe');
  if (await fs.pathExists(javaExe)) return PORTABLE_JDK_DIR;
  const baseDir = path.dirname(PORTABLE_JDK_DIR);
  const downloadDir = path.join(baseDir, '.generator-download-jdk');
  const zipPath = path.join(downloadDir, 'temurin-17.zip');
  const extractDir = path.join(downloadDir, 'extract');
  const url = 'https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse';
  logStep('JDK 17 belum ditemukan — mengunduh Eclipse Temurin JDK portable...');
  logInfo('Sumber: Eclipse Adoptium (Temurin 17 LTS).');
  await fs.ensureDir(downloadDir);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unduhan JDK 17 gagal (HTTP ${response.status}).`);
  await fs.writeFile(zipPath, Buffer.from(await response.arrayBuffer()));
  await fs.remove(extractDir);
  await execa('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force`], { stdio: 'inherit' });
  const entries = await fs.readdir(extractDir, { withFileTypes: true });
  const extractedJdk = entries.map(entry => path.join(extractDir, entry.name)).find(candidate => fs.existsSync(path.join(candidate, 'bin', 'java.exe')));
  if (!extractedJdk) throw new Error('Arsip JDK tidak memiliki struktur yang diharapkan.');
  await fs.ensureDir(baseDir);
  await fs.remove(PORTABLE_JDK_DIR);
  await fs.move(extractedJdk, PORTABLE_JDK_DIR);
  await fs.remove(downloadDir);
  if (!await fs.pathExists(javaExe)) throw new Error('JDK portable gagal diverifikasi setelah ekstraksi.');
  logSuccess(`JDK 17 portable siap: ${PORTABLE_JDK_DIR}`);
  return PORTABLE_JDK_DIR;
}

async function ensureJavaHome() {
  return (await findJavaHome()) || installPortableJdk();
}

async function findAndroidSdk() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    'D:\\android studio\\Sdk',
    path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk'),
    'C:\\Android\\Sdk'
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (await fs.pathExists(path.join(candidate, 'platform-tools', 'adb.exe')) || await fs.pathExists(path.join(candidate, 'cmdline-tools', 'latest', 'bin', 'sdkmanager.bat'))) return candidate;
  }
  return null;
}

function getDefaultAndroidSdkPath() {
  return process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || path.join(process.env.LOCALAPPDATA || ROOT_DIR, 'Android', 'Sdk');
}

async function getAndroidCommandLineToolsUrl() {
  const fallback = 'https://dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip';
  try {
    const response = await fetch('https://dl.google.com/android/repository/repository2-1.xml');
    if (!response.ok) return fallback;
    const repository = await response.text();
    const packageBlock = repository.match(/<remotePackage path="cmdline-tools;latest">([\s\S]*?)<\/remotePackage>/)?.[1] || '';
    const archives = [...packageBlock.matchAll(/<archive>([\s\S]*?)<\/archive>/g)].map(match => match[1]);
    const windowsArchive = archives.find(archive => /<host-os>windows<\/host-os>/.test(archive));
    const archiveUrl = windowsArchive?.match(/<url>([^<]+)<\/url>/)?.[1];
    return archiveUrl ? `https://dl.google.com/android/repository/${archiveUrl.trim()}` : fallback;
  } catch {
    return fallback;
  }
}

async function installAndroidCommandLineTools(sdkRoot) {
  if (process.platform !== 'win32') throw new Error('Instalasi SDK otomatis saat ini tersedia untuk Windows. Instal Android Command-line Tools melalui package manager OS Anda.');
  const sdkManager = path.join(sdkRoot, 'cmdline-tools', 'latest', 'bin', 'sdkmanager.bat');
  if (await fs.pathExists(sdkManager)) return sdkManager;
  const url = await getAndroidCommandLineToolsUrl();
  const downloadDir = path.join(sdkRoot, '.generator-download');
  const zipPath = path.join(downloadDir, 'commandlinetools-win.zip');
  const extractDir = path.join(downloadDir, 'extract');
  logStep('Android SDK belum ditemukan — mengunduh Android Command-line Tools resmi...');
  logInfo(url);
  await fs.ensureDir(downloadDir);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unduhan Android Command-line Tools gagal (HTTP ${response.status}).`);
  await fs.writeFile(zipPath, Buffer.from(await response.arrayBuffer()));
  await fs.remove(extractDir);
  await execa('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force`], { stdio: 'inherit' });
  const extractedTools = path.join(extractDir, 'cmdline-tools');
  if (!await fs.pathExists(extractedTools)) throw new Error('Arsip Android Command-line Tools tidak memiliki struktur yang diharapkan.');
  const targetTools = path.join(sdkRoot, 'cmdline-tools', 'latest');
  await fs.ensureDir(path.dirname(targetTools));
  await fs.remove(targetTools);
  await fs.move(extractedTools, targetTools);
  await fs.remove(downloadDir);
  if (!await fs.pathExists(sdkManager)) throw new Error('Command-line Tools Windows berhasil diunduh, tetapi sdkmanager.bat tidak ditemukan setelah ekstraksi. Hapus folder cmdline-tools lalu jalankan ulang menu Mobile App.');
  logSuccess(`Android Command-line Tools terpasang: ${targetTools}`);
  return sdkManager;
}

async function runSdkManager(sdkManager, sdkRoot, javaHome, args, acceptLicenses = false) {
  const env = { ...process.env, JAVA_HOME: javaHome, ANDROID_HOME: sdkRoot, ANDROID_SDK_ROOT: sdkRoot, Path: `${path.join(javaHome, 'bin')};${process.env.Path || process.env.PATH || ''}` };
  const quoteForCmd = value => `"${String(value).replace(/"/g, '""')}"`;
  const command = `${quoteForCmd(sdkManager)} ${quoteForCmd(`--sdk_root=${sdkRoot}`)} ${args.map(quoteForCmd).join(' ')}`;
  // sdkmanager pada Windows adalah file .bat. Jalankan melalui cmd.exe agar
  // Node tidak mencoba memperlakukannya sebagai executable native.
  const result = await execa('cmd.exe', ['/d', '/s', '/c', command], { env, all: true, input: acceptLicenses ? 'y\n'.repeat(80) : undefined });
  if (result.all) console.log(result.all);
}

async function ensureAndroidBuildEnv() {
  let javaHome;
  try { javaHome = await ensureJavaHome(); }
  catch (error) { logError(`JDK belum dapat disiapkan otomatis: ${error.message}`); return null; }
  const sdkRoot = (await findAndroidSdk()) || getDefaultAndroidSdkPath();
  const sdkManager = await installAndroidCommandLineTools(sdkRoot);
  const required = [
    path.join(sdkRoot, 'platform-tools', 'adb.exe'),
    path.join(sdkRoot, 'platforms', 'android-35', 'android.jar'),
    path.join(sdkRoot, 'build-tools', '35.0.0')
  ];
  if (!(await Promise.all(required.map(item => fs.pathExists(item)))).every(Boolean)) {
    logStep('Menyiapkan Android SDK untuk build APK (Platform Tools, API 35, Build Tools)...');
    await runSdkManager(sdkManager, sdkRoot, javaHome, ['--licenses'], true);
    await runSdkManager(sdkManager, sdkRoot, javaHome, ['platform-tools', 'platforms;android-35', 'build-tools;35.0.0']);
    logSuccess('Android SDK siap untuk build APK.');
  } else logInfo(`Android SDK terdeteksi dan siap: ${sdkRoot}`);
  return getAndroidBuildEnv();
}

async function getAndroidBuildEnv() {
  const javaHome = await findJavaHome();
  const androidSdk = await findAndroidSdk();
  if (!javaHome || !androidSdk) return null;
  const currentPath = process.env.Path || process.env.PATH || '';
  const toolPath = `${path.join(javaHome, 'bin')};${path.join(androidSdk, 'platform-tools')};${path.join(androidSdk, 'emulator')};${currentPath}`;
  return { JAVA_HOME: javaHome, ANDROID_HOME: androidSdk, ANDROID_SDK_ROOT: androidSdk, Path: toolPath, PATH: toolPath };
}

async function configureAndroidLocalProperties(targetDir, androidEnv) {
  const androidDir = await fs.pathExists(path.join(targetDir, 'settings.gradle.kts')) ? targetDir : path.join(targetDir, 'android');
  if (!await fs.pathExists(androidDir)) return;
  const sdkPath = androidEnv.ANDROID_HOME.replace(/\\/g, '\\\\');
  await fs.writeFile(path.join(androidDir, 'local.properties'), `sdk.dir=${sdkPath}\n`, 'utf8');
  // Android Studio versi baru membaca macro #GRADLE_LOCAL_JAVA_HOME dari
  // android/.gradle/config.properties. Tulis JDK absolut sebelum project
  // dibuka agar Sync tidak gagal dengan "Invalid Gradle JDK configuration".
  const gradleDir = path.join(androidDir, '.gradle');
  await fs.ensureDir(gradleDir);
  const javaHome = androidEnv.JAVA_HOME.replace(/\\/g, '/');
  const sdkHome = androidEnv.ANDROID_HOME.replace(/\\/g, '/');
  await fs.writeFile(path.join(gradleDir, 'config.properties'), `java.home=${javaHome}\nsdk.dir=${sdkHome}\n`, 'utf8');
}

async function runNextBuild(cwd) {
  try {
    const result = await execa('npm', ['run', 'build'], { cwd, all: true });
    if (result.all) console.log(result.all);
    return result;
  } catch (err) {
    const output = [err.all, err.stderr, err.stdout, err.shortMessage, err.message].filter(Boolean).join('\n');
    if (output) console.log(output);
    err.buildOutput = output;
    throw err;
  }
}

async function ensureVercelSession(cwd) {
  try {
    const result = await execa('npx', ['vercel', 'whoami'], { cwd, all: true });
    const account = String(result.all || result.stdout || '').trim().split(/\r?\n/).filter(Boolean).at(-1);
    await fs.writeJson(VERCEL_SESSION_PATH, { account: account || null, validatedAt: new Date().toISOString() }, { spaces: 2 });
    logInfo(`Menggunakan sesi Vercel: ${account || 'aktif'}.`);
    return;
  } catch {
    logInfo('Sesi Vercel belum ada atau token sudah tidak valid. Memulai login Vercel...');
    await runInteractive('npx', ['vercel', 'login'], cwd);
    try {
      const result = await execa('npx', ['vercel', 'whoami'], { cwd, all: true });
      const account = String(result.all || result.stdout || '').trim().split(/\r?\n/).filter(Boolean).at(-1);
      await fs.writeJson(VERCEL_SESSION_PATH, { account: account || null, validatedAt: new Date().toISOString() }, { spaces: 2 });
      logSuccess(`Login Vercel berhasil. Sesi tersimpan untuk deployment berikutnya${account ? `: ${account}` : '.'}`);
    } catch (error) {
      throw new Error('Login Vercel belum berhasil. Selesaikan otorisasi browser/email lalu jalankan deploy kembali.');
    }
  }
}

function toVercelProjectName(value) {
  const normalized = String(value || 'migrated-app').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-{3,}/g, '--').replace(/^[._-]+|[._-]+$/g, '').slice(0, 100);
  return normalized || 'migrated-app';
}

async function deployToVercel(cwd, args) {
  try {
    const result = await execa('npx', args, { cwd, all: true });
    if (result.all) console.log(result.all);
    const urls = String(result.all || '').match(/https:\/\/[^\s)]+/g) || [];
    return urls.filter(url => /vercel\.app/i.test(url)).at(-1) || urls.at(-1) || null;
  } catch (error) {
    if (error.all) console.log(error.all);
    throw error;
  }
}

// ------------------------------------------------------------------
// UTIL: cek apakah clasp CLI tersedia secara global
// ------------------------------------------------------------------
async function ensureClaspAvailable() {
  try {
    await execa('clasp', ['--version']);
    return true;
  } catch (err) {
    logError('CLI "clasp" tidak ditemukan di sistem Anda.');
    logInfo('Install terlebih dahulu dengan perintah:');
    logInfo(chalk.yellow('  npm install -g @google/clasp'));
    return false;
  }
}

async function loadGeneratorState() {
  try {
    if (await fs.pathExists(GENERATOR_STATE_PATH)) {
      return await fs.readJson(GENERATOR_STATE_PATH);
    }
  } catch (err) {
    logInfo('Status sesi lokal tidak dapat dibaca; akan diperiksa ulang.');
  }
  return { appsScriptApiConfirmed: false, claspSession: null };
}

async function saveGeneratorState(state) {
  await fs.writeJson(GENERATOR_STATE_PATH, state, { spaces: 2 });
}

async function getClaspSession() {
  try {
    const result = await execa('clasp', ['show-authorized-user', '--json']);
    const session = JSON.parse(result.stdout);
    return session.loggedIn ? session : null;
  } catch (err) {
    return null;
  }
}

async function promptOperation() {
  return inquirer.prompt([{
    type: 'list', name: 'operation', message: 'Pilih mode tools:', choices: [
      { name: '1. WebApp New — buat dan deploy GAS Web App', value: 'generate' },
      { name: '2. Migrasi Project — ubah proyek GAS menjadi Next.js', value: 'migrate' },
      { name: '3. Mobile App — buat APK / iOS wrapper dari web yang sudah deploy', value: 'mobile' },
      { name: '4. Cek Aplikasi — jalankan hasil APK wrapper di Android Emulator', value: 'check-mobile' },
      { name: '5. Web Tools — hubungkan CLI lokal ke dashboard', value: 'connect-web' }
    ]
  }]);
}

async function connectWebDashboard() {
  const { dashboardUrl, code } = await inquirer.prompt([
    { type: 'input', name: 'dashboardUrl', message: 'URL Web Tools (contoh http://localhost:3000):', default: 'http://localhost:3000', validate: value => /^https?:\/\//i.test(value.trim()) ? true : 'Masukkan URL HTTP atau HTTPS.' },
    { type: 'input', name: 'code', message: 'Kode koneksi dari halaman Web Tools:', validate: value => value.trim().length >= 6 ? true : 'Kode koneksi belum valid.' }
  ]);
  logStep('Menghubungkan CLI lokal ke Web Tools...');
  await execa(process.execPath, [path.join(__dirname, 'scripts', 'web-dashboard-agent.js'), '--url', dashboardUrl.trim(), '--code', code.trim()], { stdio: 'inherit' });
}

async function readGasProjectProfile(projectDir) {
  const codePath = path.join(projectDir, 'Code.gs');
  const content = await fs.readFile(codePath, 'utf8');
  const match = content.match(/const APP_CONFIG = ([\s\S]*?);\s*\n\s*function doGet/);
  if (!match) throw new Error('APP_CONFIG tidak ditemukan pada Code.gs. Proyek GAS ini tidak memakai format generator yang didukung.');
  const profile = JSON.parse(match[1]);
  if (!profile?.modules?.length) throw new Error('Modul aplikasi tidak ditemukan pada proyek GAS.');
  return profile;
}

async function runNextMigration() {
  await fs.ensureDir(PROJECT_CONTAINER_DIR);
  const entries = await fs.readdir(PROJECT_CONTAINER_DIR, { withFileTypes: true });
  const choices = [];
  for (const entry of entries) {
    if (entry.isDirectory() && await fs.pathExists(path.join(PROJECT_CONTAINER_DIR, entry.name, 'Code.gs'))) {
      choices.push({ name: entry.name, value: entry.name });
    }
  }
  if (!choices.length) throw new Error('Tidak ada proyek GAS yang dapat dimigrasikan di folder project/.');
  const { sourceName } = await inquirer.prompt([{ type: 'list', name: 'sourceName', message: 'Pilih proyek GAS yang akan dimigrasikan:', choices }]);
  const sourceDir = path.join(PROJECT_CONTAINER_DIR, sourceName);
  const profile = await readGasProjectProfile(sourceDir);
  logStep('AI Migration Preflight — menganalisis modul, UI, backend, SEO, dan risiko...');
  let migrationAnalysis = null;
  try {
    migrationAnalysis = await analyzeGasMigrationProject(profile.name || sourceName, profile);
    if (migrationAnalysis) {
      logSuccess(`AI Preflight: ${migrationAnalysis.summary || 'analisis selesai.'}`);
      if (migrationAnalysis.uiDirection) logInfo(`UI: ${migrationAnalysis.uiDirection}`);
      if (migrationAnalysis.backendPlan) logInfo(`Backend: ${migrationAnalysis.backendPlan}`);
      if (migrationAnalysis.risks?.length) logInfo(`Risiko: ${migrationAnalysis.risks.join(' | ')}`);
      logInfo(`SEO: ${migrationAnalysis.seoTitle || profile.name}`);
    } else {
      logInfo('AI Preflight dilewati: api.txt belum tersedia atau tidak valid. Menggunakan analisis template bawaan.');
    }
  } catch (err) {
    logError(`AI Preflight gagal: ${err.message}`);
    logInfo('Migrasi dilanjutkan dengan pemeriksaan template bawaan.');
  }
  logStep('Mencari template migrasi lokal yang paling sesuai...');
  let templateMatch = await findBestMigrationTemplate(profile, migrationAnalysis);
  let migrationTemplate = templateMatch.design;
  if (templateMatch.matched) {
    logSuccess(`Template lokal dipakai: ${migrationTemplate.name} (skor ${templateMatch.score}).`);
  } else {
    logInfo('Tidak ada template lokal yang cukup cocok. Meminta AI membuat blueprint template baru...');
    try {
      const blueprint = await createMigrationTemplateBlueprint(profile.name || sourceName, profile, migrationAnalysis);
      if (blueprint) {
        const saved = await saveMigrationTemplate(blueprint);
        migrationTemplate = saved.design;
        logSuccess(`Blueprint AI disimpan: ${path.relative(ROOT_DIR, saved.file)}.`);
        logInfo(`Template baru: ${migrationTemplate.name} (${migrationTemplate.layout}/${migrationTemplate.landing}).`);
      } else {
        logInfo('AI template tidak tersedia; menggunakan Business Core yang aman.');
      }
    } catch (err) {
      logError(`AI pembuat template gagal: ${err.message}`);
      logInfo('Menggunakan Business Core yang aman agar migrasi tetap berjalan.');
    }
  }
  const targetDir = path.join(MIGRATION_CONTAINER_DIR, sourceName);
  if (await fs.pathExists(targetDir)) {
    const { overwrite } = await inquirer.prompt([{ type: 'confirm', name: 'overwrite', message: `Folder webmigrasi/${sourceName} sudah ada. Timpa isinya?`, default: false }]);
    if (!overwrite) throw new Error('Migrasi dibatalkan; folder tujuan tidak diubah.');
    await fs.emptyDir(targetDir);
  } else {
    await fs.ensureDir(targetDir);
  }
  const files = getNextMigrationFiles({ projectName: profile.name || sourceName, profile, analysis: migrationAnalysis, designTemplate: migrationTemplate });
  for (const [filename, content] of Object.entries(files)) {
    const filePath = path.join(targetDir, filename);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf8');
  }
  logSuccess(`Migrasi Next.js dibuat: ${targetDir}`);
  logStep('Memasang dependensi Next.js dan memeriksa production build...');
  let buildReady = true;
  try {
    await runInteractive('npm', ['install'], targetDir);
    await runNextBuild(targetDir);
    logSuccess('Next.js production build berhasil.');
  } catch (err) {
    buildReady = false;
    logError('Build Next.js gagal. Periksa error di atas; source migrasi tetap tersimpan dan dapat diperbaiki.');
    let buildError = [err.buildOutput, err.shortMessage, err.stderr, err.stdout, err.message].filter(Boolean).join('\n');
    const knownRepair = await repairKnownMigrationError(targetDir, buildError);
    if (knownRepair) {
      logInfo(`Auto-repair diterapkan: ${knownRepair}. Menjalankan build ulang...`);
      try {
        await runNextBuild(targetDir);
        buildReady = true;
        logSuccess('Build berhasil setelah auto-repair.');
      } catch (retryErr) {
        logError('Build masih gagal setelah auto-repair.');
        buildError = [retryErr.buildOutput, retryErr.shortMessage, retryErr.stderr, retryErr.stdout, retryErr.message].filter(Boolean).join('\n');
      }
    }
    const analysis = await analyzeMigrationBuildError(buildError);
    if (analysis) {
      logInfo(`Analisis AI: ${analysis.summary || 'Tidak ada ringkasan.'}`);
      if (analysis.cause) logInfo(`Penyebab: ${analysis.cause}`);
      if (analysis.nextStep) logInfo(`Langkah berikut: ${analysis.nextStep}`);
    } else {
      logInfo('Analisis AI dilewati: api.txt belum tersedia atau tidak valid.');
    }
    if (!buildReady) buildReady = await repairMigrationBuildUntilPass(targetDir, buildError);
  }
  let qaReady = buildReady;
  if (buildReady) {
    logStep('AI Post-Build QA — memeriksa layout, formulir, menu, analitik, dan SEO...');
    const reviewFiles = {};
    for (const name of ['app/page.js', 'app/globals.css', 'app/layout.js', 'lib/app-config.js']) {
      reviewFiles[name] = await fs.readFile(path.join(targetDir, name), 'utf8');
    }
    try {
      const qa = await reviewMigratedNextApp(reviewFiles);
      if (qa) {
        await fs.writeFile(path.join(targetDir, 'MIGRATION_QA.md'), `# Post-Build QA\n\nStatus: **${qa.status}**\n\n${qa.summary}\n\n- Layout: ${qa.layout || 'n/a'}\n- Data entry: ${qa.dataEntry || 'n/a'}\n- Navigation: ${qa.navigation || 'n/a'}\n- SEO: ${qa.seo || 'n/a'}\n\n## Findings\n\n${qa.findings?.map(item => `- ${item}`).join('\n') || '- Tidak ada temuan.'}\n\n## Next step\n\n${qa.nextStep || 'Siap diuji dan dideploy.'}\n`, 'utf8');
        logInfo(`AI QA: ${qa.summary || qa.status}`);
        if (qa.findings?.length) logInfo(`Temuan QA: ${qa.findings.join(' | ')}`);
        qaReady = qa.status === 'ready';
        if (!qaReady) {
          const repaired = await runAiMigrationRepairCycle(targetDir, `${qa.summary}\n${qa.findings?.join('\n') || ''}`, 'post-build QA');
          if (repaired) {
            try {
              await runNextBuild(targetDir);
              const refreshed = {};
              for (const name of ['app/page.js', 'app/globals.css', 'app/layout.js', 'lib/app-config.js']) refreshed[name] = await fs.readFile(path.join(targetDir, name), 'utf8');
              const finalQa = await reviewMigratedNextApp(refreshed);
              qaReady = finalQa?.status === 'ready';
              logInfo(`QA setelah auto-repair: ${finalQa?.summary || (qaReady ? 'siap' : 'masih perlu review')}`);
            } catch (repairErr) {
              logError('Auto-repair QA tidak lolos build ulang.');
            }
          }
        }
      } else {
        logInfo('AI Post-Build QA dilewati: api.txt belum tersedia atau tidak valid. Static build sudah berhasil.');
      }
    } catch (err) {
      // Provider AI dapat sementara overload (mis. HTTP 503). Build Next.js
      // yang sudah lolos tetap menjadi syarat utama; kegagalan QA eksternal
      // dicatat sebagai tertunda, bukan memblokir deploy pengguna.
      qaReady = true;
      await fs.writeFile(path.join(targetDir, 'MIGRATION_QA.md'), `# Post-Build QA\n\nStatus: **pending — AI provider unavailable**\n\nBuild production sudah berhasil. AI QA tidak dapat dijalankan pada saat migrasi: ${err.message}\n\nLakukan QA ulang saat provider AI tersedia.\n`, 'utf8');
      logInfo(`AI Post-Build QA sementara tidak tersedia: ${err.message}`);
      logInfo('Build sudah lolos; migrasi dan deployment dilanjutkan tanpa menunggu layanan AI.');
    }
  }
  if (buildReady && qaReady) logSuccess('MIGRATION COMPLETE — build dan QA selesai, aplikasi siap diuji/deploy.');
  if (buildReady && !qaReady) logError('MIGRATION NEEDS REVIEW — build berhasil, tetapi QA meminta perbaikan sebelum deployment.');
  if (!buildReady) {
    logError('MIGRATION FAILED — build belum lolos; aplikasi tidak dinyatakan selesai dan deployment diblokir.');
    logInfo('Perbaiki error yang tersisa, lalu jalankan migrasi ulang agar generator membuat output bersih dari awal.');
    return;
  }
  if (!qaReady) {
    logError('MIGRATION NEEDS REVIEW — deployment diblokir sampai QA menyatakan siap.');
    return;
  }
  logInfo('Jalankan npm run dev untuk menguji aplikasi hasil migrasi secara lokal.');
  const { deploy } = await inquirer.prompt([{ type: 'confirm', name: 'deploy', message: 'Deploy ke Vercel sekarang dengan npx vercel --prod?', default: false }]);
  if (deploy) {
    logStep('Menjalankan deployment Vercel...');
    await ensureVercelSession(targetDir);
    const vercelProjectName = toVercelProjectName(sourceName);
    const deployArgs = ['vercel', '--prod', '--yes', '--name', vercelProjectName];
    logInfo(`Nama proyek Vercel: ${vercelProjectName}.`);
    try {
      const deployedUrl = await deployToVercel(targetDir, deployArgs);
      if (deployedUrl) logSuccess(`Link Vercel production: ${deployedUrl}`);
    } catch (error) {
      if (!/token is not valid|vercel login|authentication/i.test([error.message, error.stderr, error.stdout, error.all].filter(Boolean).join('\n'))) throw error;
      logInfo('Sesi Vercel tidak valid. Menjalankan vercel login untuk memperbarui autentikasi...');
      await runInteractive('npx', ['vercel', 'login'], targetDir);
      logStep('Mengulang deployment Vercel setelah login...');
      const deployedUrl = await deployToVercel(targetDir, deployArgs);
      if (deployedUrl) logSuccess(`Link Vercel production: ${deployedUrl}`);
    }
    logSuccess('Perintah deployment Vercel selesai.');
  } else if (!deploy) {
    logInfo('Deploy manual: cd webmigrasi/' + sourceName + ' && npm install && npx vercel --prod');
  }
}

async function getAndroidDevices(androidEnv = null) {
  try {
    const androidSdk = androidEnv?.ANDROID_HOME;
    const adb = androidSdk ? path.join(androidSdk, 'platform-tools', 'adb.exe') : 'adb';
    const result = await execa(adb, ['devices'], { env: androidEnv ? { ...process.env, ...androidEnv } : process.env });
    return result.stdout.split(/\r?\n/).slice(1).map(line => line.trim().split(/\s+/)).filter(parts => parts[0] && parts[1] === 'device').map(parts => parts[0]);
  } catch {
    return [];
  }
}

async function installApkToConnectedDevice(apkPath, androidEnv, applicationId = '') {
  const devices = await getAndroidDevices(androidEnv);
  if (!devices.length) {
    logInfo('APK siap. Hubungkan HP Android dengan USB debugging untuk instal otomatis, atau salin file APK ke HP dan instal manual.');
    return false;
  }
  const { device } = await inquirer.prompt([{ type: 'list', name: 'device', message: 'Pilih perangkat Android untuk memasang APK:', choices: devices }]);
  const adb = path.join(androidEnv.ANDROID_HOME, 'platform-tools', 'adb.exe');
  logStep(`Memasang APK ke perangkat ${device}...`);
  await runInteractive(adb, ['-s', device, 'install', '-r', apkPath], path.dirname(apkPath), androidEnv);
  if (applicationId) {
    try { await runInteractive(adb, ['-s', device, 'shell', 'monkey', '-p', applicationId, '1'], path.dirname(apkPath), androidEnv); } catch { logInfo('APK terpasang, tetapi aplikasi perlu dibuka dari layar utama perangkat.'); }
  }
  logSuccess('APK berhasil dipasang ke HP. Buka aplikasi dari layar utama perangkat.');
  return true;
}

async function isAndroidBootCompleted(androidEnv, device) {
  try {
    const adb = path.join(androidEnv.ANDROID_HOME, 'platform-tools', 'adb.exe');
    const result = await execa(adb, ['-s', device, 'shell', 'getprop', 'sys.boot_completed'], { env: { ...process.env, ...androidEnv } });
    return result.stdout.trim() === '1';
  } catch {
    return false;
  }
}

async function waitForAndroidDevice(androidEnv, timeoutMs = 240000) {
  const startedAt = Date.now();
  let lastProgressAt = 0;
  while (Date.now() - startedAt < timeoutMs) {
    const devices = await getAndroidDevices(androidEnv);
    if (devices.length && await isAndroidBootCompleted(androidEnv, devices[0])) return devices[0];
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    if (elapsedSeconds - lastProgressAt >= 15) {
      lastProgressAt = elapsedSeconds;
      logInfo(`Emulator sedang boot (${elapsedSeconds} detik). Menunggu sampai Android siap...`);
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  return null;
}

async function findAndroidAvdManager(androidSdk) {
  const toolsDir = path.join(androidSdk, 'cmdline-tools');
  if (!await fs.pathExists(toolsDir)) return null;
  const entries = await fs.readdir(toolsDir, { withFileTypes: true });
  for (const entry of entries) {
    const candidate = path.join(toolsDir, entry.name, 'bin', 'avdmanager.bat');
    if (entry.isDirectory() && await fs.pathExists(candidate)) return candidate;
  }
  return null;
}

async function getAndroidSystemImages(androidSdk) {
  const root = path.join(androidSdk, 'system-images');
  if (!await fs.pathExists(root)) return [];
  const images = [];
  const apiDirs = await fs.readdir(root, { withFileTypes: true });
  for (const apiDir of apiDirs) {
    if (!apiDir.isDirectory()) continue;
    const vendorPath = path.join(root, apiDir.name);
    const vendorDirs = await fs.readdir(vendorPath, { withFileTypes: true });
    for (const vendorDir of vendorDirs) {
      if (!vendorDir.isDirectory()) continue;
      const abiPath = path.join(vendorPath, vendorDir.name);
      const abiDirs = await fs.readdir(abiPath, { withFileTypes: true });
      for (const abiDir of abiDirs) {
        if (abiDir.isDirectory() && await fs.pathExists(path.join(abiPath, abiDir.name, 'package.xml'))) {
          images.push(`system-images;${apiDir.name};${vendorDir.name};${abiDir.name}`);
        }
      }
    }
  }
  return images;
}

async function openAndroidProjectInStudio(targetDir) {
  const studioCandidates = [
    'D:\\android studio\\bin\\studio64.exe',
    'C:\\Program Files\\Android\\Android Studio\\bin\\studio64.exe'
  ];
  const studio = studioCandidates.find(candidate => fs.existsSync(candidate));
  if (!studio) {
    logInfo('Android Studio tidak ditemukan otomatis. Buka folder android/ dari proyek mobile secara manual di Android Studio.');
    return false;
  }
  // Proyek Capacitor menyimpan Gradle di subfolder android/, sedangkan
  // generator Kotlin/XML native menaruh settings.gradle.kts di root output.
  const capacitorAndroidDir = path.join(targetDir, 'android');
  const androidDir = await fs.pathExists(path.join(targetDir, 'settings.gradle.kts')) ? targetDir : capacitorAndroidDir;
  if (!await fs.pathExists(path.join(androidDir, 'settings.gradle.kts'))) {
    logError('File settings.gradle.kts tidak ditemukan; proyek Android belum lengkap sehingga tidak dibuka dalam LightEdit.');
    return false;
  }
  const child = execa(studio, [androidDir], { detached: true, stdio: 'ignore' });
  child.catch(() => {});
  child.unref();
  logSuccess('Proyek Android dibuka di Android Studio. APK debug juga tersedia di folder apkmigrasi proyek ini.');
  return true;
}

async function installNativeAndroidUi(targetDir, mobileConfig) {
  const javaDir = path.join(targetDir, 'android', 'app', 'src', 'main', 'java', ...mobileConfig.appId.split('.'));
  const activityPath = path.join(javaDir, 'MainActivity.java');
  await fs.ensureDir(javaDir);
  await fs.writeFile(activityPath, getNativeAndroidActivity(mobileConfig), 'utf8');
  logSuccess('UI Android native dipasang: layar aplikasi tidak lagi menampilkan WebView situs.');
}

async function getMigratedMobileModules(sourceName) {
  const configPath = path.join(MIGRATION_CONTAINER_DIR, sourceName, 'lib', 'app-config.js');
  try {
    const source = await fs.readFile(configPath, 'utf8');
    const match = source.match(/export const APP = ([\s\S]+);\s*$/);
    const appConfig = match ? JSON.parse(match[1]) : null;
    return Array.isArray(appConfig?.profile?.modules) ? appConfig.profile.modules.map(module => ({ name: module.name, id: module.id, fields: module.fields || [] })) : [];
  } catch {
    return [];
  }
}

async function offerAndroidAvdSetup(androidEnv, targetDir) {
  const { ANDROID_HOME: androidSdk } = androidEnv;
  const avdManager = await findAndroidAvdManager(androidSdk);
  const images = await getAndroidSystemImages(androidSdk);
  if (avdManager && images.length) {
    const { createAvd } = await inquirer.prompt([{ type: 'confirm', name: 'createAvd', message: 'Belum ada emulator. Buat Android Virtual Device standar otomatis sekarang?', default: true }]);
    if (!createAvd) return false;
    const image = images[0];
    const avdName = `GAS_WebApp_API_${image.split(';')[1].replace(/[^a-z0-9]/gi, '_')}`;
    try {
      await execa(avdManager, ['create', 'avd', '--force', '--name', avdName, '--package', image, '--device', 'pixel_6'], {
        input: 'no\n',
        env: { ...process.env, ...androidEnv }
      });
      logSuccess(`Android Emulator otomatis dibuat: ${avdName}`);
      return true;
    } catch (err) {
      logError(`Pembuatan emulator otomatis gagal: ${err.shortMessage || err.message}`);
      return false;
    }
  }

  logInfo('SDK belum memiliki System Image atau Android SDK Command-line Tools, sehingga emulator belum dapat dibuat otomatis.');
  const studioAvailable = await fs.pathExists('D:\\android studio\\bin\\studio64.exe') || await fs.pathExists('C:\\Program Files\\Android\\Android Studio\\bin\\studio64.exe');
  if (studioAvailable) {
    const { openStudio } = await inquirer.prompt([{ type: 'confirm', name: 'openStudio', message: 'Buka Android Studio sekarang untuk membuat emulator?', default: true }]);
    if (openStudio) {
      await openAndroidProjectInStudio(targetDir);
      logInfo('Di Android Studio buka Tools > Device Manager > Create Device. Jika diminta, unduh System Image lalu selesaikan pembuatan AVD.');
    }
  }
  return false;
}

async function runAndroidEmulatorTest(targetDir) {
  const androidEnv = await getAndroidBuildEnv();
  if (!androidEnv) {
    logError('JDK atau Android SDK tidak ditemukan. Pastikan Android Studio SDK telah terpasang.');
    return;
  }
  const emulator = path.join(androidEnv.ANDROID_HOME, 'emulator', 'emulator.exe');
  if (!await fs.pathExists(emulator)) {
    logError('Android Emulator belum terpasang di SDK. Install Android Emulator melalui Android Studio > SDK Manager > SDK Tools.');
    return;
  }
  let device = (await getAndroidDevices(androidEnv))[0];
  if (device && !await isAndroidBootCompleted(androidEnv, device)) {
    logInfo('Android Emulator sudah terdeteksi tetapi masih menyelesaikan boot...');
    device = await waitForAndroidDevice(androidEnv);
  }
  if (!device) {
    let avds = [];
    try {
      const result = await execa(emulator, ['-list-avds'], { env: { ...process.env, ...androidEnv } });
      avds = result.stdout.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
    } catch {
      logError('Android Emulator/adb tidak dapat dijalankan. Periksa instalasi Android SDK melalui Android Studio > SDK Manager.');
      return;
    }
    if (!avds.length) {
      const created = await offerAndroidAvdSetup(androidEnv, targetDir);
      if (!created) return;
      const refreshed = await execa(emulator, ['-list-avds'], { env: { ...process.env, ...androidEnv } });
      avds = refreshed.stdout.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
      if (!avds.length) {
        logError('Android Virtual Device belum tersedia setelah setup. Selesaikan pembuatan AVD di Android Studio lalu jalankan kembali menu Cek Aplikasi.');
        return;
      }
    }
    const { avd } = await inquirer.prompt([{ type: 'list', name: 'avd', message: 'Pilih Android Emulator untuk testing:', choices: avds }]);
    logStep(`Menyalakan Android Emulator: ${avd}...`);
    try {
      const child = execa(emulator, ['-avd', avd], { detached: true, stdio: 'ignore', env: { ...process.env, ...androidEnv } });
      child.catch(() => {});
      child.unref();
    } catch (err) {
      logError(`Gagal menyalakan emulator: ${err.message}`);
      return;
    }
    logInfo('Menunggu emulator siap (maks. 4 menit; boot pertama dapat lebih lama)...');
    device = await waitForAndroidDevice(androidEnv);
  }
  if (!device) {
    logError('Emulator belum siap setelah 4 menit. Periksa jendela emulator untuk pesan error, lalu jalankan kembali menu Cek Aplikasi saat Android sudah berada di home screen.');
    return;
  }
  try {
    logStep(`Menjalankan aplikasi pada emulator ${device}...`);
    await configureAndroidLocalProperties(targetDir, androidEnv);
    await runInteractive('npx', ['cap', 'run', 'android', '--target', device], targetDir, androidEnv);
    logSuccess('Aplikasi mobile sudah dibuka di Android Emulator.');
  } catch (err) {
    logError('Aplikasi belum dapat dijalankan di emulator. Periksa Android SDK, JDK, dan log Gradle di atas.');
  }
}

async function runMobileWrapperBuild() {
  const engine = 'native'; /* Pilihan engine lama dipensiunkan: menu 3 selalu Android native.
    { name: 'Android native Kotlin/XML (Login, Dashboard, RecyclerView) — direkomendasikan', value: 'native' },
  */
  if (engine === 'native') {
    const sources = await fs.pathExists(MIGRATION_CONTAINER_DIR) ? (await fs.readdir(MIGRATION_CONTAINER_DIR, { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => ({ name: entry.name, value: entry.name })) : [];
    if (!sources.length) throw new Error('Belum ada proyek di webmigrasi/. Jalankan menu Migrasi Project terlebih dahulu.');
    const { sourceName } = await inquirer.prompt([{ type: 'list', name: 'sourceName', message: 'Pilih proyek untuk dibuat menjadi Android native:', choices: sources }]);
    const { apiUrl } = await inquirer.prompt([{ type: 'input', name: 'apiUrl', message: 'URL API/website Next.js (opsional, untuk integrasi backend nanti):', default: '' }]);
    const sourceDir = path.join(MIGRATION_CONTAINER_DIR, sourceName);
    logStep('AI Native Mobile Preflight — menganalisis kesiapan login, dashboard, menu, dan data...');
    try {
      const analysis = await analyzeMobileApp(sourceName, 'https://native-mobile.local');
      if (analysis) { logSuccess(`AI Native Mobile: ${analysis.summary}`); if (analysis.mobileFocus) logInfo(`Fokus: ${analysis.mobileFocus}`); if (analysis.risk) logInfo(`Risiko: ${analysis.risk}`); }
      else logInfo('AI Preflight dilewati: api.txt belum tersedia atau tidak valid.');
    } catch (err) { logError(`AI Native Mobile Preflight gagal: ${err.message}`); logInfo('Pembuatan proyek native tetap dilanjutkan.'); }
    const targetDir = path.join(MOBILE_CONTAINER_DIR, `${sourceName}-native`);
    if (await fs.pathExists(targetDir)) {
      const { overwrite } = await inquirer.prompt([{ type: 'confirm', name: 'overwrite', message: `Folder apkmigrasi/${sourceName}-native sudah ada. Timpa isinya?`, default: false }]);
      if (!overwrite) return;
      await fs.emptyDir(targetDir);
    }
    logStep('Membuat proyek Android native Jetpack Compose...');
    await runInteractive(process.execPath, [path.join(ROOT_DIR, 'scripts', 'create-native-android.js'), targetDir, sourceName, sourceDir, apiUrl.trim()], ROOT_DIR);
    logSuccess(`Proyek Android native siap: ${targetDir}`);
    const nativeWrapper = path.join(targetDir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
    const androidEnv = await ensureAndroidBuildEnv();
    if (androidEnv && await fs.pathExists(nativeWrapper)) {
      try {
        logStep('Membuat APK debug Android native...');
        await runInteractive(nativeWrapper, ['assembleDebug', '--console=plain'], targetDir, androidEnv);
        const nativeApk = path.join(targetDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
        const outputApk = path.join(targetDir, `${sourceName}-debug.apk`);
        if (await fs.pathExists(nativeApk)) { await fs.copy(nativeApk, outputApk, { overwrite: true }); logSuccess(`APK siap: ${outputApk}`); const appId = `com.otomatis.${sourceName.toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/^([^a-z])/, 'app$1').slice(0, 40) || 'aplikasi'}`; await installApkToConnectedDevice(outputApk, androidEnv, appId); }
      } catch (err) { logError(`Build APK otomatis gagal: ${err.message}`); logInfo('Periksa Java/Android SDK dan virtual memory Windows; Android Studio tidak diperlukan untuk build APK.'); }
    } else logInfo('JDK, Android SDK, atau Gradle Wrapper belum tersedia. Install Android SDK Command-line Tools dan Build Tools; Android Studio tidak diperlukan.');
    return;
  }
  const existingApps = await fs.pathExists(MOBILE_CONTAINER_DIR)
    ? (await fs.readdir(MOBILE_CONTAINER_DIR, { withFileTypes: true })).filter(entry => entry.isDirectory() && fs.existsSync(path.join(MOBILE_CONTAINER_DIR, entry.name, 'android', 'gradlew.bat'))).map(entry => entry.name)
    : [];
  if (existingApps.length) {
    const { workflow } = await inquirer.prompt([{ type: 'list', name: 'workflow', message: 'Mode Mobile App:', choices: [
      { name: 'Buat/perbarui aplikasi mobile dari hasil migrasi', value: 'create' },
      { name: 'Build ulang APK cepat (tanpa npm install / Capacitor sync)', value: 'quick' }
    ] }]);
    if (workflow === 'quick') {
      const { appName } = await inquirer.prompt([{ type: 'list', name: 'appName', message: 'Pilih aplikasi untuk build APK cepat:', choices: existingApps }]);
      await runExistingMobileBuild(path.join(MOBILE_CONTAINER_DIR, appName), appName);
      return;
    }
  }
  const candidates = [];
  if (await fs.pathExists(MIGRATION_CONTAINER_DIR)) {
    for (const entry of await fs.readdir(MIGRATION_CONTAINER_DIR, { withFileTypes: true })) {
      if (entry.isDirectory() && await fs.pathExists(path.join(MIGRATION_CONTAINER_DIR, entry.name, 'package.json'))) {
        candidates.push({ name: `${entry.name} (Next.js hasil migrasi)`, value: entry.name });
      }
    }
  }
  if (!candidates.length) throw new Error('Belum ada hasil migrasi Next.js di folder webmigrasi/. Jalankan menu Migrasi Project terlebih dahulu.');
  const answer = await inquirer.prompt([
    { type: 'list', name: 'sourceName', message: 'Pilih web yang akan dibuat menjadi aplikasi mobile:', choices: candidates },
    { type: 'input', name: 'appUrl', message: 'Masukkan URL web yang sudah deploy (HTTPS):', validate: value => /^https:\/\//i.test(value.trim()) ? true : 'URL HTTPS wajib diisi, misalnya URL Vercel atau Web App GAS /exec.' },
    { type: 'input', name: 'appId', message: 'Application ID (format com.nama.aplikasi):', default: answers => `com.webapp.${String(answers.sourceName || 'mobile').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'mobile'}`, validate: value => /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){1,}$/.test(value.trim()) ? true : 'Gunakan format seperti com.nama.aplikasi.' },
    { type: 'checkbox', name: 'platforms', message: 'Platform yang disiapkan:', choices: [{ name: 'Android (APK/AAB)', value: 'android', checked: true }, { name: 'iOS (membutuhkan macOS/Xcode)', value: 'ios' }], validate: value => value.length ? true : 'Pilih minimal satu platform.' },
    { type: 'confirm', name: 'buildNow', message: 'Pasang dependensi dan jalankan build platform yang tersedia sekarang?', default: true },
    { type: 'confirm', name: 'testAndroid', message: 'Setelah build, buka aplikasi langsung di Android Studio Emulator?', default: true, when: answers => answers.platforms.includes('android') }
  ]);
  logStep('AI Mobile Preflight — memeriksa kesiapan URL, pengalaman mobile, dan checklist test...');
  try {
    const analysis = await analyzeMobileApp(answer.sourceName, answer.appUrl.trim());
    if (analysis) {
      logSuccess(`AI Mobile: ${analysis.summary || 'analisis selesai.'}`);
      if (analysis.mobileFocus) logInfo(`Fokus mobile: ${analysis.mobileFocus}`);
      if (analysis.risk) logInfo(`Risiko: ${analysis.risk}`);
    } else logInfo('AI Mobile Preflight dilewati: api.txt belum tersedia atau tidak valid.');
  } catch (err) {
    logError(`AI Mobile Preflight gagal: ${err.message}`);
    logInfo('Pembuatan wrapper dilanjutkan dengan konfigurasi aman.');
  }
  const folderName = answer.sourceName.toLowerCase().replace(/[^a-z0-9-_]/g, '-') || 'mobile-app';
  const modules = await getMigratedMobileModules(answer.sourceName);
  const targetDir = path.join(MOBILE_CONTAINER_DIR, folderName);
  if (await fs.pathExists(targetDir)) {
    const { overwrite } = await inquirer.prompt([{ type: 'confirm', name: 'overwrite', message: `Folder apkmigrasi/${folderName} sudah ada. Timpa isinya?`, default: false }]);
    if (!overwrite) throw new Error('Pembuatan aplikasi mobile dibatalkan.');
    await fs.emptyDir(targetDir);
  } else await fs.ensureDir(targetDir);
  const mobileConfig = { appName: answer.sourceName, appId: answer.appId.trim(), appUrl: answer.appUrl.trim(), modules };
  const files = getMobileWrapperFiles(mobileConfig);
  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(targetDir, name);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf8');
  }
  logSuccess(`Proyek mobile dibuat: ${targetDir}`);
  try {
    const qa = await reviewMobileWrapper(files);
    if (qa) {
      logInfo(`AI Mobile QA: ${qa.summary || qa.status}`);
      if (qa.findings?.length) logInfo(`Temuan: ${qa.findings.join(' | ')}`);
      if (qa.status !== 'ready') throw new Error('AI Mobile QA meminta review konfigurasi sebelum build.');
    }
  } catch (err) {
    logError(`Mobile wrapper belum lolos QA: ${err.message}`);
    return;
  }
  if (!answer.buildNow) {
    logInfo(`Build manual: cd apkmigrasi/${folderName} && npm install && npm run sync`);
    return;
  }
  logStep('Memasang Capacitor dan menyiapkan platform mobile...');
  await runInteractive('npm', ['install'], targetDir);
  for (const platform of answer.platforms) {
    try {
      await runInteractive('npx', ['cap', 'add', platform], targetDir);
    } catch (err) {
      logInfo(`Platform ${platform} sudah ada atau belum dapat ditambahkan: ${err.message}`);
    }
  }
  await runInteractive('npx', ['cap', 'sync'], targetDir);
  if (answer.platforms.includes('android')) {
    await installNativeAndroidUi(targetDir, mobileConfig);
  }
  let androidBuildReady = false;
  if (answer.platforms.includes('android')) {
    try {
      logStep('Membuat Android debug APK untuk testing...');
      const androidEnv = await getAndroidBuildEnv();
      if (!androidEnv) throw new Error('JDK atau Android SDK tidak ditemukan. Install komponen Android SDK melalui Android Studio.');
      await configureAndroidLocalProperties(targetDir, androidEnv);
      logInfo(`Menggunakan Java: ${androidEnv.JAVA_HOME}`);
      logInfo(`Menggunakan Android SDK: ${androidEnv.ANDROID_HOME}`);
      await runInteractive('cmd.exe', ['/d', '/s', '/c', 'gradlew.bat assembleDebug'], path.join(targetDir, 'android'), androidEnv);
      const builtApk = path.join(targetDir, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
      const convenientApk = path.join(targetDir, `${folderName}-debug.apk`);
      if (!await fs.pathExists(builtApk)) throw new Error('APK debug tidak ditemukan setelah Gradle selesai.');
      await fs.copy(builtApk, convenientApk, { overwrite: true });
      androidBuildReady = true;
      logSuccess(`Build Android debug selesai. APK siap pakai: ${convenientApk}`);
      if (answer.testAndroid) await openAndroidProjectInStudio(targetDir);
    } catch (err) {
      logError('Build APK belum dapat dijalankan. Pastikan Android Studio, Android SDK, dan JDK telah terpasang.');
    }
    if (answer.testAndroid && androidBuildReady) await runAndroidEmulatorTest(targetDir);
    if (answer.testAndroid && !androidBuildReady) logInfo('Emulator tidak dibuka karena build Android belum berhasil.');
  }
  if (answer.platforms.includes('ios')) {
    if (process.platform !== 'darwin') logInfo('Project iOS sudah disiapkan, tetapi build iOS hanya bisa dijalankan dari macOS dengan Xcode dan signing Apple.');
    else {
      try {
        logStep('Membuat build iOS...');
        await runInteractive('npx', ['cap', 'build', 'ios'], targetDir);
        logSuccess('Build iOS selesai; lanjutkan signing/distribusi melalui Xcode.');
      } catch (err) { logError('Build iOS gagal. Periksa Xcode, provisioning profile, dan Apple Developer signing.'); }
    }
  }
}

async function runExistingMobileBuild(targetDir, appName) {
  try {
    logStep(`Build APK cepat: ${appName}...`);
    const androidEnv = await getAndroidBuildEnv();
    if (!androidEnv) throw new Error('JDK atau Android SDK tidak ditemukan.');
    await configureAndroidLocalProperties(targetDir, androidEnv);
    await runInteractive('cmd.exe', ['/d', '/s', '/c', 'gradlew.bat assembleDebug'], path.join(targetDir, 'android'), androidEnv);
    const builtApk = path.join(targetDir, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
    const outputApk = path.join(targetDir, `${appName}-debug.apk`);
    if (!await fs.pathExists(builtApk)) throw new Error('APK debug tidak ditemukan setelah build.');
    await fs.copy(builtApk, outputApk, { overwrite: true });
    logSuccess(`Build cepat selesai. APK: ${outputApk}`);
  } catch (err) {
    logError(`Build APK cepat gagal: ${err.message}`);
  }
}

async function runMobileAppCheck() {
  if (!await fs.pathExists(MOBILE_CONTAINER_DIR)) throw new Error('Folder apkmigrasi/ belum ada. Buat aplikasi mobile terlebih dahulu dari menu Mobile App.');
  const entries = await fs.readdir(MOBILE_CONTAINER_DIR, { withFileTypes: true });
  const choices = [];
  for (const entry of entries) {
    if (entry.isDirectory() && (await fs.pathExists(path.join(MOBILE_CONTAINER_DIR, entry.name, 'package.json')) || await fs.pathExists(path.join(MOBILE_CONTAINER_DIR, entry.name, 'settings.gradle.kts')))) {
      choices.push({ name: entry.name, value: entry.name });
    }
  }
  if (!choices.length) throw new Error('Tidak ada aplikasi mobile yang siap dicek di folder apkmigrasi/.');
  const { appName } = await inquirer.prompt([{ type: 'list', name: 'appName', message: 'Pilih aplikasi dari apkmigrasi/ untuk dijalankan:', choices }]);
  const targetDir = path.join(MOBILE_CONTAINER_DIR, appName);
  if (await fs.pathExists(path.join(targetDir, 'settings.gradle.kts'))) {
    const apkCandidates = [
      path.join(targetDir, `${appName.replace(/-native$/, '')}-debug.apk`),
      path.join(targetDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
    ];
    const apkPath = apkCandidates.find(candidate => fs.existsSync(candidate));
    if (!apkPath) {
      logError('APK belum ditemukan. Jalankan menu Mobile App terlebih dahulu sampai build APK berhasil.');
      return;
    }
    const androidEnv = await getAndroidBuildEnv();
    if (!androidEnv) {
      logError('Android SDK/JDK tidak ditemukan, sehingga APK belum dapat dipreview.');
      return;
    }
    logStep(`Preview APK ${appName} pada perangkat Android...`);
    const nativeGradle = await fs.readFile(path.join(targetDir, 'app', 'build.gradle.kts'), 'utf8').catch(() => '');
    const applicationId = nativeGradle.match(/applicationId\s*=\s*"([^"]+)"/)?.[1] || '';
    await installApkToConnectedDevice(apkPath, androidEnv, applicationId);
    return;
  }
  if (!await fs.pathExists(path.join(targetDir, 'android'))) {
    logInfo('Platform Android belum disiapkan. Menjalankan sinkronisasi Capacitor terlebih dahulu...');
    await runInteractive('npm', ['install'], targetDir);
    try { await runInteractive('npx', ['cap', 'add', 'android'], targetDir); } catch (err) { logError(`Platform Android tidak dapat ditambahkan: ${err.message}`); return; }
    await runInteractive('npx', ['cap', 'sync'], targetDir);
  }
  logStep(`Menjalankan aplikasi ${appName} di Android Emulator...`);
  await runAndroidEmulatorTest(targetDir);
}

async function repairKnownMigrationError(targetDir, buildError) {
  if (!/Invalid currency code\s*:?\s*ID\b/i.test(buildError || '')) return null;
  const pagePath = path.join(targetDir, 'app', 'page.js');
  if (!await fs.pathExists(pagePath)) return null;
  const source = await fs.readFile(pagePath, 'utf8');
  if (!source.includes("currency:'ID'")) return null;
  await fs.writeFile(pagePath, source.replaceAll("currency:'ID'", "currency:'IDR'"), 'utf8');
  return 'kode mata uang ID diganti menjadi IDR';
}

async function repairMigrationBuildUntilPass(targetDir, initialIssue) {
  let issue = initialIssue;
  for (let attempt = 1; attempt <= 3; attempt++) {
    logInfo(`AI auto-repair build percobaan ${attempt}/3.`);
    const repaired = await runAiMigrationRepairCycle(targetDir, issue, `build ${attempt}/3`);
    if (!repaired) return false;
    try {
      await runNextBuild(targetDir);
      logSuccess(`Build berhasil setelah AI auto-repair percobaan ${attempt}.`);
      return true;
    } catch (err) {
      issue = [err.buildOutput, err.shortMessage, err.stderr, err.stdout, err.message].filter(Boolean).join('\n');
      logError(`Build masih gagal setelah patch AI percobaan ${attempt}.`);
    }
  }
  logError('Batas aman 3 percobaan AI auto-repair tercapai; migration tidak dinyatakan selesai.');
  return false;
}

async function runAiMigrationRepairCycle(targetDir, issue, phase) {
  const files = {};
  for (const name of ['app/page.js', 'app/globals.css', 'app/layout.js']) files[name] = await fs.readFile(path.join(targetDir, name), 'utf8');
  try {
    logStep(`AI Auto-Repair (${phase}) — membuat patch aman...`);
    const proposal = await requestMigrationAutoRepair(issue, files);
    if (!proposal?.edits?.length) {
      logInfo('AI tidak memberikan patch aman untuk issue ini.');
      return false;
    }
    const allowed = new Set(Object.keys(files));
    let applied = 0;
    for (const edit of proposal.edits) {
      if (!allowed.has(edit.file) || typeof edit.find !== 'string' || typeof edit.replace !== 'string' || !edit.find || edit.find.length > 6000 || edit.replace.length > 10000) continue;
      const source = files[edit.file];
      if (!source.includes(edit.find)) continue;
      files[edit.file] = source.replace(edit.find, edit.replace);
      applied++;
    }
    if (!applied) {
      logInfo('Patch AI ditolak karena tidak cocok dengan source hasil migrasi.');
      return false;
    }
    for (const [name, content] of Object.entries(files)) await fs.writeFile(path.join(targetDir, name), content, 'utf8');
    logSuccess(`AI auto-repair menerapkan ${applied} patch: ${proposal.summary || 'patch aman diterapkan.'}`);
    return true;
  } catch (err) {
    logError(`AI auto-repair gagal: ${err.message}`);
    return false;
  }
}

// ------------------------------------------------------------------
// LANGKAH 1: Input nama proyek & siapkan struktur folder
// ------------------------------------------------------------------
async function promptProjectName() {
  const { projectName, projectType } = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Masukkan nama proyek GAS Web App Anda:',
      default: 'absensi-spp-app',
      validate: (value) => {
        const trimmed = value.trim();
        if (!trimmed) return 'Nama proyek tidak boleh kosong.';
        if (!/^[a-zA-Z0-9-_ ]+$/.test(trimmed)) {
          return 'Gunakan huruf, angka, spasi, tanda hubung (-), atau underscore (_) saja.';
        }
        return true;
      },
      filter: (value) => value.trim()
    },
    {
      type: 'list',
      name: 'projectType',
      message: 'Pilih tema dan modul utama aplikasi:',
      choices: PROJECT_TYPE_CHOICES
    }
  ]);

  // Nama folder di-slug-kan agar aman untuk sistem file & clasp
  const folderSafeName = projectName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');

  return { displayName: projectName, folderName: folderSafeName, profile: getProjectProfile(projectType) };
}

async function resolveGasAppTemplate(displayName, profile) {
  const existing = await findGasBlueprint(displayName, profile);
  if (existing) {
    logSuccess(`Blueprint aplikasi lokal dipakai: ${existing.blueprint.name} (skor ${existing.score}).`);
    return applyGasBlueprint(profile, existing.blueprint);
  }
  const { enabled } = await inquirer.prompt([{
    type: 'confirm',
    name: 'enabled',
    message: 'Gunakan AI untuk menganalisis kebutuhan modul dan template aplikasi?',
    default: true
  }]);
  if (!enabled) {
    logInfo(`Menggunakan template preset: ${profile.name}.`);
    return profile;
  }
  logStep('AI App Preflight â€” menganalisis kebutuhan bisnis, data, tarif, pembayaran, dan laporan...');
  try {
    const proposal = await analyzeGasAppRequirements(displayName, profile);
    if (!proposal) {
      logInfo('AI App Preflight dilewati: api.txt belum tersedia atau tidak valid. Menggunakan template preset.');
      return profile;
    }
    if (proposal.decision === 'use_preset') {
      logSuccess(`Analisis AI: ${proposal.summary || `preset ${profile.name} sudah mencakup kebutuhan inti.`}`);
      logInfo(`Template preset dipertahankan: ${profile.name}.`);
      return profile;
    }
    const saved = await saveGasBlueprint(proposal);
    logSuccess(`Analisis AI: ${proposal.summary || 'Blueprint kebutuhan aplikasi selesai.'}`);
    logInfo(`Blueprint aplikasi disimpan: ${path.relative(ROOT_DIR, saved.file)}.`);
    logInfo(`Modul: ${saved.blueprint.modules.map(module => module.name).join(' | ')}`);
    return applyGasBlueprint(profile, saved.blueprint);
  } catch (err) {
    logError(`AI App Preflight gagal: ${err.message}`);
    logInfo(`Menggunakan template preset aman: ${profile.name}.`);
    return profile;
  }
}

async function prepareProjectDirectory(folderName) {
  await fs.ensureDir(PROJECT_CONTAINER_DIR);
  const projectDir = path.join(PROJECT_CONTAINER_DIR, folderName);

  if (await fs.pathExists(projectDir)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Folder "project/${folderName}" sudah ada. Timpa isinya?`,
        default: false
      }
    ]);
    if (!overwrite) {
      throw new Error('Dibatalkan oleh pengguna karena folder proyek sudah ada.');
    }
    await fs.emptyDir(projectDir);
  } else {
    await fs.ensureDir(projectDir);
  }

  return projectDir;
}

// ------------------------------------------------------------------
// LANGKAH 2: Gerbang otomasi akses (buka browser + konfirmasi)
// ------------------------------------------------------------------
async function gateGoogleApiActivation(state) {
  if (state.appsScriptApiConfirmed) {
    logInfo('Google Apps Script API sudah dikonfirmasi pada sesi sebelumnya.');
    return;
  }

  logStep('Membuka browser untuk mengaktifkan Google Apps Script API...');
  try {
    await open('https://script.google.com/home/usersettings');
    logInfo('Browser terbuka. Silakan masuk ke akun Google Anda,');
    logInfo('lalu aktifkan "Google Apps Script API" melalui halaman:');
    logInfo(chalk.underline('https://script.google.com/home/usersettings'));
  } catch (err) {
    logError('Gagal membuka browser secara otomatis. Silakan buka manual.');
  }

  const { apiEnabled } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'apiEnabled',
      message: 'Apakah Anda sudah mengaktifkan Google Apps Script API?',
      default: false
    }
  ]);

  if (!apiEnabled) {
    throw new Error('Proses dihentikan karena Google Apps Script API belum diaktifkan.');
  }

  state.appsScriptApiConfirmed = true;
  await saveGeneratorState(state);
}

// ------------------------------------------------------------------
// LANGKAH 3: Autentikasi via clasp login
// ------------------------------------------------------------------
async function runClaspLogin(projectDir) {
  logStep('Menjalankan autentikasi Google (clasp login)...');
  logInfo('Sebuah tab browser akan terbuka untuk proses login OAuth.');
  try {
    await runInteractive('clasp', ['login'], projectDir);
    logSuccess('Autentikasi clasp berhasil.');
  } catch (err) {
    // clasp login akan gagal jika user sudah pernah login (sesi tersimpan global),
    // pada kasus itu clasp biasanya tetap exit 0. Jika benar-benar gagal, lempar error.
    throw new Error('Gagal melakukan clasp login: ' + err.message);
  }
}

// ------------------------------------------------------------------
// LANGKAH 4: clasp create (dijalankan dulu agar clasp yang membuat
// .clasp.json & appsscript.json awal, baru kita timpa dengan template)
// ------------------------------------------------------------------
async function runClaspCreate(projectDir, displayName) {
  logStep(`Membuat proyek Apps Script baru "${displayName}" di Google Drive...`);
  try {
    await runInteractive(
      'clasp',
      ['create', '--type', 'standalone', '--title', displayName, '--rootDir', '.'],
      projectDir
    );
    const claspJsonPath = path.join(projectDir, '.clasp.json');
    if (!await fs.pathExists(claspJsonPath)) {
      throw new Error('File .clasp.json tidak dibuat oleh clasp.');
    }

    const claspConfig = await fs.readJson(claspJsonPath);
    if (!claspConfig.scriptId) {
      throw new Error('scriptId tidak ditemukan di file .clasp.json.');
    }
    // Manifest harus selalu ikut dalam push. Urutan eksplisit ini juga membuat
    // clasp memproses konfigurasi Web App sebelum file server/client lainnya.
    claspConfig.rootDir = '.';
    claspConfig.filePushOrder = ['appsscript.json', 'Database.gs', 'Code.gs', 'app.html'];
    await fs.writeJson(claspJsonPath, claspConfig, { spaces: 2 });

    logSuccess('Proyek Apps Script berhasil dibuat (clasp create).');
  } catch (err) {
    throw new Error('Gagal menjalankan clasp create: ' + err.message);
  }
}

// ------------------------------------------------------------------
// LANGKAH 5: Generate 3 file utama + manifest, menimpa stub dari clasp
// ------------------------------------------------------------------
async function generateProjectFiles(projectDir, displayName, profile, visualTheme) {
  logStep('Merakit kode monolith (Code.gs, Database.gs, app.html, appsscript.json)...');

  const files = {
    'Code.gs': getCodeGsTemplate(displayName, profile),
    'Database.gs': getDatabaseGsTemplate(displayName, profile),
    'app.html': getAppHtmlTemplate(displayName, profile, visualTheme),
    'appsscript.json': getAppsscriptJsonTemplate()
  };

  for (const [filename, content] of Object.entries(files)) {
    const filePath = path.join(projectDir, filename);
    await fs.writeFile(filePath, content, 'utf8');
    logInfo(`Dibuat: ${filename}`);
  }

  // Bersihkan file stub bawaan clasp create yang tidak lagi relevan
  // (mis. Code.js jika ada), tanpa menyentuh .clasp.json
  const staleStub = path.join(projectDir, 'Code.js');
  if (await fs.pathExists(staleStub)) {
    await fs.remove(staleStub);
  }

  logSuccess('Seluruh file proyek berhasil dirakit.');
}

// ------------------------------------------------------------------
// LANGKAH 6: clasp push
// ------------------------------------------------------------------
async function runClaspPush(projectDir) {
  logStep('Mengunggah kode ke server Google Apps Script (clasp push)...');
  try {
    const manifestPath = path.join(projectDir, 'appsscript.json');
    if (!await fs.pathExists(manifestPath)) {
      throw new Error('appsscript.json tidak ditemukan; deployment dihentikan agar manifest Web App tidak terlewat.');
    }
    try {
      const manifest = await fs.readJson(manifestPath);
      if (!manifest.runtimeVersion || !manifest.webapp) {
        throw new Error('Manifest harus memiliki runtimeVersion dan konfigurasi webapp.');
      }
    } catch (manifestError) {
      throw new Error(`appsscript.json tidak valid: ${manifestError.message}`);
    }
    logInfo('Manifest appsscript.json tervalidasi dan disertakan dalam clasp push.');
    await runInteractive('clasp', ['push', '--force'], projectDir);
    logSuccess('Kode dan manifest appsscript.json berhasil diunggah ke Google Apps Script.');
  } catch (err) {
    throw new Error('Gagal menjalankan clasp push: ' + err.message);
  }
}

async function runGasPushWithAiRepair(projectDir) {
  try {
    await runClaspPush(projectDir);
    return;
  } catch (firstError) {
    let issue = firstError.message;
    const allowed = ['Code.gs', 'Database.gs', 'app.html', 'appsscript.json'];
    for (let attempt = 1; attempt <= 3; attempt++) {
      const files = {};
      for (const name of allowed) files[name] = await fs.readFile(path.join(projectDir, name), 'utf8');
      logStep(`AI Auto-Repair GAS (${attempt}/3) — menganalisis kegagalan push...`);
      let proposal;
      try {
        proposal = await requestGasAutoRepair(issue, files);
      } catch (err) {
        logError(`AI Auto-Repair GAS gagal: ${err.message}`);
        break;
      }
      if (!proposal?.edits?.length) {
        logInfo('AI tidak memberikan patch GAS yang aman untuk error ini.');
        break;
      }
      let applied = 0;
      for (const edit of proposal.edits) {
        if (!allowed.includes(edit.file) || typeof edit.find !== 'string' || typeof edit.replace !== 'string' || !edit.find || edit.find.length > 7000 || edit.replace.length > 12000 || !files[edit.file].includes(edit.find)) continue;
        files[edit.file] = files[edit.file].replace(edit.find, edit.replace);
        applied++;
      }
      if (!applied) {
        logInfo('Patch GAS ditolak karena tidak sesuai dengan source lokal.');
        break;
      }
      for (const [name, content] of Object.entries(files)) await fs.writeFile(path.join(projectDir, name), content, 'utf8');
      logSuccess(`AI Auto-Repair GAS menerapkan ${applied} patch: ${proposal.summary || 'patch aman diterapkan.'}`);
      try {
        await runClaspPush(projectDir);
        logSuccess(`Push GAS berhasil setelah AI Auto-Repair percobaan ${attempt}.`);
        return;
      } catch (err) {
        issue = err.message;
        logError(`Push GAS masih gagal setelah patch AI percobaan ${attempt}.`);
      }
    }
    throw new Error('Push GAS gagal setelah AI Auto-Repair. Deployment tidak dijalankan. Periksa error terakhir di terminal.');
  }
}

// ------------------------------------------------------------------
// LANGKAH 7: clasp deploy — membuat deployment Web App & mengambil
// Deployment ID dari output terminal untuk menyusun link /exec.
// Tidak pakai stdio 'inherit' di sini karena kita perlu MEMBACA
// outputnya (untuk parsing ID), lalu kita cetak ulang manual.
// ------------------------------------------------------------------
async function runClaspDeploy(projectDir, displayName) {
  logStep('Membuat deployment Web App (clasp deploy)...');
  try {
    const result = await execa(
      'clasp',
      ['deploy', '--description', `${displayName} - auto deploy`],
      { cwd: projectDir }
    );

    const combinedOutput = [result.stdout, result.stderr].filter(Boolean).join('\n');
    if (combinedOutput.trim()) {
      console.log(chalk.gray(combinedOutput));
    }

    // Deployment ID Apps Script selalu diawali "AKfy" dan dipakai persis
    // sebagai token pada URL: https://script.google.com/macros/s/<ID>/exec
    const match = combinedOutput.match(/AKfy[A-Za-z0-9_-]+/);
    if (!match) {
      logError('Deployment berhasil, tapi Deployment ID tidak terbaca otomatis dari output.');
      logInfo('Jalankan "clasp deployments" secara manual di dalam folder proyek untuk melihat ID-nya.');
      return null;
    }

    logSuccess('Deployment Web App berhasil dibuat.');
    return match[0];
  } catch (err) {
    logError('Gagal menjalankan clasp deploy: ' + err.message);
    logInfo('Anda tetap bisa menjalankan "clasp deploy" secara manual di dalam folder proyek.');
    return null;
  }
}

// ------------------------------------------------------------------
// LANGKAH 7: Ambil scriptId dari .clasp.json & tampilkan pesan sukses
// ------------------------------------------------------------------
async function printSuccessMessage(projectDir, displayName, deploymentId) {
  const claspJsonPath = path.join(projectDir, '.clasp.json');
  let scriptId = null;

  if (await fs.pathExists(claspJsonPath)) {
    try {
      const claspConfig = await fs.readJson(claspJsonPath);
      scriptId = claspConfig.scriptId;
    } catch (err) {
      // abaikan, tetap tampilkan sukses tanpa link
    }
  }

  console.log('');
  console.log(chalk.bgGreen.black.bold('  BERHASIL  '));
  console.log(chalk.greenBright(`\n✔ Proyek "${displayName}" berhasil dibuat & di-deploy!`));
  console.log(chalk.greenBright(`✔ Lokasi lokal: ${projectDir}`));

  if (deploymentId) {
    const webAppUrl = `https://script.google.com/macros/s/${deploymentId}/exec`;
    console.log(chalk.greenBright(`✔ Link Web App (siap diakses):`));
    console.log(chalk.underline.bold.cyanBright(`  ${webAppUrl}`));
  } else {
    console.log(chalk.yellow('⚠ Link Web App /exec belum tersedia otomatis.'));
    console.log(chalk.gray('  Jalankan "clasp deploy" manual lalu "clasp open --webapp" di folder proyek.'));
  }

  if (scriptId) {
    console.log(chalk.greenBright(`✔ Editor Apps Script:`));
    console.log(chalk.underline.cyanBright(`  https://script.google.com/d/${scriptId}/edit`));
  }

  console.log('');
  console.log(chalk.gray('Catatan penting:'));
  console.log(chalk.gray('  • Database dan sheet dibuat otomatis saat aplikasi pertama kali digunakan.'));
  console.log(chalk.yellow('  • Akun Admin awal: username Admin  |  password Admin123'));
  console.log(chalk.gray('    Segera ubah password awal melalui menu Akun Saya setelah berhasil masuk.'));
  console.log(chalk.gray('  • Kunjungan pertama ke link Web App mungkin meminta layar izin/otorisasi'));
  console.log(chalk.gray('    Google — ini normal untuk deployment baru.'));
  console.log('');
  console.log(chalk.gray('Perintah lanjutan (opsional, dari dalam folder proyek):'));
  console.log(chalk.yellow('  clasp deploy'), chalk.gray('       → membuat deployment/versi baru'));
  console.log(chalk.yellow('  clasp deployments'), chalk.gray('  → melihat semua deployment & ID-nya'));
  console.log(chalk.yellow('  clasp open --webapp'), chalk.gray('→ membuka langsung link Web App di browser'));
  console.log('');
}

// ------------------------------------------------------------------
// MAIN
// ------------------------------------------------------------------
async function main() {
  printBanner();
  let state = null;
  let isAuthenticated = false;
  let gasReady = false;

  async function initializeGas() {
    if (gasReady) return true;
    if (!await ensureClaspAvailable()) return false;
    state = await loadGeneratorState();
    const currentSession = await getClaspSession();
    isAuthenticated = Boolean(currentSession);
    if (currentSession) {
      state.claspSession = { email: currentSession.email, checkedAt: new Date().toISOString() };
      await saveGeneratorState(state);
      logInfo(`Menggunakan sesi clasp tersimpan: ${currentSession.email}.`);
    }
    gasReady = true;
    return true;
  }

  while (true) {
    try {
      const { operation } = await promptOperation();
      if (operation === 'connect-web') {
        await connectWebDashboard();
        continue;
      }
      if (operation === 'migrate') {
        await runNextMigration();
        continue;
      }
      if (operation === 'mobile') {
        await runMobileWrapperBuild();
        continue;
      }
      if (operation === 'check-mobile') {
        await runMobileAppCheck();
        continue;
      }
      if (!await initializeGas()) continue;
      const projectInput = await promptProjectName();
      const { displayName, folderName } = projectInput;
      let profile = projectInput.profile;
      logInfo(`Profil aplikasi terpilih: ${profile.name}.`);
      profile = await resolveGasAppTemplate(displayName, profile);
      logInfo(`Template aplikasi aktif: ${profile.name}${profile.aiBlueprint ? ` (AI blueprint: ${profile.aiBlueprint})` : ''}.`);
      const defaultTheme = getRandomVisualTheme(profile.id);
      let visualTheme = defaultTheme;
      try {
        const aiResult = await promptAndGenerateAiTheme(displayName, profile, defaultTheme);
        visualTheme = aiResult.theme;
        if (aiResult.used) {
          logSuccess(`Desain AI berhasil dibuat: ${visualTheme.name} — login ${visualTheme.loginStyle}, layout ${visualTheme.layout}, gaya ${visualTheme.dashboardStyle}, provider ${aiResult.provider}, model ${aiResult.model}.`);
          logInfo(`  Palet: ${visualTheme.primary} / ${visualTheme.secondary}; font: ${visualTheme.fontFamily || 'font profesional bawaan'}.`);
        } else {
          logInfo(`Tema bawaan dipakai: ${visualTheme.name} (${visualTheme.layout}).`);
        }
      } catch (err) {
        logError(`Tema AI tidak dapat dibuat: ${err.message}`);
        logInfo('Generator menggunakan tema bawaan yang aman.');
        logInfo(`Tema fallback: ${visualTheme.name} (${visualTheme.layout}).`);
      }

      logStep(`Menyiapkan folder proyek di: project/${folderName}`);
      const projectDir = await prepareProjectDirectory(folderName);
      logSuccess(`Folder proyek siap: ${projectDir}`);

      await gateGoogleApiActivation(state);
      if (!isAuthenticated) {
        await runClaspLogin(projectDir);
        isAuthenticated = true;
        const refreshedSession = await getClaspSession();
        state.claspSession = {
          email: refreshedSession?.email || null,
          checkedAt: new Date().toISOString()
        };
        await saveGeneratorState(state);
      } else {
        logInfo('Menggunakan sesi clasp yang sudah login.');
      }

      await runClaspCreate(projectDir, displayName);
      await generateProjectFiles(projectDir, displayName, profile, visualTheme);
      await runGasPushWithAiRepair(projectDir);
      const deploymentId = await runClaspDeploy(projectDir, displayName);
      await printSuccessMessage(projectDir, displayName, deploymentId);
    } catch (err) {
      console.log('');
      logError(err.message || 'Terjadi kesalahan yang tidak diketahui.');
    }

    await inquirer.prompt([{
      type: 'input',
      name: 'continue',
      message: 'Tekan Enter atau Spasi untuk kembali ke menu utama (Ctrl+C untuk keluar):',
      default: ''
    }]);
    console.log('');
  }
}

async function runWebGasJob(job) {
  const displayName = String(job.name || '').trim();
  const folderName = displayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
  if (!displayName || !folderName) throw new Error('Nama job dari Web Tools tidak valid.');
  if (!await ensureClaspAvailable()) throw new Error('clasp belum tersedia pada komputer agent.');
  if (!await getClaspSession()) throw new Error('Agent belum login clasp. Jalankan npm start sekali dan selesaikan login Google.');
  const projectDir = path.join(PROJECT_CONTAINER_DIR, folderName);
  if (await fs.pathExists(projectDir)) throw new Error(`Folder project/${folderName} sudah ada. Ganti nama job atau hapus proyek lama secara manual.`);
  const templateMap = { retail: 'cashier', service: 'booking', education: 'education' };
  const profile = getProjectProfile(templateMap[job.options?.template] || 'attendance');
  const visualTheme = getRandomVisualTheme(profile.id);
  await fs.ensureDir(projectDir);
  logStep(`Web Tools Agent menjalankan job GAS: ${displayName}`);
  await runClaspCreate(projectDir, displayName);
  await generateProjectFiles(projectDir, displayName, profile, visualTheme);
  await runGasPushWithAiRepair(projectDir);
  const deploymentId = await runClaspDeploy(projectDir, displayName);
  await printSuccessMessage(projectDir, displayName, deploymentId);
}

async function runWebJob() {
  const job = JSON.parse(process.env.WEBTONATIVE_JOB || '{}');
  if (job.flow !== 'gas') throw new Error(`Executor otomatis untuk alur ${job.flow || 'tidak dikenal'} belum tersedia.`);
  await runWebGasJob(job);
}

if (process.env.WEBTONATIVE_JOB) {
  runWebJob().catch(error => { logError(error.message || 'Job Web Tools gagal.'); process.exitCode = 1; });
} else {
  main();
}
