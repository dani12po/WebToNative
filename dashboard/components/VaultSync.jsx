'use client';

import { useEffect, useState } from 'react';
import { useVault } from './VaultGate';

const emptyDocument = { projects: [], aiProviders: [] };

// Pengaturan ini memakai brankas yang sudah dibuka oleh VaultGate. Tidak ada
// password kedua dan plaintext tidak pernah dikirim ke API dashboard.
export default function VaultSync() {
  const { vault: unlockedVault, saveVaultDocument } = useVault();
  const [document, setDocument] = useState(() => ({ ...emptyDocument, ...(unlockedVault || {}) }));
  const [state, setState] = useState('Brankas telah dibuka untuk sesi perangkat ini.');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDocument({ ...emptyDocument, ...(unlockedVault || {}) });
  }, [unlockedVault]);

  async function save() {
    setBusy(true);
    try {
      await saveVaultDocument(document);
      setState('API key dan konfigurasi terenkripsi berhasil disinkronkan. Server hanya menerima ciphertext.');
    } catch (error) {
      setState(error.message || 'Backup vault gagal disimpan.');
    } finally {
      setBusy(false);
    }
  }

  function addProject() {
    setDocument((current) => ({ ...current, projects: [...current.projects, { name: '', type: 'gas', notes: '' }] }));
  }
  function changeProject(index, field, value) {
    setDocument((current) => ({ ...current, projects: current.projects.map((project, i) => i === index ? { ...project, [field]: value } : project) }));
  }
  function addAiProvider() {
    setDocument((current) => ({ ...current, aiProviders: [...current.aiProviders, { label: '', provider: '', apiKey: '' }] }));
  }
  function changeAiProvider(index, field, value) {
    setDocument((current) => ({ ...current, aiProviders: current.aiProviders.map((item, i) => i === index ? { ...item, [field]: value } : item) }));
  }

  return <section className="panel device-vault">
    <div className="panel-heading"><div><h3>Vault perangkat terenkripsi</h3><p className="muted">Backup konfigurasi proyek dan API key AI lintas perangkat. OAuth Google/Vercel tidak termasuk dan tetap memakai login resmi pada tiap komputer.</p></div><span className="chip">E2EE</span></div>
    <p className="muted">Master Password sudah dibuka pada sesi ini. Tambahkan API key lalu simpan; nilainya dienkripsi di browser sebelum dikirim.</p>
    <div className="vault-actions"><button type="button" className="primary" disabled={busy} onClick={save}>{busy ? 'Menyimpan…' : 'Simpan backup terenkripsi'}</button></div>
    <p className="vault-status">{state}</p>
    <div className="vault-projects"><div className="panel-heading"><b>Konfigurasi proyek</b><button type="button" className="outline compact" onClick={addProject}>+ Proyek</button></div>{document.projects.length === 0 && <p className="muted">Tambahkan konfigurasi non-OAuth yang ingin Anda bawa ke perangkat lain.</p>}{document.projects.map((project, index) => <div className="vault-project-row" key={index}><input aria-label="Nama proyek" placeholder="Nama proyek" value={project.name} onChange={(event) => changeProject(index, 'name', event.target.value)} /><select aria-label="Jenis proyek" value={project.type} onChange={(event) => changeProject(index, 'type', event.target.value)}><option value="gas">Web App GAS</option><option value="nextjs">Next.js</option><option value="android">Android</option></select><input aria-label="Catatan proyek" placeholder="Catatan / konfigurasi non-rahasia" value={project.notes} onChange={(event) => changeProject(index, 'notes', event.target.value)} /></div>)}</div>
    <div className="vault-projects"><div className="panel-heading"><b>API key AI</b><button type="button" className="outline compact" onClick={addAiProvider}>+ API key</button></div>{document.aiProviders.length === 0 && <p className="muted">Tambahkan API key AI agar opsi analisis AI dapat digunakan saat membuat Web App GAS, migrasi Next.js, atau aplikasi Android.</p>}{document.aiProviders.map((item, index) => <div className="vault-project-row ai-row" key={index}><input aria-label="Nama layanan AI" placeholder="Nama layanan" value={item.label} onChange={(event) => changeAiProvider(index, 'label', event.target.value)} /><input aria-label="Provider atau model" placeholder="Provider / model" value={item.provider} onChange={(event) => changeAiProvider(index, 'provider', event.target.value)} /><input aria-label="API key AI" type="password" autoComplete="off" placeholder="API key" value={item.apiKey} onChange={(event) => changeAiProvider(index, 'apiKey', event.target.value)} /></div>)}</div>
  </section>;
}
