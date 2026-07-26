# GAS Web App Generator

CLI Node.js untuk membuat, mengunggah, dan men-deploy Web App Google Apps Script (GAS) dengan dashboard SaaS modular. Setiap proyek memakai Google Sheets sebagai penyimpanan data dan dapat dikembangkan lebih lanjut dari Apps Script Editor.

## Yang dihasilkan

- 54+ preset aplikasi: kasir, toko fashion, laundry, bengkel, booking, sekolah, BIMBA, klinik, inventaris, keuangan, HR, restoran, dan lainnya.
- Login, registrasi, logout, role Admin/User, serta menu **Akun Saya**.
- Panel Admin untuk pengaturan harga, metode pembayaran, laporan, dan manajemen pengguna.
- Database Google Sheets yang dibuat otomatis saat aplikasi pertama digunakan.
- UI responsif untuk desktop, tablet, dan handphone.
- Layout dashboard dan halaman login yang bervariasi: topbar, split, reversed, sidebar, glass workspace, spotlight, editorial, showcase, dan minimal.
- Tema AI opsional untuk menghasilkan palet, font, komposisi login, serta gaya dashboard yang sesuai nama dan jenis aplikasi.
- AI App Preflight opsional untuk menilai apakah preset modul sudah cocok; bila belum, blueprint modul bisnis tervalidasi dibuat dan disimpan agar dapat dipakai ulang.
- Pembuatan proyek Apps Script, `clasp push`, dan deployment Web App dalam satu alur CLI.

## Prasyarat

