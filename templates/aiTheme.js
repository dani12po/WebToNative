import inquirer from 'inquirer';
import fs from 'node:fs/promises';

const PROVIDERS = {
  openai: { name: 'OpenAI', endpoint: 'https://api.openai.com/v1/chat/completions' },
  groq: { name: 'Groq', endpoint: 'https://api.groq.com/openai/v1/chat/completions' },
  nvidia: { name: 'NVIDIA NIM', endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions' },
  openrouter: { name: 'OpenRouter', endpoint: 'https://openrouter.ai/api/v1/chat/completions' }
};

function extractJson(text) {
  const source = String(text || '').replace(/```json|```/gi, '').trim();
  for (let start = source.indexOf('{'); start !== -1; start = source.indexOf('{', start + 1)) {
    let depth = 0;
    let quoted = false;
    let escaped = false;
    for (let index = start; index < source.length; index++) {
      const char = source[index];
      if (quoted) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') quoted = false;
        continue;
      }
      if (char === '"') quoted = true;
      else if (char === '{') depth++;
      else if (char === '}') {
        depth--;
        if (depth === 0) {
          try { return JSON.parse(source.slice(start, index + 1)); } catch { break; }
        }
      }
    }
  }
  throw new Error('AI tidak mengembalikan JSON desain yang valid.');
}

function validHex(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(value || '') ? value : fallback;
}

function validateTheme(raw, fallback) {
  const layouts = new Set(['split', 'centered', 'split-reverse', 'sidebar', 'glass']);
  const dashboardStyles = new Set(['commerce', 'operations', 'studio', 'executive', 'schedule']);
  const loginStyles = new Set(['split', 'spotlight', 'editorial', 'showcase', 'minimal']);
  return {
    id: 'ai-custom',
    name: String(raw.name || 'AI Custom Theme').slice(0, 40),
    primary: validHex(raw.primary, fallback.primary),
    secondary: validHex(raw.secondary, fallback.secondary),
    dark: validHex(raw.dark, fallback.dark),
    soft: validHex(raw.soft, fallback.soft),
    background: validHex(raw.background, fallback.background),
    layout: layouts.has(raw.layout) ? raw.layout : fallback.layout,
    fontFamily: ['Inter', 'Manrope', 'DM Sans', 'Nunito Sans', 'Plus Jakarta Sans'].includes(raw.fontFamily) ? raw.fontFamily : null,
    dashboardStyle: dashboardStyles.has(raw.dashboardStyle) ? raw.dashboardStyle : 'operations',
    loginStyle: loginStyles.has(raw.loginStyle) ? raw.loginStyle : 'split'
  };
}

