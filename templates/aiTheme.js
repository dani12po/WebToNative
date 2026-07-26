import inquirer from 'inquirer';
import fs from 'node:fs/promises';

const PROVIDERS = {
  openai: { name: 'OpenAI', endpoint: 'https://api.openai.com/v1/chat/completions' },
  groq: { name: 'Groq', endpoint: 'https://api.groq.com/openai/v1/chat/completions' },
  nvidia: { name: 'NVIDIA NIM', endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions' },
  openrouter: { name: 'OpenRouter', endpoint: 'https://openrouter.ai/api/v1/chat/completions' }
};

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI tidak mengembalikan JSON desain.');
  return JSON.parse(match[0]);
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
  const prompt = `Anda adalah art director SaaS Indonesia. Rancang sistem visual yang benar-benar sesuai dengan bisnis berikut, bukan tema generik.\nJudul proyek: ${projectName}\nJenis aplikasi: ${profile.name}\nKegunaan: ${profile.tagline}\n\nKembalikan JSON SAJA tanpa markdown dengan schema: {"name":"nama gaya singkat","primary":"#RRGGBB","secondary":"#RRGGBB","dark":"#RRGGBB","soft":"#RRGGBB","background":"#RRGGBB","layout":"split|centered|split-reverse|sidebar|glass","dashboardStyle":"commerce|operations|studio|executive|schedule","loginStyle":"split|spotlight|editorial|showcase|minimal","fontFamily":"Inter|Manrope|DM Sans|Nunito Sans|Plus Jakarta Sans"}.\n\nArti layout: centered = navigasi horizontal/topbar untuk booking, kalender, atau layanan; split = sidebar ringkas untuk operasi; split-reverse = panel navigasi kanan untuk pendidikan/kreatif; sidebar = kontrol cepat untuk kasir/retail; glass = workspace ringan untuk layanan modern.\nArti dashboardStyle: commerce = kartu kasir/retail; operations = tabel dan proses kerja padat; studio = bento kreatif dengan visual lembut; executive = ringkas, formal, banyak ruang kosong; schedule = agenda/booking terstruktur.\nArti loginStyle: split = halaman merek dua panel; spotlight = kartu masuk terpusat dengan latar elegan; editorial = panel merek sempit dan form lega; showcase = halaman merek yang kuat dengan kartu mengambang; minimal = masuk yang sangat ringkas dan formal. Pilih masing-masing satu yang paling relevan dengan bisnis. Gunakan warna yang memiliki karakter industri, kontras aksesibel, dan hindari hijau default kecuali memang cocok.`;
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
