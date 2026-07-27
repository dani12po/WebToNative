# GAS Web App Generator

CLI Node.js untuk membuat dan deploy Google Apps Script (GAS) Web App modular, memigrasikan hasilnya ke Next.js, serta menghasilkan aplikasi Android native berbasis Jetpack Compose.

## Teknologi & dokumentasi resmi

Gunakan dokumentasi resmi berikut saat menyiapkan lingkungan, mengembangkan hasil generator, atau melakukan deployment produksi:

| Teknologi | Digunakan untuk | Dokumentasi resmi |
| --- | --- | --- |
| Node.js | Menjalankan CLI generator | [nodejs.org/docs](https://nodejs.org/en/docs) |
| Google Apps Script | Web App, API server, dan otomasi Google Workspace | [Google Apps Script](https://developers.google.com/apps-script) |
| `clasp` | Membuat, push, dan deploy proyek GAS dari terminal | [Panduan clasp Google](https://developers.google.com/apps-script/guides/clasp) |
| Google Sheets | Database awal Web App GAS | [Spreadsheet service](https://developers.google.com/apps-script/guides/sheets) |
| Next.js | Hasil migrasi web modern | [Next.js Docs](https://nextjs.org/docs) |
| Vercel | Deployment hasil migrasi Next.js | [Vercel Documentation](https://vercel.com/docs) |
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
- Pengaturan harga, pembayaran, metode pembayaran, laporan, dan modul bisnis sesuai preset.
- Database Google Sheets yang dibuat otomatis ketika GAS Web App pertama kali digunakan.
- Tema AI opsional untuk memilih palet, font, landing page/login, dashboard, dan blueprint modul bisnis yang tervalidasi.
- Migrasi GAS ke Next.js dengan landing page SaaS, SEO, API route, skema database, pemeriksaan build, dan QA AI.
- Generator Android native Jetpack Compose dengan login, registrasi, database lokal, modul bisnis dinamis, debug APK, serta instalasi ke perangkat Android.

## Prasyarat

1. Node.js 18 atau lebih baru.
2. Akun Google dengan akses Google Drive dan Apps Script.
3. Google Apps Script API aktif di [Apps Script settings](https://script.google.com/home/usersettings).
4. `clasp` terpasang global:

   ```bash
   npm install -g @google/clasp
   ```

Untuk build APK, sediakan JDK 17+ (JBR bawaan Android Studio juga didukung). Saat menu **Mobile App** dijalankan, generator mendeteksi Android SDK terlebih dahulu. Jika belum ada, generator otomatis mengunduh Android Command-line Tools resmi lalu memasang Platform Tools, Android API 35, dan Build Tools 35.0.0. Android Studio hanya opsional untuk emulator atau debugging visual.

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
4. Untuk build APK, Java tetap diperlukan. Tools mencoba `JAVA_HOME`, JBR Android Studio, lalu lokasi Android Studio standar. Instal JDK 17+ hanya jika ketiganya tidak tersedia.

Proses ini memerlukan koneksi internet dan izin menulis ke folder profil Windows pengguna; hak Administrator tidak diperlukan. Bila tools diperbarui dari GitHub, pastikan pengguna mengambil versi terbaru sebelum mencoba lagi:

```powershell
git pull origin main
npm install
npm start
```

Jika instalasi SDK terhenti karena koneksi/proxy kantor, jalankan kembali menu **Mobile App** setelah koneksi tersedia. Bila JDK tidak ditemukan, instal JDK 17+ atau Android Studio lalu jalankan ulang. Pesan `sdkmanager.bat is not recognized` pada versi lama ditangani oleh generator versi terbaru melalui `cmd.exe`; lakukan `git pull origin main` terlebih dahulu.

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

- Jangan commit atau bagikan `api.txt`, `authsesion.json`, atau kredensial `clasp`.
- Ganti password Admin awal sebelum aplikasi digunakan.
- Uji dengan data non-produksi terlebih dahulu dan cadangkan Google Sheet secara berkala.
- Untuk data sensitif, transaksi nyata, atau kebutuhan kepatuhan khusus, lakukan audit keamanan dan pengembangan tambahan sebelum dipakai produksi.

## Lisensi

Periksa lisensi repository atau hubungi pemilik repository untuk penggunaan komersial dan distribusi.