export async function promptAndGenerateAiTheme(projectName, profile, fallbackTheme) {
  const { enabled } = await inquirer.prompt([{ type: 'confirm', name: 'enabled', message: 'Gunakan AI untuk membuat tema visual proyek ini?', default: false }]);
  if (!enabled) return { theme: fallbackTheme, used: false };
  const configPath = new URL('../api.txt', import.meta.url);
  let text;
  try { text = await fs.readFile(configPath, 'utf8'); } catch (err) { throw new Error('File api.txt tidak ditemukan. Salin api.txt.example lalu isi provider, api_key, dan model.'); }
  const config = Object.fromEntries(text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => { const index = line.indexOf('='); return index === -1 ? ['', ''] : [line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim()]; }).filter(([key]) => key));
  const provider = (config.provider || '').toLowerCase();
  if (!config.api_key || !config.model) throw new Error('api.txt wajib memuat api_key dan model.');
  const endpoint = provider === 'custom' ? config.endpoint : PROVIDERS[provider]?.endpoint;
  if (!endpoint || !/^https:\/\//.test(endpoint)) throw new Error('Provider atau endpoint di api.txt tidak valid.');
  console.log(`  Konfigurasi AI ditemukan: ${provider === 'custom' ? 'endpoint custom' : PROVIDERS[provider].name}, model ${config.model}.`);
  console.log('  Menghubungi AI untuk membuat palet, font, komposisi, dan layout dashboard...');
  const prompt = `Anda adalah art director SaaS Indonesia. Rancang sistem visual yang benar-benar sesuai dengan bisnis berikut, bukan tema generik.\nJudul proyek: ${projectName}\nJenis aplikasi: ${profile.name}\nKegunaan: ${profile.tagline}\n\nKembalikan JSON SAJA tanpa markdown dengan schema: {"name":"nama gaya singkat","primary":"#RRGGBB","secondary":"#RRGGBB","dark":"#RRGGBB","soft":"#RRGGBB","background":"#RRGGBB","layout":"split|centered|split-reverse|sidebar|glass","dashboardStyle":"commerce|operations|studio|executive|schedule","loginStyle":"split|spotlight|editorial|showcase|minimal","fontFamily":"Inter|Manrope|DM Sans|Nunito Sans|Plus Jakarta Sans"}.\n\nArti layout: centered = navigasi horizontal/topbar untuk booking, kalender, atau layanan; split = sidebar ringkas untuk operasi; split-reverse = panel navigasi kanan untuk pendidikan/kreatif; sidebar = kontrol cepat untuk kasir/retail; glass = workspace ringan untuk layanan modern.\nArti dashboardStyle: commerce = kartu kasir/retail; operations = tabel dan proses kerja padat; studio = bento kreatif dengan visual lembut; executive = ringkas, formal, banyak ruang kosong; schedule = agenda/booking terstruktur.\nArti loginStyle: split = halaman merek dua panel; spotlight = kartu masuk terpusat dengan latar elegan; editorial = panel merek sempit dan form lega; showcase = halaman merek yang kuat dengan kartu mengambang; minimal = masuk yang sangat ringkas dan formal. Pilih masing-masing satu yang paling relevan dengan bisnis. Jangan jadikan sidebar sebagai pilihan default: gunakan centered/topbar, split, split-reverse, atau glass bila sama-sama relevan agar karakter tiap aplikasi bervariasi. Gunakan warna yang memiliki karakter industri, kontras aksesibel, dan hindari hijau default kecuali memang cocok.`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.api_key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt }], temperature: 0.8 })
  });
  if (!response.ok) throw new Error(`Provider AI gagal merespons (HTTP ${response.status}). Periksa api_key, model, dan provider di api.txt.`);
  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  return { theme: validateTheme(extractJson(content || ''), fallbackTheme), used: true, provider, model: config.model };
}

export async function analyzeMigrationBuildError(errorText) {
  const configPath = new URL('../api.txt', import.meta.url);
  let text;
  try { text = await fs.readFile(configPath, 'utf8'); } catch { return null; }
  const config = Object.fromEntries(text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => { const index = line.indexOf('='); return index === -1 ? ['', ''] : [line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim()]; }).filter(([key]) => key));
  const provider = (config.provider || '').toLowerCase();
  const endpoint = provider === 'custom' ? config.endpoint : PROVIDERS[provider]?.endpoint;
  if (!config.api_key || !config.model || !endpoint || !/^https:\/\//.test(endpoint)) return null;
  const excerpt = String(errorText || '').slice(-12000);
  const prompt = `Analisis error build/runtime Next.js berikut. Jawab JSON saja: {"summary":"ringkas","cause":"penyebab","safeRepair":"currency-id-to-idr|none","nextStep":"langkah berikut"}. Jangan meminta atau mengungkap kredensial. SafeRepair hanya boleh currency-id-to-idr bila error menyebut invalid currency code ID.\n\nERROR:\n${excerpt}`;
  const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${config.api_key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt }], temperature: 0.1 }) });
  if (!response.ok) return { summary: `AI tidak dapat menganalisis error (HTTP ${response.status}).`, safeRepair: 'none' };
  try { return extractJson((await response.json()).choices?.[0]?.message?.content || ''); } catch { return { summary: 'Respons AI tidak dapat diparse.', safeRepair: 'none' }; }
}

