# 📚 TUTORIAL INSTALASI
# Sistem ERP Keuangan Sekolah Rakyat v4.0
# Dari Ahli kepada Murid — Langkah demi Langkah

---

> **Dari Gurumu:**
> "Muridku, hari ini kita akan memasang sebuah sistem keuangan profesional yang berjalan 100% gratis di Google. Ikuti setiap langkah dengan teliti. Jangan terburu-buru. Setiap langkah memiliki alasan. Kalau kamu macet, baca ulang dari langkah tersebut — jangan dari awal."

---

## 🗺️ PETA PERJALANAN KITA HARI INI

```
LANGKAH 1  →  Siapkan Akun Google
LANGKAH 2  →  Buka Google Apps Script
LANGKAH 3  →  Buat Proyek Baru
LANGKAH 4  →  Salin 12 File Kode (URUTAN PENTING!)
LANGKAH 5  →  Deploy sebagai Web App
LANGKAH 6  →  Test Sistem Berjalan
LANGKAH 7  →  Daftarkan Sekolah Pertama
LANGKAH 8  →  Setup Notifikasi Telegram (Opsional)
LANGKAH 9  →  Setup Jadwal Otomatis
LANGKAH 10 →  Selesai & Mulai Pakai!
```

**Estimasi waktu:** 45–90 menit (pertama kali)

---


## ⚠️ SEBELUM MULAI — BACA INI DULU

### Yang Kamu Butuhkan:
| Kebutuhan | Keterangan | Biaya |
|-----------|-----------|-------|
| Akun Gmail | Gmail biasa sudah cukup | GRATIS |
| Browser Chrome | Disarankan Chrome terbaru | GRATIS |
| Internet stabil | Minimal 1 Mbps | - |
| Waktu | ~60-90 menit | - |

### Analogi yang Akan Membantu:
> 🏗️ Bayangkan kita sedang **membangun restoran digital**:
> - **Google Apps Script** = dapur tempat memasak data
> - **Google Sheets** = lemari arsip penyimpanan data
> - **URL Web App** = alamat toko yang dibagikan ke pelanggan
> - **Telegram Bot** = kurir yang lapor ke bos otomatis

---

## 📥 LANGKAH 0 — DOWNLOAD KODE DARI GITHUB

Pertama, kita perlu melihat semua file kode yang akan dipakai.

1. Buka browser, ketik alamat ini:
   ```
   https://github.com/waliasrama43-rosa/bendahara
   ```

2. Pastikan kamu berada di branch **`fase-2-4-erp-complete`**
   - Di halaman GitHub, cari tulisan `main` atau `fase-2-4-erp-complete`
   - Klik dan pilih `fase-2-4-erp-complete`

3. Kamu akan melihat folder-folder berikut:
   ```
   📁 src/
      📁 controllers/
      📁 database/
      📁 modules/
      📁 ui/
   📁 cloudflare/
   📄 TUTORIAL_INSTALASI.md  ← file ini
   📄 PANDUAN_LENGKAP.md
   ```

> 💡 **Catatan Guru:** Kamu tidak perlu download semua file. Kita akan salin satu per satu langsung dari GitHub ke Google Apps Script. Ini lebih mudah dan tidak perlu install software apapun.

---

## 🟦 LANGKAH 1 — SIAPKAN AKUN GOOGLE

Pastikan kamu sudah login ke Gmail di browser.

1. Buka: **https://gmail.com**
2. Login jika belum masuk
3. Pastikan kamu menggunakan akun yang akan menjadi **"pemilik sistem"**

> ⚠️ **Peringatan Guru:** Gunakan satu akun Google khusus untuk sistem ini. Jangan pakai akun pribadi yang berisi email penting. Idealnya buat akun Google baru khusus untuk sekolah.

---

## 🟦 LANGKAH 2 — BUKA GOOGLE APPS SCRIPT

