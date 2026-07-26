import { randomInt } from 'node:crypto';

const VISUAL_THEMES = [
  { id: 'aurora', name: 'Aurora Indigo', primary: '#635bff', secondary: '#a855f7', dark: '#172554', soft: '#eef2ff', background: '#f8fafc', layout: 'split' },
  { id: 'ocean', name: 'Ocean Teal', primary: '#0f766e', secondary: '#06b6d4', dark: '#083344', soft: '#ecfeff', background: '#f0fdfa', layout: 'centered' },
  { id: 'sunset', name: 'Sunset Coral', primary: '#e11d48', secondary: '#f97316', dark: '#4c0519', soft: '#fff1f2', background: '#fff7ed', layout: 'split-reverse' },
  { id: 'forest', name: 'Forest Green', primary: '#15803d', secondary: '#84cc16', dark: '#052e16', soft: '#f0fdf4', background: '#f7fee7', layout: 'sidebar' },
  { id: 'midnight', name: 'Midnight Blue', primary: '#2563eb', secondary: '#8b5cf6', dark: '#0f172a', soft: '#eff6ff', background: '#f8fafc', layout: 'glass' },
  { id: 'royal', name: 'Royal Violet', primary: '#7e22ce', secondary: '#db2777', dark: '#3b0764', soft: '#faf5ff', background: '#fdf4ff', layout: 'centered' }
];

export function getRandomVisualTheme() {
  return VISUAL_THEMES[randomInt(VISUAL_THEMES.length)];
}
