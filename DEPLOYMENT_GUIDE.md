# Panduan Deployment - ERP Keuangan Sekolah Rakyat

Panduan langkah demi langkah untuk men-deploy aplikasi ERP Keuangan dari nol hingga siap digunakan.

---

## 1. Prasyarat

Sebelum memulai, pastikan Anda memiliki:

- **Akun Google** (Gmail atau Google Workspace)
- **Akses ke** https://script.google.com
- **Browser modern** (Chrome/Firefox/Edge terbaru)
- File source code:
  - `standalone/Code.gs` (backend)
  - `standalone/index.html` (frontend)

> **Catatan**: Tidak perlu install software apapun di komputer Anda. Semua dilakukan via browser.

---

## 2. Membuat Proyek Apps Script Baru

1. Buka https://script.google.com di browser.
2. Klik tombol **+ New Project** (pojok kiri atas).
3. Klik pada tulisan "Untitled project" di kiri atas.
4. Ganti nama menjadi: `ERP Keuangan Sekolah Rakyat`.
5. Tekan Enter untuk menyimpan nama.

> **Tampilan**: Anda akan melihat editor dengan satu file `Code.gs` berisi fungsi `myFunction()` kosong.

---

## 3. Menyalin Code.gs

1. Buka file `standalone/Code.gs` dari repository ini (bisa di GitHub atau file lokal).
2. Seleksi SEMUA isinya (Ctrl+A / Cmd+A).
3. Copy (Ctrl+C / Cmd+C).
4. Kembali ke editor Apps Script.
5. Klik pada file `Code.gs` di panel kiri.
6. Seleksi SEMUA isi yang ada (Ctrl+A).
7. Paste (Ctrl+V) - ini menimpa fungsi `myFunction()` kosong.
8. Tekan **Ctrl+S** untuk menyimpan.

> **Verifikasi**: Baris pertama harus berisi komentar `/** ... ERP KEUANGAN SEKOLAH RAKYAT ...`. Jumlah baris sekitar 2600+.

---

## 4. Menyalin index.html

1. Di editor Apps Script, klik ikon **+** di samping "Files" (panel kiri).
2. Pilih **HTML**.
3. Pada popup yang muncul, ketik nama: `index` (tanpa ekstensi .html).
4. Tekan Enter - file `index.html` baru terbuat.
5. Hapus semua isi default yang ada.
6. Buka file `standalone/index.html` dari repository.
7. Seleksi semua isinya, copy.
8. Paste ke file `index.html` di editor Apps Script.
9. Tekan **Ctrl+S** untuk menyimpan.

> **Verifikasi**: File berisi tag `<!DOCTYPE html>` di baris pertama. Ukuran file cukup besar (ratusan KB).

---

## 5. Deploy sebagai Web App

1. Klik tombol **Deploy** di toolbar atas.
2. Pilih **New deployment**.
3. Klik ikon gear (roda gigi) di samping "Select type".
4. Pilih **Web app**.
5. Isi form konfigurasi:

| Setting | Nilai | Penjelasan |
|---------|-------|------------|
| Description | `Production v1.0` | Deskripsi versi (bebas) |
| Execute as | **Me** | Script berjalan dengan akun Anda |
| Who has access | **Anyone** | Siapapun dengan link bisa akses |

6. Klik **Deploy**.
7. Akan muncul popup authorization:
   - Klik **Authorize access**.
   - Pilih akun Google Anda.
   - Jika muncul warning "This app isn't verified":
     - Klik **Advanced** (di kiri bawah).
     - Klik **Go to ERP Keuangan Sekolah Rakyat (unsafe)**.
   - Klik **Allow** untuk memberikan izin.
8. Setelah berhasil, akan muncul **Web app URL**.
9. **COPY URL ini** - ini adalah alamat aplikasi Anda.

> **Format URL**: `https://script.google.com/macros/s/XXXXX.../exec`

### Penjelasan Setting

- **Execute as: Me** - Artinya semua operasi database (baca/tulis Google Sheets) menggunakan akun Anda. User lain tidak perlu punya akses ke Sheets.
- **Who has access: Anyone** - Siapapun yang punya URL bisa membuka aplikasi. Auth internal (role Admin/Tendik) ditangani oleh kode aplikasi sendiri.

