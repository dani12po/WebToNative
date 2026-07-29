'use client';

import { useEffect, useMemo, useState } from 'react';
import { encryptVaultSecret } from '../lib/vault-client';
import VaultSync from './VaultSync';

const providers = { google_apps_script: 'Google Apps Script', vercel: 'Vercel', ai: 'AI Provider' };
const localCommands = { google_apps_script: 'npm run service-login -- --service gas', vercel: 'npm run service-login -- --service vercel' };

export default function ServiceSettings({ supabase, session }) {
  const [connections, setConnections] = useState([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ provider: 'google_apps_script', label: 'Google Apps Script', accountHint: '', secret: '' });
  const [vaultPassword, setVaultPassword] = useState('');
  const [agent, setAgent] = useState(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(session.user.email || '');

  const token = () => session.access_token;
  const request = (path, options = {}) => fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(options.headers || {}) }
  });
  const provider = form.provider;
  const isAi = provider === 'ai';
  const command = localCommands[provider];
  const serviceConnected = connections.some(connection => connection.provider === provider);
  const helper = useMemo(() => {
    if (provider === 'google_apps_script') return 'Aktifkan API, lalu jalankan login resmi clasp pada CLI yang sudah dipasangkan. Web tidak menerima token Google Anda.';
    if (provider === 'vercel') return 'Jalankan login resmi Vercel pada CLI yang sudah dipasangkan. Sesi vendor tetap dibuat secara lokal.';
    return 'API key dienkripsi di browser memakai password vault Anda sebelum dikirim ke server. Kami tidak dapat membukanya.';
  }, [provider]);

  async function load() {
    const res = await request('/api/connections');
    const data = await res.json();
    if (res.ok) setConnections(data.connections || []);
    else setMessage(data.error);
  }

  async function loadProfile() {
    const { data } = await supabase.from('profiles').select('username').eq('id', session.user.id).maybeSingle();
    setUsername(data?.username || session.user.user_metadata?.username || session.user.email?.split('@')[0] || '-');
  }

  useEffect(() => {
    load();
    loadProfile();
    const refreshAgent = () => request('/api/agents/status').then(res => res.json()).then(data => setAgent(data.active || null)).catch(() => setAgent(null));
    refreshAgent();
    const timer = setInterval(() => { load(); refreshAgent(); }, 5000);
    return () => clearInterval(timer);
  }, []);

  function selectProvider(next) {
    setForm({ provider: next, label: providers[next], accountHint: '', secret: '' });
    setMessage('');
  }

  async function loginFromDashboard() {
    if (!command) return;
    setLoginBusy(true);
    setMessage('');
    try {
      const service = provider === 'google_apps_script' ? 'gas' : 'vercel';
      const res = await request('/api/jobs', { method: 'POST', body: JSON.stringify({ flow: 'service_login', name: `Login ${providers[provider]}`, service }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(agent ? 'Permintaan login dikirim. CLI aktif akan membuka browser login resmi di komputer Anda.' : 'Permintaan login masuk antrean. Hubungkan CLI terlebih dahulu, lalu agent akan membuka browser login resmi.');
    } catch (error) {
      setMessage(error.message || 'Login tidak dapat dimulai.');
    } finally {
      setLoginBusy(false);
    }
  }

  async function save(event) {
    event.preventDefault();
    setMessage('');
    try {
      const secret = isAi ? form.secret : `LOCAL_${provider.toUpperCase()}_SESSION`;
      const vaultPayload = await encryptVaultSecret(secret, vaultPassword);
      const input = { provider, label: form.label, accountHint: form.accountHint || (isAi ? 'API key pribadi' : 'Sesi login lokal'), vaultPayload };
      const res = await request('/api/connections', { method: 'POST', body: JSON.stringify(input) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConnections(current => [data.connection, ...current]);
      setForm({ provider, label: providers[provider], accountHint: '', secret: '' });
      setVaultPassword('');
      setMessage(isAi ? 'API key sudah tersimpan sebagai ciphertext. Masukkan password vault saat pairing CLI untuk menyalinnya ke komputer baru.' : 'Metadata koneksi tersimpan sebagai ciphertext. Selesaikan login CLI resmi untuk membuat sesi lokal.');
    } catch (error) {
      setMessage(error.message || 'Koneksi gagal disimpan.');
    }
  }

  async function remove(id) {
    if (!confirm('Hapus koneksi ini?')) return;
    const res = await request(`/api/connections/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setConnections(current => current.filter(item => item.id !== id));
      setMessage('Koneksi dan ciphertext-nya dihapus.');
    }
  }

  async function backup(id) {
    const res = await request(`/api/connections/${id}`);
    const data = await res.json();
    if (!res.ok) return setMessage(data.error);
    const blob = new Blob([JSON.stringify({ format: 'webtonative-e2ee-export', version: 1, exportedAt: new Date().toISOString(), connection: data.connection }, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `webtonative-vault-${id}.json`;
    link.click();
    URL.revokeObjectURL(href);
    setMessage('Ciphertext vault berhasil diunduh. Simpan bersama password vault Anda.');
  }

  async function changeEmail(event) {
    event.preventDefault();
    const nextEmail = email.trim().toLowerCase();
    if (!nextEmail || nextEmail === session.user.email) return setMessage('Masukkan email baru untuk diperbarui.');
    const { error } = await supabase.auth.updateUser({ email: nextEmail });
    setMessage(error ? error.message : 'Permintaan perubahan email dikirim. Konfirmasikan melalui email yang dikirim Supabase sebelum email login berubah.');
  }

  async function changePassword(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextPassword = new FormData(form).get('password');
    const { error } = await supabase.auth.updateUser({ password: nextPassword });
    setMessage(error ? error.message : 'Password akun diperbarui.');
    if (!error) form.reset();
  }

  return (
    <section id="pengaturan" className="settings-wrap service-settings">
      <div className="settings-grid">
        <article className="panel account-details">
          <h3>Akun & keamanan</h3>
          <p className="muted">Kelola identitas login, email, dan password workspace Anda.</p>
          <label>Username<input value={username} readOnly aria-readonly="true" /></label>
          <p className="account-note">Username bersifat permanen dan tidak dapat diubah.</p>
          <form onSubmit={changeEmail}>
            <label>Email login<input name="email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></label>
            <button className="outline" type="submit">Perbarui email</button>
          </form>
          <p className="account-note">Perubahan email membutuhkan konfirmasi melalui email Anda.</p>
          <form onSubmit={changePassword}>
            <label>Password baru<input name="password" type="password" minLength="8" autoComplete="new-password" required /></label>
            <button className="outline" type="submit">Simpan password</button>
          </form>
        </article>
        <article className="panel">
          <h3>Hubungkan layanan</h3>
          <p className="muted">Rahasia dienkripsi di browser. Server hanya menyimpan data terenkripsi dan tidak memiliki password vault Anda.</p>
          <div className="service-tabs">{Object.entries(providers).map(([key, value]) => <button type="button" className={provider === key ? 'active' : ''} onClick={() => selectProvider(key)} key={key}>{value}</button>)}</div>
          <div className="pairing-status"><span className={agent ? 'status-dot online' : 'status-dot'} />{agent ? `CLI ${agent.deviceName} siap menerima login` : <>CLI belum dipasangkan. <a href="/buat-aplikasi">Pasangkan CLI terlebih dahulu</a></>}</div>
          <div className="service-guide">
            <b>{providers[provider]}</b><p>{helper}</p>
            {provider === 'google_apps_script' && <button className="outline" type="button" onClick={() => window.open('https://script.google.com/home/usersettings', '_blank', 'noopener,noreferrer')}>1. Aktifkan Apps Script API ↗</button>}
            {command && <><span>2. Login resmi melalui CLI</span><button className="primary compact-login" type="button" onClick={loginFromDashboard} disabled={loginBusy || serviceConnected}>{serviceConnected ? `${providers[provider]} sudah terhubung` : loginBusy ? 'Mengirim permintaan…' : `Login ${providers[provider]} di komputer ini`} <span>→</span></button><small>{serviceConnected ? 'Status koneksi sudah disimpan. Token OAuth tetap hanya berada di komputer yang dipasangkan.' : 'Jika CLI sedang aktif, browser login resmi akan terbuka otomatis pada komputer yang dipasangkan.'}</small></>}
            {isAi && <span>Setelah disimpan, API key tidak akan ditampilkan lagi.</span>}
          </div>
          {isAi ? <form onSubmit={save}>
            <label>Nama koneksi<input required value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} /></label>
            <label>Provider / model (opsional)<input placeholder="Contoh: NVIDIA NIM atau Groq" value={form.accountHint} onChange={e => setForm({ ...form, accountHint: e.target.value })} /></label>
            <label>API key<input required type="password" autoComplete="new-password" placeholder="Paste API key" value={form.secret} onChange={e => setForm({ ...form, secret: e.target.value })} /></label>
            <label>Password vault<input required type="password" minLength="12" autoComplete="new-password" placeholder="Minimal 12 karakter — tidak disimpan" value={vaultPassword} onChange={e => setVaultPassword(e.target.value)} /></label>
            <p className="vault-note">Simpan password vault di pengelola password Anda. Tanpa password ini, ciphertext tidak bisa dipulihkan oleh siapa pun, termasuk kami.</p>
            <button className="primary" type="submit">Simpan terenkripsi <span>→</span></button>
          </form> : <div className="local-session-note"><b>{serviceConnected ? 'Layanan terhubung' : 'Menunggu login resmi'}</b><p>{serviceConnected ? 'Dashboard hanya menyimpan status koneksi dan nama perangkat. Sesi OAuth, token, email, serta password tidak dikirim ke server.' : 'Klik tombol login di atas. Setelah OAuth berhasil, agent akan menyimpan status koneksi ke dashboard secara otomatis.'}</p></div>}
        </article>
      </div>
      <section className="panel connections">
        <div className="panel-heading"><h3>Koneksi tersimpan</h3><span className="chip">{connections.length} koneksi</span></div>
        <p className="muted">Ekspor berisi ciphertext vault. Token mentah dan API key tidak pernah ditampilkan atau didekripsi oleh server.</p>
        <div className="connection-list">
          {connections.map(item => <article className="stored-connection" key={item.id}><span className="provider-icon">{item.provider === 'vercel' ? 'V' : item.provider === 'ai' ? 'AI' : 'G'}</span><div><b>{item.label}</b><small>{providers[item.provider]} · {item.account_hint}</small></div><div className="connection-actions"><button title="Unduh vault terenkripsi" className="icon-button" onClick={() => backup(item.id)}>↓</button><button title="Hapus koneksi" className="icon-button danger" onClick={() => remove(item.id)}>×</button></div></article>)}
          {!connections.length && <p className="empty">Belum ada koneksi.</p>}
        </div>
      </section>
      <VaultSync session={session} />
      {message && <p className="message">{message}</p>}
    </section>
  );
}
