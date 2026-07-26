# GAS Web App Generator

CLI Node.js untuk membuat dan deploy Google Apps Script (GAS) Web App modular, memigrasikan hasilnya ke Next.js, serta membuat wrapper mobile Android/iOS dengan Capacitor.

## Kemampuan utama

- 54+ preset aplikasi, termasuk kasir, toko fashion, laundry, bengkel, booking, sekolah, BIMBA, klinik, inventaris, keuangan, HR, dan restoran.
- Login, registrasi, logout, role Admin/User, pengaturan akun, dan manajemen pengguna.
- Dashboard responsif untuk desktop, tablet, dan ponsel dengan tema terang/gelap serta layout bervariasi.
- Pengaturan harga, pembayaran, metode pembayaran, laporan, dan modul bisnis sesuai preset.
- Database Google Sheets yang dibuat otomatis ketika GAS Web App pertama kali digunakan.
- Tema AI opsional untuk memilih palet, font, landing page/login, dashboard, dan blueprint modul bisnis yang tervalidasi.
- Migrasi GAS ke Next.js dengan landing page SaaS, SEO, API route, skema database, pemeriksaan build, dan QA AI.
- Wrapper Capacitor untuk Android/iOS, debug APK, dan pengujian pada Android Emulator.

## Prasyarat

1. Node.js 18 atau lebih baru.
2. Akun Google dengan akses Google Drive dan Apps Script.
3. Google Apps Script API aktif di [Apps Script settings](https://script.google.com/home/usersettings).
4. `clasp` terpasang global:

   ```bash
   npm install -g @google/clasp
   ```

Untuk fitur Android, install Android Studio, Android SDK Platform-Tools, dan Android Emulator.

## Instalasi

```bash
git clone https://github.com/hydracore-digitech/web-app-generator-GAS.git
cd web-app-generator-GAS
npm install
npm start
```

## Mode tools

Menu utama menyediakan empat alur:

1. **WebApp New** — membuat dan deploy GAS Web App baru.
2. **Migrasi Project** — mengubah proyek dari `project/` menjadi aplikasi Next.js di `webmigrasi/`.
3. **Mobile App** — membuat wrapper Android/iOS dari web Next.js yang sudah dideploy HTTPS.
4. **Cek Aplikasi** — menjalankan hasil wrapper di Android Emulator.

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

## Mobile App: Android APK dan iOS wrapper

Pilih **Mobile App**, lalu pilih hasil migrasi dari `webmigrasi/`. Masukkan URL HTTPS web yang sudah dideploy (contoh: URL Vercel), application ID seperti `com.webapp.kasir`, dan platform yang akan disiapkan.

Untuk Android, tool membuat proyek Capacitor di `apkmigrasi/<nama-aplikasi>/`, memasang dependensi, menyinkronkan platform, lalu membuat debug APK tanpa keystore. APK yang siap dipasang berada di:

```text
apkmigrasi/<nama-aplikasi>/<nama-aplikasi>-debug.apk
```

Source native Android tersedia pada:

```text
apkmigrasi/<nama-aplikasi>/android/
```

Saat opsi testing emulator dipilih, proyek Android dibuka otomatis di Android Studio. Jika sudah ada Android Virtual Device (AVD), tool menjalankan dan memasang aplikasi ke emulator.

### Setup Android Emulator satu kali

1. Buka Android Studio.
2. Pastikan **Android SDK Platform-Tools** dan **Android Emulator** terpasang melalui SDK Manager.
3. Buka **Tools > Device Manager > Create Device**.
4. Pilih perangkat, unduh/pilih System Image, kemudian selesaikan pembuatan AVD.

Setelah AVD tersedia, gunakan menu **Cek Aplikasi** untuk menyalakan emulator dan menguji aplikasi. Jika SDK sudah mempunyai Command-line Tools dan System Image, tool menawarkan pembuatan AVD standar secara otomatis.

Debug APK digunakan untuk testing internal. APK release, AAB Play Store, iOS archive, dan distribusi publik membutuhkan Android keystore atau Apple provisioning/signing milik pemilik aplikasi.

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
`-- apkmigrasi/<nama-aplikasi>/  # output Capacitor Android/iOS
```

Folder `project/`, `webmigrasi/`, dan `apkmigrasi/` adalah output generator dan tidak di-commit.

## Keamanan dan penggunaan produksi

- Jangan commit atau bagikan `api.txt`, `authsesion.json`, atau kredensial `clasp`.
- Ganti password Admin awal sebelum aplikasi digunakan.
- Uji dengan data non-produksi terlebih dahulu dan cadangkan Google Sheet secara berkala.
- Untuk data sensitif, transaksi nyata, atau kebutuhan kepatuhan khusus, lakukan audit keamanan dan pengembangan tambahan sebelum dipakai produksi.

## Lisensi

Periksa lisensi repository atau hubungi pemilik repository untuk penggunaan komersial dan distribusi.
