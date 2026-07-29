'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';
import { clearVaultSession } from './VaultGate';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const errorMessage = error => error?.message || error?.error_description || error?.code || (typeof error === 'string' ? error : 'Proses akun gagal. Periksa konfigurasi Supabase lalu coba lagi.');

export function useSupabase() {
  return useMemo(() => url && anonKey ? createClient(url, anonKey) : null, []);
}

function Landing({ open, theme, toggleTheme, children }) {
  return (
    <main className="landing">
      <header className="landing-nav">
        <div className="brand"><span className="brand-mark">W</span><b>WebToNative</b></div>
        <nav className="landing-links" aria-label="Navigasi utama">
          <a href="#fitur">Fitur</a>
          <a href="#cara-kerja">Cara kerja</a>
          <a href="#keamanan">Keamanan</a>
        </nav>
        <div className="landing-nav-actions">
          <button className="landing-theme" type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Mode gelap aktif' : 'Mode terang aktif'} title={theme === 'dark' ? 'Mode gelap aktif' : 'Mode terang aktif'}>{theme === 'dark' ? '◐' : '☀'}</button>
          <button className="landing-login" onClick={() => open('login')}>Masuk</button>
          <button className="landing-cta" onClick={() => open('register')}>Mulai gratis</button>
        </div>
      </header>

      <section className="landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">BUILD CONTROL CENTER</p>
          <h1>Bangun lebih banyak, atur lebih sedikit.</h1>
          <p>Workspace untuk membuat Web App GAS, memigrasikan ke Next.js, dan menyiapkan Android native - dengan build tetap berjalan aman di komputer Anda.</p>
          <div className="landing-actions">
            <button className="landing-cta" onClick={() => open('register')}>Buat workspace <span>→</span></button>
            <button className="landing-login" onClick={() => open('login')}>Masuk ke akun</button>
          </div>
          <div className="landing-points"><span>✓ Job privat per akun</span><span>✓ CLI lokal aman</span><span>✓ Riwayat deployment</span></div>
        </div>
        <div className="hero-preview" aria-label="Preview dashboard">
          <div className="preview-top"><span className="preview-logo">W</span><span>Workspace Anda</span><i>●</i></div>
          <div className="preview-main">
            <aside><b>Ringkasan</b><span>Buat aplikasi</span><span>Proyek saya</span><span>Pengaturan</span></aside>
            <section>
              <div className="preview-title"><small>RINGKASAN</small><b>Aktivitas proyek</b></div>
              <div className="preview-stats"><span><small>Proyek</small><b>12</b></span><span><small>Berjalan</small><b>03</b></span><span><small>Berhasil</small><b>09</b></span></div>
              <div className="preview-row"><i /><div><b>Kasir digital</b><small>Deploy Next.js · selesai</small></div><em>Live</em></div>
              <div className="preview-row"><i /><div><b>Portal bimbel</b><small>Build Android · berjalan</small></div><em>58%</em></div>
            </section>
          </div>
        </div>
      </section>

      <section id="fitur" className="landing-features landing-feature-details">
        <article><b>01</b><h2>Buat aplikasi</h2><p>Pilih alur Web App GAS, migrasi Next.js, atau Android native. Job tersimpan rapi di workspace agar Anda tidak perlu berpindah-pindah alat.</p></article>
        <article><b>02</b><h2>Bangun di komputer Anda</h2><p>Dashboard menyiapkan pekerjaan, lalu CLI lokal menjalankan clasp, Next.js, atau Gradle dengan environment yang memang ada di perangkat Anda.</p></article>
        <article><b>03</b><h2>Pantau hasilnya</h2><p>Lihat status proses, tautan deploy, dan file output dari satu tempat. Riwayat membantu Anda kembali ke proyek yang pernah dibuat.</p></article>
      </section>

      <section id="cara-kerja" className="landing-card-section">
        <header className="landing-section-heading"><p className="eyebrow">WORKFLOW</p><p>Alur dari job sampai hasil dibuat sebagai kartu tersendiri agar mudah dipahami sebelum Anda mulai membangun aplikasi.</p></header>
        <div className="landing-detail-grid workflow-cards">
          <article className="landing-detail-card"><span className="detail-number">01</span><h3>Buat job</h3><p>Pilih proyek dan alur yang ingin dijalankan dari workspace. Job hanya dapat dilihat oleh akun yang membuatnya.</p></article>
          <article className="landing-detail-card"><span className="detail-number">02</span><h3>Hubungkan CLI</h3><p>Masukkan kode pairing sekali agar komputer pilihan Anda dapat mengambil job dari workspace akun yang sama.</p></article>
          <article className="landing-detail-card"><span className="detail-number">03</span><h3>Build di komputer Anda</h3><p>CLI menjalankan toolchain yang diperlukan secara lokal, seperti clasp, Next.js, atau Gradle, sesuai jenis aplikasi.</p></article>
          <article className="landing-detail-card"><span className="detail-number">04</span><h3>Pantau hasil</h3><p>Status proses, link deploy, dan lokasi output dikirim kembali ke workspace saat proses selesai atau membutuhkan perhatian.</p></article>
        </div>
      </section>

      <section id="keamanan" className="landing-card-section landing-security-section">
        <header className="landing-section-heading"><p className="eyebrow">PRIVASI &amp; AKSES</p><p>Kendali credential tetap di tangan Anda. Akun layanan dapat dihubungkan untuk mempercepat workflow, namun aksesnya tetap dapat dikelola dari pengaturan akun.</p></header>
        <div className="landing-detail-grid security-cards">
          <article className="landing-detail-card"><h3>Pairing per perangkat</h3><p>CLI perlu dipasangkan sebelum dapat mengambil job dari workspace. Anda memilih komputer yang diberi akses.</p></article>
          <article className="landing-detail-card"><h3>Data sensitif terenkripsi</h3><p>Credential yang dipilih untuk disimpan diproses sebagai data terenkripsi dan tidak ditampilkan kembali sebagai nilai mentah di dashboard.</p></article>
          <article className="landing-detail-card"><h3>Akun tetap terkendali</h3><p>Username bersifat permanen. Anda dapat memperbarui email melalui konfirmasi Supabase, mengganti password, atau menghapus dan mengekspor koneksi saat berpindah perangkat.</p></article>
        </div>
        <p className="detail-note">Kami menjelaskan alur penggunaan yang penting tanpa mempublikasikan detail keamanan internal atau isi credential Anda.</p>
      </section>
      {children}
    </main>
  );
}

