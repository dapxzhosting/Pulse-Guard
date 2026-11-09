# PulseGuard | Uptime & API Health Monitor

> **Production-Grade Uptime & Incident Management Engine (BetterStack & UptimeRobot Clone)**  
> Dibangun dengan backend **Zero-Dependency Native Node.js** dan proses build frontend menggunakan Terser, serta **Modern Reactive ES Module UI** dengan tema obsidian dark mode.

---

## 🎯 Tujuan & Konsep Aplikasi

**PulseGuard** dirancang untuk memantau ketersediaan (*uptime*), performa latensi, dan masa berlaku sertifikat SSL dari seluruh website, REST API, dan microservice Anda secara *real-time*.

Ketika server atau API Anda mengalami gangguan (*downtime*) atau penurunan performa (*latency degradation*), PulseGuard akan secara otomatis:
1. Mendeteksi kegagalan jaringan secara akurat tanpa *false alarm* (*flapping prevention*).
2. Membuka tiket insiden secara otomatis (*Automated Incident Creation*).
3. Mengirimkan sinyal bahaya ke berbagai kanal komunikasi tim Anda (**Discord**, **Telegram**, **Email**, atau **Custom Webhooks**).
4. Menampilkan status terkini kepada pengguna publik melalui **Public Status Page**.
5. Mengirimkan notifikasi pemulihan (*recovery alert*) beserta total durasi gangguan saat server kembali beroperasi normal.

---

## 🧠 Alur Logika Sistem (How It Works Under the Hood)

```
[Target URL / API] 
       ▲
       │ 1. Scheduled Ping & Handshake (Interval 10s - 10m)
[Background Worker Engine]
       │
       ├─► [Checker Service] ──► Mengukur DNS, TCP, TLS, TTFB & Validasi Kata Kunci (Keyword)
       ├─► [SSL Inspector]   ──► Membaca Masa Berlaku Sertifikat X.509 (Days Left)
       │
       ▼ 2. Analisis Hasil Cek (2-Strike Failure Rule)
  [Evaluasi Status]
       │
       ├─► Normal (UP) ────► Rekam Heartbeat ──► Hitung 24h & 30d Uptime
       │
       └─► Gagal (DOWN) ───► Auto-Create Incident ──► Kirim Alert (Discord / Telegram / Webhook)
                                     │
                                     ▼
                            [Server Pulih (UP)] ──► Auto-Resolve Incident ──► Kirim Recovery Alert
```

### Logika Utama di Balik Mesin PulseGuard:
1. **Background Monitoring Worker**:
   - Berjalan sebagai proses *event-loop* independen di server Node.js.
   - Mengambil daftar monitor yang aktif dari database persistent (`data/db.json`) dan menjadwalkan pengecekan sesuai interval masing-masing (10 detik, 30 detik, 60 detik, dst.).
2. **Microsecond Socket Latency Breakdown**:
   - Membuka soket jaringan native (`node:http` & `node:https`) dan mendengarkan event tingkat rendah:
     - `lookup` ➔ **DNS Lookup Time**
     - `connect` ➔ **TCP Handshake Time**
     - `secureConnect` ➔ **TLS/SSL Negotiation Time**
     - `response` ➔ **TTFB (Time to First Byte)**
   - Memberikan visibilitas langsung di bagian mana jaringan Anda mengalami hambatan (*bottleneck*).
3. **Pencegahan Alarm Palsu (Anti-Flapping 2-Strike Rule)**:
   - Gangguan sesaat (seperti spike sesaat pada koneksi internet penyedia) tidak akan langsung memicu sirine alarm. Status baru beralih ke `DOWN` setelah 2 kegagalan berturut-turut terkonfirmasi.
