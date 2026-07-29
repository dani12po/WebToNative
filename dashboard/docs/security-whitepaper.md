# WebToNative Security Whitepaper

**Major Update — Zero-Knowledge E2EE Vault**
Versi 1.0 · 29 Juli 2026

> Ringkasan: WebToNative memisahkan proses build lokal dari penyimpanan data sensitif. Konfigurasi proyek dan API key AI yang dipilih pengguna dapat disimpan sebagai vault terenkripsi end-to-end. Master Password tidak pernah dikirim ke server. Token OAuth Google Apps Script dan Vercel tidak pernah dipindahkan antar-komputer.

---

## 1. Panduan untuk pengguna

### Apa yang berubah?

WebToNative kini memiliki **Zero-Knowledge End-to-End Encryption (E2EE) Vault**. Artinya, data yang dimasukkan ke vault—misalnya konfigurasi proyek dan API key AI—dienkripsi di browser Anda sebelum dikirim ke server.

Server WebToNative, Vercel, Supabase, dan administrator platform hanya menyimpan bentuk terenkripsi (*ciphertext*). Mereka tidak menerima Master Password dan tidak dapat membaca isi vault.

Ini bukan jaminan absolut terhadap semua risiko. Keamanan tetap bergantung pada perangkat yang aman, Master Password yang kuat, browser yang tepercaya, serta kebiasaan pengguna dalam melindungi Recovery Key.

### Data yang termasuk dan tidak termasuk

| Data | Disinkronkan melalui vault E2EE | Keterangan |
| --- | --- | --- |
| Konfigurasi proyek | Ya, bila Anda menyimpannya ke vault | Dienkripsi di browser. |
| API key AI | Ya, bila Anda menyimpannya ke vault | Dienkripsi di browser. |
| Token/sesi Google Apps Script | Tidak | Login OAuth dilakukan resmi pada setiap komputer. |
| Token/sesi Vercel | Tidak | Login OAuth dilakukan resmi pada setiap komputer. |
| Master Password | Tidak pernah | Hanya berada di memori browser selama proses enkripsi/dekripsi. |

### Membuat Master Password pertama kali

1. Masuk ke WebToNative.
2. Jika vault belum tersedia, layar **Buat Master Password** akan muncul.
3. Buat password unik minimal 8 karakter yang memiliki huruf besar, angka, dan simbol. Gunakan password manager bila tersedia.
4. Konfirmasi password tersebut.
5. Setelah vault dibuat, simpan **Recovery Key** yang tampil.
6. Salin atau unduh file `.txt` Recovery Key, lalu simpan di password manager atau media offline yang aman.
7. Centang konfirmasi bahwa Recovery Key telah disimpan sebelum melanjutkan ke dashboard.

> Jangan menyimpan Master Password atau Recovery Key pada chat, screenshot publik, source code, Git, atau dokumen yang dibagikan.

### Pindah ke komputer baru

1. Masuk ke akun WebToNative pada komputer baru.
2. Dashboard akan menemukan vault terenkripsi Anda secara otomatis.
3. Masukkan **Master Password** pada modal **Buka brankas Anda**.
4. Pilih **Buka & sinkronkan**.
5. Browser mendekripsi vault secara lokal. Setelah berhasil, konfigurasi proyek/API key dalam vault tersedia pada sesi browser tersebut.
6. Untuk Google Apps Script atau Vercel, tetap lakukan login OAuth resmi dari CLI di komputer baru.

### Jika Master Password terlupa

Master Password tidak dapat di-reset melalui email. Ini adalah konsekuensi penting dari arsitektur Zero-Knowledge: server memang tidak mempunyai kunci untuk membuka vault lama.

Gunakan **Recovery Key**:

1. Pada modal vault, pilih **Lupa Master Password?**
2. Masukkan Recovery Key.
3. Jika valid, buat Master Password baru.
4. Sistem membuat Recovery Key baru dan meminta Anda menyimpannya.

Proses ini melakukan **Reset Vault**. Ciphertext lama dihapus dan digantikan vault baru. Data lama tidak dapat dipulihkan tanpa Master Password lama.

---

## 2. Arsitektur teknikal dan keamanan

### Prinsip Zero-Knowledge

Desain ini mengikuti prinsip berikut:

- Enkripsi dan dekripsi terjadi di browser pengguna.
- Master Password tidak dikirim melalui API dan tidak disimpan pada database, cookie, atau localStorage.
- Server hanya memvalidasi sesi pengguna, struktur payload, batas ukuran, dan hak akses data.
- Server menyimpan ciphertext, salt, IV, metadata algoritma, serta hash Recovery Key.
- Token OAuth vendor tidak masuk ke vault dan tidak disalin antar-perangkat.

### Alur kriptografi

```text
Master Password
      │
      ├── PBKDF2-SHA-256 + salt acak 16 byte + 310.000 iterasi
      │
      ▼
Kunci AES-GCM 256-bit
      │
      ├── AES-GCM + IV acak 12 byte + AAD terikat ke user_id
      │
      ▼
Ciphertext + Authentication Tag
      │
      ▼
Vercel API / Supabase (penyimpanan ciphertext saja)
```

### Web Crypto API

