# GAS Web App Generator (Node.js CLI)

Generator otomatis untuk proyek **Google Apps Script (GAS) Web App** bertema
Absensi + SPP dengan tampilan SaaS modern (dark/light split-screen).

## Struktur Direktori

```
gas-webapp-generator/
├── index.js                  # Skrip utama bot (root, jangan dipindah)
├── package.json
├── templates/
│   ├── codeGs.js              # Generator konten Code.gs
│   ├── databaseGs.js          # Generator konten Database.gs
│   ├── appHtml.js             # Generator konten app.html
│   └── appsscriptJson.js      # Generator konten appsscript.json
└── project/                   # Dibuat otomatis saat CLI dijalankan
    └── <nama-proyek-anda>/    # Sub-folder per proyek yang di-generate
        ├── Code.gs
        ├── Database.gs
        ├── app.html
        ├── appsscript.json
        └── .clasp.json         # Dibuat oleh `clasp create`
```

Semua proses (generate file, `clasp create`, `clasp push`) hanya menyentuh
`project/<nama-proyek-anda>/` — root directory bot tidak pernah kotor.

## Prasyarat

1. **Node.js** >= 18
2. **clasp** CLI Google terpasang global:
   ```bash
   npm install -g @google/clasp
   ```
3. Akun Google dengan akses ke Google Drive & Apps Script.

## Instalasi

```bash
cd gas-webapp-generator
npm install
```

## Menjalankan

Buka terminal VS Code di folder `gas-webapp-generator`, lalu:

```bash
node index.js
```

Alur interaktif yang akan terjadi:

1. **Nama proyek** — Anda diminta memasukkan nama proyek (mis. `absensi-spp-app`).
   Folder `project/<nama>` otomatis dibuat.
2. **Aktivasi API** — Browser terbuka otomatis untuk memandu Anda mengaktifkan
   *Google Apps Script API* pada akun Google Anda. Konfirmasi lewat prompt
   ketika sudah selesai.
3. **Login Google** — `clasp login` dijalankan otomatis; sebuah tab OAuth akan
   terbuka untuk menyambungkan akun Anda ke clasp.
4. **Pembuatan proyek cloud** — `clasp create --type standalone` dijalankan di
   dalam `project/<nama>/`, membuat proyek Apps Script baru di Google Drive.
   Proyek standalone tersebut kemudian di-deploy sebagai Web App.
5. **Perakitan kode** — Bot menulis `Code.gs`, `Database.gs`, `app.html`, dan
   `appsscript.json` ke dalam folder proyek (menimpa file stub bawaan clasp).
6. **Push** — `clasp push --force` mengunggah semua kode ke server GAS.
7. **Deploy** — `clasp deploy` dijalankan otomatis untuk membuat deployment
   Web App. Bot membaca Deployment ID dari output terminal clasp lalu
   menyusun link akses publiknya.
8. **Selesai** — Pesan sukses berwarna hijau ditampilkan beserta:
   - Link Web App siap-pakai: `https://script.google.com/macros/s/<deploymentId>/exec`
   - Link editor Apps Script: `https://script.google.com/d/<scriptId>/edit`

## Setelah Generate

Gunakan akun awal berikut saat pertama membuka aplikasi:

- Username: `Admin`
- Password: `Admin123`

Akun ini dibuat otomatis hanya ketika database proyek pertama kali diinisialisasi.

1. Buka link **Web App (/exec)** yang ditampilkan untuk mengakses aplikasi.
   Spreadsheet dan sheet untuk tema yang dipilih dibuat otomatis saat akses pertama.
2. Kunjungan pertama biasanya memunculkan layar izin/otorisasi Google — ini
   normal untuk deployment baru, cukup setujui sekali.
3. Setiap kali Anda mengubah kode dan ingin mem-publish ulang, jalankan
   dari dalam folder proyek:
   ```bash
   clasp push --force
   clasp deploy --description "update"
   ```
   Link `/exec` versi lama tetap berlaku (deployment "terkelola"); jika
   ingin versi baru menimpa link yang sama, gunakan
   `clasp deployments` untuk melihat ID, lalu `clasp deploy -i <deploymentId>`.

## Arsitektur Kode yang Digenerate

Hanya **3 file inti** (sesuai desain, tidak dipecah-pecah):

- `Code.gs` — routing (`doGet`), seluruh callback `apiXxx()` untuk frontend,
  dan `setupDatabase()`.
- `Database.gs` — schema (pembuatan sheet), Auth (hash SHA-256, login,
  register), Attendance, dan modul SPP.
- `app.html` — UI login + dashboard SaaS (Tailwind CDN), SPA berbasis
  vanilla JS (toggle class, tanpa reload), memanggil `google.script.run`.
