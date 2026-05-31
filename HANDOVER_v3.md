# HANDOVER v3 - ERP Keuangan Sekolah Rakyat

Dokumen serah terima teknis dari developer kepada klien dan developer masa depan.

---

## 1. Ringkasan Proyek

**ERP Keuangan Sekolah Rakyat** adalah sistem informasi manajemen keuangan berbasis web yang dirancang khusus untuk Sekolah Rakyat Indonesia. Sistem ini mendigitalisasi seluruh alur pengelolaan anggaran mulai dari perencanaan (RKKAL), pelaksanaan belanja (Rekap SPJ), hingga pelaporan realisasi (AKRURAL).

### Untuk Siapa?

- **Bendahara Sekolah** - input dan kelola data keuangan harian
- **Tenaga Kependidikan (Tendik)** - input transaksi dan rekap belanja
- **Admin** - kelola konfigurasi, user, backup, dan laporan

### Masalah yang Diselesaikan

1. Proses pencatatan keuangan sekolah yang sebelumnya manual (Excel terpisah-pisah) menjadi terintegrasi dalam satu aplikasi web.
2. Pembuatan kode MAK (Mata Anggaran Kegiatan) otomatis sesuai format resmi pemerintah.
3. Perhitungan realisasi anggaran real-time (Pagu vs Realisasi vs Sisa).
4. Export laporan dalam format standar yang siap dilaporkan (AKRURAL, Rekap SPJ, RKKAL).
5. Kalkulator pajak terintegrasi (PPN, PPh 21/22/23).

---

## 2. Arsitektur Sistem

```
+-------------------+       +----------------------+       +-------------------+
|   Browser User    | <---> | Google Apps Script    | <---> | Google Sheets     |
|   (index.html)    |       | Web App (Code.gs)    |       | (Database)        |
+-------------------+       +----------------------+       +-------------------+
        |                            |
        |  google.script.run         |  SpreadsheetApp
        |  (async RPC)               |  PropertiesService
        |                            |  DriveApp
        v                            v
  Single Page App            Server-side Functions
  (vanilla JS + CSS)         (ES5 JavaScript)
```

### Komponen Utama

| Komponen | File | Fungsi |
|----------|------|--------|
| Backend | `standalone/Code.gs` | Semua logika server, API, database |
| Frontend | `standalone/index.html` | UI lengkap (HTML + CSS + JS dalam 1 file) |
| Manifest | `standalone/appsscript.json` | Konfigurasi Apps Script |

### Arsitektur Single-File

Seluruh aplikasi terdiri dari **2 file saja**:
- `Code.gs` - backend (62+ fungsi API + helper)
- `index.html` - frontend (SPA dengan routing client-side)

Tidak ada framework, tidak ada build tool, tidak ada dependency eksternal.

### Teknologi

- **Runtime**: Google Apps Script (V8 Engine, tapi kode ditulis ES5)
- **Database**: Google Sheets (via SpreadsheetApp)
- **Auth**: Google Account (Session.getActiveUser())
- **Storage**: Google Drive (untuk backup dan bukti transaksi)
- **Frontend**: Vanilla JavaScript, Google Charts, CSS custom

---

## 3. Alur Bisnis

```
RKKAL (Pagu/Rencana)
        |
        v
    RAB (Rincian Anggaran Biaya)
        |
        v
Rekap SPJ (Realisasi Belanja)
        |
        v
Realisasi Anggaran (Pagu vs Realisasi vs Sisa)
        |
        v
Export AKRURAL (Laporan Resmi)
```

### Penjelasan Alur

1. **RKKAL (Arus Masuk)** - Admin/Bendahara menginput rencana anggaran per kegiatan dan kode akun. Ini adalah "pagu" atau batas anggaran yang tersedia.
2. **RAB** - Rincian Anggaran Biaya dibuat per kegiatan/bulan sebagai perencanaan detail.
3. **Rekap SPJ (Arus Keluar)** - Setiap belanja yang terjadi dicatat sebagai transaksi dengan tanggal, toko, jumlah, dan kode MAK lengkap.
4. **Realisasi** - Sistem otomatis menghitung perbandingan antara Pagu (RKKAL) vs Realisasi (Rekap SPJ) per kode akun dan per kegiatan.
5. **Export AKRURAL** - Laporan realisasi dalam format CSV standar yang sesuai dengan format pelaporan resmi.

---

## 4. Daftar Fitur Lengkap