export async function analyzeGasMigrationProject(projectName, profile) {
  const configPath = new URL('../api.txt', import.meta.url);
  let text;
  try { text = await fs.readFile(configPath, 'utf8'); } catch { return null; }
  const config = Object.fromEntries(text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => { const index = line.indexOf('='); return index === -1 ? ['', ''] : [line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim()]; }).filter(([key]) => key));
  const provider = (config.provider || '').toLowerCase();
  const endpoint = provider === 'custom' ? config.endpoint : PROVIDERS[provider]?.endpoint;
  if (!config.api_key || !config.model || !endpoint || !/^https:\/\//.test(endpoint)) return null;
  const modules = (profile.modules || []).map(module => ({ name: module.name, adminOnly: Boolean(module.adminOnly), fields: (module.fields || []).map(field => field.label) }));
  const prompt = `Anda adalah lead engineer Next.js dan product designer. Analisis migrasi GAS ke Next.js berikut. Jawab JSON saja: {"summary":"maksimal 180 karakter","uiDirection":"maksimal 120 karakter","seoTitle":"maksimal 60 karakter","seoDescription":"maksimal 155 karakter","landingStyle":"product|showcase|editorial|trust","landingHeadline":"maksimal 90 karakter, bernada manfaat bisnis","landingDescription":"maksimal 190 karakter","landingCta":"maksimal 36 karakter","backendPlan":"maksimal 180 karakter","risks":["maksimal 3 risiko"],"testChecklist":["maksimal 4 tes"]}. LandingStyle: product untuk kasir/retail, showcase untuk booking/layanan, editorial untuk kreatif/fashion, trust untuk keuangan/pendidikan/administrasi. Jangan mengirim kode, kredensial, atau klaim integrasi yang tidak ada.\nNama proyek: ${projectName}\nJenis: ${profile.name}\nDeskripsi: ${profile.tagline}\nModul: ${JSON.stringify(modules)}`;
  const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${config.api_key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt }], temperature: 0.25 }) });
  if (!response.ok) throw new Error(`AI preflight gagal (HTTP ${response.status}).`);
  const result = extractJson((await response.json()).choices?.[0]?.message?.content || '');
  const landingStyle = ['product', 'showcase', 'editorial', 'trust'].includes(result.landingStyle) ? result.landingStyle : 'product';
  return { summary: String(result.summary || '').slice(0, 180), uiDirection: String(result.uiDirection || '').slice(0, 120), seoTitle: String(result.seoTitle || '').slice(0, 60), seoDescription: String(result.seoDescription || '').slice(0, 155), landingStyle, landingHeadline: String(result.landingHeadline || '').slice(0, 90), landingDescription: String(result.landingDescription || '').slice(0, 190), landingCta: String(result.landingCta || '').slice(0, 36), backendPlan: String(result.backendPlan || '').slice(0, 180), risks: Array.isArray(result.risks) ? result.risks.slice(0, 3).map(String) : [], testChecklist: Array.isArray(result.testChecklist) ? result.testChecklist.slice(0, 4).map(String) : [], provider, model: config.model };
}

export async function createMigrationTemplateBlueprint(projectName, profile, analysis) {
  const configPath = new URL('../api.txt', import.meta.url);
  let text;
  try { text = await fs.readFile(configPath, 'utf8'); } catch { return null; }
  const config = Object.fromEntries(text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => { const index = line.indexOf('='); return index === -1 ? ['', ''] : [line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim()]; }).filter(([key]) => key));
  const provider = (config.provider || '').toLowerCase();
  const endpoint = provider === 'custom' ? config.endpoint : PROVIDERS[provider]?.endpoint;
  if (!config.api_key || !config.model || !endpoint || !/^https:\/\//.test(endpoint)) return null;
  const modules = (profile.modules || []).map(module => ({ name: module.name, fields: (module.fields || []).map(field => field.label) }));
  const prompt = `Anda membuat blueprint desain reusable untuk generator migrasi GAS ke Next.js. Tidak boleh memberi kode. Jawab JSON saja dengan bentuk: {"id":"slug-lowercase","name":"maksimal 72 karakter","match":["6-12 kata kunci Indonesia"],"layout":"sidebar|topbar|rail","landing":"split|centered|editorial","accent":"#RRGGBB","accent2":"#RRGGBB","description":"maksimal 180 karakter"}. Pilih desain SaaS profesional yang cocok khusus untuk aplikasi ini, bukan template bengkel/retail generik. Hindari warna putih polos dan ikon emoji. Semua warna harus hex valid.\nNama proyek: ${projectName}\nJenis: ${profile.name}\nDeskripsi: ${profile.tagline}\nModul: ${JSON.stringify(modules)}\nArah AI: ${analysis?.uiDirection || 'Belum tersedia'}`;
  const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${config.api_key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt }], temperature: 0.35 }) });
  if (!response.ok) throw new Error(`AI pembuat template gagal (HTTP ${response.status}).`);
  return extractJson((await response.json()).choices?.[0]?.message?.content || '');
}