1. Buka tab browser baru
2. Ketik di kolom alamat: **`script.google.com`**
3. Tekan Enter
4. Halaman Google Apps Script akan terbuka

> 💡 **Apa itu Google Apps Script?**
> Ini adalah "pabrik program" gratis dari Google. Seperti Microsoft Excel, tapi bisa menjalankan kode program otomatis. Tidak perlu install apapun — semua berjalan di cloud Google.

---

## 🟦 LANGKAH 3 — BUAT PROYEK BARU

1. Klik tombol **`+ Proyek baru`** (tombol biru, kiri atas)
2. Halaman editor akan terbuka — kamu akan melihat:
   - Panel kiri: daftar file
   - Area tengah: tempat menulis kode
   - Ada satu file bernama `Code.gs` sudah ada

3. **Beri nama proyek:**
   - Klik tulisan `Proyek tanpa judul` (kiri atas)
   - Ketik: `ERP_Sekolah_Rakyat`
   - Klik `Ganti nama`

4. **Hapus isi Code.gs yang default:**
   - Klik file `Code.gs` di panel kiri
   - Tekan `Ctrl+A` (pilih semua) lalu `Delete`
   - Biarkan kosong dulu

> 💡 **Catatan Guru:** Nama proyek tidak mempengaruhi fungsi sistem, tapi penting untuk kerapian. Kalau ada banyak proyek di akun kamu, nama yang jelas akan memudahkan pencarian.

---


## 🟦 LANGKAH 4 — SALIN 12 FILE KODE

> ⚠️ **PERINGATAN PALING PENTING:**
> **Urutan file sangat menentukan apakah sistem berjalan atau error.**
> Ikuti tabel di bawah ini PERSIS — tidak boleh diacak.

### Cara Membuat File Baru di Apps Script:
1. Di panel kiri, klik ikon **`+`** di samping tulisan "File"
2. Pilih **"Script"**
3. Ketik nama file sesuai kolom "Nama di Apps Script"
4. Tekan Enter
5. Hapus semua isi default (`Ctrl+A` → `Delete`)
6. Salin kode dari GitHub (lihat panduan di bawah)

### Cara Menyalin Kode dari GitHub:
1. Buka link file di kolom "Link GitHub"
2. Klik tombol **`Raw`** (pojok kanan atas halaman GitHub)
3. Tekan **`Ctrl+A`** (pilih semua teks)
4. Tekan **`Ctrl+C`** (salin)
5. Kembali ke Apps Script → klik file yang sesuai
6. Tekan **`Ctrl+V`** (tempel)
7. Tekan **`Ctrl+S`** (simpan)

---

### 📋 TABEL 12 FILE — IKUTI URUTAN INI:

| # | Nama di Apps Script | Salin dari GitHub |
|---|---------------------|-------------------|
| 1 | `schema` | `src/database/schema.gs` |
| 2 | `database` | `src/database/database.gs` |
| 3 | `module_queue` | `src/modules/module.queue.gs` |
| 4 | `module_selfhealing` | `src/modules/module.selfhealing.gs` |
| 5 | `module_telegram` | `src/modules/module.telegram.gs` |
| 6 | `module_dashboard` | `src/modules/module.dashboard.gs` |
| 7 | `controller_rkkal` | `src/controllers/controller.rkkal.gs` |
| 8 | `controller_input` | `src/controllers/controller.input.gs` |
| 9 | `controller_export` | `src/controllers/controller.export.gs` |
| 10 | `controller_validation` | `src/controllers/controller.validation.gs` |
| 11 | `controller_correction` | `src/controllers/controller.correction.gs` |
| 12 | `style_css` | `src/ui/style.css.gs` |
| 13 | `ui_components` | `src/ui/ui.components.gs` |
| 14 | `ui_js` | `src/ui/ui.js.gs` |
| 15 | `ui_pages` | `src/ui/ui.pages.gs` |
| 16 | `Code` *(sudah ada!)* | `src/main.gs` |