### 4.1 Login Google Account & Role Management
- Autentikasi menggunakan Google Account (tidak ada form login terpisah)
- User pertama otomatis menjadi Admin
- Dua role: **Admin** (akses penuh) dan **Tendik** (input data saja)
- Manajemen user: tambah, edit role, nonaktifkan

### 4.2 Dashboard dengan 3 Google Charts
- Kartu ringkasan: Total Pagu, Total Realisasi, Sisa Anggaran, % Serapan
- Chart 1: Pie chart serapan anggaran
- Chart 2: Bar chart realisasi per kegiatan
- Chart 3: Line chart tren bulanan
- Jumlah item RKKAL, Rekap, dan status verifikasi

### 4.3 RKKAL (Rencana Kerja & Anggaran Kegiatan)
- **Input Manual** - form multi-baris dengan dropdown kegiatan, akun, satuan
- **Daftar RKKAL** - tabel dengan filter, edit inline, hapus
- **Upload CSV** - import massal dari file CSV dengan validasi otomatis

### 4.4 RAB (Rincian Anggaran Biaya)
- **Buat RAB** - form per kegiatan/bulan dengan item-item detail
- **Daftar RAB** - list semua RAB yang sudah dibuat
- **Export Format Resmi** - download RAB dalam format CSV terstruktur

### 4.5 Rekap SPJ (Surat Pertanggungjawaban)
- **Input Transaksi** - form belanja dengan preview Kode MAK otomatis
- **Daftar Rekap** - tabel filter tahun/bulan/jenjang dengan aksi lengkap
- **Upload CSV** - import massal transaksi belanja
- **Verifikasi** - setujui/tolak transaksi (Admin only)
- **Kwitansi** - cetak kwitansi per transaksi
- **Upload Bukti** - lampirkan foto/scan bukti belanja (disimpan di Google Drive)

### 4.6 Realisasi Anggaran
- Group by Kode Akun: total pagu, realisasi, sisa, % per akun
- Group by Kegiatan: total pagu, realisasi, sisa, % per kegiatan
- Filter berdasarkan tahun anggaran dan jenjang

### 4.7 Kalkulator Pajak
- **PPN** - perhitungan 11% dari DPP
- **PPh 21** - pajak penghasilan karyawan
- **PPh 22** - pajak pengadaan barang (1.5%)
- **PPh 23** - pajak jasa (2%)

### 4.8 Export Laporan
- **Rekap SPJ CSV** - seluruh transaksi belanja
- **RKKAL CSV** - seluruh rencana anggaran
- **Realisasi AKRURAL** - format standar pelaporan pemerintah (hierarki kegiatan > akun > item)

### 4.9 Template Export & Import
- Konfigurasi kolom export yang bisa di-custom
- Mapping kolom import untuk format CSV yang berbeda-beda
- CRUD template (simpan, edit, hapus)

### 4.10 Kode Akun Library
- CRUD kode akun (tambah, edit, nonaktifkan)
- 18 kode akun default sudah tersedia
- Bisa ditambah sesuai kebutuhan satker

### 4.11 Kegiatan Library
- CRUD kegiatan (A sampai M = 13 kegiatan)
- Bisa ditambah/diubah sesuai struktur organisasi

### 4.12 Prefix MAK Library
- CRUD prefix kode MAK (3 prefix default)
- Format: `PREFIX.KEGIATAN.KODE_AKUN`

### 4.13 Manajemen User
- Daftar semua user yang terdaftar
- Tambah user baru dengan email dan role
- Ubah role (Admin/Tendik)
- Nonaktifkan user

### 4.14 Tema & Tampilan
- Color picker untuk warna utama aplikasi
- Upload logo sekolah (disimpan sebagai base64 di Config_UI)
- Kustomisasi tampilan tanpa ubah kode

### 4.15 Setup & Database
- **Health Check** - cek semua sheet dan kolom ada
- **Repair** - auto-create sheet/kolom yang hilang
- **Backup Harian** - trigger otomatis jam 2 pagi
- **Backup Manual** - copy spreadsheet ke folder backup di Drive
- **Restore** - kembalikan data dari backup sebelumnya

### 4.16 Diagnostik Sistem
- Info runtime (spreadsheet URL, jumlah sheet, total baris)
- Daftar trigger aktif
- Status kesehatan database
- Log sistem

---

## 5. Daftar API (62 Functions)

### Autentikasi & Bootstrap

| Fungsi | Deskripsi |
|--------|-----------|
| `apiGetCurrentUser()` | Mendapatkan email dan role user yang sedang login |
| `apiGetRefs()` | Mengambil data referensi (akun, kegiatan, prefix) yang aktif |
| `apiBootstrap()` | Inisialisasi awal: refs + summary + schoolId + spreadsheetUrl |

