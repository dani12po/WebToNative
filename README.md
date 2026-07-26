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

`project/` adalah output generator dan tidak di-commit. Untuk mengubah aplikasi yang sudah dibuat, gunakan Apps Script Editor atau buat ulang proyek baru melalui generator.

## Keamanan dan penggunaan produksi

- Jangan commit atau bagikan `api.txt`, `authsesion.json`, atau kredensial `clasp`.
- Ganti password Admin awal sebelum aplikasi digunakan.
- Uji dengan data non-produksi terlebih dahulu.
- Buat backup Google Sheet secara berkala.
- Untuk data sensitif, transaksi riil, atau kebutuhan kepatuhan khusus, lakukan audit keamanan dan pengembangan tambahan sebelum dipakai produksi.

## Lisensi

Periksa lisensi repository atau hubungi pemilik repository untuk penggunaan komersial dan distribusi.
