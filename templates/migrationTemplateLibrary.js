import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

const DESIGN_DIRECTORY = new URL('./migration-designs/', import.meta.url);
const REQUIRED_FIELDS = ['id', 'name', 'match', 'layout', 'landing', 'accent', 'accent2'];
const LAYOUTS = new Set(['sidebar', 'topbar', 'rail']);
const LANDINGS = new Set(['split', 'centered', 'editorial', 'marketplace', 'service', 'industrial', 'culinary']);
const HEX = /^#[0-9a-f]{6}$/i;

const fallbackDesign = {
  id: 'business-core',
  name: 'Business Core',
  match: ['operasional', 'dashboard', 'bisnis'],
  layout: 'sidebar',
  landing: 'split',
  accent: '#60a5fa',
  accent2: '#a78bfa',
  description: 'Dashboard SaaS serbaguna untuk operasi bisnis.'
};

function normalize(value) {
  return String(value || '').toLocaleLowerCase('id-ID').replace(/[^a-z0-9]+/g, ' ').trim();
}

export function normalizeMigrationDesign(value) {
  if (!value || typeof value !== 'object') return null;
  if (!REQUIRED_FIELDS.every(field => value[field] !== undefined)) return null;
  const design = {
    id: String(value.id).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 48),
    name: String(value.name).slice(0, 72),
    match: Array.isArray(value.match) ? value.match.map(normalize).filter(Boolean).slice(0, 16) : [],
    layout: String(value.layout),
    landing: String(value.landing),
    accent: String(value.accent),
    accent2: String(value.accent2),
    description: String(value.description || '').slice(0, 180),
    source: value.source === 'ai' ? 'ai' : 'library'
  };
  if (!design.id || !design.name || !design.match.length || !LAYOUTS.has(design.layout) || !LANDINGS.has(design.landing) || !HEX.test(design.accent) || !HEX.test(design.accent2)) return null;
  return design;
}

async function readDesigns() {
  const directory = fileURLToPath(DESIGN_DIRECTORY);
  await fs.ensureDir(directory);
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const designs = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    try {
      const design = normalizeMigrationDesign(JSON.parse(await fs.readFile(path.join(directory, entry.name), 'utf8')));
      if (design) designs.push(design);
    } catch {
      // Template invalid dilewati agar migrasi tetap dapat berjalan.
    }
  }
  return designs;
}

export async function findBestMigrationTemplate(profile, analysis) {
  const corpus = normalize([
    profile?.name,
    profile?.tagline,
    analysis?.uiDirection,
    ...(profile?.modules || []).flatMap(module => [module.name, ...(module.fields || []).map(field => field.label)])
  ].join(' '));
  const designs = await readDesigns();
  const ranked = designs.map(design => ({
    design,
    score: design.match.reduce((total, keyword) => total + (corpus.includes(keyword) ? Math.max(2, keyword.split(' ').length * 2) : 0), 0)
  })).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  // Template lokal hanya cukup spesifik bila minimal 8 poin kecocokan.
  // Skor di bawah batas ini memakai blueprint AI agar domain seperti
  // pendidikan tidak mewarisi layout/SEO aplikasi retail secara keliru.
  return best && best.score >= 8 ? { ...best, matched: true } : { design: fallbackDesign, score: best?.score || 0, matched: false };
}

export async function saveMigrationTemplate(design) {
  const normalized = normalizeMigrationDesign({ ...design, source: 'ai' });
  if (!normalized) throw new Error('Blueprint template AI tidak valid.');
  const directory = fileURLToPath(DESIGN_DIRECTORY);
  await fs.ensureDir(directory);
  const filename = `${normalized.id}.json`;
  const target = path.join(directory, filename);
  await fs.writeFile(target, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  return { design: normalized, file: target };
}