export default function AuthGate({ children }) {
  const supabase = useSupabase();
  const [session, setSession] = useState(undefined);
  const [screen, setScreen] = useState('landing');
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    if (!supabase) return setSession(null);
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'SIGNED_OUT') clearVaultSession();
      setSession(next);
    });
    return () => subscription.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const next = localStorage.getItem('webtonative-theme') === 'dark' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }, []);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'register') {
        const username = form.username.trim().toLowerCase();
        if (!/^[a-z0-9_.-]{3,32}$/.test(username)) throw new Error('Username gunakan 3-32 huruf kecil, angka, titik, garis bawah, atau minus.');
        const { error } = await supabase.auth.signUp({ email: form.email.trim(), password: form.password, options: { data: { username } } });
        if (error) throw error;
        setMessage('Akun dibuat. Periksa email untuk verifikasi, lalu masuk menggunakan username Anda.');
        setMode('login');
      } else {
        const response = await fetch('/api/auth/username-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: form.username, password: form.password }) });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error);
        const { error } = await supabase.auth.setSession({ access_token: payload.session.access_token, refresh_token: payload.session.refresh_token });
        if (error) throw error;
      }
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function open(nextMode) { setMode(nextMode); setMessage(''); setScreen('auth'); }
  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('webtonative-theme', next);
    document.documentElement.classList.remove('preview-theme-changing');
    document.documentElement.dataset.theme = next;
    requestAnimationFrame(() => document.documentElement.classList.add('preview-theme-changing'));
    window.setTimeout(() => document.documentElement.classList.remove('preview-theme-changing'), 5000);
  }

  if (session === undefined) return <main className="auth-shell"><p>Memeriksa sesi aman...</p></main>;
  if (!supabase) return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">KONFIGURASI DIPERLUKAN</p><h1>Hubungkan Supabase terlebih dahulu.</h1><p>Salin <code>.env.example</code> menjadi <code>.env.local</code>, lalu isi URL, anon key, service-role key, dan kunci enkripsi server.</p></section></main>;
  if (session) return children({ supabase, session });
  if (screen === 'landing') return <Landing open={open} theme={theme} toggleTheme={toggleTheme} />;
  if (screen === 'auth') return <Landing open={open} theme={theme} toggleTheme={toggleTheme}><div className="auth-modal-overlay" role="presentation" onMouseDown={() => setScreen('landing')}><section className="auth-card auth-modal" role="dialog" aria-modal="true" aria-label={mode === 'login' ? 'Masuk' : 'Daftar akun'} onMouseDown={event => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setScreen('landing')} aria-label="Tutup formulir">×</button><div className="auth-brand"><span className="brand-mark">W</span><b>WebToNative</b></div><p className="eyebrow">AKUN AMAN</p><h1>{mode === 'login' ? 'Masuk ke workspace Anda.' : 'Buat workspace pribadi.'}</h1><p>{mode === 'login' ? 'Masuk dengan username atau email dan password.' : 'Email dipakai untuk verifikasi dan pemulihan akun.'}</p><form onSubmit={submit}><label>{mode === 'login' ? 'Username atau email' : 'Username'}<input autoComplete="username" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></label>{mode === 'register' && <label>Email<input type="email" autoComplete="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>}<label>Password<input type="password" minLength="8" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label><button disabled={busy} className="primary" type="submit">{busy ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar akun'} <span>→</span></button></form><button className="auth-link" type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage(''); }}>{mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah memiliki akun? Masuk'}</button>{message && <p className="message">{message}</p>}</section></div></Landing>;

  return <main className="auth-shell"><section className="auth-card"><button className="back-home" onClick={() => setScreen('landing')}>← Kembali</button><div className="auth-brand"><span className="brand-mark">W</span><b>WebToNative</b></div><p className="eyebrow">AKUN AMAN</p><h1>{mode === 'login' ? 'Masuk ke workspace Anda.' : 'Buat workspace pribadi.'}</h1><p>{mode === 'login' ? 'Masuk dengan username atau email dan password.' : 'Email dipakai untuk verifikasi dan pemulihan akun.'}</p><form onSubmit={submit}><label>{mode === 'login' ? 'Username atau email' : 'Username'}<input autoComplete="username" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></label>{mode === 'register' && <label>Email<input type="email" autoComplete="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>}<label>Password<input type="password" minLength="8" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label><button disabled={busy} className="primary" type="submit">{busy ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar akun'} <span>→</span></button></form><button className="auth-link" type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage(''); }}>{mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah memiliki akun? Masuk'}</button>{message && <p className="message">{message}</p>}</section></main>;
}
