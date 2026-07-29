"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ConnectCli from "../components/ConnectCli";
import AuthGate from "../components/AuthGate";
import ServiceSettings from "../components/ServiceSettings";
import Documentation from "../components/Documentation";
import VaultProvider from "../components/VaultGate";

const flows = {
  gas: { label: "Web App GAS", icon: "G" },
  migration: { label: "Migrasi Next.js", icon: "N" },
  android: { label: "Android Native", icon: "A" },
  service_login: { label: "Login layanan", icon: "L" },
};
const fmt = (value) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
const pages = {
  "/": {
    key: "apps",
    title: "Aplikasi & web saya",
    eyebrow: "PROYEK",
    heading: "Semua aplikasi Anda.",
    description:
      "Pantau antrean, build, deployment, serta hasil proyek yang pernah dibuat.",
  },
  "/buat-aplikasi": {
    key: "create",
    title: "Buat aplikasi",
    eyebrow: "BUAT APLIKASI",
    heading: "Mulai proyek baru.",
    description:
      "Pilih jenis aplikasi dan biarkan CLI Anda menjalankan proses build.",
  },
  "/aplikasi-saya": {
    key: "apps",
    title: "Aplikasi & web saya",
    eyebrow: "PROYEK",
    heading: "Semua aplikasi Anda.",
    description:
      "Pantau antrean, build, deployment, serta hasil proyek yang pernah dibuat.",
  },
  "/docs": {
    key: "docs",
    title: "Docs",
    eyebrow: "PANDUAN",
    heading: "Cara kerja WebToNative.",
    description: "Ikuti panduan koneksi CLI dan alur pembuatan aplikasi.",
  },
  "/pengaturan": {
    key: "settings",
    title: "Pengaturan",
    eyebrow: "PENGATURAN",
    heading: "Pengaturan akun.",
    description: "Kelola password, koneksi layanan, dan akses perangkat Anda.",
  },
};