> 💡 **Catatan Guru:** File `Code.gs` sudah ada dari awal. Untuk file ini, kamu cukup hapus isinya dan tempel kode dari `src/main.gs`. Tidak perlu buat baru.

### Setelah semua file tersalin, panel kiri Apps Script kamu harus terlihat seperti ini:
```
📄 Code
📄 controller_correction
📄 controller_export
📄 controller_input
📄 controller_rkkal
📄 controller_validation
📄 database
📄 module_dashboard
📄 module_queue
📄 module_selfhealing
📄 module_telegram
📄 schema
📄 style_css
📄 ui_components
📄 ui_js
📄 ui_pages
```
*(Apps Script mengurutkan abjad — itu normal)*

---

## 🟦 LANGKAH 5 — DEPLOY SEBAGAI WEB APP

> 🎯 **Ini adalah langkah paling penting.** Deploy artinya kita "membuka pintu toko" agar sistem bisa diakses lewat internet.

1. Di bagian kanan atas, klik tombol biru **`Deploy`**
2. Pilih **`Deployment baru`**
3. Klik ikon ⚙️ (gear) di sebelah tulisan "Pilih jenis"
4. Pilih **`Aplikasi web`**

5. Isi formulir yang muncul:
   | Field | Isi dengan |
   |-------|-----------|
   | Deskripsi | `ERP Sekolah Rakyat v4.0 - Produksi` |
   | Jalankan sebagai | `Saya (email@gmail.com)` |
   | Siapa yang memiliki akses | `Semua orang` |

6. Klik **`Deploy`**

7. **Otorisasi Akses** — Google akan meminta izin:
   - Klik **`Otorisasi akses`**
   - Pilih akun Gmail kamu
   - Akan muncul halaman "Google belum memverifikasi aplikasi ini"
   - Klik **`Lanjutan`**
   - Klik **`Buka ERP_Sekolah_Rakyat (tidak aman)`**
   - Klik **`Izinkan`**

   > ⚠️ **Jangan panik!** Pesan "tidak aman" itu muncul karena ini aplikasi baru yang belum diverifikasi Google. Ini NORMAL untuk semua Google Apps Script yang baru dibuat.

8. **Salin URL Web App yang muncul!**
   - Contoh: `https://script.google.com/macros/s/AKfycbxABC123DEF456/exec`
   - **Simpan URL ini di tempat aman** — ini adalah "alamat" sistem kamu
   - Klik **`Selesai`**

---

## 🟦 LANGKAH 6 — TEST SISTEM BERJALAN

Sekarang kita test apakah sistem sudah berjalan dengan benar.

### Test 1: Health Check
1. Buka tab browser baru
2. Tempel URL Web App kamu
3. Tambahkan `?action=health_check` di belakang URL
4. Hasilnya harus seperti ini:
   ```json
   {
     "status": "healthy",
     "version": "4.0.0",
     "database": "connected"
   }
   ```

### Test 2: Lihat Tampilan UI
1. Buka URL Web App kamu (tanpa parameter tambahan)
2. Kamu akan melihat tampilan dashboard dengan:
   - Sidebar navigasi di kiri
   - 5 stat card di atas
   - Bar chart
   - 6 tombol aksi cepat

### Test 3: Cek Database Otomatis Terbuat
1. Buka Google Drive: **drive.google.com**
2. Cari file bernama **`ERP_Sekolah_Rakyat`**
3. Buka file — kamu akan melihat 8 tab lembar kerja:
   - `Data_Transaksi`
   - `Data_Sekolah`
   - `Data_RKKAL`
   - `Data_Realisasi`
   - `System_Logs`
   - dan 3 tab lainnya

> 🎉 **Selamat!** Jika ketiga test berhasil, sistem sudah berjalan 100%!

---


## 🟦 LANGKAH 7 — DAFTARKAN SEKOLAH PERTAMA

