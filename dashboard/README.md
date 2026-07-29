# WebToNative Control Center

Dashboard web untuk membuat dan memantau job generator. Build berat **tidak** dilakukan browser: job nantinya diambil dan dieksekusi oleh CLI WebToNative pada komputer pengguna.

## Ringkasan cepat

1. Konfigurasikan Supabase dan jalankan schema SQL.
2. Salin `.env.example` ke `.env.local`.
3. Jalankan `npm install` lalu `npm run dev`.
4. Buat akun, hubungkan CLI, lalu buat job dari dashboard.

> Dashboard adalah control center. CLI lokal tetap menjalankan `clasp`, Next.js, Gradle, dan proses deployment di komputer pengguna.

## Konfigurasi Supabase (wajib untuk akun publik)

1. Buat proyek di [Supabase](https://supabase.com/), lalu pada **Authentication** aktifkan Email/Password dan konfirmasi email.
2. Jalankan isi [supabase/schema.sql](./supabase/schema.sql) di **SQL Editor** Supabase.
3. Salin `.env.example` menjadi `.env.local`, lalu isi nilai URL/key proyek. `SUPABASE_SERVICE_ROLE_KEY` dan `WEBTONATIVE_SECRETS_KEY` hanya boleh ada di server/deployment environment; jangan dibagikan ke browser atau Git.
4. Untuk Vercel, gunakan folder `dashboard` sebagai **Root Directory**, lalu masukkan keempat environment variable yang sama di **Project Settings → Environment Variables**.

Dashboard memakai Supabase Auth: pengguna daftar dengan **email, username, password**, lalu masuk memakai **username + password**. Username adalah identitas permanen dan tidak dapat diubah. Email dipakai untuk verifikasi/pemulihan dan dapat diperbarui dari **Pengaturan**; Supabase mengirim konfirmasi sebelum email login baru aktif. Semua job, agent CLI, dan riwayat tersaring berdasarkan `user_id` akun yang sedang masuk.

Jika dashboard sudah pernah dikonfigurasi, jalankan ulang [supabase/schema.sql](./supabase/schema.sql) di SQL Editor. Schema terbaru menambahkan trigger untuk menyelaraskan email tabel `profiles` setelah perubahan email Auth dikonfirmasi.

## Jalankan lokal

```bash
cd dashboard
npm install
npm run dev
```

Buka `http://localhost:3001`.

Jika muncul error `Cannot find module './331.js'`, hentikan server dengan `Ctrl+C` lalu jalankan kembali `npm run dev`. Cache development dibersihkan otomatis saat startup. Folder build production sekarang terpisah dari cache development sehingga `npm run build` aman dijalankan pada terminal lain.

## Keamanan koneksi dan Vault E2EE

- Google Apps Script dan Vercel **tidak** menyalin token OAuth antar-komputer. Setiap komputer menjalankan login OAuth resmi melalui CLI lokalnya sendiri.
- Vault lintas perangkat menyimpan konfigurasi proyek dan API key AI sebagai `ciphertext` AES-256-GCM. Kunci diturunkan di browser melalui PBKDF2-SHA-256 (310.000 iterasi) dari Master Password pengguna.
- Server Vercel/Supabase hanya menyimpan `ciphertext`, `salt`, IV, AAD, dan parameter KDF. Master Password serta plaintext tidak pernah dikirim, dicatat, atau tersedia bagi administrator.
- Saat perangkat baru masuk ke akun, browser dapat mengunduh ciphertext lalu meminta Master Password untuk dekripsi lokal satu kali per sesi browser. Jangan menyimpan Master Password dalam localStorage.
- Kehilangan Master Password membuat vault tidak dapat dipulihkan. Token OAuth Google/Vercel/API key tidak boleh dicetak ke log terminal atau di-commit ke Git.

### Migrasi skema Vault

Jalankan [supabase/vault-schema.sql](./supabase/vault-schema.sql) setelah schema utama. Skema ini membuat `user_vaults` (satu ciphertext vault per user) dan `vault_logs` (metadata `READ`/`UPDATE`). IP audit dipersistenkan sebagai hash ber-pepper, bukan IP mentah. Untuk integrasi backend berbasis Prisma, model setaranya tersedia di [prisma/schema.prisma](./prisma/schema.prisma).

Dokumen lengkap untuk pengguna, arsitektur kriptografi, pemulihan Master Password, rate limiting, dan logging tersedia di [Security Whitepaper](./docs/security-whitepaper.md).

## Menghubungkan CLI lokal

1. Jalankan dashboard dengan `npm run dev` dari folder `dashboard/`.
2. Daftar/masuk terlebih dahulu, kemudian pada dashboard buka **Hubungkan CLI**.
3. Unduh **WebToNative Agent** dari tautan yang disediakan dashboard, simpan file `.exe` di folder pilihan, lalu salin perintah pairing yang ditampilkan dan jalankan di PowerShell:

   ```bash
   .\WebToNative-Agent-win-x64.exe connect --url http://localhost:3001 --code ABCD2345
   ```

4. Sesi perangkat disimpan lokal pada `webtonative-agent.json`. Metadata perangkat juga tersimpan pada akun Supabase agar job tidak tertukar antar pengguna. Agent langsung menunggu job hingga 10 menit.
5. Untuk memulai kembali mode menunggu tanpa pairing ulang, jalankan:

   ```bash
   .\WebToNative-Agent-win-x64.exe wait
   ```

> Pengguna tidak perlu clone repository core dan tidak menerima folder source generator. Dashboard harus diberi `NEXT_PUBLIC_WEBTONATIVE_AGENT_URL` dan `NEXT_PUBLIC_WEBTONATIVE_AGENT_SHA256`. Dengan keduanya, perintah pairing otomatis mengunduh binary ke folder PowerShell yang dipilih, memverifikasi SHA-256, lalu menjalankan agent.

Setelah Supabase dikonfigurasi, job dan pairing tidak hilang saat dashboard direstart atau dipindah ke Vercel. CLI hanya dapat mengambil job yang dibuat oleh akun pemilik perangkat tersebut.

## Alur penggunaan singkat

1. Pengguna membuat akun dashboard dengan username, email, dan password. Username bersifat permanen; email dan password dapat diperbarui dari Pengaturan.
2. Pengguna memasangkan CLI pada komputer yang akan menjalankan build.
3. Job Web App GAS, migrasi Next.js, atau Android dibuat dari halaman **Buat aplikasi**.
4. CLI lokal mengambil job milik akun tersebut, menjalankan tool yang dibutuhkan, lalu mengirim status kembali ke dashboard.
5. URL deploy atau lokasi output tampil pada **Aplikasi & web saya**.

Dashboard mengatur workflow dan status. Build tetap dijalankan di komputer pengguna, sehingga browser tidak menjalankan credential atau tool deployment secara langsung.