### RKKAL (Arus Masuk / Pagu)

| Fungsi | Deskripsi |
|--------|-----------|
| `apiSaveRKKAL(payload)` | Simpan satu atau banyak baris RKKAL |
| `apiGetRKKAL(payload)` | Ambil data RKKAL dengan filter tahun/jenjang |
| `apiUpdateRKKAL(payload)` | Update baris RKKAL berdasarkan ID |
| `apiDeleteRKKAL(payload)` | Hapus baris RKKAL berdasarkan ID |
| `apiUploadRKKALCsv(payload)` | Import RKKAL dari string CSV |
| `apiExportRKKAL(payload)` | Export seluruh RKKAL ke format CSV |

### Rekap SPJ (Arus Keluar / Realisasi)

| Fungsi | Deskripsi |
|--------|-----------|
| `apiSaveRekap(payload)` | Simpan transaksi belanja baru |
| `apiGetRekap(payload)` | Ambil data rekap dengan filter |
| `apiUpdateRekap(payload)` | Update transaksi berdasarkan ID |
| `apiDeleteRekap(payload)` | Hapus transaksi berdasarkan ID |
| `apiVerifyRekap(payload)` | Setujui/tolak transaksi (Admin) |
| `apiUploadBuktiRekap(payload)` | Upload bukti belanja ke Google Drive |
| `apiUploadRekapCsv(payload)` | Import rekap dari string CSV |
| `apiExportRekap(payload)` | Export seluruh rekap ke format CSV |

### Dashboard & Realisasi

| Fungsi | Deskripsi |
|--------|-----------|
| `apiGetDashboard(payload)` | Data ringkasan: pagu, realisasi, sisa, serapan, count |
| `apiGetRealisasi(payload)` | Data realisasi grouped by akun atau kegiatan |
| `apiGetChartData(payload)` | Data untuk 3 Google Charts di dashboard |

### RAB (Rincian Anggaran Biaya)

| Fungsi | Deskripsi |
|--------|-----------|
| `apiSaveRAB(payload)` | Simpan RAB baru |
| `apiGetRABList(payload)` | Daftar semua RAB |
| `apiGetRAB(payload)` | Ambil detail satu RAB berdasarkan ID |
| `apiDeleteRAB(payload)` | Hapus RAB berdasarkan ID |
| `apiExportRAB(payload)` | Export RAB ke format CSV resmi |
| `apiExportRealisasiAKRURAL(payload)` | Export realisasi format AKRURAL |

### Sekolah

| Fungsi | Deskripsi |
|--------|-----------|
| `apiGetSchool(payload)` | Ambil data profil sekolah |
| `apiSaveSchool(payload)` | Simpan/update profil sekolah |

### Manajemen User

| Fungsi | Deskripsi |
|--------|-----------|
| `apiGetUsers()` | Daftar semua user terdaftar |
| `apiAddUser(payload)` | Tambah user baru (Admin only) |
| `apiUpdateUser(payload)` | Update role/status user (Admin only) |
| `apiDeleteUser(payload)` | Hapus user (Admin only) |

### Konfigurasi Kode Akun

| Fungsi | Deskripsi |
|--------|-----------|
| `apiGetConfigAkun()` | Daftar kode akun dari Config_Akun |
| `apiAddConfigAkun(payload)` | Tambah kode akun baru |
| `apiUpdateConfigAkun(payload)` | Update kode akun |
| `apiDeleteConfigAkun(payload)` | Hapus kode akun |

### Konfigurasi Kegiatan

| Fungsi | Deskripsi |
|--------|-----------|
| `apiGetConfigKegiatan()` | Daftar kegiatan dari Config_Kegiatan |
| `apiAddConfigKegiatan(payload)` | Tambah kegiatan baru |
| `apiUpdateConfigKegiatan(payload)` | Update kegiatan |
| `apiDeleteConfigKegiatan(payload)` | Hapus kegiatan |

### Konfigurasi Prefix MAK

| Fungsi | Deskripsi |
|--------|-----------|
| `apiGetConfigPrefix()` | Daftar prefix dari Config_Prefix |
| `apiAddConfigPrefix(payload)` | Tambah prefix baru |
| `apiUpdateConfigPrefix(payload)` | Update prefix |
| `apiDeleteConfigPrefix(payload)` | Hapus prefix |

### Template Export & Import