Setiap sekolah punya "School ID" — seperti nomor KTP untuk sekolah dalam sistem.

### Cara Mendaftar via UI:
1. Buka URL sistem kamu
2. Klik menu **`🏛️ Daftar Sekolah`** di sidebar kiri
3. Isi form pendaftaran:
   | Field | Contoh Isian |
   |-------|-------------|
   | Nama Sekolah | `SDN 01 Jakarta Pusat` |
   | Kode Sekolah | `SDN01JKT` |
   | Email Bendahara | `bendahara@sekolah.sch.id` |
   | Kepala Sekolah | `Budi Santoso, S.Pd` |
   | Bendahara | `Siti Rahayu` |
   | Kota/Kabupaten | `Jakarta Pusat` |
   | Provinsi | `DKI Jakarta` |
4. Klik **`🏛️ Daftarkan Sekolah`**
5. **Catat School ID yang muncul!** Contoh: `SCH-1739812345678`

### Cara Mendaftar via URL (alternatif):
Salin URL ini, ganti isinya, dan buka di browser:
```
URL_ANDA?action=register_school&namaSekolah=SDN+01+Jakarta&email=bendahara@sekolah.sch.id&bendahara=Siti+Rahayu&kepalaSekolah=Budi+Santoso&kota=Jakarta+Pusat&provinsi=DKI+Jakarta
```

> 💡 **Catatan Guru:** School ID ini wajib disimpan. Gunakan satu School ID yang sama setiap kali mengakses sistem. Kalau lupa, cek di Google Sheets tab `Data_Sekolah`.

---

## 🟦 LANGKAH 8 — SETUP TELEGRAM BOT (OPSIONAL TAPI DISARANKAN)

Dengan Telegram Bot, setiap transaksi baru akan langsung kirim notifikasi ke HP Kepala Sekolah.

### 8a. Buat Bot Baru:
1. Buka Telegram di HP kamu
2. Cari: **`@BotFather`**
3. Ketik: `/newbot`
4. Ikuti instruksi:
   - Nama bot: `ERP Sekolah Saya`
   - Username: `erp_sekolah_saya_bot` *(harus diakhiri `_bot`)*
5. BotFather akan kirim **TOKEN** — contoh:
   ```
   7123456789:AABCdefGHIjklMNOpqrSTUvwxYZ123abc
   ```
6. **Simpan token ini!** Ini seperti password bot kamu.

### 8b. Cari Chat ID Kamu:
1. Di Telegram, cari: **`@userinfobot`**
2. Ketik: `/start`
3. Bot akan balas dengan ID kamu, contoh: `123456789`

### 8c. Simpan Token ke Sistem:
1. Di Google Apps Script, klik ikon ⚙️ **`Setelan proyek`** (kiri bawah)
2. Scroll ke bawah, klik **`Tambahkan properti skrip`**
3. Tambahkan properti pertama:
   - Properti: `TELEGRAM_BOT_TOKEN`
   - Nilai: *(tempel token dari BotFather)*
4. Klik **`+ Tambahkan properti`** lagi:
   - Properti: `TELEGRAM_ADMIN_CHAT`
   - Nilai: *(tempel Chat ID kamu)*
5. Klik **`Simpan properti skrip`**

### 8d. Hubungkan Bot ke Sistem:
1. Buka browser, ketik URL ini (ganti TOKEN dan URL_ANDA):
   ```
   https://api.telegram.org/botTOKEN_KAMU/setWebhook?url=URL_WEB_APP_KAMU?action=webhook
   ```
2. Harus muncul: `{"ok":true,"result":true}`

### 8e. Hubungkan Sekolah ke Bot:
1. Buka bot kamu di Telegram
2. Klik **`Start`** atau ketik `/start`
3. Ketik: `/daftar SCH-1739812345678` *(ganti dengan School ID kamu)*
4. Bot balas: ✅ Berhasil terhubung!

### Sekarang test notifikasi:
- Input satu transaksi → HP kamu harus menerima pesan Telegram otomatis!

