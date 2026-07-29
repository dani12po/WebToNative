'use client';

import { useEffect } from 'react';

const tools = [
  ['Node.js 18+', 'Menjalankan CLI dan dependensi JavaScript.', 'https://nodejs.org/en/download'],
  ['Google clasp', 'Membuat dan deploy Web App GAS.', 'https://github.com/google/clasp#readme'],
  ['Next.js', 'Membangun hasil migrasi menjadi aplikasi web.', 'https://nextjs.org/docs'],
  ['Vercel', 'Opsional untuk deployment Next.js.', 'https://vercel.com/docs'],
  ['Android SDK / JDK', 'Diperlukan untuk build APK Android native.', 'https://developer.android.com/studio'],
  ['Supabase', 'Menyimpan akun, job, pairing, dan profil dashboard.', 'https://supabase.com/docs']
];

export default function Documentation() {
  useEffect(() => {
    const scrollToHash = () => {
      const id = window.location.hash.slice(1);
      if (id) window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    };
    scrollToHash();
    window.addEventListener('hashchange', scrollToHash);
    return () => window.removeEventListener('hashchange', scrollToHash);
  }, []);

  return (
    <section className="docs-page">
      <section className="docs-intro panel">
        <div><p className="eyebrow">DOKUMENTASI RESMI</p><h2>Bangun dan jalankan aplikasi dengan aman.</h2><p>Panduan untuk menghubungkan dashboard dengan CLI lokal, mengelola akun, mengirim job, dan menelusuri hasil build.</p></div>
        <dl><div><dt>Versi</dt><dd>0.3</dd></div><div><dt>Diperbarui</dt><dd>29 Juli 2026</dd></div></dl>
      </section>

      <div className="docs-layout">
        <aside className="docs-sidebar" aria-label="Navigasi dokumentasi">
          <p>NAVIGASI</p><a href="#start">Mulai</a><a href="#akun">Akun</a><a href="#vault-e2ee">Vault E2EE</a><a href="#arsitektur">Cara kerja</a><a href="#implementasi">Implementasi</a><a href="#dependensi">Komponen</a><a href="#troubleshoot">Kendala</a><a href="#faq">Bantuan</a>
          <hr /><a href="https://github.com/google/clasp" target="_blank" rel="noreferrer">Dokumentasi clasp ↗</a><a href="https://nextjs.org/docs" target="_blank" rel="noreferrer">Dokumentasi Next.js ↗</a>
        </aside>

        <article className="docs-content">
          <section className="docs-section" id="start">
            <p className="eyebrow">MULAI DI SINI</p><h2>Gambaran singkat</h2>
            <p className="docs-lead">WebToNative memisahkan pengelolaan proyek dan proses build. Dashboard mengatur job per akun, sedangkan CLI pada komputer pengguna menjalankan proses yang membutuhkan tool lokal.</p>
            <div className="docs-grid docs-grid-three">
              <article><h3>Tujuan</h3><p>Membuat Web App GAS, migrasi Next.js, atau aplikasi Android dari satu workspace dengan status yang dapat dipantau.</p></article>
              <article><h3>Target pembaca</h3><p>Pemula, admin operasional, dan teknisi yang menyiapkan toolchain lokal.</p></article>
              <article><h3>Prasyarat</h3><ul><li>Akun WebToNative aktif.</li><li>Node.js 18 atau lebih baru.</li><li>Akses layanan sesuai alur build.</li></ul></article>
            </div>
          </section>

          <section className="docs-section" id="akun">
            <p className="eyebrow">AKUN &amp; IDENTITAS</p><h2>Kelola login tanpa mengubah identitas workspace</h2>
            <div className="docs-grid docs-grid-three">
              <article><h3>Username permanen</h3><p>Username dibuat saat pendaftaran dan menjadi identitas tetap workspace. Gunakan username atau email untuk masuk.</p></article>
              <article><h3>Perbarui email</h3><p>Buka Pengaturan, masukkan email baru, lalu selesaikan konfirmasi Supabase. Email login baru aktif setelah konfirmasi berhasil.</p></article>
              <article><h3>Ganti password</h3><p>Masukkan password baru minimal delapan karakter pada Pengaturan. Password tidak pernah ditampilkan kembali oleh dashboard.</p></article>
            </div>
            <p className="docs-note">Sesudah memperbarui schema Supabase, trigger profil menyelaraskan email tabel <code>profiles</code> setelah perubahan email Auth dikonfirmasi.</p>
          </section>

          <section className="docs-section" id="vault-e2ee">
            <p className="eyebrow">VAULT LINTAS PERANGKAT</p><h2>Sinkronisasi E2EE tanpa memindahkan sesi OAuth</h2>
            <p className="docs-lead">Google Apps Script dan Vercel selalu diautentikasi lewat OAuth resmi pada setiap komputer. Hanya konfigurasi proyek dan API key AI yang dipilih pengguna dapat dibackup sebagai ciphertext.</p>
            <div className="docs-grid docs-grid-three">
              <article><h3>1. Enkripsi di browser</h3><p>Browser menurunkan kunci AES-256-GCM dari Master Password menggunakan PBKDF2-SHA-256 dan salt acak. Master Password tidak dikirim atau disimpan.</p></article>
              <article><h3>2. Server hanya ciphertext</h3><p>Endpoint vault hanya menerima salt, IV, parameter KDF, AAD, dan ciphertext. API Vercel maupun Supabase tidak dapat membaca isi tanpa Master Password.</p></article>
              <article><h3>3. Buka di perangkat baru</h3><p>Setelah masuk ke akun WebToNative, backup terenkripsi diunduh otomatis. Masukkan Master Password sekali untuk mendekripsi data di browser pada sesi tersebut.</p></article>
            </div>
            <p className="docs-note">Jangan masukkan token OAuth Google/Vercel ke Vault. Login layanan tersebut tetap berjalan di CLI lokal masing-masing perangkat. Kehilangan Master Password berarti ciphertext tidak dapat dipulihkan.</p>
          </section>

          <section className="docs-section" id="arsitektur">
            <p className="eyebrow">CARA SCRIPT BEKERJA</p><h2>Alur eksekusi dari dashboard ke komputer</h2>
            <div className="flow-diagram" aria-label="Diagram alur eksekusi WebToNative">
              <article className="flow-node"><small>01 · WORKSPACE</small><span className="flow-icon" aria-hidden="true">▣</span><strong>Dashboard</strong></article>
              <article className="flow-node"><small>02 · SECURE QUEUE</small><span className="flow-icon" aria-hidden="true">⌁</span><strong>Antrean aman</strong></article>
              <article className="flow-node"><small>03 · LOCAL CLI</small><span className="flow-icon" aria-hidden="true">›_</span><strong>Agent lokal</strong></article>
              <article className="flow-node flow-result"><small>04 · OUTPUT</small><span className="flow-icon" aria-hidden="true">✓</span><strong>Hasil proyek</strong></article>
              <div className="flow-trace" aria-label="Alur data dan build"><span>+ Create job</span><b>DB / Encryption</b><b>Agent build</b><strong>Status &amp; output</strong></div>
            </div>
            <div className="docs-grid">
              <article><h3>Dashboard dan API</h3><p>Saat memilih Buat aplikasi, dashboard membuat job berisi nama, alur, template, dan opsi AI. Job bersifat privat untuk akun pembuatnya.</p></article>
              <article><h3><code>web-dashboard-agent.js</code></h3><p>Script pairing menyimpan sesi perangkat di <code>webtonative-agent.json</code>, memeriksa antrean setiap lima detik, dan berhenti setelah sepuluh menit bila tidak ada job.</p></article>
              <article><h3>Generator utama</h3><p>Ketika job tersedia, agent menjalankan <code>index.js</code> dengan data <code>WEBTONATIVE_JOB</code>. Tool lokal seperti clasp, Next.js, atau Gradle dipanggil oleh generator.</p></article>
              <article><h3>Hasil dan status</h3><p>Setelah proses berakhir, agent memperbarui status berhasil atau gagal serta mengirim catatan ringkas kembali ke dashboard.</p></article>
            </div>
          </section>

          <section className="docs-section" id="implementasi">
            <p className="eyebrow">IMPLEMENTASI</p><h2>Hubungkan dan jalankan CLI</h2>
            <ol className="docs-steps">
              <li><b>01</b><div><h3>Buat kode pairing</h3><p>Buka Buat aplikasi. Kode pairing dibuat khusus untuk akun dan perangkat build Anda.</p></div></li>
              <li><b>02</b><div><h3>Jalankan WebToNative Agent</h3><p>Unduh agent Windows dari dashboard, simpan di folder pilihan, lalu salin perintah pairing. Agent tidak memerlukan clone repository core atau <code>package.json</code>.</p></div></li>
              <li><b>03</b><div><h3>Agent menunggu job</h3><p>Setelah pairing sukses, agent aktif dan mengambil job yang sesuai untuk dijalankan di background.</p></div></li>
              <li><b>04</b><div><h3>Periksa hasil</h3><p>Lihat status, link deployment, lokasi output, dan ringkasan error pada Aplikasi &amp; web saya.</p></div></li>
            </ol>
            <div className="docs-code"><span>CONTOH PERINTAH TERMINAL</span><code>npm run connect-web -- --url URL_DASHBOARD --code KODE_PAIRING</code><small>Gunakan nilai URL dan kode yang dibuat dari Buat aplikasi. Jangan memakai kode pairing lama.</small></div>
            <div className="terminal-diagram" aria-label="Diagram proses pairing CLI"><article><div><small><b>01</b> TERMINAL LOKAL</small><strong>Jalankan perintah</strong><span>URL &amp; kode pairing</span></div></article><article><div><small><b>02</b> WORKSPACE</small><strong>Verifikasi akun</strong><span>Dashboard cocokkan kode</span></div></article><article><div><small><b>03</b> CLI AGENT</small><strong>Siap menerima job</strong><span>Agent aktif build</span></div></article></div>
          </section>

          <section className="docs-section" id="dependensi">
            <p className="eyebrow">KOMPONEN YANG DIPERLUKAN</p><h2>Siapkan toolchain sesuai jenis aplikasi</h2>
            <div className="docs-resource-list">{tools.map(([name, detail, href]) => <a key={name} href={href} target="_blank" rel="noreferrer"><b>{name}</b><span>{detail}</span><i>↗</i></a>)}</div>
          </section>

          <section className="docs-section" id="troubleshoot">
            <p className="eyebrow">TROUBLESHOOTING</p><h2>Jika aplikasi tidak dapat dibuat</h2>
            <div className="docs-faq">
              <details open><summary>Job tidak diproses atau status tetap menunggu</summary><p>Pastikan pairing CLI selesai pada folder tools yang benar. Jalankan kembali <code>npm run agent</code>, cek koneksi internet, lalu buat job baru jika kode pairing kedaluwarsa.</p></details>
              <details><summary>ENOENT: tidak menemukan package.json saat pairing</summary><p>Jangan menjalankan <code>npm run connect-web</code> dari folder kosong. Unduh WebToNative Agent dari Buat aplikasi lalu jalankan perintah yang disalin dengan format <code>.\\WebToNative-Agent-win-x64.exe connect --url ... --code ...</code>.</p></details>
              <details><summary>CLI menyatakan belum terhubung</summary><p>Buat kode baru dari Buat aplikasi lalu jalankan perintah pairing yang baru. Jangan menyalin file sesi perangkat dari komputer lain.</p></details>
              <details><summary>GAS gagal saat create, push, atau deploy</summary><p>Login ulang clasp, pastikan Google Apps Script API aktif, lalu baca log terminal. Periksa akses akun Google ke Google Drive dan Apps Script.</p></details>
              <details><summary>Next.js, Vercel, atau Android build gagal</summary><p>Jalankan build lokal untuk melihat error lengkap. Periksa login Vercel, Java 17+, Android SDK, build-tools, serta platform SDK sesuai alurnya.</p></details>
            </div>
          </section>

          <section className="docs-section" id="faq">
            <p className="eyebrow">FAQ &amp; BANTUAN</p><h2>Pertanyaan umum</h2>
            <div className="docs-faq">
              <details><summary>Apakah credential dikirim sebagai teks biasa?</summary><p>Tidak. Konfigurasi proyek dan API key AI dalam Vault dienkripsi oleh browser sebelum dikirim. Token OAuth Google/Vercel tidak disinkronkan dan tidak masuk ke Vault.</p></details>
              <details><summary>Apakah saya dapat memakai beberapa komputer?</summary><p>Bisa. Hubungkan setiap perangkat memakai kode pairing sendiri dan kelola koneksinya melalui Pengaturan.</p></details>
              <details><summary>Di mana hasil aplikasi berada?</summary><p>Hasil mengikuti alur build: GAS di folder project, Next.js di webmigrasi, dan Android native di apkmigrasi.</p></details>
            </div>
            <p className="docs-support">Untuk bantuan, sertakan nama job, waktu kejadian, dan potongan log tanpa token, API key, atau password. Hubungi administrator workspace atau <a href="mailto:support@webtonative.app">support@webtonative.app</a>.</p>
          </section>
        </article>
      </div>
    </section>
  );
}