| Fungsi | Deskripsi |
|--------|-----------|
| `apiGetExportTemplates()` | Daftar template export |
| `apiSaveExportTemplate(payload)` | Simpan template export baru |
| `apiDeleteExportTemplate(payload)` | Hapus template export |
| `apiGetImportTemplates()` | Daftar template import |
| `apiSaveImportTemplate(payload)` | Simpan template import baru |
| `apiDeleteImportTemplate(payload)` | Hapus template import |

### UI & Tema

| Fungsi | Deskripsi |
|--------|-----------|
| `apiGetUIConfig()` | Ambil konfigurasi tampilan (warna, logo) |
| `apiSaveUIConfig(payload)` | Simpan konfigurasi tampilan |
| `apiUploadLogo(payload)` | Upload logo sekolah (base64) |

### Database & Backup

| Fungsi | Deskripsi |
|--------|-----------|
| `apiSetupDatabase()` | Setup/repair struktur database (Admin) |
| `apiCheckDatabaseHealth()` | Cek kesehatan semua sheet |
| `apiCreateBackup()` | Buat backup manual ke Google Drive (Admin) |
| `apiListBackups()` | Daftar backup yang tersedia (Admin) |
| `apiRestoreBackup(payload)` | Restore dari backup (Admin) |
| `apiSetupDailyBackup()` | Aktifkan trigger backup harian jam 2 pagi (Admin) |
| `apiRemoveDailyBackup()` | Nonaktifkan trigger backup harian (Admin) |

### Utilitas

| Fungsi | Deskripsi |
|--------|-----------|
| `apiDiagnostics()` | Info diagnostik sistem |
| `apiSeedDummy(payload)` | Masukkan data contoh untuk testing |
| `selfTest()` | Test penyimpanan dari editor Apps Script |
| `dailyBackup()` | Fungsi yang dipanggil trigger harian |

---

## 6. Struktur Database (Google Sheets)

Semua data disimpan dalam satu Google Spreadsheet bernama `ERP_Sekolah_Rakyat` yang otomatis dibuat saat pertama kali diakses.

### Data_RKKAL (Arus Masuk / Pagu)

| Kolom | Deskripsi |
|-------|-----------|
| ID_RKKAL | Primary key (auto-generated, prefix "RKK") |
| Tahun_Anggaran | Tahun anggaran (2025, 2026, dst) |
| Jenjang | SD / SMP / SMA/SMK |
| Kode_Kegiatan | Huruf kegiatan (A-M) |
| Nama_Kegiatan | Nama lengkap kegiatan |
| Kode_Akun | 6 digit kode MAK (521211, dll) |
| Nama_Akun | Nama lengkap akun belanja |
| Uraian | Deskripsi item belanja |
| Volume | Jumlah/kuantitas |
| Satuan | OK, OH, PKT, KEG, dll |
| Harga_Satuan | Harga per satuan (Rp) |
| Jumlah_Biaya | Volume x Harga_Satuan |
| School_ID | ID sekolah (multi-tenant) |
| Timestamp | Waktu input |

### Data_Rekap (Arus Keluar / SPJ)

| Kolom | Deskripsi |
|-------|-----------|
| ID_Rekap | Primary key (auto-generated, prefix "RKP") |
| Tanggal_Transaksi | Tanggal belanja (ISO date) |
| Nama_Toko | Nama toko/vendor |
| Kode_MAK | Kode MAK lengkap (mis. DQ.7936.SBE.101.303.A.522151) |
| Kode_Akun | 6 digit kode akun |
| Nama_Akun | Nama akun belanja |
| Kode_Kegiatan | Huruf kegiatan (A-M) |
| Uraian_Pembayaran | Deskripsi pembayaran |
| Tahun_Anggaran | Tahun anggaran |
| Bulan_Pelaksanaan | Bulan pelaksanaan belanja |
| Jumlah | Nominal belanja (Rp) |
| Terbilang | Jumlah dalam kata-kata (otomatis) |
| Jenjang | SD / SMP / SMA/SMK |
| Status_Verifikasi | Pending / Disetujui / Ditolak |
| Bukti_URL | URL file bukti di Google Drive |
| School_ID | ID sekolah |
| Timestamp | Waktu input |

### Data_RAB (Rincian Anggaran Biaya)

