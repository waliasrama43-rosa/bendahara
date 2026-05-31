# Panduan Administrator - ERP Keuangan Sekolah Rakyat

Panduan lengkap untuk administrator (Admin) dalam mengelola aplikasi ERP Keuangan berbasis Google Apps Script.

---

## 1. Cara Deploy Web App

Langkah-langkah deploy aplikasi sebagai Google Apps Script Web App:

1. Buka [Google Apps Script](https://script.google.com) dan login dengan akun Google.
2. Klik **Project Baru** untuk membuat project kosong.
3. Ganti nama project menjadi "ERP Keuangan Sekolah" (atau sesuai kebutuhan).
4. Hapus isi default pada file `Code.gs`, lalu copy-paste seluruh isi file `standalone/Code.gs` dari repository ini.
5. Buat file HTML baru:
   - Klik **+** di samping "Files" > **HTML** > beri nama `index`.
   - Copy-paste seluruh isi file `standalone/index.html` dari repository ini.
6. Deploy sebagai Web App:
   - Klik **Deploy** > **New deployment**.
   - Klik ikon gear di samping "Select type" > pilih **Web app**.
   - Isi konfigurasi:
     - **Description**: versi deployment (misal "v1.0")
     - **Execute as**: `Me` (akun Anda sendiri)
     - **Who has access**: `Anyone`
   - Klik **Deploy**.
7. Authorize akses saat diminta (klik "Advanced" > "Go to project" jika ada warning).
8. Copy URL Web App yang muncul. URL ini yang akan dibagikan ke semua user.

### Catatan Penting

- Setiap kali ada perubahan kode, buat **New deployment** atau update deployment yang ada melalui **Deploy** > **Manage deployments** > **Edit**.
- URL deployment baru akan berbeda dari sebelumnya kecuali Anda mengupdate deployment yang sama.

---

## 2. Cara Login Pertama Kali

Sistem menggunakan `Session.getActiveUser().getEmail()` untuk mendeteksi email pengguna yang mengakses aplikasi.

### Mekanisme Login

1. User pertama yang mengakses aplikasi akan **otomatis terdaftar sebagai Admin**.
2. Email user tersebut dicatat di sheet `Users` dengan role `Admin`.
3. Tidak ada form login terpisah - autentikasi menggunakan akun Google yang sedang aktif di browser.

### Langkah Login

1. Buka URL Web App yang sudah di-deploy.
2. Jika diminta, login dengan akun Google.
3. Authorize akses aplikasi jika diminta.
4. Dashboard akan langsung tampil setelah autentikasi berhasil.

### Catatan

- Pastikan akun Google yang digunakan untuk deploy adalah akun yang akan menjadi Admin utama.
- User lain yang belum didaftarkan akan mendapat pesan "Akses Ditolak".

---

## 3. Menambah User (Tendik)

Admin dapat menambahkan user baru agar bisa mengakses aplikasi.

### Langkah Menambah User

1. Buka sidebar menu **Pengaturan**.
2. Pilih sub-menu **Manajemen User**.
3. Klik tombol **Tambah User**.
4. Isi form:
   - **Email**: alamat email Google user yang akan ditambahkan (harus akun Google valid).
   - **Role**: pilih salah satu:
     - `Admin` - akses penuh termasuk pengaturan sistem.
     - `Tendik` - akses operasional (input data, lihat laporan).
5. Klik **Simpan**.
6. User yang ditambahkan kini bisa mengakses aplikasi menggunakan URL Web App.

### Mengelola User

- **Edit**: ubah role user yang sudah terdaftar.
- **Hapus**: cabut akses user dari sistem.
- User yang dihapus akan mendapat pesan "Akses Ditolak" saat mencoba mengakses aplikasi.

---

## 4. Mengelola Kode Akun, Kegiatan, Prefix MAK

Library berisi data referensi yang digunakan di seluruh aplikasi.

### Mengakses Library

1. Buka sidebar menu **Pengaturan**.
2. Pilih sub-menu **Library**.

### Kode Akun (6 Digit)

Kode akun mengikuti format 6 digit standar, contoh:

```
522151 - Belanja Jasa Profesi
521211 - Belanja Bahan
524111 - Belanja Perjalanan Biasa
```

Operasi yang tersedia:
- **Tambah**: masukkan kode (6 digit) dan nama akun.
- **Edit**: ubah nama akun atau status aktif/nonaktif.
- **Hapus**: hapus kode akun yang tidak digunakan.

### Huruf Kegiatan (A-M)

Huruf kegiatan merepresentasikan jenis kegiatan, contoh:

```
A - Asesmen Awal
B - Pembelajaran Reguler
C - Projek Penguatan Profil Pelajar
```

Operasi: Tambah, Edit (aktif/nonaktif), Hapus.

### Prefix MAK

Prefix MAK digunakan untuk membentuk kode MAK lengkap pada transaksi SPJ:

```
Format: [Prefix]-[Huruf Kegiatan]-[Kode Akun]
Contoh: 4789.BMA.003-A-522151
```

Operasi: Tambah, Edit (aktif/nonaktif), Hapus.

### Catatan

- Kode yang dinonaktifkan tidak muncul di dropdown input, tapi data historis tetap tersimpan.
- Pastikan semua kode yang dibutuhkan sudah diisi sebelum user mulai input data.

---

## 5. Membuat Template Export & Import

Template menentukan format output laporan dan mapping input CSV.

### Mengakses Template

1. Buka sidebar menu **Pengaturan**.
2. Pilih sub-menu **Template Export/Import**.

### Template Export

Template Export menentukan header row custom untuk laporan CSV yang diekspor.

1. Pilih jenis laporan (RKKAL, Rekap SPJ, Realisasi).
2. Tentukan header row:
   - Urutan kolom yang akan diekspor.
   - Nama header yang ditampilkan di file CSV.
3. Simpan template.

Contoh header Export RKKAL:

```
Kode_Kegiatan,Kode_Akun,Uraian,Volume,Satuan,Harga_Satuan,Jumlah
```

### Template Import

Template Import menentukan mapping antara kolom CSV yang diupload ke field di sistem.

1. Pilih jenis data (RKKAL, Rekap SPJ).
2. Tentukan mapping kolom dalam format JSON:

```json
{
  "kolom_csv": "field_sistem",
  "Kode_Kegiatan": "kegiatan",
  "Kode_Akun": "kodeAkun",
  "Uraian": "uraian",
  "Volume": "volume",
  "Satuan": "satuan",
  "Harga_Satuan": "hargaSatuan",
  "Jumlah": "jumlah"
}
```

3. Simpan template.

### Catatan

- Template yang sudah disimpan berlaku untuk semua user.
- Pastikan mapping CSV sesuai dengan file yang akan diupload oleh user.

---

## 6. Mengatur Tema dan Logo

Kustomisasi tampilan aplikasi sesuai identitas sekolah.

### Langkah Pengaturan

1. Buka sidebar menu **Pengaturan**.
2. Pilih sub-menu **Tema & Tampilan**.
3. Atur komponen visual:
   - **Warna Sidebar**: pilih warna latar sidebar navigasi.
   - **Warna Brand**: warna utama aplikasi (header, tombol utama).
   - **Warna Aksen**: warna sekunder (highlight, badge, link).
4. Upload logo:
   - Klik area upload atau tombol **Pilih File**.
   - Pilih file gambar (PNG/JPG, maksimal 2MB).
   - Preview akan tampil setelah upload berhasil.
5. Klik **Simpan** untuk menerapkan perubahan.

### Catatan

- Perubahan tema langsung berlaku untuk semua user setelah refresh halaman.
- Logo ditampilkan di header sidebar dan halaman login.
- Jika logo melebihi 2MB, akan muncul pesan error.

---

## 7. Setup Database dan Backup

Kelola kesehatan database, backup, dan restore data.

### Mengakses Setup Database

1. Buka sidebar menu **Pengaturan**.
2. Pilih sub-menu **Setup & Database**.

### Health Check

Halaman menampilkan status kesehatan tiap sheet:
- **Hijau**: sheet dan semua kolom dalam kondisi normal.
- **Kuning**: ada kolom yang hilang atau tidak sesuai schema.
- **Merah**: sheet tidak ditemukan atau rusak.

### Repair Database

Jika ada sheet yang bermasalah:

1. Klik tombol **Repair Database**.
2. Sistem akan:
   - Membuat sheet yang hilang.
   - Menambahkan kolom yang kurang sesuai schema.
   - Memperbaiki header yang tidak sesuai.
3. Data yang sudah ada tidak akan terhapus.

### Backup Manual

1. Klik tombol **Buat Backup**.
2. Sistem membuat salinan lengkap spreadsheet sebagai file baru di Google Drive.
3. Nama file backup: `BACKUP_ERP_[tanggal]_[jam]`.
4. File backup tersimpan di Google Drive akun yang men-deploy.

### Backup Harian Otomatis

1. Aktifkan toggle **Backup Harian Otomatis**.
2. Backup otomatis berjalan setiap hari jam 02:00 pagi (WIB).
3. Menggunakan time-driven trigger di Google Apps Script.
4. Nonaktifkan toggle untuk menghentikan backup otomatis.

### Restore dari Backup

1. Daftar backup yang tersedia ditampilkan di halaman.
2. Pilih file backup yang ingin di-restore.
3. Klik **Restore**.
4. Konfirmasi restore (data saat ini akan ditimpa).
5. Sistem menyalin data dari file backup ke spreadsheet aktif.

### Catatan

- Backup manual dan otomatis membutuhkan ruang di Google Drive.
- Pastikan kuota Google Drive masih mencukupi.
- Restore akan menimpa seluruh data saat ini - pastikan sudah backup terlebih dahulu.

---

## 8. Membuat RAB

Rencana Anggaran Biaya (RAB) untuk perencanaan keuangan sekolah.

### Mengakses Menu RAB

Buka sidebar menu **RAB**.

### Tab Buat RAB

1. Isi informasi RAB:
   - **Bulan**: pilih bulan RAB.
   - **Tahun**: pilih tahun anggaran.
   - **Jenjang**: pilih jenjang pendidikan.
   - **Nama Kegiatan**: pilih atau isi nama kegiatan.
2. Tambah item RAB:
   - **Kode Akun**: pilih dari dropdown (6 digit).
   - **Uraian**: deskripsi item belanja.
   - **Kuantitas**: jumlah unit.
   - **Satuan**: satuan ukur (paket, orang, buah, dll).
   - **Harga**: harga per satuan.
3. Klik **Tambah Item** untuk menambah baris baru.
4. Jumlah per item dihitung otomatis (Kuantitas x Harga).
5. Total RAB ditampilkan di bagian bawah.
6. Klik **Simpan** untuk menyimpan RAB.

### Tab Daftar RAB

Menampilkan semua RAB yang sudah dibuat:

- **Lihat Detail**: buka RAB lengkap dengan semua item.
- **Export CSV**: export RAB ke format CSV resmi.
- **Hapus**: hapus RAB (dengan konfirmasi).

### Format Export RAB

```
Kode_Akun,Uraian,Kuantitas,Satuan,Harga_Satuan,Jumlah
522151,Honorarium Narasumber,2,orang,500000,1000000
521211,ATK Kegiatan,1,paket,250000,250000
```

---

## 9. Export Realisasi AKRURAL

Export laporan realisasi anggaran dalam format standar AKRURAL.

### Langkah Export

1. Buka sidebar menu **Export Laporan**.
2. Pilih filter:
   - **Tahun**: tahun anggaran yang akan diekspor.
   - **Jenjang**: jenjang pendidikan.
3. Klik tombol **Export Realisasi AKRURAL**.
4. File CSV akan ter-download.

### Format Output

Kolom dalam file export:

```
KODE AKUN, PROGRAM, VOL, SAT, H SATUAN, PAGU, REALISASI, %, SALDO
```

Keterangan kolom:
- **KODE AKUN**: kode akun 6 digit.
- **PROGRAM**: uraian program/kegiatan.
- **VOL**: volume/kuantitas.
- **SAT**: satuan.
- **H SATUAN**: harga satuan.
- **PAGU**: total anggaran yang direncanakan.
- **REALISASI**: total yang sudah direalisasikan.
- **%**: persentase serapan (Realisasi/Pagu x 100).
- **SALDO**: sisa anggaran (Pagu - Realisasi).

### Pengelompokan Data

Data dalam laporan dikelompokkan secara hierarkis:
1. **Per Kegiatan** (huruf kegiatan A-M).
2. **Per Kode Akun** di dalam masing-masing kegiatan.

Setiap kelompok kegiatan memiliki subtotal, dan di akhir terdapat grand total.

---

## 10. Troubleshooting

Solusi untuk masalah umum yang sering ditemui.

### "Akses Ditolak"

**Penyebab**: Email user belum didaftarkan oleh Admin.

**Solusi**:
1. Admin membuka menu **Pengaturan** > **Manajemen User**.
2. Tambahkan email user dengan role yang sesuai.
3. Minta user untuk refresh halaman.

### Sheet Tidak Muncul / Data Tidak Tampil

**Penyebab**: Sheet database rusak atau kolom tidak sesuai schema.

**Solusi**:
1. Buka **Pengaturan** > **Setup & Database**.
2. Cek status health tiap sheet.
3. Klik **Repair Database** untuk memperbaiki.

### Export Kosong (File CSV Tidak Ada Data)

**Penyebab**: Belum ada data yang diinput untuk filter yang dipilih.

**Solusi**:
1. Pastikan sudah ada data RKKAL dan/atau Rekap SPJ yang diinput.
2. Periksa filter tahun dan jenjang sudah sesuai dengan data yang tersedia.
3. Coba ubah filter untuk memastikan ada data.

### Backup Gagal

**Penyebab**: Kuota Google Drive penuh atau timeout.

**Solusi**:
1. Periksa sisa kuota Google Drive melalui [drive.google.com](https://drive.google.com).
2. Hapus file yang tidak diperlukan untuk menambah ruang.
3. Coba lagi proses backup setelah ada ruang cukup.
4. Jika masih gagal, cek apakah trigger backup otomatis masih aktif di Apps Script.

### Login Loop (Halaman Terus Kembali ke Login)

**Penyebab**: Cache browser bermasalah atau deployment perlu diperbarui.

**Solusi**:
1. Clear cache browser (Ctrl+Shift+Del).
2. Logout dari semua akun Google, lalu login kembali dengan akun yang benar.
3. Jika masih bermasalah, Admin perlu re-deploy:
   - Buka Google Apps Script project.
   - **Deploy** > **Manage deployments** > buat deployment baru.
   - Bagikan URL baru ke user.

### Trigger Tidak Berjalan

**Penyebab**: Trigger backup otomatis terhapus atau error.

**Solusi**:
1. Buka Google Apps Script project.
2. Klik ikon jam (Triggers) di sidebar kiri.
3. Periksa apakah trigger masih ada dan statusnya.
4. Jika error, hapus trigger lama dan aktifkan ulang melalui aplikasi.

---

## Kontak Bantuan

Jika masalah tidak dapat diselesaikan dengan panduan di atas, hubungi developer atau tim teknis yang mengelola project Google Apps Script ini.
