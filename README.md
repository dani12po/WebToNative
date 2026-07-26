# GAS Web App Generator

CLI Node.js untuk membuat dan deploy Google Apps Script Web App dengan dashboard SaaS modular, Google Sheets sebagai database, serta tema visual responsif.

## Fitur utama

- 54 preset aplikasi, termasuk Kasir, Laundry, Bengkel, Booking, BIMBA, Analisis Keuangan, Inventaris, Sekolah, Klinik, Restoran, E-Commerce, HR, dan lainnya.
- Dashboard modular: data utama, aktivitas, laporan, pembayaran, dan pengaturan harga.
- Role awal Admin dan User; menu Admin hanya ditampilkan untuk Admin.
- 12 tema visual dengan kombinasi warna, font, serta lima variasi layout dashboard.
- Responsif untuk desktop, tablet, dan handphone.
- Login, registrasi, logout, tabel data, dan notifikasi aplikasi.
- Database Google Sheets dibuat otomatis saat aplikasi pertama digunakan.
- Pembuatan Apps Script, push source, dan deployment dilakukan dari CLI.

## Prasyarat

1. Node.js 18 atau lebih baru.
2. `clasp` terpasang secara global:

   ```bash
   npm install -g @google/clasp
   ```

3. Akun Google dengan akses Google Drive dan Apps Script.

## Instalasi

```bash
cd gas-webapp-generator
npm install
```

## Menjalankan generator

```bash
npm start
```

Pilih nama proyek dan template aplikasi. Generator akan membuat folder pada `project/<nama-proyek>`, membuat Apps Script standalone, mengirim source, lalu membuat deployment Web App.

Setelah proyek selesai, tekan Enter untuk kembali ke menu utama dan membuat proyek lain dalam sesi yang sama.

## Sesi Google dan API

Pada run pertama, generator akan memandu aktivasi Apps Script API dan login `clasp`.

Status lokal disimpan sebagai `authsesion.json` di direktori generator. File tersebut menyimpan konfirmasi API, email sesi, dan waktu pemeriksaan. Token OAuth tidak disalin ke file ini; token tetap dikelola `clasp`.

Selama sesi `clasp` masih aktif, run berikutnya tidak membuka OAuth atau meminta konfirmasi API lagi. File `authsesion.json` diabaikan Git agar tidak ikut dipublikasikan.

## Tema visual dengan AI (opsional)

Untuk meminta AI membuat warna, font, dan layout berdasarkan judul serta jenis aplikasi, salin `api.txt.example` menjadi `api.txt`, lalu isi konfigurasi berikut:

```text
provider=openai
api_key=ISI_API_KEY_ANDA
model=ISI_MODEL_ANDA
```

Provider yang didukung: `openai`, `groq`, `nvidia`, `openrouter`, atau `custom` dengan `endpoint` HTTPS kompatibel Chat Completions. File `api.txt` tidak pernah di-commit dan tidak disalin ke proyek hasil generate. Saat generator bertanya apakah tema AI akan digunakan, pilih `Yes` untuk memakai konfigurasi tersebut.

## Akun awal aplikasi

Saat database proyek baru pertama dibuat, akun berikut tersedia:

- Username: `Admin`
- Password: `Admin123`
- Role: `admin`

Segera ubah password awal sebelum aplikasi digunakan secara nyata.

## Pembayaran dan harga

Setiap preset mendapatkan modul Pembayaran dan Pengaturan Harga untuk Admin, kecuali bila preset sudah memiliki modul versi khusus.

Metode pembayaran yang dapat dicatat: Tunai, QRIS, Transfer, dan Kartu. QRIS pada generator adalah pencatatan metode dan status pembayaran. QR dinamis atau konfirmasi pembayaran otomatis memerlukan integrasi payment gateway resmi beserta kredensial pengguna, misalnya Midtrans atau Xendit.

Preset Laundry memiliki modul tambahan untuk Order, Layanan & Harga, Pelanggan, Pembayaran, dan Laporan. Total tagihan disimpan dengan perhitungan server:

```text
(berat × harga per kg) − diskon
```

Preset Bengkel memiliki Tiket Servis, Sparepart, Teknisi, Pelanggan, Pembayaran, dan Laporan Bengkel.

## Preset dan tampilan

Setiap proyek memilih tema visual secara otomatis. Tema dapat mengubah palet warna, font, halaman login, dan struktur dashboard seperti sidebar kiri, navigasi atas, sidebar kanan, glass workspace, atau layout compact.

Semua dashboard tetap mempertahankan form yang bisa digunakan, penyimpanan data Google Sheets, serta tabel responsif. Pada layar kecil, menu berubah menjadi navigasi horizontal dan tabel bisa digeser tanpa memecahkan layout.

## Struktur proyek

```text
gas-webapp-generator/
├── index.js
├── package.json
├── templates/
│   ├── appHtmlV2.js
│   ├── appHtmlV3.js
│   ├── codeGs.js
│   ├── databaseGs.js
│   ├── projectProfiles.js
│   ├── visualThemes.js
│   └── appsscriptJson.js
└── project/
    └── <nama-proyek>/
        ├── Code.gs
        ├── Database.gs
        ├── app.html
        ├── appsscript.json
        └── .clasp.json
```

## File yang dihasilkan

- `Code.gs`: entry point Web App dan API untuk frontend.
- `Database.gs`: schema Google Sheets, autentikasi, modul data, pembayaran, dan perhitungan khusus.
- `app.html`: halaman login dan dashboard SPA responsif.
- `appsscript.json`: manifest Apps Script.

## Catatan keamanan dan operasional

- Jangan membagikan file kredensial `clasp` atau file sesi lokal.
- Gunakan password Admin yang baru sebelum aplikasi dipakai pelanggan.
- Validasi dan pembatasan akses perlu disesuaikan lagi jika aplikasi menangani data sensitif atau transaksi nyata.
- Uji deployment dengan akun dan data non-produksi sebelum digunakan pelanggan.