export async function analyzeGasAppRequirements(projectName, profile) {
  const configPath = new URL('../api.txt', import.meta.url);
  let text;
  try { text = await fs.readFile(configPath, 'utf8'); } catch { return null; }
  const config = Object.fromEntries(text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => { const index = line.indexOf('='); return index === -1 ? ['', ''] : [line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim()]; }).filter(([key]) => key));
  const provider = (config.provider || '').toLowerCase();
  const endpoint = provider === 'custom' ? config.endpoint : PROVIDERS[provider]?.endpoint;
  if (!config.api_key || !config.model || !endpoint || !/^https:\/\//.test(endpoint)) return null;
  const baseModules = (profile.modules || []).map(module => ({ id: module.id, name: module.name, fields: (module.fields || []).map(field => field.label) }));
  const prompt = `Anda adalah product analyst aplikasi bisnis Indonesia. Periksa dahulu apakah template preset sudah cocok. Jawab JSON SAJA. Jika sudah cocok, gunakan {"decision":"use_preset","summary":"maksimal 180 karakter"}. Jika belum cocok, gunakan {"decision":"new_blueprint","id":"slug-lowercase","name":"nama aplikasi maksimal 72 karakter","tagline":"maksimal 180 karakter","match":["6-12 kata kunci"],"summary":"maksimal 180 karakter","modules":[{"id":"slug","name":"maksimal 56 karakter","icon":"1-3 karakter standar","adminOnly":true,"fields":[{"key":"snake_case","label":"maksimal 56 karakter","type":"text|number|date|datetime-local|month|select","options":["minimal 2 opsi, hanya select"]}]}]}. Blueprint baru wajib 3-8 modul dan 2-9 field per modul, konkret terhadap bisnis, mencakup data inti, pelanggan bila relevan, tarif/produk, pembayaran, dan laporan bila relevan. Untuk Laundry, misalnya order, layanan dan harga per kg, pelanggan, pembayaran, dan laporan; jika preset sudah memiliki itu, pilih use_preset. Jangan membuat fitur yang mengklaim integrasi payment gateway, QRIS dinamis, atau keamanan bank. Jangan memberi JavaScript, HTML, SQL, atau kredensial.\n\nNama proyek: ${projectName}\nTemplate preset awal: ${profile.name}\nTujuan: ${profile.tagline}\nModul preset: ${JSON.stringify(baseModules)}`;
  const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${config.api_key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt }], temperature: 0.25 }) });
  if (!response.ok) throw new Error(`AI analisis kebutuhan aplikasi gagal (HTTP ${response.status}).`);
  const result = extractJson((await response.json()).choices?.[0]?.message?.content || '');
  return { ...result, summary: String(result.summary || '').slice(0, 180), provider, model: config.model };
}

export async function reviewMigratedNextApp(files) {
  const configPath = new URL('../api.txt', import.meta.url);
  let text;
  try { text = await fs.readFile(configPath, 'utf8'); } catch { return null; }
  const config = Object.fromEntries(text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => { const index = line.indexOf('='); return index === -1 ? ['', ''] : [line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim()]; }).filter(([key]) => key));
  const provider = (config.provider || '').toLowerCase();
  const endpoint = provider === 'custom' ? config.endpoint : PROVIDERS[provider]?.endpoint;
  if (!config.api_key || !config.model || !endpoint || !/^https:\/\//.test(endpoint)) return null;
  const source = Object.entries(files).map(([name, value]) => `FILE: ${name}\n${String(value).slice(0, 7000)}`).join('\n\n').slice(0, 18000);
  const prompt = `Anda adalah QA lead untuk aplikasi Next.js SaaS. Tinjau source hasil migrasi ini tanpa memberi kode. Jawab JSON saja: {"status":"ready|needs_review","summary":"maksimal 160 karakter","layout":"ok|needs_review","dataEntry":"ok|needs_review","navigation":"ok|needs_review","seo":"ok|needs_review","findings":["maksimal 4 temuan konkret"],"nextStep":"maksimal 140 karakter"}. Status needs_review HANYA untuk kerusakan fungsional yang dapat dibuktikan dari source (syntax JSX, handler rusak, referensi variabel/file tidak ada, layout pasti pecah). Periksa khusus CSS navigasi: menu tidak boleh disembunyikan melalui font-size:0, color:transparent, opacity:0, display:none, atau lebar rail yang membuat label tidak terbaca. Scaffold ini sengaja memakai localStorage sebagai fallback demo satu pengguna; jangan jadikan itu temuan pemblokir bila API database sudah tersedia. Metadata statis di layout.js cukup untuk scaffold satu halaman; jangan menuntut dynamic SEO. Saran database, auth server-side, audit keamanan, atau SEO lanjutan adalah peningkatan produksi dan tidak boleh membuat status needs_review. Nilai hanya dari source yang tersedia dan jangan mengarang error.\n\n${source}`;
  const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${config.api_key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt }], temperature: 0.1 }) });
  if (!response.ok) throw new Error(`AI Post-Build QA gagal (HTTP ${response.status}).`);
  const result = extractJson((await response.json()).choices?.[0]?.message?.content || '');
  return { status: result.status === 'ready' ? 'ready' : 'needs_review', summary: String(result.summary || '').slice(0, 160), layout: result.layout, dataEntry: result.dataEntry, navigation: result.navigation, seo: result.seo, findings: Array.isArray(result.findings) ? result.findings.slice(0, 4).map(String) : [], nextStep: String(result.nextStep || '').slice(0, 140), provider, model: config.model };
}