---

## 🟦 LANGKAH 9 — SETUP JADWAL OTOMATIS

Sistem bisa berjalan otomatis setiap hari tanpa kamu sentuh.

### Fungsi Jadwal yang Tersedia:
| Fungsi | Jadwal | Aksi |
|--------|--------|------|
| `dailyMorningJobs` | Setiap hari jam 07.00 | Cek anggaran + kirim alert kalau hampir habis |
| `monthlyReportTrigger` | Setiap tanggal 1 | Kirim laporan bulanan ke Telegram |

### Cara Setup:
1. Di Apps Script, klik ikon ⏰ **`Pemicu`** (panel kiri, ikon jam)
2. Klik **`+ Tambahkan pemicu`** (pojok kanan bawah)
3. Setup Pemicu 1:
   - **Fungsi yang akan dijalankan:** `dailyMorningJobs`
   - **Sumber kejadian:** `Berbasis waktu`
   - **Jenis pemicu waktu:** `Timer hari`
   - **Waktu dalam sehari:** `07.00 - 08.00`
   - Klik **`Simpan`**
4. Klik **`+ Tambahkan pemicu`** lagi untuk Pemicu 2:
   - **Fungsi:** `monthlyReportTrigger`
   - **Sumber kejadian:** `Berbasis waktu`
   - **Jenis pemicu waktu:** `Timer bulan`
   - **Hari dalam bulan:** `1`
   - Klik **`Simpan`**

> ✅ Sistem sekarang berjalan otomatis! Tidak perlu dibuka setiap hari.

---

## 🟦 LANGKAH 10 — MULAI PAKAI!

Selamat! Sistem sudah siap. Ini cara pakai sehari-hari:

### Input Data SPJ (5 menit):
1. Buka URL sistem di browser atau HP
2. Klik **`📝 Input Data SPJ`** di sidebar
3. Isi form:
   - Nama Toko/Vendor
   - Kode & Uraian MAK
   - Uraian Pembayaran
   - Tahun & Bulan
   - Jumlah (terbilang muncul otomatis!)
4. Klik **`💾 Simpan Data SPJ`**
5. Notifikasi Telegram terkirim otomatis ke Kepala Sekolah ✅

### Lihat Laporan (2 menit):
1. Klik **`📤 Export Laporan`** di sidebar
2. Pilih **SPJ** atau **Realisasi**
3. Klik tombol export
4. Link file Google Sheets muncul → klik **`Download Excel`**

---


---

## 🔧 TROUBLESHOOTING — KALAU ADA MASALAH

### ❌ Muncul: "You do not have permission"
**Penyebab:** Deployment belum diatur untuk publik
**Solusi:**
1. Klik `Deploy` → `Kelola deployment`
2. Klik ikon pensil (edit)
3. Ubah "Siapa yang memiliki akses" → **`Semua orang`**
4. Klik `Deploy`

---

### ❌ Muncul: "ReferenceError: Controller is not defined"
**Penyebab:** Urutan file salah
**Solusi:**
1. Di panel kiri Apps Script, klik kanan pada nama file
2. Pilih **`Ganti urutan`** atau **`Pindah ke atas/bawah`**
3. Pastikan `schema` dan `database` ada di atas semua file lain
4. `Code` harus ada di **paling bawah**

---

### ❌ Muncul: "Exception: Unexpected error"
**Penyebab:** Google sedang maintenance / quota habis
**Solusi:** Tunggu 5-10 menit, coba lagi

---

### ❌ Database tidak terbuat di Google Drive
**Penyebab:** Script belum pernah dijalankan
**Solusi:** Buka URL: `URL_SISTEM_KAMU?action=init_db`

---

### ❌ Halaman putih / tidak ada tampilan
**Penyebab:** File UI belum tersalin atau ada typo nama file
**Solusi:**
1. Pastikan 4 file UI sudah ada: `style_css`, `ui_components`, `ui_js`, `ui_pages`
2. Cek nama file — tidak boleh ada spasi
3. Lakukan deployment ulang