| Kolom | Deskripsi |
|-------|-----------|
| ID_RAB | Primary key (auto-generated, prefix "RAB") |
| Tahun_Anggaran | Tahun |
| Bulan | Bulan perencanaan |
| Jenjang | SD / SMP / SMA/SMK |
| Nama_Kegiatan | Nama kegiatan |
| Kode_Program | Kode program/kegiatan |
| Items_JSON | Detail item dalam format JSON string |
| Total | Total biaya RAB |
| School_ID | ID sekolah |
| Timestamp | Waktu input |

### Data_Transaksi (Legacy - kompatibilitas data lama)

| Kolom | Deskripsi |
|-------|-----------|
| ID_Transaksi | Primary key |
| Kode_Anggaran | Kode anggaran lama |
| Nama_Kegiatan | Nama kegiatan |
| Jumlah_Rupiah | Nominal |
| Timestamp | Waktu |
| Status_Verifikasi | Status |
| School_ID | ID sekolah |
| Kode_Program | Kode program |
| Kode_Komponen | Kode komponen |
| Jenis_Belanja | Jenis belanja |
| Kuantitas | Kuantitas |
| Harga_Satuan | Harga satuan |
| Bulan | Bulan |
| Jenjang | Jenjang |
| Bukti_URL | URL bukti |

### Data_Sekolah (Profil Sekolah)

| Kolom | Deskripsi |
|-------|-----------|
| School_ID | Primary key |
| Nama_Sekolah | Nama sekolah |
| Alamat_Sekolah | Alamat lengkap |
| Kepala_Sekolah | Nama kepala sekolah |
| Bendahara | Nama bendahara |
| Status_Aktif | Aktif/Tidak |
| Tanggal_Daftar | Tanggal registrasi |
| Plan_Type | Tipe subscription |

### Config_Users (Manajemen User)

| Kolom | Deskripsi |
|-------|-----------|
| Email | Email Google user |
| Role | Admin / Tendik |
| Name | Nama tampilan |
| Status | Active / Inactive |

### Config_Akun (Library Kode Akun)

| Kolom | Deskripsi |
|-------|-----------|
| Kode | 6 digit kode akun |
| Nama | Nama lengkap akun |
| Aktif | Y / N |

### Config_Kegiatan (Library Kegiatan)

| Kolom | Deskripsi |
|-------|-----------|
| Kode | Huruf kegiatan (A-M) |
| Nama | Nama lengkap kegiatan |
| Aktif | Y / N |

### Config_Prefix (Library Prefix MAK)

| Kolom | Deskripsi |
|-------|-----------|
| Kode | Prefix lengkap (mis. DQ.7936.SBE.101.303) |
| Nama | Deskripsi prefix |
| Aktif | Y / N |

### Config_Export (Template Export)

| Kolom | Deskripsi |
|-------|-----------|
| TemplateName | Nama template |
| Type | Tipe export (RKKAL/Rekap/RAB) |
| Columns | Daftar kolom (JSON) |
| HeaderRow | Label header baris pertama |

### Config_Import (Template Import)

| Kolom | Deskripsi |
|-------|-----------|
| TemplateName | Nama template |
| Type | Tipe import (RKKAL/Rekap) |
| Mapping | Mapping kolom CSV ke field (JSON) |

### Config_UI (Tampilan & Tema)

| Kolom | Deskripsi |
|-------|-----------|
| Key | Nama setting (primaryColor, logo, schoolName) |
| Value | Nilai setting |

### System_Logs (Log Sistem)

| Kolom | Deskripsi |
|-------|-----------|
| Log_ID | Primary key |
| Timestamp | Waktu log |
| Level | INFO / WARN / ERROR |
| Module | Nama modul |
| Message | Pesan log |
| Details | Detail tambahan (JSON) |

---

## 7. Kode Akun Default (18 Akun)

| No | Kode | Nama Akun |
|----|------|-----------|
| 1 | 521111 | Belanja Keperluan Perkantoran |
| 2 | 521112 | Belanja Pengadaan Bahan Makanan |
| 3 | 521113 | Belanja Penambah Daya Tahan Tubuh |
| 4 | 521211 | Belanja Bahan |
| 5 | 521213 | Belanja Honor Output Kegiatan |
| 6 | 521219 | Belanja Barang Non Operasional Lainnya |
| 7 | 521252 | Belanja Peralatan dan Mesin - Ekstrakomptabel |
| 8 | 521811 | Belanja Barang Persediaan Barang Konsumsi |
| 9 | 522111 | Belanja Langganan Listrik |
| 10 | 522112 | Belanja Langganan Telepon |
| 11 | 522113 | Belanja Langganan Air |
| 12 | 522141 | Belanja Sewa |
| 13 | 522151 | Belanja Jasa Profesi |
| 14 | 522191 | Belanja Jasa Lainnya |
| 15 | 523111 | Belanja Pemeliharaan Gedung dan Bangunan |
| 16 | 523121 | Belanja Pemeliharaan Peralatan dan Mesin |
| 17 | 524111 | Belanja Perjalanan Dinas Biasa |
| 18 | 524113 | Belanja Perjalanan Dinas Dalam Kota |