---

## 6. Akses Pertama Kali

1. Buka URL Web App yang sudah di-copy di browser.
2. Tunggu loading (pertama kali mungkin 5-10 detik).
3. Anda akan diminta login Google jika belum.
4. Setelah masuk, dashboard akan muncul.

> **PENTING**: User pertama yang mengakses aplikasi **otomatis menjadi Admin**. Pastikan ANDA yang pertama kali membuka URL, bukan orang lain.

### Apa yang Terjadi di Belakang

- Sistem otomatis membuat Google Spreadsheet baru bernama `ERP_Sekolah_Rakyat` di Google Drive Anda.
- Semua sheet (Data_RKKAL, Data_Rekap, Config_Users, dll) otomatis dibuat.
- Email Anda didaftarkan sebagai Admin di sheet Config_Users.
- Profil sekolah default dibuat di Data_Sekolah.

---

## 7. Menjalankan selfTest

SelfTest adalah fungsi untuk memverifikasi sistem berjalan dengan benar.

1. Kembali ke editor Apps Script (https://script.google.com).
2. Pastikan file `Code.gs` sedang terbuka.
3. Pada dropdown fungsi di toolbar, pilih `selfTest`.
4. Klik tombol **Run** (ikon play).
5. Jika diminta authorization lagi, ikuti langkah yang sama.
6. Lihat hasil di panel **Execution log** di bawah:

```
=== SELF TEST RESULT ===
{
  "rkkalBefore": 0,
  "rkkalAfter": 1,
  "rekapBefore": 0,
  "rekapAfter": 1,
  "kodeMakContoh": "DQ.7936.SBE.101.303.A.522151",
  "terbilangContoh": "Enam Puluh Tujuh Ribu Delapan Ratus Sembilan Puluh Rupiah",
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/XXX/edit"
}
```

> **Sukses** jika `rkkalAfter` dan `rekapAfter` bertambah 1 dari before. URL spreadsheet bisa diklik untuk melihat data.

---

## 8. Mengaktifkan Backup Harian

Backup harian otomatis membuat salinan spreadsheet setiap hari jam 2 pagi.

### Via Aplikasi (Rekomendasi)

1. Buka aplikasi Web App.
2. Navigasi ke menu **Setup & Database** (sidebar).
3. Klik tombol **Aktifkan Backup Harian**.
4. Konfirmasi - trigger akan dibuat.

### Via Editor (Alternatif)

1. Di editor Apps Script, klik ikon jam (Triggers) di sidebar kiri.
2. Klik **+ Add Trigger**.
3. Konfigurasi:
   - Function: `dailyBackup`
   - Event source: Time-driven
   - Type: Day timer
   - Time: 2am to 3am
4. Klik **Save**.

### Lokasi Backup

Backup disimpan di folder `Backup_ERP_Sekolah_Rakyat` di Google Drive Anda. Setiap backup bernama `Backup_ERP_YYYY-MM-DD_HHMM`.

---

## 9. Mendaftarkan User (Tendik)

Setelah Anda (Admin) berhasil masuk, daftarkan user lain yang akan menggunakan sistem:

1. Buka aplikasi Web App.
2. Navigasi ke menu **Manajemen User** di sidebar.
3. Klik **Tambah User Baru**.
4. Isi form:
   - **Email**: alamat Gmail/Google Workspace user (harus tepat)
   - **Nama**: nama tampilan
   - **Role**: pilih `Tendik` (untuk input data) atau `Admin` (akses penuh)
5. Klik **Simpan**.
6. Bagikan URL Web App ke user tersebut.

### Perbedaan Role

| Aksi | Admin | Tendik |
|------|-------|--------|
| Lihat Dashboard | Ya | Ya |
| Input RKKAL | Ya | Ya |
| Input Rekap SPJ | Ya | Ya |
| Verifikasi Transaksi | Ya | Tidak |
| Kelola User | Ya | Tidak |
| Kelola Config (Akun/Kegiatan/Prefix) | Ya | Tidak |
| Backup & Restore | Ya | Tidak |
| Setup Database | Ya | Tidak |
| Export Laporan | Ya | Ya |
| Kalkulator Pajak | Ya | Ya |

---

## 10. Custom Domain via Cloudflare (Opsional)

Jika ingin mengakses aplikasi via domain sendiri (misal: `erp.sekolahanda.id`) alih-alih URL panjang Google.

### Prasyarat Tambahan
- Domain yang sudah terdaftar
- Akun Cloudflare (gratis)
- DNS domain sudah diarahkan ke Cloudflare

### Langkah-langkah

1. **Login ke Cloudflare Dashboard** (https://dash.cloudflare.com).
2. Pilih domain Anda.
3. Navigasi ke **Workers & Pages** > **Create application** > **Create Worker**.
4. Beri nama worker: `erp-proxy` (atau sesuai keinginan).
5. Klik **Deploy** (deploy dengan kode default dulu).
6. Klik **Edit code** / **Quick edit**.
7. Hapus semua kode default, ganti dengan isi file `cloudflare/worker.js` dari repository.
8. Ubah nilai `BACKEND_URL` di baris atas menjadi URL Web App Anda:

```javascript
const BACKEND_URL = 'https://script.google.com/macros/s/XXXXX.../exec';
```

9. Klik **Save and deploy**.
10. Kembali ke halaman worker, buka tab **Triggers**.
11. Di bagian **Custom Domains**, klik **Add Custom Domain**.
12. Masukkan subdomain: `erp.sekolahanda.id`.
13. Klik **Add Custom Domain** - Cloudflare otomatis membuat DNS record.
14. Tunggu 1-2 menit, lalu buka `https://erp.sekolahanda.id`.

### Keuntungan Custom Domain
- URL lebih pendek dan mudah diingat
- Rate limiting bawaan Cloudflare
- SSL/HTTPS otomatis
- Caching untuk aset statis

---

## 11. Update / Re-deploy

Ketika ada perubahan kode (update dari repository):

### Update dengan Deployment yang Sama (URL Tetap)

1. Buka editor Apps Script.
2. Update file `Code.gs` dan/atau `index.html` dengan versi baru.
3. Simpan (Ctrl+S).
4. Klik **Deploy** > **Manage deployments**.
5. Klik ikon pensil (edit) pada deployment aktif.
6. Ubah **Version** ke "New version".
7. Klik **Deploy**.
8. URL tetap sama, perubahan langsung aktif.

### Deploy Baru (URL Berbeda)

1. Buka editor Apps Script.
2. Update file.
3. Klik **Deploy** > **New deployment**.
4. Isi deskripsi versi baru (misal: "v2.0 - tambah fitur RAB").
5. Klik **Deploy**.
6. Anda mendapat URL baru. URL lama masih aktif dengan kode lama.

> **Rekomendasi**: Gunakan "Manage deployments" > edit (cara pertama) agar URL tidak berubah.

### Setelah Update

1. Buka URL Web App.
2. Hard refresh browser (Ctrl+Shift+R) untuk memastikan index.html terbaru dimuat.
3. Jalankan `selfTest` dari editor untuk verifikasi.
4. Cek menu Setup & Database > Health Check untuk memastikan semua sheet lengkap.

---

## 12. Troubleshooting

### Error: "Script function not found: doGet"

**Penyebab**: File `Code.gs` tidak ter-paste dengan benar.
**Solusi**: Pastikan seluruh isi `standalone/Code.gs` sudah ter-copy (2600+ baris).

### Error: "File UI tidak ditemukan"

**Penyebab**: File HTML tidak bernama `index` (mungkin bernama `Index.html` atau `index.html.html`).
**Solusi**: Pastikan nama file di panel kiri adalah `index` (tanpa ekstensi - Apps Script otomatis menambahkan `.html`).

### Halaman Blank / Loading Terus

**Penyebab**: JavaScript error di frontend.
**Solusi**:
1. Buka Developer Tools (F12) > tab Console.
2. Lihat error merah yang muncul.
3. Hard refresh (Ctrl+Shift+R).
4. Jika masih blank, pastikan `index.html` ter-paste lengkap.

### Error: "Authorization required"

**Penyebab**: Permission belum diberikan.
**Solusi**:
1. Buka editor Apps Script.
2. Jalankan fungsi `doGet` atau `selfTest` manual (Run).
3. Ikuti proses authorization saat diminta.
4. Setelah berhasil, coba buka URL Web App lagi.

### Error: "You do not have permission" (user biasa)

**Penyebab**: Email user belum terdaftar di sistem.
**Solusi**: Admin perlu mendaftarkan email user tersebut di menu Manajemen User.

### Data Tidak Muncul di Dashboard

**Penyebab**: Belum ada data, atau data ada di school_id berbeda.
**Solusi**:
1. Pastikan sudah input data (RKKAL dan/atau Rekap SPJ).
2. Jalankan `selfTest` untuk membuat data contoh.
3. Cek sheet langsung di Google Sheets apakah data ada.

### Backup Harian Tidak Jalan

**Penyebab**: Trigger belum terpasang atau error permission.
**Solusi**:
1. Buka editor Apps Script > Triggers (ikon jam di sidebar).
2. Cek apakah trigger `dailyBackup` ada.
3. Jika tidak ada, buat manual atau klik "Aktifkan Backup Harian" dari aplikasi.
4. Jika ada tapi error, klik trigger > lihat execution log.

### Kode MAK Tidak Ter-generate

**Penyebab**: Prefix, kegiatan, atau akun tidak dipilih.
**Solusi**: Pastikan semua dropdown (Sumber Dana, Kegiatan, Kode Akun) terisi saat input Rekap SPJ.

### Upload CSV Error

**Penyebab**: Format CSV tidak sesuai.
**Solusi**:
- RKKAL CSV harus punya kolom: `Kode_Kegiatan,Kode_Akun,Uraian,Volume,Satuan,Harga_Satuan`
- Rekap CSV harus punya kolom: `Tanggal,Nama_Toko,Kode_MAK,Uraian_Pembayaran,Tahun,Bulan,Jumlah`
- Pastikan separator adalah koma (bukan titik koma)
- Pastikan encoding UTF-8

### Google Sheets Penuh / Lambat

**Penyebab**: Data terlalu banyak (>10.000 baris per sheet).
**Solusi**:
1. Archive data lama (copy ke spreadsheet terpisah).
2. Hapus data yang sudah di-archive dari sheet aktif.
3. Atau buat spreadsheet baru untuk tahun anggaran baru.

### Cara Membersihkan Data Dummy

Jika sebelumnya menjalankan `selfTest` atau `apiSeedDummy`:

1. Buka Google Sheets (URL dari menu Diagnostik atau hasil selfTest).
2. Buka sheet `Data_RKKAL`:
   - Cari baris dengan uraian "SELF TEST RKKAL" atau "Dummy".
   - Seleksi baris tersebut > klik kanan > Delete rows.
3. Buka sheet `Data_Rekap`:
   - Cari baris dengan nama toko "SELF TEST TOKO" atau uraian "Dummy".
   - Hapus baris tersebut.
4. JANGAN hapus baris 1 (header) di sheet manapun.
5. Setelah bersih, aplikasi siap diisi data sesungguhnya.

> **Alternatif cepat**: Jika SEMUA data di sheet adalah dummy (belum ada data real), seleksi semua baris dari baris 2 ke bawah lalu Delete rows. Header di baris 1 harus tetap ada.

---

## Lampiran: Checklist Deploy

- [ ] File `Code.gs` ter-paste lengkap (2600+ baris)
- [ ] File `index.html` ter-paste lengkap
- [ ] Deploy sebagai Web App berhasil
- [ ] URL Web App bisa diakses
- [ ] User pertama (Admin) berhasil masuk
- [ ] selfTest berhasil (rkkalAfter = rkkalBefore + 1)
- [ ] Backup harian diaktifkan
- [ ] User Tendik didaftarkan
- [ ] Data dummy dibersihkan (jika sudah tidak diperlukan)
- [ ] Data sesungguhnya mulai diinput

---

*Dokumen ini adalah bagian dari paket serah terima ERP Keuangan Sekolah Rakyat.*
*Terakhir diperbarui: 2025*