4. **SSL Expiry Inspector**:
   - Melakukan handshake TLS SNI (*Server Name Indication*) langsung ke port 443 tanpa membebani browser.
   - Membaca metadata sertifikat: Lembaga Penerbit (*Issuer CA* seperti Let's Encrypt / DigiCert / Cloudflare), Nama Subjek (*Common Name*), dan menghitung sisa hari berlaku.
   - Memicu peringatan dini jika masa berlaku tersisa di bawah ambang batas (default: 30 hari).
5. **Multi-Channel Dispatcher**:
   - Mengemas data insiden ke dalam format khusus (Rich Embed warna merah/hijau untuk Discord, format HTML untuk Telegram Bot, JSON Payload untuk generic webhook).
6. **Reactive Frontend Engine**:
   - Menghubungkan dashboard admin dan status page ke REST API dengan sinkronisasi data latar belakang.
   - Sistem modal terisolasi memastikan form dialog tidak akan hilang fokus atau ter-reset saat proses pembaruan data berkala berlangsung.

---

## ✨ Fitur-Fitur Unggulan

### 1. Pemantau Multi-Protokol & Assertion Fleksibel
- Mendukung metode HTTP: `GET`, `POST`, `HEAD`, `PUT`, `PATCH`.
- Kustomisasi kode status HTTP yang diharapkan (misal `200`, `201`, `204`, `301`).
- **Response Body Keyword Assertion**: Memvalidasi apakah respon server benar-benar mengandung kata kunci tertentu (misal `"status": "ok"` atau `"healthy"`), bukan halaman error generik.
- **Advanced HTTP Options (Custom Headers & Payload)**: Mendukung injection header kustom (misal `Authorization: Bearer <token>`, `X-Api-Key`) dan payload JSON body untuk endpoint REST API & GraphQL.

### 2. IP & Server Geolocation Details (DB-IP / ip-api)
- Menampilkan resolusi DNS IPv4 target secara otomatis.
- Metadata lokasi server lengkap: **IP Address, Hostname, ASN & ISP/Org, Negara & Bendera, Region, Kota, Zona Waktu, dan Koordinat**.
- **Embedded OpenStreetMap**: Pratinjau peta interaktif langsung di modal detail monitor untuk mengetahui lokasi fisik data center server Anda.

### 3. Maintenance Mode / Snooze Alerts
- Pengguna dapat membisukan alert (*snooze*) sementara selama **1 Jam**, **4 Jam**, atau **24 Jam** saat melakukan pemeliharaan server (*scheduled maintenance*).
- Menghindari spam alert ke Discord/Telegram/Email selama proses deployment, dan otomatis kembali aktif saat durasi pemeliharaan berakhir.

### 4. Heartbeat Response Body Inspector
- Riwayat log heartbeat kini dilengkapi pratinjau cuplikan respon (*response body snippet*).
- Memudahkan proses *debugging* ketika server mengembalikan respon tak terduga (misal pesan error 500 atau 503).

### 5. Rincian Latensi Interaktif & Grafik SVG
- Grafik tren waktu respon dinamis (*SVG sparkline chart*) dengan gradien warna modern.
- Menampilkan metrik **Min**, **Average**, dan **Max** respon server.
- Visualisasi baris per baris untuk DNS, TCP, TLS, dan TTFB.

### 6. Interactive 35-Slot Uptime Bar (BetterStack Style)
- Setiap kartu monitor dilengkapi 35 slot baris ketersediaan harian.
- Dilengkapi animasi hover skala dan tooltip interaktif yang menampilkan status operasional, nilai latensi, serta timestamp lengkap.

### 7. Export SLA Report (CSV) & One-Click Copy cURL
- **Export SLA (CSV)**: Unduh laporan resmi ketersediaan SLA seluruh monitor atau per-monitor dalam format file `.csv`.
- **Copy cURL**: Salin perintah cURL terminal lengkap dengan satu klik untuk mereplikasi probe jaringan langsung dari CLI.

### 8. GSAP Spring Physics & Web Audio Micro-Interactions
- **GSAP Fluid Transitions**: Kartu monitor masuk bertahap (*staggered entrance*), modal pop elastis gaya Framer Motion (`back.out(1.4)`), dan radar scanner berkedip di header.
- **Interactive Mouse Spotlight**: Efek glowing radial emerald yang melacak posisi kursor mouse pengguna secara interaktif di atas kartu.
- **Web Audio Sound Effects**: Umpan balik audio mikro futuristik saat mengklik tombol dan memeriksa kesehatan sistem, lengkap dengan tombol mute di navbar.

### 9. Manajemen Insiden Otomatis & Manual
- **Otomatis**: Tiket insiden terbuka saat terdeteksi *downtime* (aturan 2-strike anti-flapping) dan terselesaikan otomatis saat server pulih.
- **Manual**: Pengguna dapat mendeklarasikan insiden terencana serta memposting catatan pembaruan investigasi (*Investigating*, *Identified*, *Monitoring*, *Resolved*).

### 10. Multi-Channel Alert Integrations (Zero Dependency Email)
- **Discord Webhook**: Notifikasi embed rapi lengkap dengan badge dan link ke sistem.
- **Telegram Bot**: Terhubung via Bot Token & Chat ID.
- **Email Alerts**: Pengiriman email alert langsung melalui **Native TLS SMTP** (Gmail App Password, Outlook, Custom Mail Server) atau **Resend API**. Cukup dikonfigurasi sekali di server (`.env`), pengguna cukup memasukkan email tujuan di UI!
- **Generic Webhook**: Siap diintegrasikan ke Slack, Zapier, Make, n8n, atau PagerDuty.
- **Fitur Test Alert**: Tombol uji kirim untuk memastikan webhook/email valid sebelum terjadi kendala nyata.

### 11. Public Status Page Mandiri
- Halaman status yang dapat diakses publik tanpa perlu login admin (`/#/status`).
- Menampilkan persentase uptime 30 hari kumulatif, banner kesehatan sistem (*All Systems Operational* / *Active Outage Detected*), dan daftar layanan yang dikelompokkan berdasarkan kategori.

---

## 🚀 Panduan Instalasi & Menjalankan

### Prasyarat
- **Node.js** v18.0.0 atau lebih tinggi (disarankan Node.js v20+ atau v22+).
- Git.

### 1. Clone Repository
```bash
git clone https://github.com/username-anda/pulseguard-uptime.git
cd pulseguard-uptime
```

### 2. Konfigurasi Environment (Opsional)
Duplikasi file konfigurasi environment:
```bash
cp .env.example .env
```
Isi konfigurasi (jika ingin mengubah port default):
```env
PORT=3001
```

### 3. Menjalankan Aplikasi
Build frontend menggunakan Terser untuk menghasilkan JavaScript ter-minify di folder `public`. Kode frontend sumber berada di luar folder yang disajikan server. Minifikasi hanya mempersulit pembacaan; kode yang dikirim ke browser tetap dapat diinspeksi melalui DevTools.

```bash
# Instal dependency build
npm install

# Mode Produksi / Standar
npm start

# Mode Pengembangan (Live reload saat kode server berubah)
npm run dev

# Build ulang frontend setelah mengubah frontend/app.js
npm run build
```

Server akan aktif di:
- **Admin Dashboard**: `http://localhost:3001`
- **Public Status Page**: `http://localhost:3001/#/status`
- **Health Check Endpoint**: `http://localhost:3001/api/health`

---

## ☁️ Panduan Hosting 24/7 (Production Deployment)

Karena PulseGuard adalah bot pemantau ketersediaan, aplikasi **harus menyala 24/7 tanpa henti**. Hindari serverless (seperti Vercel Hobby) yang tertidur saat tidak ada request.

### Opsi 1: VPS Linux (Ubuntu / Debian / CentOS) dengan PM2 (Paling Direkomendasikan)
1. Buka terminal server VPS dan pasang Node.js & PM2:
   ```bash
   sudo apt update && sudo apt install -y nodejs npm
   sudo npm install -g pm2
   ```
2. Clone repository & pasang dependencies:
   ```bash
   git clone https://github.com/dapxzhosting/Pulse-Guard.git
   cd Pulse-Guard
   npm install
   npm run build
   ```
3. Siapkan file `.env` dengan kredensial pengirim email (misal Gmail SMTP):
   ```bash
   cp .env.example .env
   nano .env
   ```
4. Jalankan 24/7 dengan PM2:
   ```bash
   pm2 start server/index.js --name "pulseguard"
   pm2 startup
   pm2 save
   ```

### Opsi 2: Railway.app (Deploy Otomatis dari GitHub)
1. Buka [Railway.app](https://railway.app) dan login dengan akun GitHub.
2. Pilih **New Project** ➔ **Deploy from GitHub repo** ➔ pilih `Pulse-Guard`.
3. Masuk ke menu **Variables**, tambahkan environment variable:
   - `PORT`: `3001`
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `465`
   - `SMTP_USER`: `email-anda@gmail.com`
   - `SMTP_PASS`: `kata-sandi-aplikasi-gmail`
   - `SMTP_FROM`: `PulseGuard <email-anda@gmail.com>`
4. Di tab **Settings**, klik **Generate Domain** untuk mendapatkan URL publik gratis berprotokol HTTPS.

---

## 📁 Struktur Direktori

```text
├── server/
│   ├── index.js               # Native HTTP Web Server & REST API Router
│   ├── worker.js              # Background Scheduler & Loop Ping Engine
│   ├── db.js                  # Database Persistence Layer (JSON file storage)
│   ├── types.ts               # Tipe data TypeScript untuk backend
│   └── services/
│       ├── checker.js         # Pengukur Latensi Socket & HTTP Validator
│       ├── sslChecker.js      # Pemeriksa Sertifikat SSL X.509
│       ├── incidentManager.js # Pengelola Siklus Hidup Insiden & Flapping
│       └── notifier.js        # Dispatcher Notifikasi Discord, Telegram, & Webhook
├── frontend/
│   └── app.js                 # Frontend SPA source (not served directly)
├── scripts/
│   └── build-frontend.js      # Minifies frontend source for distribution
├── public/
│   ├── index.html             # Shell container HTML aplikasi
│   ├── app.min.js             # Minified frontend distribution
│   └── style.css              # Custom Styling, Scrollbar, & Glassmorphism
├── data/
│   └── db.json                # Database JSON penyimpanan monitor & log heartbeat
├── package.json
└── README.md
```

---

## 🛠️ Panduan Troubleshooting

Berikut adalah solusi untuk kendala umum yang mungkin Anda temui:

### 1. `Error: listen EADDRINUSE: address already in use 0.0.0.0:3001`
- **Penyebab**: Port `3001` sedang digunakan oleh proses lain atau instansi server sebelumnya belum ditutup.
- **Solusi Windows (PowerShell)**:
  ```powershell
  # Cari proses yang memakai port 3001
  netstat -ano | findstr :3001
  
  # Matikan proses berdasarkan PID (ganti <PID> dengan angka di kolom terakhir)
  taskkill /PID <PID> /F
  ```
- **Solusi Alternatif**: Jalankan di port lain menggunakan environment variable:
  ```bash
  PORT=3002 npm start
  ```

### 2. Form Modal Berkedip atau Teks Terhapus Saat Mengetik
- **Status**: Masalah ini telah diperbaiki di versi terbaru!
- **Mekanisme**: Komponen dialog modal telah dipisahkan ke dalam kontainer `#modal-root`. Selama pengguna membuka atau mengisi form, proses sinkronisasi background otomatis tidak akan merestart atau menghancurkan elemen input aktif.

### 3. Target URL HTTPS Mengembalikan `UNABLE_TO_VERIFY_LEAF_SIGNATURE`
- **Penyebab**: Server target menggunakan *self-signed certificate* atau rantai sertifikat SSL intermediate belum lengkap dipasang.
- **Solusi**: Pastikan server target telah memasang Full-Chain Certificate (contohnya `fullchain.pem` dari Certbot). Jika target adalah server lokal pengembangan internal (*self-signed*), gunakan protokol `http://` atau pasang sertifikat CA tepercaya di OS lokal Anda.

### 4. Webhook Discord Tidak Terkirim / Error 400
- **Penyebab**: URL webhook salah atau format URL terpotong.
- **Solusi**:
  1. Buka channel Discord Anda ➔ **Edit Channel** ➔ **Integrations** ➔ **Webhooks** ➔ **New Webhook**.
  2. Klik **Copy Webhook URL**.
  3. Buka PulseGuard ➔ Masuk ke tab **Alerts & Webhooks** ➔ Buka Channel ➔ Tempel URL secara utuh.
  4. Tekan tombol **Test Alert** untuk memverifikasi respon langsung.

### 5. Telegram Bot Tidak Mengirim Pesan
- **Penyebab**: Bot Token salah, atau bot belum pernah di-start oleh Chat ID target.
- **Solusi**:
  1. Pastikan Anda telah membuat bot via `@BotFather` dan menyalin token HTTP API.
  2. Mulai percakapan dengan bot Anda di Telegram (tekan tombol **/start**).
  3. Masukkan Chat ID akun personal atau ID grup Anda.

### 6. Database `data/db.json` Terhapus atau Kosong
- **Solusi**: PulseGuard otomatis menginisialisasi file `data/db.json` baru dengan template skema standar jika file tersebut tidak ditemukan saat server dijalankan pertama kali.

---

## 📡 Ringkasan REST API

| Method | Endpoint | Keterangan |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Status kesehatan internal engine PulseGuard |
| `GET` | `/api/stats` | Ringkasan metrik statistik (Total, UP, DOWN, Avg Latency, Uptime) |
| `GET` | `/api/monitors` | Mengambil seluruh daftar endpoint monitor |
| `POST` | `/api/monitors` | Menambahkan endpoint monitor baru |
| `PUT` | `/api/monitors/:id` | Memperbarui konfigurasi monitor |
| `DELETE` | `/api/monitors/:id` | Menghapus monitor |
| `POST` | `/api/monitors/:id/check` | Memicu pengecekan jaringan manual (*instant check*) |
| `POST` | `/api/monitors/:id/pause` | Menghentikan sementara (*pause*) atau melanjutkan (*resume*) |
| `GET` | `/api/monitors/:id/heartbeats` | Mengambil log riwayat latensi heartbeat |
| `GET` | `/api/incidents` | Mengambil daftar insiden aktif dan arsip |
| `POST` | `/api/incidents` | Membuat tiket insiden baru |
| `POST` | `/api/incidents/:id/updates` | Menambahkan catatan pembaruan progres insiden |
| `GET` | `/api/notifications` | Mengambil daftar saluran notifikasi |
| `POST` | `/api/notifications/:id/test` | Menguji pengiriman alert ke saluran webhook |
| `GET` | `/api/status-page/public` | Data publik untuk halaman status pelanggan |

---

## 📄 Lisensi

Didistribusikan di bawah lisensi **MIT**. Anda bebas menggunakan, memodifikasi, dan menerapkan sistem ini untuk kebutuhan pribadi maupun komersial.
