import { randomInt } from 'node:crypto';

const VISUAL_THEMES = [
  { id: 'aurora', name: 'Aurora Indigo', primary: '#635bff', secondary: '#a855f7', dark: '#172554', soft: '#eef2ff', background: '#f8fafc', layout: 'split' },
  { id: 'ocean', name: 'Ocean Teal', primary: '#0f766e', secondary: '#06b6d4', dark: '#083344', soft: '#ecfeff', background: '#f0fdfa', layout: 'centered' },
  { id: 'sunset', name: 'Sunset Coral', primary: '#e11d48', secondary: '#f97316', dark: '#4c0519', soft: '#fff1f2', background: '#fff7ed', layout: 'split-reverse' },
  { id: 'forest', name: 'Forest Green', primary: '#15803d', secondary: '#84cc16', dark: '#052e16', soft: '#f0fdf4', background: '#f7fee7', layout: 'sidebar' },
  { id: 'midnight', name: 'Midnight Blue', primary: '#2563eb', secondary: '#8b5cf6', dark: '#0f172a', soft: '#eff6ff', background: '#f8fafc', layout: 'glass' },
  { id: 'royal', name: 'Royal Violet', primary: '#7e22ce', secondary: '#db2777', dark: '#3b0764', soft: '#faf5ff', background: '#fdf4ff', layout: 'centered' },
  { id: 'copper', name: 'Copper Workshop', primary: '#c2410c', secondary: '#f59e0b', dark: '#431407', soft: '#fff7ed', background: '#fffaf5', layout: 'split-reverse' },
  { id: 'rose', name: 'Rose Studio', primary: '#be185d', secondary: '#fb7185', dark: '#500724', soft: '#fff1f2', background: '#fff8fa', layout: 'glass' },
  { id: 'lime', name: 'Lime Fresh', primary: '#4d7c0f', secondary: '#a3e635', dark: '#1a2e05', soft: '#f7fee7', background: '#fbfff3', layout: 'sidebar' },
  { id: 'slate', name: 'Slate Corporate', primary: '#334155', secondary: '#64748b', dark: '#0f172a', soft: '#f1f5f9', background: '#f8fafc', layout: 'centered' },
  { id: 'ruby', name: 'Ruby Commerce', primary: '#b91c1c', secondary: '#ef4444', dark: '#450a0a', soft: '#fef2f2', background: '#fffafa', layout: 'split' },
  { id: 'sky', name: 'Sky Travel', primary: '#0369a1', secondary: '#38bdf8', dark: '#082f49', soft: '#f0f9ff', background: '#f8fcff', layout: 'glass' },
  { id: 'academy', name: 'Academy Marketplace', primary: '#5b21b6', secondary: '#d946ef', dark: '#17112b', soft: '#f5f3ff', background: '#fbfaff', layout: 'marketplace' },
  { id: 'service', name: 'Service Trust Blue', primary: '#1677c8', secondary: '#15a6a2', dark: '#102a43', soft: '#eaf6ff', background: '#fbfdff', layout: 'service' },
  { id: 'industrial', name: 'Industrial Signal', primary: '#d89b00', secondary: '#f5c518', dark: '#1d252c', soft: '#fff8dd', background: '#fbfbfa', layout: 'industrial' },
  { id: 'culinary', name: 'Culinary Heritage', primary: '#8b4513', secondary: '#e67e22', dark: '#302218', soft: '#fdf3df', background: '#fffdf9', layout: 'culinary' }
];

const THEME_BY_PROFILE = {
  cashier: ['ruby', 'copper', 'sunset'], restaurant: ['culinary', 'ruby', 'copper'], coffee: ['culinary', 'copper', 'royal'], laundry: ['ocean', 'sky', 'service'], salon: ['rose', 'service', 'ocean'], clinic: ['service', 'ocean', 'sky'], dental: ['service', 'ocean', 'rose'], pharmacy: ['service', 'ocean', 'slate'],
  workshop: ['industrial', 'copper', 'service'], carwash: ['industrial', 'service', 'sky'], logistics: ['industrial', 'slate', 'sky'], warehouse: ['industrial', 'slate', 'midnight'], parking: ['industrial', 'slate', 'midnight'], security: ['midnight', 'industrial', 'slate'],
  bimba: ['academy', 'royal', 'sunset'], school: ['academy', 'royal', 'sky'], course: ['academy', 'royal', 'ocean'], attendance: ['sky', 'aurora'], finance: ['slate', 'midnight'], payroll: ['slate', 'midnight'], invoice: ['slate', 'royal'], legal: ['midnight', 'slate'], hr: ['aurora', 'slate'],
  hotel: ['culinary', 'royal', 'service'], travel: ['sky', 'service', 'ocean'], event: ['culinary', 'royal', 'rose'], photography: ['midnight', 'rose'], realestate: ['service', 'slate', 'midnight'], donation: ['lime', 'royal'], posyandu: ['service', 'rose', 'ocean'], agriculture: ['forest', 'lime'], farm: ['forest', 'lime']
};

export function getRandomVisualTheme(profileId) {
  const candidates = THEME_BY_PROFILE[profileId];
  const pool = candidates ? VISUAL_THEMES.filter(theme => candidates.includes(theme.id)) : VISUAL_THEMES;
  return pool[randomInt(pool.length)];
}
