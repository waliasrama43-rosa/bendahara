# Sistem ERP Keuangan Sekolah Rakyat

Sistem ERP Keuangan Satu Atap untuk digitalisasi manajemen anggaran di Sekolah Rakyat Indonesia.

## 🎯 Fitur Utama

- **Input RKKAL** - Upload dan proses Rencana Kerja dan Anggaran Kegiatan
- **Web App** - Antarmuka input berbasis kolom yang intuitif
- **Auto-Export Excel** - Ekspor laporan ke format Excel baku secara otomatis
- **Telegram Bot** - Monitoring tanpa intervensi manual
- **Anti-Spam Queueing** - Cegah eksekusi ganda dari multiple clicks
- **Self-Healing** - Auto-create struktur jika terhapus

## 📁 Struktur File

```
bendahara/
├── src/
│   ├── main.gs              # Entry point dengan routing
│   ├── database/
│   │   ├── schema.gs        # Database schema
│   │   └── database.gs      # CRUD operations
│   ├── controllers/
│   │   ├── controller.rkkal.gs     # Input RKKAL
│   │   ├── controller.input.gs     # Data input
│   │   ├── controller.export.gs    # Export Excel
│   │   ├── controller.validation.gs # Validasi anggaran
│   │   └── controller.correction.gs # Inline editing
│   └── modules/
│       ├── module.selfhealing.gs     # Auto-heal system
│       └── module.queue.gs          # Anti-spam queueing
├── cloudflare/
│   └── worker.js            # Reverse proxy dan rate limiting
└── docs/
    ├── api-docs.md
    └── deployment-guide.md
```

## 🔧 Stack Teknologi

- **Backend**: Google Apps Script (V8 Engine)
- **Database**: Google Sheets API
- **Webhook**: Cloudflare Reverse Proxy
- **Frontend**: React.js (dashboard web)
- **Monitoring**: Telegram Bot

## 🚀 Deployment

### 1. Google Apps Script