---

## 8. Kegiatan Default (13 Kegiatan)

| Kode | Nama Kegiatan |
|------|---------------|
| A | Kegiatan Belajar Mengajar |
| B | Praktikum Komunitas |
| C | Kegiatan Krida |
| D | Karya Ilmiah dan Latihan Olahraga Seni |
| E | Koordinasi dan Konsultasi Sekolah Rakyat |
| F | Operasional Perkantoran |
| G | Perlengkapan Operasional Sekolah |
| H | Kebutuhan Asrama |
| I | Pengasramaan Siswa |
| J | Pengasramaan Guru dan Tenaga Pendidik |
| K | Peralatan Makan Siswa |
| L | Perlengkapan Sekolah |
| M | Dukungan Penyelenggaraan Operasional Sekolah Rakyat |

---

## 9. Prefix MAK Default (3 Prefix)

| Kode | Nama / Deskripsi |
|------|------------------|
| DQ.7936.SBE.101.303 | SR Menengah Pertama (SBE) |
| DQ.7936.SBB.101.303 | SR Menengah Atas (SBB) |
| WA.7937.EBA.994.002 | Operasional Perkantoran (EBA) |

Format Kode MAK lengkap: `<PREFIX>.<KODE_KEGIATAN>.<KODE_AKUN>`

Contoh: `DQ.7936.SBE.101.303.A.522151` artinya:
- Prefix: DQ.7936.SBE.101.303 (SR Menengah Pertama)
- Kegiatan: A (Kegiatan Belajar Mengajar)
- Akun: 522151 (Belanja Jasa Profesi)

---

## 10. Cara Deploy

### Prasyarat
- Akun Google (Gmail/Workspace)
- Akses ke https://script.google.com

### Langkah Deploy

1. Buka https://script.google.com dan login.
2. Klik **New Project**.
3. Ganti nama project menjadi "ERP Keuangan Sekolah Rakyat".
4. Hapus isi file `Code.gs` default, paste seluruh isi `standalone/Code.gs`.
5. Buat file HTML baru: klik **+** > **HTML** > beri nama `index`.
6. Paste seluruh isi `standalone/index.html` ke file tersebut.
7. Klik **Deploy** > **New deployment**.
8. Pilih type: **Web app**.
9. Konfigurasi:
   - Execute as: **Me**
   - Who has access: **Anyone**
10. Klik **Deploy**, lalu **Authorize** saat diminta.
11. Copy URL Web App yang muncul.
12. Buka URL tersebut di browser - Anda otomatis menjadi Admin.
13. Jalankan `selfTest` dari editor untuk verifikasi (Run > selfTest).
14. Aktifkan backup harian dari menu Setup & Database di aplikasi.

---

## 11. Cara Maintenance

### Menambah Kode Akun Baru
1. Buka aplikasi sebagai Admin.
2. Navigasi ke menu **Kode Akun** (di sidebar).
3. Klik **Tambah Akun Baru**.
4. Isi kode (6 digit) dan nama akun.
5. Klik Simpan - akun langsung tersedia di dropdown.

### Menambah Kegiatan Baru
1. Navigasi ke menu **Kegiatan**.
2. Klik **Tambah Kegiatan**.
3. Isi kode (huruf) dan nama kegiatan.
4. Simpan.

### Mengubah Tema/Warna
1. Navigasi ke menu **Tema & Tampilan**.
2. Pilih warna utama menggunakan color picker.
3. Upload logo sekolah (opsional, format gambar).
4. Klik Simpan - tampilan langsung berubah.

### Backup Manual
1. Navigasi ke **Setup & Database**.
2. Klik **Buat Backup Sekarang**.
3. Backup berupa copy spreadsheet di folder `Backup_ERP_Sekolah_Rakyat` di Google Drive Anda.

### Restore dari Backup
1. Navigasi ke **Setup & Database**.
2. Klik **Lihat Daftar Backup**.
3. Pilih backup yang ingin di-restore.
4. Klik **Restore** - data akan dikembalikan ke kondisi saat backup dibuat.
5. **PERHATIAN**: restore akan menimpa SEMUA data saat ini!