1. Node.js 18 atau lebih baru.
2. Akun Google yang memiliki akses Google Drive dan Apps Script.
3. Google Apps Script API aktif di [Apps Script settings](https://script.google.com/home/usersettings).
4. `clasp` terpasang global:

   ```bash
   npm install -g @google/clasp
   ```

## Instalasi

```bash
git clone https://github.com/hydracore-digitech/web-app-generator-GAS.git
cd web-app-generator-GAS
npm install
```

## Membuat Web App

```bash
npm start
```

Kemudian:

1. Masukkan nama proyek.
2. Pilih preset aplikasi.
3. Pilih apakah tema AI akan digunakan.
4. Generator membuat folder `project/<nama-proyek>`, proyek Apps Script standalone, file sumber, push, dan deployment.
5. Salin URL Web App yang tampil di terminal.

Setelah deployment, tekan Enter untuk kembali ke menu utama. Sesi `clasp` dipakai ulang sehingga tidak perlu login Google setiap membuat proyek baru.

> Generator menampilkan `Profil aplikasi terpilih` sebelum proses dibuat. Periksa baris ini untuk memastikan preset yang dipilih sudah benar.

## Akun Admin awal

Pada penggunaan pertama, database dan akun awal dibuat otomatis:

| Field | Nilai |
| --- | --- |
| Username | `Admin` |
| Password | `Admin123` |
| Role | `admin` |

Segera masuk lalu ubah password melalui menu **Akun Saya**. Jika sheet pengguna belum memiliki akun `Admin`, generator juga memastikan akun awal tersebut dibuat saat proses login.

## Fitur akun dan akses

Semua pengguna dapat membuka **Akun Saya** untuk memperbarui nama dan password sendiri. Perubahan password meminta password saat ini.

Admin dapat membuka panel **Manajemen pengguna** dari halaman yang sama untuk melihat pengguna, memperbarui nama/role, dan mereset password. Aksi administratif meminta password Admin sebagai konfirmasi.

## Tema AI opsional

Buat file `api.txt` di root generator. File ini bersifat lokal dan sudah diabaikan Git.

```text
provider=nvidia
api_key=ISI_API_KEY_ANDA
model=poolside/laguna-xs-2.1
```

Provider yang didukung:

- `openai`
- `groq`
- `nvidia`
- `openrouter`
- `custom` untuk endpoint HTTPS yang kompatibel dengan Chat Completions

Konfigurasi `custom` memerlukan `endpoint` tambahan:

```text
provider=custom
endpoint=https://contoh.com/v1/chat/completions
api_key=ISI_API_KEY_ANDA
model=nama-model
```

Saat opsi AI dipilih, terminal mencatat provider, model, palet, font, layout, gaya dashboard, dan gaya login. Respons AI hanya boleh memilih komponen yang telah divalidasi generator; AI tidak pernah memasukkan HTML atau JavaScript bebas ke aplikasi hasil generate.

Saat membuat GAS Web App, AI App Preflight juga dapat menganalisis kebutuhan modul sebelum proyek dibuat. Preset lokal selalu diperiksa lebih dahulu; jika sudah sesuai, misalnya preset Laundry yang telah memiliki order, harga per kg, pelanggan, pembayaran, dan laporan, preset digunakan kembali. Jika belum cocok, AI menghasilkan blueprint modul terstruktur yang tervalidasi dan menyimpannya pada `templates/gas-app-blueprints/` untuk dipakai lagi atau di-commit ke Git. Blueprint tidak berisi kode bebas dan tidak membuat klaim integrasi pembayaran yang tidak tersedia.

## Pembayaran, tarif, dan QRIS

Preset memiliki modul **Pembayaran**, **Pengaturan Harga**, dan **Metode Pembayaran** sesuai kebutuhan. Admin dapat mencatat nominal, status pembayaran, rekening/e-wallet, instruksi transfer, dan URL gambar QRIS resmi merchant.

Generator ini tidak membuat QRIS interoperable dari nomor rekening atau e-wallet dan tidak melakukan konfirmasi pembayaran otomatis. Untuk QRIS dinamis, verifikasi mutasi otomatis, atau pembayaran produksi, gunakan penyedia pembayaran resmi serta kredensial merchant yang sah.

Contoh fitur khusus:

- **Laundry**: order, layanan & harga, pelanggan, pembayaran, serta laporan. Total dihitung di server dengan rumus `(berat × harga per kg) − diskon`.
- **Bengkel**: tiket servis, sparepart, teknisi, pelanggan, pembayaran, dan laporan bengkel.
- **Kasir/Retail**: transaksi, produk, stok, pembayaran, dan laporan.

## Sesi Google

Status sesi lokal disimpan dalam `authsesion.json`. File ini hanya menyimpan status konfirmasi API dan metadata sesi; token OAuth tetap dikelola oleh `clasp` dan tidak disalin ke file tersebut.

Selama `clasp` masih login, generator tidak akan meminta login OAuth atau aktivasi API berulang kali.

## Migrasi ke Next.js

Pilih **Migrasikan proyek GAS ke Next.js** dari menu utama untuk membaca `Code.gs` sebuah proyek di `project/` dan membuat scaffold Next.js pada `webmigrasi/<nama-proyek>/`.

Hasil migrasi memindahkan konfigurasi aplikasi, modul, formulir, dan dashboard ke React/Next.js serta siap dijalankan dengan:

```bash
cd webmigrasi/<nama-proyek>
npm install
npm run dev
```

Jika `api.txt` dikonfigurasi, **AI Migration Preflight** berjalan sebelum file dibuat untuk menganalisis modul, arah UI, risiko, rencana backend, checklist tes, serta metadata SEO. Ringkasannya tampil di terminal dan disimpan pada `MIGRATION_AUDIT.md` di output Next.js. Saat migrasi, tools menjalankan `npm install` dan `npm run build` otomatis terlebih dahulu agar error Next.js terlihat sebelum deployment; error yang dikenali dapat diperbaiki otomatis lalu dibangun ulang, sedangkan AI memberi analisis terminal untuk error lain. Mode tersebut juga menawarkan deploy otomatis melalui `npx vercel --prod`; pilih `No` untuk deploy manual di kemudian hari. Data Google Sheets dan akun GAS tidak disalin otomatis. Scaffold memakai penyimpanan browser sebagai baseline yang langsung dapat di-deploy, lalu perlu dihubungkan ke database dan autentikasi server-side untuk penggunaan multi-user/produksi.

Sebelum merakit UI, generator menilai template lokal dalam `templates/migration-designs/`. Jika ada kecocokan kuat, template itu digunakan ulang dan dipersonalisasi untuk copy landing, SEO, warna, serta layout. Jika belum ada template yang cocok, AI membuat **blueprint desain terstruktur** (bukan JavaScript/CSS bebas), generator memvalidasinya, lalu menyimpannya sebagai JSON di folder tersebut. Template yang tersimpan dapat direview dan di-commit ke Git untuk dipakai pada migrasi berikutnya.

## Struktur proyek

```text
web-app-generator-GAS/
├── index.js
├── package.json
├── templates/
│   ├── aiTheme.js
│   ├── appHtmlV2.js
│   ├── appHtmlV3.js
│   ├── codeGs.js
│   ├── databaseGs.js
│   ├── projectProfiles.js
│   └── visualThemes.js
└── project/
    └── <nama-proyek>/
        ├── .clasp.json
        ├── Code.gs
        ├── Database.gs
        ├── app.html
        └── appsscript.json
```

Folder `project/` dan `webmigrasi/` adalah output generator dan tidak di-commit. Untuk mengubah aplikasi yang sudah dibuat, gunakan Apps Script Editor atau buat ulang proyek baru melalui generator.

## Keamanan dan penggunaan produksi

- Jangan commit atau bagikan `api.txt`, `authsesion.json`, atau kredensial `clasp`.
- Ganti password Admin awal sebelum aplikasi digunakan.
- Uji dengan data non-produksi terlebih dahulu.
- Buat backup Google Sheet secara berkala.
- Untuk data sensitif, transaksi riil, atau kebutuhan kepatuhan khusus, lakukan audit keamanan dan pengembangan tambahan sebelum dipakai produksi.

## Lisensi

Periksa lisensi repository atau hubungi pemilik repository untuk penggunaan komersial dan distribusi.
