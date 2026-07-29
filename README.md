# GAS Web App Generator

CLI Node.js untuk membuat dan deploy Google Apps Script (GAS) Web App modular, memigrasikan hasilnya ke Next.js, serta menghasilkan aplikasi Android native berbasis Jetpack Compose.

## Daftar isi

- [Teknologi & dokumentasi resmi](#teknologi--dokumentasi-resmi)
- [Kemampuan utama](#kemampuan-utama)
- [Prasyarat dan instalasi](#prasyarat)
- [Dashboard web WebToNative](#dashboard-web-webtonative)
- [Brankas perangkat E2EE](#brankas-perangkat-e2ee)
- [Mode tools](#mode-tools)
- [Membuat Web App GAS](#membuat-web-app-gas)
- [Migrasi ke Next.js](#migrasi-ke-nextjs)
- [Mobile App Android](#mobile-app-android-native-dan-apk)
- [Keamanan dan penggunaan produksi](#keamanan-dan-penggunaan-produksi)

## Teknologi & dokumentasi resmi

Gunakan dokumentasi resmi berikut saat menyiapkan lingkungan, mengembangkan hasil generator, atau melakukan deployment produksi:

| Teknologi | Digunakan untuk | Dokumentasi resmi |
| --- | --- | --- |
| Node.js | Menjalankan CLI generator | [nodejs.org/docs](https://nodejs.org/en/docs) |
| Eclipse Temurin JDK 17 | Java portable otomatis untuk build APK | [Adoptium installation](https://adoptium.net/installation/) |
| Google Apps Script | Web App, API server, dan otomasi Google Workspace | [Google Apps Script](https://developers.google.com/apps-script) |
| `clasp` | Membuat, push, dan deploy proyek GAS dari terminal | [Panduan clasp Google](https://developers.google.com/apps-script/guides/clasp) |
| Google Sheets | Database awal Web App GAS | [Spreadsheet service](https://developers.google.com/apps-script/guides/sheets) |
| Next.js | Hasil migrasi web modern | [Next.js Docs](https://nextjs.org/docs) |
| Vercel | Deployment hasil migrasi Next.js | [Vercel Documentation](https://vercel.com/docs) |
| Supabase | Akun dashboard, antrean job, dan metadata koneksi | [Supabase Docs](https://supabase.com/docs) |
| Midtrans Snap | Checkout pembayaran pada hasil migrasi Next.js | [Midtrans Snap Docs](https://docs.midtrans.com/docs/snap-overview) |
| Telegram Bot API | Notifikasi transaksi Telegram | [Telegram Bot API](https://core.telegram.org/bots/api) |
| Fonnte | Notifikasi WhatsApp opsional | [Fonnte API Docs](https://docs.fonnte.com/) |
| Android Jetpack Compose | UI aplikasi Android native | [Android Compose](https://developer.android.com/compose) |
| Gradle | Build debug APK Android otomatis | [Gradle User Manual](https://docs.gradle.org/current/userguide/userguide.html) |
| Android Debug Bridge | Instalasi dan preview APK di perangkat/emulator | [ADB documentation](https://developer.android.com/tools/adb) |
| Android Command-line Tools | Instalasi SDK dan komponen build otomatis | [Android SDK Command-line Tools](https://developer.android.com/studio#command-tools) |

### Provider AI opsional

Mode AI membaca konfigurasi lokal dari `api.txt`. Pilih salah satu provider yang didukung dan gunakan dokumentasi resminya untuk membuat API key serta memilih model:

- [OpenAI API documentation](https://developers.openai.com/api/docs)
- [Groq documentation](https://console.groq.com/docs/overview)
- [NVIDIA NIM documentation](https://docs.nvidia.com/nim/)
- [OpenRouter documentation](https://openrouter.ai/docs/quickstart)

> API key bersifat rahasia. Simpan hanya pada `api.txt` lokal dan jangan commit file tersebut ke GitHub.

## Kemampuan utama

- 54+ preset aplikasi, termasuk kasir, toko fashion, laundry, bengkel, booking, sekolah, BIMBA, klinik, inventaris, keuangan, HR, dan restoran.
- Login, registrasi, logout, role Admin/User, pengaturan akun, dan manajemen pengguna.
- Dashboard responsif untuk desktop, tablet, dan ponsel dengan tema terang/gelap serta layout bervariasi.
- **Dukungan PWA:** hasil migrasi **Next.js** otomatis menyertakan PWA penuh: `manifest.webmanifest`, icon, service worker, cache shell, registrasi otomatis, dan panduan instalasi setelah deploy HTTPS. Pada hasil GAS, tombol **Add to Home Screen** hanya muncul jika browser benar-benar memicu event instalasi native; jika tidak didukung, tombol tidak ditampilkan. PWA offline asli tetap memakai hasil migrasi Next.js karena Apps Script HtmlService tidak menyajikan service worker serta manifest statis secara penuh.
- Tema tambahan **Learning Marketplace** untuk kursus, sekolah, BIMBA, komunitas, katalog, dan membership: navigasi topbar, kartu konten, hero premium, serta grid responsif. Tema lama tetap tersedia.
- Tema tambahan **Service Trust** untuk klinik, salon, bengkel, properti, konsultasi, dan layanan profesional: topbar bersih, hero biru/teal, kartu layanan, CTA kontak, dan tata letak responsif. Tema lama tetap tersedia.
- Tema tambahan **Industrial Signal** untuk bengkel, cuci kendaraan, parkir, gudang, logistik, dan operasional teknis: topbar charcoal, aksen kuning sinyal, status kerja yang tegas, dan layout responsif. Tema lama tetap tersedia.
- Tema tambahan **Culinary Heritage** untuk restoran, kafe, hotel, katering, dan event: palet cokelat-krem-oranye, kartu menu atau layanan, dan landing hospitality yang responsif. Tema lama tetap tersedia.
- Pengaturan harga, pembayaran, metode pembayaran, laporan, dan modul bisnis sesuai preset.
- Database Google Sheets yang dibuat otomatis ketika GAS Web App pertama kali digunakan.
- Tema AI opsional untuk memilih palet, font, landing page/login, dashboard, dan blueprint modul bisnis yang tervalidasi.
- Migrasi GAS ke Next.js dengan landing page SaaS, SEO, API route, skema database, pemeriksaan build, dan QA AI.
- Hasil migrasi Next.js menyertakan Midtrans Snap, webhook SHA-512 idempoten, tabel transaksi pembayaran, serta tombol bayar untuk record yang memiliki nominal.
- Notifikasi transaksi hasil migrasi mendukung Telegram atau WhatsApp/Fonnte, dengan fallback environment dan pengaturan admin yang menyimpan token terenkripsi.
- Generator Android native Jetpack Compose dengan login, registrasi, database lokal, modul bisnis dinamis, debug APK, serta instalasi ke perangkat Android.
- Dashboard WebToNative untuk membuat job dari browser, memasangkan agent lokal, dan memantau log, lokasi output, URL Web App, URL editor GAS, serta URL deployment Next.js.
- Brankas perangkat E2EE untuk API key AI dan konfigurasi proyek non-OAuth lintas komputer, dengan Master Password, Recovery Key, AES-GCM 256-bit, dan PBKDF2 di browser/CLI.

## Prasyarat

1. Node.js 18 atau lebih baru.
2. Akun Google dengan akses Google Drive dan Apps Script.
3. Google Apps Script API aktif di [Apps Script settings](https://script.google.com/home/usersettings).
4. `clasp` terpasang global:

   ```bash
   npm install -g @google/clasp
   ```

Saat menu **Mobile App** dijalankan, generator mendeteksi Java dan Android SDK terlebih dahulu. Jika Java belum ada, generator otomatis mengunduh Eclipse Temurin JDK 17 portable ke profil pengguna. Jika Android SDK belum ada, generator otomatis mengunduh Android Command-line Tools resmi lalu memasang Platform Tools, Android API 35, dan Build Tools 35.0.0. Android Studio hanya opsional untuk emulator atau debugging visual.

## Instalasi

```bash
git clone https://github.com/hydracore-digitech/web-app-generator-GAS.git
cd web-app-generator-GAS
npm install
npm start
```

Setelah instalasi, gunakan `npm start` untuk membuka menu CLI. Untuk menjalankan dashboard browser, ikuti bagian [Dashboard web WebToNative](#dashboard-web-webtonative) di bawah.

## Dashboard web WebToNative

Selain CLI, repository ini menyediakan dashboard Next.js di folder `dashboard/`. Dashboard digunakan untuk membuat job dari browser, mengelola koneksi layanan, dan memantau hasil pekerjaan yang dijalankan oleh CLI lokal. Browser tidak menjalankan `clasp`, Next.js build, Gradle, atau deployment secara langsung.

### Menjalankan dashboard secara lokal

Ringkasnya: **buat proyek Supabase → jalankan schema SQL → isi `.env.local` → jalankan dashboard → pairing CLI**.

1. Siapkan proyek [Supabase](https://supabase.com/) dan aktifkan **Email/Password** pada Authentication.
2. Jalankan SQL dari [`dashboard/supabase/schema.sql`](dashboard/supabase/schema.sql) pada SQL Editor Supabase.
3. Salin konfigurasi contoh:

   ```powershell
   Copy-Item dashboard\.env.example dashboard\.env.local
   ```

4. Isi `dashboard/.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, dan `WEBTONATIVE_SECRETS_KEY`.
5. Jalankan dashboard:

   ```bash
   cd dashboard
   npm install
   npm run dev
   ```

6. Buka [http://localhost:3001](http://localhost:3001), buat akun atau masuk, lalu gunakan menu **Hubungkan CLI** untuk memperoleh kode pairing.

> `SUPABASE_SERVICE_ROLE_KEY` dan `WEBTONATIVE_SECRETS_KEY` adalah rahasia server. Jangan gunakan prefix `NEXT_PUBLIC_`, jangan commit `.env.local`, dan jangan memasukkannya ke log.

### Menghubungkan dashboard ke CLI

Dashboard mengatur job, sedangkan komputer pengguna tetap menjalankan build dan deployment.

1. Buat kode pairing pada menu **Buat aplikasi** di dashboard.
2. Jika belum memiliki agent, klik kolom perintah pairing. Dashboard menyediakan satu perintah PowerShell yang mengunduh agent, memverifikasi checksum SHA-256, lalu memasangkannya di folder pilihan.

   ```powershell
   .\WebToNative-Agent.cmd
   ```

3. Agent menyimpan sesi perangkat pada `webtonative-agent.json` lokal dan otomatis menunggu job dari akun yang sama selama maksimal 10 menit. Setelah itu, jalankan ulang `WebToNative-Agent.cmd` saat siap menerima job lagi.
4. Untuk komputer baru, lakukan pairing dan login resmi layanan sekali. Setelah sinkronisasi vault berhasil, konfigurasi non-OAuth yang terenkripsi dapat dibuka lokal memakai Master Password.

Setiap job dibatasi pada akun pemiliknya. Status proses, tautan deployment, atau pesan error dikirim kembali ke dashboard setelah pekerjaan selesai.

> Pengguna tidak perlu clone repository core atau memasang `package.json`. Binary agent membawa runtime yang diperlukan dan tidak menyalin folder source generator ke komputer pengguna.

### Layanan yang harus dihubungkan

Sebelum membuat job, dashboard memeriksa layanan yang diperlukan:

- **Web App GAS** membutuhkan Google Apps Script yang sudah aktif dan login `clasp` pada perangkat agent.
- **Migrasi Next.js** membutuhkan sumber proyek GAS yang valid. Deployment Vercel memerlukan login Vercel lokal pada perangkat agent.
- **Android native** membutuhkan path hasil migrasi Next.js. Java dan Android SDK dapat dideteksi atau dipasang otomatis oleh agent.
- **Analisis AI** hanya dapat dipilih setelah API key AI tersedia pada brankas perangkat yang telah dibuka.

Tombol login Google Apps Script dan Vercel di menu **Pengaturan** mengirim job ke agent. Browser otorisasi resmi dibuka di komputer agent; dashboard tidak menerima password akun maupun token OAuth mentah.

### Membangun dan mendistribusikan WebToNative Agent (administrator)

Repository core bersifat private. Administrator membangun binary Windows dari repository ini:

```bash
npm install
npm run build:agent
```

Hasilnya berada pada `dist/agent/WebToNative-Agent-win-x64.exe`. Workflow GitHub Actions **Build WebToNative Agent** juga dapat dijalankan manual dan menghasilkan artifact Windows. Unggah artifact tersebut ke storage publik/CDN yang terpisah dari repository core, lalu isi `NEXT_PUBLIC_WEBTONATIVE_AGENT_URL` dan `NEXT_PUBLIC_WEBTONATIVE_AGENT_SHA256` pada environment dashboard. Dashboard memakai SHA-256 untuk memverifikasi binary sebelum menjalankannya otomatis dari PowerShell.

### Deploy dashboard ke Vercel

Deploy dashboard sebagai proyek Next.js terpisah dengan **Root Directory** `dashboard`. Masukkan environment variable yang sama seperti `.env.local`, termasuk `NEXT_PUBLIC_WEBTONATIVE_AGENT_URL`, lalu jalankan migrasi SQL Supabase terlebih dahulu. Setelah deployment, gunakan URL deployment pada pairing CLI, misalnya `--url https://dashboard-anda.vercel.app`.

Koneksi Google Apps Script dan Vercel dicatat sebagai status perangkat, bukan token OAuth yang dipindahkan antar-komputer. Pengguna dapat menghapus koneksi atau mengunduh backup terenkripsi konfigurasi yang tersedia. Pada Pengaturan akun, username bersifat permanen, sedangkan email login dapat diperbarui melalui konfirmasi Supabase dan password dapat diganti kapan saja. Setelah memperbarui dashboard, jalankan migrasi SQL pada [`dashboard/supabase/migrations`](dashboard/supabase/migrations) dan [`dashboard/supabase/vault-schema.sql`](dashboard/supabase/vault-schema.sql).

> Dashboard membutuhkan Supabase agar akun, job, pairing CLI, dan koneksi layanan tersimpan. CLI tetap harus dijalankan pada komputer pengguna karena proses build bergantung pada tool dan environment lokal.

## Brankas perangkat E2EE

Brankas perangkat menyinkronkan **API key AI dan konfigurasi proyek non-OAuth** lintas komputer tanpa mengirim nilai mentah ke server. Ini bukan pengganti login OAuth Google atau Vercel: setiap komputer tetap harus melakukan otorisasi resmi vendor sendiri.

1. Saat setup, pengguna membuat Master Password minimal 8 karakter yang memuat huruf besar, angka, dan simbol.
2. Browser membuat Recovery Key, lalu pengguna wajib menyalin atau mengunduhnya. Server hanya menyimpan hash Recovery Key.
3. Browser mengenkripsi payload dengan Web Crypto API: AES-GCM 256-bit. Kunci dibuat lokal dari Master Password dengan PBKDF2 dan salt unik.
4. Dashboard/Supabase hanya menyimpan ciphertext, salt, IV, dan metadata akses. Nilai asli tidak ditampilkan kembali oleh server.
5. Di perangkat baru, pengguna login ke dashboard, memasukkan Master Password sekali untuk membuka vault lokal, kemudian agent dapat menyinkronkan konfigurasi terenkripsi yang dibutuhkan.

Jika Master Password hilang, Recovery Key hanya dapat memvalidasi permintaan reset. Data lama tidak dapat didekripsi ulang tanpa Master Password lama; pengguna harus menghapus vault lama dan membuat vault baru. Simpan Recovery Key secara offline di tempat aman.

## Mode tools

Menu utama menyediakan empat alur:

1. **WebApp New** — membuat dan deploy GAS Web App baru.
2. **Migrasi Project** — mengubah proyek dari `project/` menjadi aplikasi Next.js di `webmigrasi/`.
3. **Mobile App** — membuat aplikasi Android native Jetpack Compose dan debug APK dari hasil migrasi Next.js.
4. **Cek Aplikasi** — memasang APK yang sudah dibuat ke HP Android atau emulator yang terdeteksi.

Setelah satu proses selesai, tekan Enter untuk kembali ke menu utama. Sesi `clasp` dipakai ulang sehingga login Google tidak diminta berulang selama sesi masih valid.

## Membuat Web App GAS

Pilih **WebApp New**, kemudian:

1. Masukkan nama proyek.
2. Pilih preset aplikasi.
3. Pilih penggunaan AI bila diperlukan.
4. Generator membuat `project/<nama-proyek>`, proyek Apps Script standalone, file sumber, menjalankan `clasp push`, dan deployment Web App.
5. Salin URL Web App yang ditampilkan di terminal.

Generator menampilkan profil aplikasi sebelum proyek dibuat. Periksa profil ini untuk memastikan modul sesuai kebutuhan bisnis.

### Akun Admin awal

Pada penggunaan pertama, database dan akun awal dibuat otomatis:

| Field | Nilai |
| --- | --- |
| Username | `Admin` |
| Password | `Admin123` |
| Role | `admin` |

Segera ubah password melalui menu **Akun Saya**. Admin dapat mengelola pengguna dan peran melalui panel manajemen pengguna.

## Konfigurasi AI opsional

Buat file `api.txt` di root generator. File ini lokal dan diabaikan Git.

```text
provider=nvidia
api_key=ISI_API_KEY_ANDA
model=poolside/laguna-xs-2.1
```

Provider yang didukung: `openai`, `groq`, `nvidia`, `openrouter`, dan `custom` untuk endpoint HTTPS yang kompatibel dengan Chat Completions.

Contoh provider custom:

```text
provider=custom
endpoint=https://contoh.com/v1/chat/completions
api_key=ISI_API_KEY_ANDA
model=nama-model
```

AI hanya menghasilkan pilihan konfigurasi dan blueprint tervalidasi. AI tidak memasukkan HTML atau JavaScript bebas ke aplikasi GAS yang dihasilkan.

## Pembayaran dan QRIS

Preset dapat menyertakan Pengaturan Harga, Pembayaran, Metode Pembayaran, laporan, serta pencatatan rekening/e-wallet. Admin dapat memasang URL gambar QRIS merchant resmi.

Generator ini tidak mengubah nomor rekening/e-wallet menjadi QRIS interoperable dan tidak mengonfirmasi pembayaran otomatis. Untuk QRIS dinamis atau verifikasi mutasi produksi, gunakan penyedia pembayaran resmi dan kredensial merchant yang sah.

## Migrasi ke Next.js

Pilih **Migrasi Project**, lalu pilih salah satu proyek dari `project/`. Hasilnya dibuat pada `webmigrasi/<nama-proyek>/`.

```bash
cd webmigrasi/<nama-proyek>
npm install
npm run dev
```

Jika `api.txt` tersedia, AI Migration Preflight menganalisis modul, UI, risiko, backend, SEO, dan checklist test. Ringkasannya disimpan sebagai `MIGRATION_AUDIT.md`. Tool menjalankan `npm install` dan `npm run build` otomatis. Jika build atau QA mendeteksi masalah yang dapat diperbaiki, AI membuat patch aman lalu build dijalankan ulang sebelum status selesai ditampilkan.

Output migrasi mencakup struktur API dan skema database. Untuk produksi multi-user, hubungkan database melalui `POSTGRES_URL` (misalnya Vercel Postgres) dan gunakan autentikasi server-side. Data Google Sheets dan akun GAS tidak dipindahkan otomatis.

Tool juga memilih template lokal dari `templates/migration-designs/`. Jika tidak ada template yang sesuai, AI membuat blueprint desain tervalidasi yang dapat digunakan kembali pada migrasi berikutnya.

### Pembayaran Midtrans dan notifikasi hasil migrasi

Setiap migrasi baru menyiapkan Midtrans Snap sebagai gateway default. Tidak ada server key, token notifikasi, atau kredensial merchant yang dimasukkan ke source code maupun bundle browser.

1. Hubungkan PostgreSQL/Vercel Postgres dan jalankan `db/schema.sql` dari folder hasil migrasi.
2. Salin `.env.example` menjadi `.env.local` untuk pengujian lokal, atau isi nilai yang sama di **Vercel Environment Variables** untuk deployment.
3. Isi `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, dan pilih `MIDTRANS_IS_PRODUCTION=false` untuk Sandbox terlebih dahulu.
4. Setelah deploy, daftarkan URL webhook `https://domain-anda/api/payment/webhook` di dashboard Midtrans.
5. Uji pembayaran Sandbox. Webhook hanya memproses payload dengan signature SHA-512 Midtrans yang valid dan pembaruan transaksi dibuat idempoten.

Untuk notifikasi, gunakan `NOTIFICATION_CHANNEL=telegram` atau `whatsapp`, lalu isi token dan target pada environment sebagai fallback. Admin dapat mengganti channel, token, dan target dari menu **Pengaturan Notifikasi** tanpa mengubah kode atau redeploy. Menu tersebut membutuhkan `ADMIN_SETTINGS_TOKEN`; token provider disimpan terenkripsi dengan `NOTIFICATION_ENCRYPTION_KEY` dan hanya ditampilkan dalam bentuk tersamarkan.

> `MIDTRANS_SERVER_KEY`, token Telegram/Fonnte, `NOTIFICATION_ENCRYPTION_KEY`, dan `ADMIN_SETTINGS_TOKEN` adalah rahasia. Jangan masukkan nilainya ke `NEXT_PUBLIC_*`, source code, atau repository.

## Mobile App: Android native dan APK

Pilih **Mobile App**, lalu pilih hasil migrasi dari `webmigrasi/`. Tool menganalisis modul hasil migrasi dan membuat aplikasi Android native Jetpack Compose pada `apkmigrasi/<nama-proyek>-native/`. Menu seperti transaksi, produk, siswa, absensi, iuran, pembayaran, dan laporan diteruskan menjadi menu aplikasi.

Generator membuat login, pendaftaran akun lokal, pemulihan password, dashboard, input data per modul, animasi transisi, serta penyimpanan SQLite lokal. Akun demo awal adalah `Admin / Admin123`.

Tool menjalankan Gradle Wrapper untuk membangun debug APK otomatis. APK hasilnya berada di:

```text
apkmigrasi/<nama-proyek>-native/<nama-proyek>-debug.apk
```

Setelah build, tool mendeteksi perangkat melalui `adb`. Jika HP dengan **USB debugging** atau emulator aktif tersedia, APK dapat dipasang dan dibuka otomatis. Menu **Cek Aplikasi** memasang APK yang sudah jadi tanpa membangun ulang.

Android Studio tidak diperlukan untuk build APK; gunakan hanya untuk emulator atau debugging visual.

### Setup Android Emulator satu kali

1. Buka Android Studio.
2. Pastikan **Android SDK Platform-Tools** dan **Android Emulator** terpasang melalui SDK Manager.
3. Buka **Tools > Device Manager > Create Device**.
4. Pilih perangkat, unduh/pilih System Image, kemudian selesaikan pembuatan AVD.

Setelah AVD tersedia dan sedang berjalan, gunakan menu **Cek Aplikasi** untuk memasang APK ke emulator.

Debug APK digunakan untuk testing internal. APK release, AAB Play Store, iOS archive, dan distribusi publik membutuhkan Android keystore atau Apple provisioning/signing milik pemilik aplikasi.

### Instalasi Android SDK otomatis di komputer lain

Menu **Mobile App** dirancang agar dapat dipakai pada akun Windows yang berbeda tanpa mengatur path SDK secara manual.

1. Tools mengecek `ANDROID_HOME`, `ANDROID_SDK_ROOT`, lokasi SDK Android Studio, lalu `%LOCALAPPDATA%\Android\Sdk` milik pengguna yang sedang login.
2. Jika SDK belum ditemukan, tools mengunduh **Android Command-line Tools untuk Windows** dari server resmi Google dan menyimpannya di folder SDK pengguna.
3. Tools menerima lisensi Android SDK dan memasang `platform-tools`, `platforms;android-35`, serta `build-tools;35.0.0` secara otomatis.
4. Untuk build APK, tools mencoba `JAVA_HOME`, JBR Android Studio, lalu lokasi Android Studio standar. Jika semuanya tidak tersedia, tools mengunduh Eclipse Temurin JDK 17 portable ke `%LOCALAPPDATA%\GAS-WebApp-Generator\jdk-17` dan hanya memakainya untuk proses generator.

Proses ini memerlukan koneksi internet dan izin menulis ke folder profil Windows pengguna; hak Administrator tidak diperlukan. Bila tools diperbarui dari GitHub, pastikan pengguna mengambil versi terbaru sebelum mencoba lagi:

```powershell
git pull origin main
npm install
npm start
```

Jika instalasi SDK atau JDK terhenti karena koneksi/proxy kantor, jalankan kembali menu **Mobile App** setelah koneksi tersedia. Bila bootstrap JDK tidak dapat diunduh, pengguna tetap dapat memasang JDK 17+ atau Android Studio secara manual lalu menjalankan ulang. Pesan `sdkmanager.bat is not recognized` pada versi lama ditangani oleh generator versi terbaru melalui `cmd.exe`; lakukan `git pull origin main` terlebih dahulu.

## Struktur proyek

```text
web-app-generator-GAS/
|-- index.js
|-- templates/
|   |-- aiTheme.js
|   |-- mobileApp.js
|   |-- nextJsMigration.js
|   `-- ...
|-- project/<nama-proyek>/       # output GAS
|-- webmigrasi/<nama-proyek>/    # output Next.js
`-- apkmigrasi/<nama>-native/    # output Android native dan APK
```

Folder `project/`, `webmigrasi/`, dan `apkmigrasi/` adalah output generator dan tidak di-commit.

## Keamanan dan penggunaan produksi

- Jangan commit atau bagikan `api.txt`, `authsesion.json`, `vercelsession.json`, `webtonative-agent.json`, atau kredensial `clasp`.
- Token sesi OAuth Google/Vercel tidak disalin melalui dashboard atau vault. Login vendor resmi dilakukan per perangkat.
- Master Password dan Recovery Key tidak dikirim sebagai teks asli ke server. Kehilangan keduanya berarti data vault yang lama tidak dapat dipulihkan.
- Endpoint vault membatasi payload, memvalidasi skema, menerapkan rate limit, dan mencatat metadata aktivitas perangkat. Terapkan RLS Supabase sebelum dashboard dipublikasikan.
- Ganti password Admin awal sebelum aplikasi digunakan.
- Untuk pembayaran nyata, gunakan Midtrans Sandbox lebih dulu, aktifkan webhook HTTPS, dan pastikan `db/schema.sql` telah dijalankan sebelum mengarahkan pelanggan ke checkout.
- Simpan semua payment key dan token notifikasi hanya sebagai environment variable deployment; jangan gunakan credential uji untuk transaksi produksi.
- Uji dengan data non-produksi terlebih dahulu dan cadangkan Google Sheet secara berkala.
- Untuk data sensitif, transaksi nyata, atau kebutuhan kepatuhan khusus, lakukan audit keamanan dan pengembangan tambahan sebelum dipakai produksi.

## Lisensi

Periksa lisensi repository atau hubungi pemilik repository untuk penggunaan komersial dan distribusi.