---

### ❌ Telegram tidak menerima notifikasi
**Penyebab:** Token salah atau webhook belum di-set
**Solusi:**
1. Cek `TELEGRAM_BOT_TOKEN` di Script Properties
2. Ulangi langkah webhook di Langkah 8d
3. Pastikan kamu sudah `/daftar SCH-ID` di bot

---

## 📱 CARA AKSES DI HP (MOBILE)

1. Buka browser HP kamu (Chrome direkomendasikan)
2. Masukkan URL sistem
3. Tampilan akan otomatis menyesuaikan layar HP
4. Untuk navigasi: ketuk ikon **☰** di kiri atas
5. Sidebar akan muncul dari kiri
6. Pilih menu yang diinginkan

> 💡 **Tips:** Simpan URL sistem di bookmark browser HP, atau tambahkan ke Home Screen untuk akses lebih cepat.

---

## 🔄 CARA UPDATE KODE JIKA ADA VERSI BARU

Kalau gurumu merilis update:

1. Cek file mana yang diperbarui di GitHub
2. Buka file tersebut → klik `Raw` → salin semua
3. Di Apps Script, buka file yang sama → tempel kode baru
4. Klik **`Deploy`** → **`Kelola deployment`**
5. Edit deployment yang ada
6. Ubah "Versi" → pilih **`Versi baru`**
7. Klik **`Deploy`**

> ⚠️ Jangan buat deployment baru — edit yang sudah ada agar URL tidak berubah.

---

## 📊 RINGKASAN SEMUA FITUR SISTEM

| Fitur | Menu | Keterangan |
|-------|------|-----------|
| Dashboard & Statistik | 📊 Dashboard | Tampilan data real-time |
| Input Data SPJ | 📝 Input Data SPJ | Form + terbilang otomatis |
| Lihat Semua Transaksi | 🗂️ Lihat Transaksi | Tabel + search + verifikasi |
| Upload RKKAL | 📁 Upload RKKAL | Import file CSV pagu anggaran |
| Realisasi Anggaran | 📈 Realisasi | Progress per kode MAK |
| Export SPJ Excel | 📤 Export Laporan | Laporan format resmi |
| Export Realisasi | 📤 Export Laporan | Realisasi Jan-Des |
| Daftar Sekolah | 🏛️ Daftar Sekolah | Registrasi & School ID |
| Pengaturan Sistem | ⚙️ Pengaturan | School ID + Diagnosa |
| Notifikasi Telegram | Otomatis | Setiap transaksi + alert anggaran |
| Laporan Bulanan | Otomatis | Terkirim tanggal 1 setiap bulan |
| Self-Healing DB | Otomatis | Database diperbaiki sendiri |
| Anti Double Input | Otomatis | Rate limiting 5 detik |

---

## 🎓 PESAN DARI GURU

> "Kamu sudah berhasil memasang sistem ERP keuangan profesional yang biasanya membutuhkan jutaan rupiah dan tim developer berbayar. Sistem ini sepenuhnya gratis, berjalan di infrastruktur Google yang terpercaya, dan bisa dipakai oleh ratusan sekolah sekaligus.
>
> Yang terpenting bukan seberapa canggih sistemnya — tapi seberapa konsisten kamu menggunakannya. Input data setiap hari, pantau anggaran setiap minggu, dan ekspor laporan setiap bulan.
>
> Jika ada yang perlu ditambah atau diubah sesuai kebutuhan sekolahmu, lanjutkan percakapan dengan gurumu. Sistem ini masih bisa berkembang lebih jauh."

---

*Tutorial ini dibuat oleh Kiro AI Developer*
*Versi 4.0 | Repository: https://github.com/waliasrama43-rosa/bendahara*
*Branch: fase-2-4-erp-complete*