1. Buka [Google Apps Script](https://script.google.com)
2. Copy semua file dari `src/` ke Google Apps Script
3. Deploy sebagai Web App dengan:
   - Execute as: Me
   - Who has access: Anyone
4. Copy URL Web App

### 2. Cloudflare Worker

1. Buat worker di [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Copy konten `cloudflare/worker.js`
3. Update `BACKEND_URL` dengan URL Google Apps Script Anda
4. Deploy worker

### 3. Telegram Bot (Opsional)

1. Buat bot di Telegram dengan @BotFather
2. Update bot token di `src/controllers/controller.telegram.gs`

## 📊 Database Schema

### Data_Transaksi

| Колом | Tipe Data |
|-------|-----------|
| ID_Transaksi | String (Primary Key) |
| Kode_Anggaran | String |
| Nama_Kegiatan | String |
| Jumlah_Rupiah | Number |
| Timestamp | Date |
| Status_Verifikasi | String |
| School_ID | String |

### Data_Sekolah

| Колом | Tipe Data |
|-------|-----------|
| School_ID | String (Primary Key) |
| Nama_Sekolah | String |
| Alamat_Sekolah | String |
| Kepala_Sekolah | String |
| Bendahara | String |

### Data_Subscription

| Kolom | Tipe Data |
|-------|-----------|
| Subscription_ID | String |
| School_ID | String |
| Start_Date | Date |
| End_Date | Date |
| Status | String |

## 🔒 Keamanan

- Rate limiting via Cloudflare Worker
- Anti-spam queueing (5 second cooldown)
- Comprehensive error logging
- No sensitive data exposure

## 📝 Subscription Model

- Multi-tenant architecture per sekolah
- School profile personalization
- Recurring billingIntegration

## 🐛 Troubleshooting

Lihat [docs/troubleshooting.md](docs/troubleshooting.md) untuk panduan troubleshooting.

## 📞 Support

Untuk bantuan, hubungi developer atau buat issue di repository.

---

**Dibangun untuk Sekolah Rakyat Indonesia** 🇮🇩

# Deployment Guide

## Google Apps Script Deployment

### Langkah-langkah:

1. **Buka Google Apps Script**
   - Kunjungi https://script.google.com
   - Sign in dengan Google Account

2. **Buat Project Baru**
   - Klik on "Untitled Project"
   - Rename menjadi "ERP_Sekolah_Rakyat"

3. **Copy Files ke Project**
   - Copy isi file `src/main.gs`
   - Paste ke `Code.js` di Apps Script
   - Ulangi untuk file-file lain:

```
database/schema.gs → database/schema.gs
database/database.gs → database/database.gs
controllers/controller.rkkal.gs → controllers/controller.rkkal.gs
controllers/controller.input.gs → controllers/controller.input.gs
controllers/controller.export.gs → controllers/controller.export.gs
controllers/controller.validation.gs → controllers/controller.validation.gs
controllers/controller.correction.gs → controllers/controller.correction.gs
modules/module.selfhealing.gs → modules/module.selfhealing.gs
modules/module.queue.gs → modules/module.queue.gs
```

4. **Install Dependencies (jika ada)**
   - Di Apps Script, klik "Services"
   - Add Google Sheets API

5. **Deploy as Web App**
   - Klik "Deploy" → "New deployment"
   - Select type: Web app
   - Config:
     - Description: "Production v1.0"
     - Execute as: Me
     - Who has access: Anyone
   - Klik "Deploy"
   - Copy URL Web App (akan digunakan di Cloudflare)

## Cloudflare Worker Deployment

### Langkah-langkah:

1. **Buka Cloudflare Dashboard**
   - Login ke https://dash.cloudflare.com
   - Pilih account Anda

2. **Buat Worker**
   - Navigate ke "Workers & Pages"
   - Click "Create Application"
   - Select "Worker"
   - Name: "erp-school-worker"

3. **Configure Worker**
   - Copy isi file `cloudflare/worker.js`
   - Paste ke worker editor
   - Update konfigurasi:

```javascript
const BACKEND_URL = 'HTTPS://SCRIPT.GOOGLE.com/macros/s/YOUR_GOOGLE_SCRIPT_ID/exec';
```

4. **Set Rate Limiting (Opsional)**
   - Di Worker Settings, tambahkan KV namespace untuk rate limiting
   - Opsi: Gunakan Cloudflare Rate Limiting API

5. **Route Traffic**
   - Buat rule di "Routes"
   - Pattern: `erp.yourdomain.com/*`
   - Destination: Worker name Anda

6. **Deploy**
   - Click "Save and Deploy"
   - Test di `https://erp.yourdomain.com`

## Telegram Bot Integration (Opsional)

### Langkah-langkah:

1. **Buat Bot**
   - Chat dengan @BotFather di Telegram
   - `/newbot` → ikuti instruksi
   - Copy bot token

2. **Update Bot Token**
   - Di `src/controllers/controller.telegram.gs`:
   
```javascript
const BOT_TOKEN = 'YOUR_BOT_TOKEN';
```

3. **Setup Webhook**
   - Call API:
   `https://api.telegram.org/botYOUR_BOT_TOKEN/set webhook?url=https://YOUR_CLOUDFLARE_WORKER_URL/telegram`

4. **Test Bot**
   - Chat dengan bot Anda
   - `/start` untuk test

## testing

### Test Endpoints:

```
GET  /?action=home
POST /?action=upload_rkkal
POST /?action=input_data
POST /?action=export_excel
POST /?action=verify_trans
POST /?action=edit_data
POST /?action=webhook
```

### Sample Request:

```bash
curl -X POST \
  'https://erp.yourdomain.com/?action=input_data' \
  -H 'Content-Type: application/json' \
  -d '{
    "schoolId": "SCH001",
    "kodeAnggaran": "521211",
    "namaKegiatan": "Pembelian ATK",
    "jumlahRupiah": "500000"
  }'
```

## Troubleshooting

### Google Apps Script:
- Error: "Script not found" → Check deployment ID
- Error: "Permission denied" → Review Apps Script permissions
- Error: "Sheet not found" → Self-healing akan auto-create

### Cloudflare Worker:
- Error: "502 Bad Gateway" → Check BACKEND_URL
- Error: "Rate limit" → Adjust rate limit settings
- Error: "CORS" → Check CORS headers di worker

### Telegram Bot:
- No response → Check webhook setup
- Error connecting → Verify BOT_TOKEN
- Not receiving updates → Test with `/getUpdate`

---

**Last Updated**: May 2026