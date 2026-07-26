import { getAppHtmlTemplate as getBaseAppHtmlTemplate } from './appHtmlV2.js';

const LAYOUT_CSS = `
/* Variasi tata letak dashboard per tema */
.dash-centered #dashboard{display:block!important}.dash-centered #sidebar{width:100%;min-height:auto;display:flex;align-items:center;gap:1.25rem;padding:1rem 2rem}.dash-centered #sidebar nav{display:flex;gap:.5rem;flex:1}.dash-centered #sidebar .menu{width:auto;padding:.65rem .9rem}.dash-centered #sidebar>div:last-child{margin:0!important;border:0!important;padding:0!important;display:flex;align-items:center;gap:.75rem}.dash-centered #userName{margin:0!important;white-space:nowrap}.dash-centered #logoutBtn{width:auto;white-space:nowrap}.dash-centered #dashboard>section{padding-top:3rem}
.dash-split-reverse #sidebar{order:2;box-shadow:-14px 0 35px rgba(15,23,42,.12)}.dash-split-reverse #dashboard>section{background:linear-gradient(135deg,#fff,transparent 55%)}
.dash-glass #dashboard{background:radial-gradient(circle at 10% 10%,var(--soft),transparent 32%),radial-gradient(circle at 88% 82%,color-mix(in srgb,var(--secondary) 18%,transparent),transparent 35%)}.dash-glass .card{background:rgba(255,255,255,.72);backdrop-filter:blur(16px);border-color:rgba(255,255,255,.55)}.dash-glass #sidebar{box-shadow:14px 0 42px rgba(15,23,42,.16)}
.dash-sidebar #sidebar{width:19rem}.dash-sidebar #dashboard>section{padding:2.5rem}.dash-sidebar .card{border-radius:1.75rem}
.dash-split #sidebar{width:15.5rem}.dash-split #dashboard>section{padding:3rem}.dash-split .card{box-shadow:0 24px 55px rgba(15,23,42,.11)}
.dash-workshop #dashboard{display:block!important;background:linear-gradient(135deg,#f8fafc,#fff7ed)}.dash-workshop #sidebar{width:100%;min-height:auto;display:flex;align-items:center;gap:1.25rem;padding:1rem 2rem;background:linear-gradient(90deg,#1c1917,#78350f,#b45309)}.dash-workshop #sidebar nav{display:flex;gap:.45rem;flex:1}.dash-workshop #sidebar .menu{width:auto;padding:.65rem .85rem}.dash-workshop #sidebar>div:last-child{margin:0!important;border:0!important;padding:0!important;display:flex;align-items:center;gap:.75rem}.dash-workshop #userName{margin:0!important;white-space:nowrap}.dash-workshop #logoutBtn{width:auto;white-space:nowrap}.dash-workshop #dashboard>section{padding-top:3rem}.dash-workshop .card{border-radius:1rem;border-top:4px solid #f59e0b}
@media(max-width:767px){.dash-centered #sidebar{display:block;padding:1.25rem}.dash-centered #sidebar nav{display:block;margin-top:1rem}.dash-centered #sidebar .menu{width:100%}.dash-centered #sidebar>div:last-child{display:block;margin-top:1.5rem!important}.dash-split-reverse #sidebar{order:0}}
/* Mobile-first: menu ringkas, form satu kolom, tabel tetap dapat digeser */
@media(max-width:767px){#dashboard{display:block!important}#sidebar{width:100%!important;min-height:auto!important;padding:1.25rem!important}#sidebar nav{display:flex!important;overflow-x:auto;gap:.5rem;margin-top:1rem!important;padding-bottom:.35rem}#sidebar .menu{width:auto!important;min-width:max-content;flex:0 0 auto;padding:.7rem .85rem}#sidebar>div:last-child{margin-top:1.25rem!important;padding-top:1rem!important}#dashboard>section{padding:1rem!important}#dashboard .grid{display:block!important}#recordForm{margin-bottom:1rem}#dashboard h1{font-size:1.7rem;line-height:1.15}#dashboard .card{border-radius:1.25rem}#dashboard table{min-width:40rem}#dashboard input,#dashboard select{font-size:16px}.toast{left:1rem;right:1rem;bottom:1rem}}
@media(min-width:768px) and (max-width:1023px){#sidebar{width:13.5rem!important}#dashboard>section{padding:1.5rem!important}#dashboard .grid{grid-template-columns:1fr 1.5fr!important}#dashboard table{min-width:38rem}}
`;

export function getAppHtmlTemplate(projectName, profile, theme) {
  const specializedLayouts = { workshop: 'workshop' };
  const layout = specializedLayouts[profile.id] || theme.layout;
  const html = getBaseAppHtmlTemplate(projectName, profile, theme);
  return html
    .replace('</head>', `<style>${LAYOUT_CSS}</style></head>`)
    .replace('<body>', `<body class="dash-${layout}">`);
}