Frontend menggunakan [Web Crypto API](https://developer.mozilla.org/docs/Web/API/Web_Crypto_API), khususnya `window.crypto.subtle`:

- `crypto.getRandomValues()` membuat salt, IV, dan Recovery Key dengan sumber acak kriptografis browser.
- `PBKDF2` dengan `SHA-256` menurunkan kunci dari Master Password.
- Implementasi saat ini memakai **310.000 iterasi**, melampaui baseline 100.000 iterasi yang sering dipakai pada contoh lama. Nilai ini dapat ditinjau berkala mengikuti rekomendasi platform dan performa perangkat.
- `AES-GCM` dengan panjang kunci **256-bit** mengenkripsi dokumen vault sekaligus memberi autentikasi integritas.
- *Additional Authenticated Data* (AAD) mengikat vault ke identitas user. Ciphertext tidak dapat dipindah begitu saja ke akun lain lalu dibuka sebagai vault yang valid.

### Bentuk data di server

Tabel `user_vaults` menyimpan:

```text
user_id
ciphertext
salt
iv
encryption_metadata
recovery_key_hash
created_at
updated_at
```

`ciphertext` tidak dapat dibaca tanpa Master Password yang benar. `salt` dan `iv` bukan rahasia; keduanya diperlukan untuk proses dekripsi, tetapi tidak cukup untuk memperoleh plaintext.

Server tidak memiliki kemampuan teknis untuk mendekripsi vault karena tidak memiliki Master Password atau kunci AES hasil derivasi pengguna.

### Recovery Key

Saat setup, browser menghasilkan Recovery Key 32 karakter dan menyimpan hanya hash SHA-256-nya pada `recovery_key_hash`.

Recovery Key dipakai untuk membuktikan bahwa pengguna berhak menjalankan **reset vault**. Ia tidak digunakan sebagai kunci dekripsi ciphertext lama. Pendekatan ini menghindari *backdoor* yang dapat melemahkan Master Password.

---

## 3. Protokol keamanan server

### Verifikasi sesi

Setiap endpoint vault memverifikasi bearer access token Supabase di server melalui `requireUser()`. API tidak menerima `user_id` dari body sebagai sumber kebenaran.

Endpoint utama:

| Endpoint | Fungsi |
| --- | --- |
| `GET /api/vault` | Mengambil ciphertext vault milik user yang sudah masuk. |
| `PUT` / `POST /api/vault` | Menyimpan ciphertext baru atau pembaruan vault. |
| `POST /api/vault/recovery/verify` | Memverifikasi hash Recovery Key dan menerbitkan tiket reset singkat. |
| `POST /api/vault/recovery/reset` | Mengganti vault lama setelah tiket reset valid. |
| `GET /api/vault/activity` | Menampilkan metadata aktivitas vault milik user. |

### Validasi payload dan pembatasan ukuran

Server hanya menerima `application/json` dengan ukuran maksimum **50 KB**. Payload diperiksa sebelum diproses:

- Skema enkripsi harus `webtonative-e2ee-v2`.
- KDF harus `PBKDF2-SHA-256`.
- Iterasi harus berada dalam rentang yang diizinkan.
- `ciphertext`, `salt`, dan `iv` harus berupa Base64 dengan panjang yang valid.
- AAD harus cocok dengan format vault aplikasi.

Pembatasan ini mengurangi risiko unggahan besar, JSON tidak valid, dan serangan *denial of service* sederhana.

### Rate limiting

Endpoint vault memakai rate limit atomik di database: maksimal **5 request per menit** untuk kombinasi akun dan hash jaringan/perangkat. Mekanisme ini berlaku lintas instance serverless sehingga tidak bergantung pada memori satu server Vercel.

Rate limiting diterapkan pada baca vault, tulis vault, verifikasi Recovery Key, reset, dan aktivitas vault. Endpoint pemulihan juga membuat tiket reset bertanda tangan HMAC yang hanya berlaku **5 menit**.

### Device Activity Log

Tabel `vault_logs` menyediakan transparansi aktivitas:

- aksi `READ`, `UPDATE`, atau `RECOVERY_RESET`;
- user agent yang dipotong ke panjang aman;
- waktu akses;
- kode negara/region bila header Vercel tersedia;
- **hash IP ber-pepper**, bukan alamat IP mentah.

Hash IP memungkinkan deteksi jaringan/perangkat baru tanpa menyimpan alamat IP literal sebagai data pribadi. Log tidak menyimpan Master Password, Recovery Key, plaintext, API key, atau token OAuth.

### Praktik operasional yang wajib

- Aktifkan HTTPS pada deployment Vercel.
- Isi `VAULT_RATE_LIMIT_SECRET` dan `VAULT_RECOVERY_TOKEN_SECRET` dengan secret acak minimal 32 karakter di environment server.
- Jangan menaruh `SUPABASE_SERVICE_ROLE_KEY` pada variabel yang diawali `NEXT_PUBLIC_`.
- Jangan mencetak request body vault ke log aplikasi.
- Tinjau dan rotasi secret server bila dicurigai bocor.
- Jalankan migration SQL terbaru sebelum deploy endpoint vault.

---

## Batasan dan model ancaman

E2EE melindungi data saat disimpan di server dan saat berpindah antar perangkat melalui backend. Ia tidak dapat melindungi pengguna jika:

- perangkat telah terkena malware atau extension browser berbahaya;
- Master Password/Recovery Key dibagikan ke pihak lain;
- pengguna membuka phishing page yang meniru WebToNative;
- perangkat dibiarkan terbuka saat vault sudah berhasil dibuka.

Untuk perlindungan terbaik, gunakan password manager, aktifkan MFA pada Google/Vercel/Supabase bila tersedia, perbarui browser dan sistem operasi, serta logout dari perangkat bersama.