export async function requestMigrationAutoRepair(issue, files) {
  const configPath = new URL('../api.txt', import.meta.url);
  let text;
  try { text = await fs.readFile(configPath, 'utf8'); } catch { return null; }
  const config = Object.fromEntries(text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => { const index = line.indexOf('='); return index === -1 ? ['', ''] : [line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim()]; }).filter(([key]) => key));
  const provider = (config.provider || '').toLowerCase();
  const endpoint = provider === 'custom' ? config.endpoint : PROVIDERS[provider]?.endpoint;
  if (!config.api_key || !config.model || !endpoint || !/^https:\/\//.test(endpoint)) return null;
  const source = Object.entries(files).map(([name, value]) => `FILE: ${name}\n${String(value).slice(0, 8000)}`).join('\n\n').slice(0, 22000);
  const prompt = `Anda memperbaiki scaffold Next.js hasil migrasi. Berdasarkan issue dan source berikut, jawab JSON saja: {"summary":"ringkas","edits":[{"file":"app/page.js|app/globals.css|app/layout.js","find":"teks persis dari source","replace":"pengganti"}]}. Maksimal 3 edit. Hanya beri edit jika pasti memperbaiki issue dan nilai find harus ada persis pada source. Jangan ubah package.json, jangan tambah dependensi, jangan akses jaringan, env, kredensial, atau file di luar daftar. Jika tidak yakin, edits harus array kosong.\n\nISSUE:\n${String(issue).slice(0, 8000)}\n\nSOURCE:\n${source}`;
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const retryNote = attempt === 1 ? '' : '\n\nRespons sebelumnya bukan JSON valid. Ulangi dengan JSON valid saja, tanpa markdown, tanpa komentar, dan tanpa koma tambahan.';
    const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${config.api_key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt + retryNote }], temperature: 0.05 }) });
    if (!response.ok) throw new Error(`AI auto-repair gagal (HTTP ${response.status}).`);
    try {
      const result = extractJson((await response.json()).choices?.[0]?.message?.content || '');
      return { summary: String(result.summary || '').slice(0, 180), edits: Array.isArray(result.edits) ? result.edits.slice(0, 3) : [] };
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`AI auto-repair mengirim JSON tidak valid setelah percobaan ulang: ${lastError?.message || 'unknown error'}`);
}

export async function requestGasAutoRepair(issue, files) {
  const configPath = new URL('../api.txt', import.meta.url);
  let text;
  try { text = await fs.readFile(configPath, 'utf8'); } catch { return null; }
  const config = Object.fromEntries(text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => { const index = line.indexOf('='); return index === -1 ? ['', ''] : [line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim()]; }).filter(([key]) => key));
  const provider = (config.provider || '').toLowerCase();
  const endpoint = provider === 'custom' ? config.endpoint : PROVIDERS[provider]?.endpoint;
  if (!config.api_key || !config.model || !endpoint || !/^https:\/\//.test(endpoint)) return null;
  const source = Object.entries(files).map(([name, value]) => `FILE: ${name}\n${String(value).slice(0, 9000)}`).join('\n\n').slice(0, 24000);
  const prompt = `Anda memperbaiki error generator Google Apps Script. Jawab JSON saja: {"summary":"ringkas","edits":[{"file":"Code.gs|Database.gs|app.html|appsscript.json","find":"teks persis dari source","replace":"pengganti"}]}. Maksimal 3 edit. Hanya berikan patch bila find benar-benar ada dan pasti memperbaiki error. Jangan menambah library eksternal, URL eksternal, kredensial, OAuth scope, atau menghapus validasi keamanan. Jangan mengubah konsep aplikasi. Jika tidak yakin, edits harus array kosong.\n\nERROR:\n${String(issue).slice(0, 9000)}\n\nSOURCE:\n${source}`;
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const note = attempt === 1 ? '' : '\n\nKembalikan JSON yang valid saja, tanpa markdown dan tanpa koma tambahan.';
    const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${config.api_key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt + note }], temperature: 0.05 }) });
    if (!response.ok) throw new Error(`AI perbaikan GAS gagal (HTTP ${response.status}).`);
    try {
      const result = extractJson((await response.json()).choices?.[0]?.message?.content || '');
      return { summary: String(result.summary || '').slice(0, 180), edits: Array.isArray(result.edits) ? result.edits.slice(0, 3) : [] };
    } catch (err) { lastError = err; }
  }
  throw new Error(`AI perbaikan GAS mengirim JSON tidak valid: ${lastError?.message || 'unknown error'}`);
}

