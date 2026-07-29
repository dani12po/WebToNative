import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

function getDirectory() {
  if (import.meta.url) return fileURLToPath(new URL('./gas-app-blueprints/', import.meta.url));
  return path.join(process.env.WEBTONATIVE_TEMPLATE_ROOT || process.cwd(), 'gas-app-blueprints');
}
const TYPES = new Set(['text', 'number', 'date', 'datetime-local', 'month', 'select']);

const normalize = value => String(value || '').toLocaleLowerCase('id-ID').replace(/[^a-z0-9]+/g, ' ').trim();
const slug = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 48);

function cleanField(field, index) {
  if (!field || typeof field !== 'object') return null;
  const type = TYPES.has(field.type) ? field.type : 'text';
  const label = String(field.label || '').trim().slice(0, 56);
  const key = slug(field.key || label || `field-${index + 1}`).replace(/-/g, '_');
  const options = type === 'select' && Array.isArray(field.options)
    ? field.options.map(value => String(value).trim().slice(0, 40)).filter(Boolean).slice(0, 8)
    : undefined;
  if (!key || !label || (type === 'select' && (!options || options.length < 2))) return null;
  return { key, label, type, ...(options ? { options } : {}) };
}

export function normalizeGasBlueprint(value) {
  if (!value || typeof value !== 'object') return null;
  const id = slug(value.id);
  const name = String(value.name || '').trim().slice(0, 72);
  const tagline = String(value.tagline || '').trim().slice(0, 180);
  const match = Array.isArray(value.match) ? value.match.map(normalize).filter(Boolean).slice(0, 12) : [];
  const modules = Array.isArray(value.modules) ? value.modules.slice(0, 8).map((module, moduleIndex) => {
    const fields = Array.isArray(module?.fields) ? module.fields.slice(0, 9).map(cleanField).filter(Boolean) : [];
    const moduleId = slug(module?.id || module?.name || `modul-${moduleIndex + 1}`);
    const moduleName = String(module?.name || '').trim().slice(0, 56);
    return moduleId && moduleName && fields.length >= 2 ? { id: moduleId, name: moduleName, icon: String(module?.icon || moduleName[0]).slice(0, 3), adminOnly: Boolean(module?.adminOnly), fields } : null;
  }).filter(Boolean) : [];
  if (!id || !name || !tagline || !match.length || modules.length < 2) return null;
  return { id, name, tagline, match, modules, source: 'ai' };
}

async function loadBlueprints() {
  const directory = getDirectory();
  await fs.ensureDir(directory);
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const items = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    try {
      const blueprint = normalizeGasBlueprint(JSON.parse(await fs.readFile(path.join(directory, entry.name), 'utf8')));
      if (blueprint) items.push(blueprint);
    } catch {
      // Satu blueprint rusak tidak boleh menghentikan generator.
    }
  }
  return items;
}

export async function findGasBlueprint(projectName, profile) {
  const corpus = normalize(`${projectName} ${profile?.id} ${profile?.name} ${profile?.tagline}`);
  const ranked = (await loadBlueprints()).map(blueprint => ({
    blueprint,
    score: blueprint.match.reduce((score, keyword) => score + (corpus.includes(keyword) ? 2 : 0), 0)
  })).sort((a, b) => b.score - a.score);
  return ranked[0]?.score >= 4 ? ranked[0] : null;
}

export async function saveGasBlueprint(blueprint) {
  const normalized = normalizeGasBlueprint(blueprint);
  if (!normalized) throw new Error('Blueprint kebutuhan aplikasi dari AI tidak valid.');
  const directory = getDirectory();
  await fs.ensureDir(directory);
  const file = path.join(directory, `${normalized.id}.json`);
  await fs.writeFile(file, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  return { blueprint: normalized, file };
}

export function applyGasBlueprint(baseProfile, blueprint) {
  if (!blueprint) return baseProfile;
  const custom = blueprint.modules.map(module => ({ ...module, fields: module.fields.map(field => ({ ...field })) }));
  const required = (baseProfile.modules || []).filter(module => ['pembayaran', 'pengaturan', 'metodePembayaran'].includes(module.id));
  for (const module of required) if (!custom.some(item => item.id === module.id)) custom.push(module);
  return { ...baseProfile, name: blueprint.name, tagline: blueprint.tagline, modules: custom, aiBlueprint: blueprint.id };
}