### Menambah User Baru (Tendik)
1. Navigasi ke **Manajemen User**.
2. Klik **Tambah User**.
3. Masukkan email Google dan pilih role (Admin/Tendik).
4. User bisa langsung mengakses aplikasi dengan email tersebut.

### Membersihkan Data Dummy / Data Contoh

Jika sebelumnya Anda menjalankan `apiSeedDummy` atau `selfTest` untuk mencoba sistem, data contoh tersebut perlu dibersihkan sebelum diisi data sesungguhnya. Berikut caranya:

#### Cara 1: Hapus Langsung di Google Sheets (Paling Mudah)

1. Buka Google Sheets database (URL bisa dilihat dari menu Diagnostik Sistem di aplikasi, atau dari `selfTest` result).
2. Buka sheet **Data_RKKAL**:
   - Seleksi semua baris data (baris 2 ke bawah, baris 1 adalah header).
   - Klik kanan > **Delete rows**.
3. Ulangi untuk sheet **Data_Rekap**.
4. Ulangi untuk sheet **Data_RAB** jika ada data dummy.
5. **JANGAN hapus baris header (baris 1)** di setiap sheet.

#### Cara 2: Hapus via Aplikasi

1. Buka menu **RKKAL** > tab **Daftar RKKAL**.
2. Hapus satu per satu item dummy (klik tombol hapus di setiap baris).
3. Buka menu **Rekap SPJ** > tab **Daftar Rekap**.
4. Hapus satu per satu transaksi dummy.

#### Cara 3: Reset Total dengan Backup Kosong

1. Pastikan backup harian sudah jalan (agar data aman jika salah).
2. Buka Google Sheets database.
3. Pada sheet Data_RKKAL, Data_Rekap, dan Data_RAB:
   - Seleksi semua baris DATA (bukan header).
   - Delete rows.
4. Sekarang database bersih dan siap diisi data sesungguhnya.

#### Tips Identifikasi Data Dummy

- Data dari `selfTest` memiliki uraian "SELF TEST RKKAL" dan nama toko "SELF TEST TOKO".
- Data dari `apiSeedDummy` memiliki uraian yang mengandung kata "Dummy" atau "Test".
- Filter kolom Uraian di Google Sheets untuk menemukan data dummy.

#### Catatan Penting

- Setelah membersihkan data dummy, JANGAN jalankan `selfTest` atau `apiSeedDummy` lagi di environment produksi.
- Buat backup sebelum menghapus data, untuk berjaga-jaga.
- Sheet Config_Users, Config_Akun, Config_Kegiatan, dan Config_Prefix TIDAK perlu dihapus (ini konfigurasi, bukan data dummy).

---

## 12. Catatan Teknis untuk Developer

### Sintaks ES5 (WAJIB)

Google Apps Script mendukung V8 Engine, tetapi kode ini ditulis dalam ES5 untuk kompatibilitas maksimal:
- Gunakan `var` (bukan `let`/`const`)
- Gunakan `function(){}` (bukan arrow function `=>`)
- Tidak ada template literal (gunakan string concatenation)
- Tidak ada destructuring, spread operator, atau async/await
- Tidak ada `class` (gunakan object literal dan prototype)

### Single-File Constraint

- Seluruh backend ada dalam **satu file** `Code.gs`.
- Seluruh frontend ada dalam **satu file** `index.html`.
- Jangan pisahkan ke banyak file - ini disengaja agar deployment sederhana (copy-paste 2 file saja).

### Google Apps Script Limitations

- **Waktu eksekusi maksimal**: 6 menit per pemanggilan fungsi.
- **Kuota harian**: 90 menit total execution time (akun gratis).
- **Ukuran file HTML**: maksimal 500KB (termasuk CSS dan JS inline).
- **google.script.run**: komunikasi frontend-backend bersifat async, satu arah (tidak bisa push dari server).
- **Session**: `Session.getActiveUser().getEmail()` hanya bekerja jika Web App di-deploy dengan "Execute as: Me" dan "Anyone" access.
- **Tidak ada WebSocket**: semua update harus polling atau reload.

### Cara Auth Bekerja

1. User mengakses URL Web App.
2. Google meminta login jika belum (OAuth bawaan Google).
3. `Session.getActiveUser().getEmail()` mengembalikan email user.
4. Sistem cek di sheet `Config_Users`:
   - Jika belum ada user sama sekali, user pertama otomatis jadi Admin.
   - Jika email ditemukan dan status Active, return role-nya.
   - Jika email tidak ditemukan atau Inactive, akses ditolak.