export async function analyzeMobileApp(projectName, appUrl) {
  const configPath = new URL('../api.txt', import.meta.url);
  let text;
  try { text = await fs.readFile(configPath, 'utf8'); } catch { return null; }
  const config = Object.fromEntries(text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => { const index = line.indexOf('='); return index === -1 ? ['', ''] : [line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim()]; }).filter(([key]) => key));
  const provider = (config.provider || '').toLowerCase();
  const endpoint = provider === 'custom' ? config.endpoint : PROVIDERS[provider]?.endpoint;
  if (!config.api_key || !config.model || !endpoint || !/^https:\/\//.test(endpoint)) return null;
  const prompt = `Anda adalah mobile product QA untuk aplikasi Capacitor. Analisis rencana wrapper aplikasi mobile ini. Jawab JSON saja: {"summary":"maksimal 160 karakter","mobileFocus":"maksimal 120 karakter","testChecklist":["maksimal 4 tes"],"risk":"maksimal 140 karakter"}. Jangan memberi kode, jangan mengarang integrasi native, dan jangan meminta kredensial.\nNama aplikasi: ${projectName}\nURL aplikasi web: ${appUrl}`;
  const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${config.api_key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt }], temperature: 0.15 }) });
  if (!response.ok) throw new Error(`AI Mobile Preflight gagal (HTTP ${response.status}).`);
  const result = extractJson((await response.json()).choices?.[0]?.message?.content || '');
  return { summary: String(result.summary || '').slice(0, 160), mobileFocus: String(result.mobileFocus || '').slice(0, 120), testChecklist: Array.isArray(result.testChecklist) ? result.testChecklist.slice(0, 4).map(String) : [], risk: String(result.risk || '').slice(0, 140), provider, model: config.model };
}

export async function reviewMobileWrapper(files) {
  const configPath = new URL('../api.txt', import.meta.url);
  let text;
  try { text = await fs.readFile(configPath, 'utf8'); } catch { return null; }
  const config = Object.fromEntries(text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => { const index = line.indexOf('='); return index === -1 ? ['', ''] : [line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim()]; }).filter(([key]) => key));
  const provider = (config.provider || '').toLowerCase();
  const endpoint = provider === 'custom' ? config.endpoint : PROVIDERS[provider]?.endpoint;
  if (!config.api_key || !config.model || !endpoint || !/^https:\/\//.test(endpoint)) return null;
  const source = ['package.json', 'capacitor.config.json'].filter(name => files[name]).map(name => `FILE: ${name}\n${String(files[name]).slice(0, 6000)}`).join('\n\n');
  const prompt = `Anda adalah QA konfigurasi proyek Android native. Tinjau hanya package.json dan capacitor.config.json berikut. Jawab tepat satu objek JSON tanpa teks lain: {"status":"ready|needs_review","summary":"maksimal 160 karakter","findings":["maksimal 3 temuan konkret"],"nextStep":"maksimal 120 karakter"}. Status needs_review hanya bila URL bukan HTTPS, appId invalid, atau konfigurasi Capacitor tidak dapat dipakai. Jangan menuntut build iOS pada Windows.\n\n${source}`;
  const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${config.api_key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt }], temperature: 0.1 }) });
  if (!response.ok) throw new Error(`AI Mobile QA gagal (HTTP ${response.status}).`);
  const result = extractJson((await response.json()).choices?.[0]?.message?.content || '');
  return { status: result.status === 'ready' ? 'ready' : 'needs_review', summary: String(result.summary || '').slice(0, 160), findings: Array.isArray(result.findings) ? result.findings.slice(0, 3).map(String) : [], nextStep: String(result.nextStep || '').slice(0, 120), provider, model: config.model };
}