function Workspace({ supabase, session }) {
  const pathname = usePathname();
  const current = pages[pathname] || pages["/"];
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [agent, setAgent] = useState(null);
  const [connections, setConnections] = useState([]);
  const [theme, setTheme] = useState("light");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    flow: "gas",
    template: "auto",
    aiEnabled: true,
  });
  const auth = { Authorization: `Bearer ${session.access_token}` };
  const hasAiProvider = connections.some(
    (connection) => connection.provider === "ai",
  );
  useEffect(() => {
    // Opsi AI hanya boleh aktif bila API key terenkripsi telah disimpan.
    // JSX lama berada dalam satu baris besar; atribut disabled disetel di sini
    // agar perilakunya tetap eksplisit tanpa mengubah struktur halaman.
    const checkbox = document.querySelector(
      '.create-job .toggle input[type="checkbox"]',
    );
    if (checkbox) checkbox.disabled = !hasAiProvider;
    if (!hasAiProvider)
      setForm((current) =>
        current.aiEnabled ? { ...current, aiEnabled: false } : current,
      );
  }, [hasAiProvider, pathname]);
  useEffect(() => {
    const next =
      localStorage.getItem("webtonative-theme") === "dark" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }, []);
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("webtonative-theme", next);
    document.documentElement.classList.remove("preview-theme-changing");
    document.documentElement.dataset.theme = next;
    requestAnimationFrame(() =>
      document.documentElement.classList.add("preview-theme-changing"),
    );
    window.setTimeout(
      () => document.documentElement.classList.remove("preview-theme-changing"),
      5000,
    );
  }
  async function refresh() {
    setLoading(true);
    try {
      const [jobsResponse, connectionsResponse] = await Promise.all([
        fetch("/api/jobs", { cache: "no-store", headers: auth }),
        fetch("/api/connections", { cache: "no-store", headers: auth }),
      ]);
      const jobsPayload = await jobsResponse.json();
      const connectionsPayload = await connectionsResponse.json();
      setJobs(jobsPayload.jobs || []);
      setConnections(connectionsPayload.connections || []);
    } catch {
      setMessage("Dashboard belum dapat terhubung ke API job.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, [pathname]);
  useEffect(() => {
    let live = true;
    const check = async () => {
      try {
        const response = await fetch("/api/agents/status", {
          cache: "no-store",
          headers: auth,
        });
        const payload = await response.json();
        if (live) setAgent(payload.active || null);
      } catch {}
    };
    check();
    const timer = setInterval(check, 5000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, []);
  async function submit(event) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ ...form, sourcePath: ['migration', 'android'].includes(form.flow) ? form.name : '' }),
    });
    const payload = await response.json();
    if (!response.ok)
      return setMessage(payload.error || "Aplikasi gagal dibuat.");
    setJobs((current) => [payload.job, ...current]);
    setForm((current) => ({ ...current, name: "" }));
    setMessage("Aplikasi ditambahkan ke antrean CLI milik akun Anda.");
  }
  const counts = useMemo(
    () => ({
      total: jobs.length,
      queued: jobs.filter((job) => job.status === "queued").length,
      ready: jobs.filter(
        (job) => job.status === "ready" || job.status === "success",
      ).length,
    }),
    [jobs],
  );
  const completedBuilds = useMemo(
    () =>
      jobs.filter(
        (job) =>
          job.status === "success" &&
          (job.result?.webAppUrl || job.result?.editorUrl || job.result?.localPath || job.result?.apkPath),
      ),
    [jobs],
  );
  const requirements =
    {
      gas: [["google_apps_script", "Google Apps Script"]],
      migration: [
        ["google_apps_script", "Google Apps Script"],
        ["vercel", "Vercel"],
      ],
      android: [["vercel", "Vercel"]],
    }[form.flow] || [];
  const missingServices = requirements
    .filter(
      ([provider]) =>
        !connections.some((connection) => connection.provider === provider),
    )
    .map(([, label]) => label);
  const requiredServiceReady = missingServices.length === 0;
  const canCreate = Boolean(agent && requiredServiceReady);
  const requiresSourcePath = ['migration', 'android'].includes(form.flow);
  const sourceFieldLabel = requiresSourcePath ? 'Direktori proyek sumber' : 'Nama aplikasi';
  const sourceFieldPlaceholder = form.flow === 'migration'
    ? 'Contoh: D:\\gas-webapp-generator\\project\\kasir'
    : form.flow === 'android'
      ? 'Contoh: D:\\gas-webapp-generator\\webmigrasi\\kasir'
      : 'Contoh: Kasir Outlet Jakarta';
  const createBlocker = !agent
    ? "Hubungkan dan jalankan CLI lokal terlebih dahulu."
    : !requiredServiceReady
      ? `Hubungkan layanan ${missingServices.join(" dan ")} di Pengaturan terlebih dahulu.`
      : "";
  const nav = [
    ["/buat-aplikasi", "Buat aplikasi"],
    ["/aplikasi-saya", "Aplikasi & web saya"],
    ["/docs", "Docs"],
  ];
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">W</span>
          <div>
            <b>WebToNative</b>
            <small>Workspace</small>
          </div>
        </div>
        <nav aria-label="Navigasi utama">
          {nav.map(([href, label]) => (
            <Link
              key={href}
              className={pathname === href ? "active" : ""}
              href={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className={`connection ${agent ? "connected" : ""}`}>
          <span className="status-dot" />
          {agent ? `CLI ${agent.deviceName} aktif` : "CLI belum terhubung"}
          <Link href="/">{agent ? "Kelola perangkat" : "Hubungkan CLI"}</Link>
        </div>
        <div className="sidebar-actions">
          <button
            className="theme-icon-button"
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Mode gelap aktif" : "Mode terang aktif"
            }
          >
            {theme === "dark" ? "◐" : "☀"}
          </button>
          <div className="account-menu">
            <button
              className="gear-button"
              type="button"
              onClick={() => setAccountMenuOpen((value) => !value)}
              aria-label="Menu akun"
              aria-expanded={accountMenuOpen}
            >
              ⚙
            </button>
            {accountMenuOpen && (
              <div className="account-popover">
                <Link
                  href="/pengaturan"
                  onClick={() => setAccountMenuOpen(false)}
                >
                  Pengaturan
                </Link>
                <button type="button" onClick={() => supabase.auth.signOut()}>
                  Keluar akun
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
      <section className="workspace">
        <header>
          <div>
            <p className="eyebrow">{current.eyebrow}</p>
            <h1>{current.heading}</h1>
            <p>{current.description}</p>
          </div>
        </header>
        {current.key === "overview" && (
          <section className="metrics">
            <article>
              <small>Total aplikasi</small>
              <b>{counts.total}</b>
              <span>Semua proyek Anda</span>
            </article>
            <article>
              <small>Dalam antrean</small>
              <b>{counts.queued}</b>
              <span>Menunggu CLI</span>
            </article>
            <article>
              <small>Siap diuji</small>
              <b>{counts.ready}</b>
              <span>Output tersedia</span>
            </article>
          </section>
        )}
        {current.key === "create" && (
          <>
          <div className="create-layout">
            <form className="panel create-job page-form" onSubmit={submit}>
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">KONFIGURASI</p>
                  <h2>Detail aplikasi</h2>
                </div>
                <span className="chip">Build lokal</span>
              </div>
              <label>
                {sourceFieldLabel}
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder={sourceFieldPlaceholder}
                  required
                />
                {requiresSourcePath && <small className="field-help">Tempel path folder proyek yang ingin diproses. CLI lokal akan membaca folder tersebut langsung.</small>}
              </label>
              <label>
                Jenis aplikasi
                <select
                  value={form.flow}
                  onChange={(event) =>
                    setForm({ ...form, flow: event.target.value })
                  }
                >
                  {Object.entries(flows).map(([key, flow]) => (
                    <option value={key} key={key}>
                      {flow.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Template
                <select
                  value={form.template}
                  onChange={(event) =>
                    setForm({ ...form, template: event.target.value })
                  }
                >
                  <option value="auto">Pilih otomatis</option>
                  <option value="retail">Retail & Kasir</option>
                  <option value="service">Layanan & Booking</option>
                  <option value="education">Pendidikan</option>
                </select>
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={form.aiEnabled}
                  onChange={(event) =>
                    setForm({ ...form, aiEnabled: event.target.checked })
                  }
                />
                <span>Gunakan AI untuk analisis kebutuhan</span>
              </label>
              {createBlocker && (
                <p className="create-requirement">
                  {createBlocker}{" "}
                  <Link href={agent ? "/pengaturan" : "/buat-aplikasi"}>
                    {agent ? "Buka Pengaturan" : "Hubungkan CLI"}
                  </Link>
                </p>
              )}
              <button
                className="primary"
                type="submit"
                disabled={!canCreate}
                title={createBlocker || "Buat aplikasi"}
              >
                Buat aplikasi <span>→</span>
              </button>
              {message && <p className="message">{message}</p>}
            </form>
            <section className="connect-section">
              <ConnectCli token={session.access_token} />
            </section>
          </div>
          <section className="panel build-history">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">RIWAYAT DEPLOYMENT</p>
                <h2>Proyek siap digunakan</h2>
              </div>
              <span className="chip">{completedBuilds.length} hasil</span>
            </div>
            {completedBuilds.length ? (
              <div className="build-history-list">
                {completedBuilds.map((job) => (
                  <article className="build-history-item" key={job.id}>
                    <div className="build-history-info">
                      <b>{job.name}</b>
                      <p>{flows[job.flow]?.label || "Proyek"} · selesai {fmt(job.finishedAt || job.createdAt)}</p>
                      {job.result?.sourcePath && <code title={job.result.sourcePath}>Sumber: {job.result.sourcePath}</code>}
                      {job.result?.localPath && <code title={job.result.localPath}>{job.result.localPath}</code>}
                      {job.result?.apkPath && <code title={job.result.apkPath}>APK: {job.result.apkPath}</code>}
                    </div>
                    <div className="build-history-links">
                      {job.result?.webAppUrl && <a href={job.result.webAppUrl} target="_blank" rel="noreferrer">Buka Web App <span>↗</span></a>}
                      {job.result?.editorUrl && <a className="outline" href={job.result.editorUrl} target="_blank" rel="noreferrer">Editor Apps Script <span>↗</span></a>}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="build-history-empty">Hasil deployment yang berhasil akan tampil di sini, lengkap dengan link Web App dan editor.</p>
            )}
          </section>
          </>
        )}
        {current.key === "apps" && (
          <section className="panel job-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">APLIKASI & WEB SAYA</p>
                <h2>Proyek terbaru</h2>
              </div>
              <span className="chip">
                {loading ? "Memuat…" : `${jobs.length} proyek`}
              </span>
            </div>
            <div className="job-list">
              {jobs.map((job) => (
                <article className="job" key={job.id}>
                  <span className={`job-icon ${job.flow}`}>
                    {flows[job.flow]?.icon || "•"}
                  </span>
                  <div>
                    <b>{job.name}</b>
                    <p>
                      {flows[job.flow]?.label} · {fmt(job.createdAt)}
                    </p>
                    <small>{job.note}</small>
                    {(job.result?.webAppUrl || job.result?.editorUrl) && <span className="job-result-links">{job.result?.webAppUrl && <a href={job.result.webAppUrl} target="_blank" rel="noreferrer">Web App ↗</a>}{job.result?.editorUrl && <a href={job.result.editorUrl} target="_blank" rel="noreferrer">Editor ↗</a>}</span>}
                  </div>
                  <span className={`job-status ${job.status}`}>
                    {job.status}
                  </span>
                </article>
              ))}
              {!loading && !jobs.length && (
                <div className="empty empty-actions">
                  <p>Belum ada aplikasi di workspace ini.</p>
                  <div>
                    <Link
                      className="primary compact-primary"
                      href="/buat-aplikasi"
                    >
                      Buat aplikasi pertama <span>→</span>
                    </Link>
                    <Link className="outline" href="/docs">
                      Lihat panduan CLI
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
        {current.key === "docs" && <Documentation />}
        {false && (
          <section className="docs-page">
            <section className="docs-intro panel">
              <div>
                <p className="eyebrow">DOKUMENTASI</p>
                <h2>Panduan lengkap WebToNative</h2>
                <p>
                  Referensi praktis untuk menyiapkan CLI lokal, membuat
                  aplikasi, memantau proses, dan menangani kendala umum.
                </p>
              </div>
              <dl>
                <div>
                  <dt>Versi</dt>
                  <dd>0.2</dd>
                </div>
                <div>
                  <dt>Diperbarui</dt>
                  <dd>29 Juli 2026</dd>
                </div>
              </dl>
            </section>
            <nav className="docs-toc" aria-label="Daftar isi">
              <a href="#mulai">Mulai</a>
              <a href="#langkah">Langkah kerja</a>
              <a href="#contoh">Contoh</a>
              <a href="#masalah">Troubleshooting</a>
              <a href="#faq">FAQ</a>
            </nav>
            <section className="docs-section" id="mulai">
              <p className="eyebrow">PENDAHULUAN</p>
              <h2>Yang perlu Anda siapkan</h2>
              <div className="docs-grid docs-grid-three">
                <article>
                  <h3>Tujuan panduan</h3>
                  <p>
                    Setelah membaca panduan ini, Anda dapat mengirim job dari
                    workspace dan membiarkan komputer sendiri menjalankan build
                    secara lokal.
                  </p>
                </article>
                <article>
                  <h3>Untuk siapa</h3>
                  <p>
                    Cocok untuk pemilik proyek, admin operasional, dan teknisi
                    yang mengelola Web App GAS, Next.js, atau Android native.
                  </p>
                </article>
                <article>
                  <h3>Prasyarat</h3>
                  <ul>
                    <li>Akun WebToNative aktif.</li>
                    <li>Node.js dan folder CLI WebToNative.</li>
                    <li>
                      Akses layanan yang diperlukan, seperti Google Apps Script,
                      Vercel, atau Android SDK sesuai alur.
                    </li>
                  </ul>
                </article>
              </div>
            </section>
            <section className="docs-section" id="langkah">
              <p className="eyebrow">LANGKAH KERJA</p>
              <h2>Dari job sampai hasil</h2>
              <ol className="docs-steps">
                <li>
                  <b>01</b>
                  <div>
                    <h3>Hubungkan komputer</h3>
                    <p>
                      Masuk ke <strong>Buat aplikasi</strong>, buat kode
                      pairing, lalu salin perintah yang diberikan ke terminal
                      pada folder tools Anda.
                    </p>
                  </div>
                </li>
                <li>
                  <b>02</b>
                  <div>
                    <h3>Buat aplikasi</h3>
                    <p>
                      Tentukan nama, alur aplikasi, template, serta opsi
                      analisis AI. Job hanya terlihat pada akun yang membuatnya.
                    </p>
                  </div>
                </li>
                <li>
                  <b>03</b>
                  <div>
                    <h3>CLI menjalankan build</h3>
                    <p>
                      Agent lokal mengambil job dan memakai toolchain yang
                      tersedia di komputer, misalnya clasp, Next.js, atau
                      Gradle.
                    </p>
                  </div>
                </li>
                <li>
                  <b>04</b>
                  <div>
                    <h3>Pantau dan uji hasil</h3>
                    <p>
                      Buka <strong>Aplikasi &amp; web saya</strong> untuk
                      melihat status, URL deployment, catatan proses, atau
                      lokasi output.
                    </p>
                  </div>
                </li>
              </ol>
              <div className="docs-flow" aria-label="Alur kerja">
                <span>Workspace</span>
                <i>→</i>
                <span>CLI lokal</span>
                <i>→</i>
                <span>Build</span>
                <i>→</i>
                <span>Hasil</span>
              </div>
            </section>
            <section className="docs-section" id="contoh">
              <p className="eyebrow">CONTOH KASUS</p>
              <h2>Membuat Web App GAS</h2>
              <div className="docs-callout">
                <b>Kasus: kasir sederhana</b>
                <p>
                  Pilih <strong>Web App GAS</strong>, isi nama “Kasir Outlet”,
                  pilih template Retail &amp; Kasir, lalu buat aplikasi. Setelah
                  CLI selesai, halaman proyek akan menampilkan tautan Web App
                  dan editor Apps Script. Gunakan akun Admin awal yang
                  ditampilkan di log, lalu segera ganti passwordnya.
                </p>
              </div>
            </section>
            <section className="docs-section" id="masalah">
              <p className="eyebrow">TROUBLESHOOTING</p>
              <h2>Kendala yang sering terjadi</h2>
              <div className="docs-grid">
                <article>
                  <h3>CLI belum terhubung</h3>
                  <p>
                    Buat kode pairing baru dari Buat aplikasi, pastikan URL
                    dashboard benar, lalu jalankan perintah pairing dari folder
                    tools yang sama.
                  </p>
                </article>
                <article>
                  <h3>Job tetap menunggu</h3>
                  <p>
                    Pastikan agent sedang berjalan dan komputer tidak tidur.
                    Agent dapat menunggu job hingga 10 menit sebelum perlu
                    dijalankan kembali.
                  </p>
                </article>
                <article>
                  <h3>Build atau deploy gagal</h3>
                  <p>
                    Baca log yang dikirim ke proyek. Periksa login layanan
                    lokal, API key, Java/Android SDK, atau token Vercel sesuai
                    jenis job.
                  </p>
                </article>
                <article>
                  <h3>Credential ingin diganti</h3>
                  <p>
                    Buka Pengaturan, hapus koneksi lama, lalu simpan koneksi
                    baru. Nilai rahasia tidak ditampilkan kembali setelah
                    disimpan.
                  </p>
                </article>
              </div>
            </section>
            <section className="docs-section" id="faq">
              <p className="eyebrow">FAQ &amp; BANTUAN</p>
              <h2>Pertanyaan umum</h2>
              <div className="docs-faq">
                <details>
                  <summary>Apakah browser menjalankan build?</summary>
                  <p>
                    Tidak. Browser hanya mengatur job. Build berjalan pada CLI
                    lokal agar tool dan credential tetap berada di komputer
                    Anda.
                  </p>
                </details>
                <details>
                  <summary>
                    Apakah satu akun dapat memakai beberapa komputer?
                  </summary>
                  <p>
                    Bisa. Pairing setiap komputer secara terpisah. Anda dapat
                    meninjau atau memutus koneksi melalui Pengaturan.
                  </p>
                </details>
                <details>
                  <summary>Di mana saya melihat hasil deployment?</summary>
                  <p>
                    Setelah job selesai, buka Aplikasi &amp; web saya. Tautan
                    hasil dan catatan proses akan muncul pada proyek terkait
                    bila tersedia.
                  </p>
                </details>
              </div>
              <p className="docs-support">
                Masih membutuhkan bantuan? Hubungi administrator workspace atau
                kirim ringkasan log ke{" "}
                <a href="mailto:support@webtonative.app">
                  support@webtonative.app
                </a>
                . Jangan mengirim API key, token, atau password melalui pesan
                bantuan.
              </p>
            </section>
          </section>
        )}
        {current.key === "settings" && (
          <ServiceSettings supabase={supabase} session={session} />
        )}
      </section>
    </main>
  );
}
export default function Home() {
  return (
    <AuthGate>
      {(props) => (
        <VaultProvider session={props.session}>
          <Workspace {...props} />
        </VaultProvider>
      )}
    </AuthGate>
  );
}
