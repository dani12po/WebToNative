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
import { promptAndGenerateAiTheme } from './templates/aiTheme.js';

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
const GENERATOR_STATE_PATH = path.join(ROOT_DIR, 'authsesion.json');

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
async function runInteractive(command, args, cwd) {
  return execa(command, args, {
    cwd,
    stdio: 'inherit'
  });
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
    await runInteractive('clasp', ['push', '--force'], projectDir);
    logSuccess('Kode berhasil diunggah ke Google Apps Script.');
  } catch (err) {
    throw new Error('Gagal menjalankan clasp push: ' + err.message);
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

  const claspOk = await ensureClaspAvailable();
  if (!claspOk) {
    process.exitCode = 1;
    return;
  }

  const state = await loadGeneratorState();
  const currentSession = await getClaspSession();
  let isAuthenticated = Boolean(currentSession);
  if (currentSession) {
    state.claspSession = { email: currentSession.email, checkedAt: new Date().toISOString() };
    await saveGeneratorState(state);
    logInfo(`Menggunakan sesi clasp tersimpan: ${currentSession.email}.`);
  }

  while (true) {
    try {
      const { displayName, folderName, profile } = await promptProjectName();
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
      await runClaspPush(projectDir);
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

main();
