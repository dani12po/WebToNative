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

Dashboard memakai Supabase Auth: pengguna daftar dengan **email, username, password**, lalu masuk memakai **username + password**. Email dipakai untuk verifikasi/pemulihan. Semua job, agent CLI, dan riwayat tersaring berdasarkan `user_id` akun yang sedang masuk.

## Jalankan lokal

```bash
cd dashboard
npm install
npm run dev
```

Buka `http://localhost:3001`.

Jika muncul error `Cannot find module './331.js'`, hentikan server dengan `Ctrl+C` lalu jalankan kembali `npm run dev`. Cache development dibersihkan otomatis saat startup. Folder build production sekarang terpisah dari cache development sehingga `npm run build` aman dijalankan pada terminal lain.

## Keamanan koneksi layanan

- Google Apps Script, Vercel, dan AI Provider disimpan sebagai credential AES-256-GCM terenkripsi di server sebelum masuk tabel `connected_services`.
- Credential tidak pernah dikirim ulang ke browser atau ditampilkan sebagai teks biasa.
- Tombol **↓** membuat JSON backup yang dienkripsi lagi memakai password backup pengguna. Tombol **⌫** menghapus credential terenkripsi dari akun.
- Token Google/Vercel/API key tidak boleh disimpan di localStorage, source code, Git, atau log terminal.

## Menghubungkan CLI lokal

1. Jalankan dashboard dengan `npm run dev` dari folder `dashboard/`.
2. Daftar/masuk terlebih dahulu, kemudian pada dashboard buka **Hubungkan CLI**.
3. Dari folder utama tools, jalankan perintah yang ditampilkan, misalnya:

   ```bash
   npm run connect-web -- --url http://localhost:3001 --code ABCD2345
   ```

4. Sesi perangkat disimpan lokal pada `webtonative-agent.json` dan diabaikan Git. Metadata perangkat juga tersimpan pada akun Supabase agar job tidak tertukar antar pengguna. Agent langsung menunggu job hingga 10 menit.
5. Untuk memulai kembali mode menunggu tanpa pairing ulang, jalankan:

   ```bash
   npm run agent
   ```

Setelah Supabase dikonfigurasi, job dan pairing tidak hilang saat dashboard direstart atau dipindah ke Vercel. CLI hanya dapat mengambil job yang dibuat oleh akun pemilik perangkat tersebut.

## Alur penggunaan singkat

1. Pengguna membuat akun dashboard dengan username, email, dan password.
2. Pengguna memasangkan CLI pada komputer yang akan menjalankan build.
3. Job Web App GAS, migrasi Next.js, atau Android dibuat dari halaman **Buat aplikasi**.
4. CLI lokal mengambil job milik akun tersebut, menjalankan tool yang dibutuhkan, lalu mengirim status kembali ke dashboard.
5. URL deploy atau lokasi output tampil pada **Aplikasi & web saya**.

Dashboard mengatur workflow dan status. Build tetap dijalankan di komputer pengguna, sehingga browser tidak menjalankan credential atau tool deployment secara langsung.