5. Fungsi `_withAuth('Admin', fn)` memastikan hanya Admin yang bisa menjalankan operasi tertentu.

### Config Caching

- Konfigurasi (Config_Akun, Config_Kegiatan, Config_Prefix) di-cache menggunakan `_configCache` object selama satu sesi eksekusi server.
- Cache otomatis invalidated di setiap request baru (karena setiap `google.script.run` call adalah eksekusi baru).
- Fungsi `_loadConfigAkun()`, `_loadConfigKegiatan()`, `_loadConfigPrefix()` membaca dari sheet dan cache hasilnya.
- Jika data config berubah (tambah/hapus akun), cache otomatis fresh di request berikutnya.

### Konvensi Penamaan

- Fungsi API publik: prefix `api` (contoh: `apiSaveRKKAL`)
- Fungsi helper private: prefix `_` (contoh: `_buildKodeMak`)
- Semua API return format: `{ ok: true/false, ... }` atau `{ ok: false, error: "pesan" }`
- ID auto-generated dengan format: `<PREFIX>_<timestamp>_<random>` (fungsi `_genId`)

### Database Object Methods

```javascript
Database.init()              // Inisialisasi spreadsheet
Database.getDatabase()       // Return SpreadsheetApp object
Database.ensureSheets(ss)    // Auto-create semua sheet yang kurang
Database.insert(sheet, obj)  // Insert 1 row
Database.readAll(sheet)      // Baca semua data sebagai array of objects
Database.updateRowById(sheet, idCol, id, obj)  // Update by ID
Database.deleteRowById(sheet, idCol, id)       // Delete by ID
Database.countRows(sheet)    // Hitung jumlah baris data
Database.getSpreadsheetUrl() // URL spreadsheet
Database.ensureDefaultSchool() // Buat profil sekolah default
```

### Frontend Architecture

- **STATE object**: menyimpan semua state aplikasi (refs, user, data)
- **gcall(fn, payload)**: wrapper `google.script.run` yang return Promise
- **navigate(page)**: routing client-side (ganti konten `#app-content`)
- **render* functions**: setiap halaman punya fungsi render (contoh: `renderDashboard`)
- **wireGenericTabs(container)**: helper untuk tab panel

---

## 13. Riwayat Versi

| PR | Deskripsi | Konten |
|----|-----------|--------|
| PR #5 | Backend v2 | Rewrite Code.gs: RKKAL/Rekap terpisah, kode MAK, REF dropdown, self-test |
| PR #6 | Frontend v2 | Rewrite index.html: SPA dengan 7 halaman, Google Charts, kalkulator pajak |
| PR #7 | Full Upgrade | Auth system, charts, config CRUD, RAB module, AKRURAL export, backup/restore, daily backup trigger, setup page, diagnostik, dokumentasi |

### Detail PR #7 (terbaru)

Backend:
- Auth: `apiGetCurrentUser`, `_requireAuth`, `_withAuth`
- Config CRUD: akun, kegiatan, prefix (12 API baru)
- Charts: `apiGetChartData` (pie, bar, line)
- RAB: `apiSaveRAB`, `apiGetRABList`, `apiGetRAB`, `apiDeleteRAB`, `apiExportRAB`
- AKRURAL: `apiExportRealisasiAKRURAL` (format standar pemerintah)
- Backup: `apiCreateBackup`, `apiListBackups`, `apiRestoreBackup`, `apiSetupDailyBackup`, `apiRemoveDailyBackup`, `dailyBackup`
- UI Config: `apiGetUIConfig`, `apiSaveUIConfig`, `apiUploadLogo`
- Export/Import Templates: 6 API baru
- User Management: 4 API baru
- Setup: `apiSetupDatabase`, `apiCheckDatabaseHealth`

Frontend:
- Halaman RAB (buat, daftar, export)
- Halaman Setup & Database (health check, repair, backup, restore, daily trigger)
- Export AKRURAL dari halaman Export

---

## 14. Kontak & Lisensi

### Kontak Developer
- Repository: `waliasrama43-rosa/bendahara`
- [Isi nama dan email developer di sini]

### Lisensi
- [Tentukan lisensi yang berlaku]
- Kode ini dikembangkan khusus untuk Sekolah Rakyat Indonesia.

---

*Dokumen ini dibuat sebagai bagian dari serah terima proyek ERP Keuangan Sekolah Rakyat.*
*Terakhir diperbarui: 2025*
