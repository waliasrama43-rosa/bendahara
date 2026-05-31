# Panduan Pengguna (Tendik) - ERP Keuangan Sekolah Rakyat

Panduan lengkap untuk pengguna Tendik (Tenaga Kependidikan) dalam mengoperasikan aplikasi ERP Keuangan Sekolah.

---

## 1. Cara Akses Aplikasi

### Langkah Akses

1. Buka URL Web App yang diberikan oleh Admin melalui browser (Chrome, Firefox, Edge).
2. Jika diminta, login dengan akun Google yang sudah didaftarkan oleh Admin.
3. Authorize akses aplikasi jika muncul permintaan izin.
4. Setelah berhasil, Dashboard utama akan tampil.

### Dashboard

Dashboard menampilkan ringkasan keuangan:
- Total Pagu (anggaran yang direncanakan).
- Total Realisasi (anggaran yang sudah terpakai).
- Sisa Anggaran.
- Persentase Serapan.

### Navigasi

Gunakan sidebar di sebelah kiri untuk berpindah antar menu:
- **Arus Masuk** - Input RKKAL.
- **Arus Keluar** - Rekap SPJ.
- **Realisasi Anggaran** - Laporan pagu vs realisasi.
- **Kalkulator Pajak** - Perhitungan pajak.
- **RAB** - Rencana Anggaran Biaya.
- **Export Laporan** - Download laporan.

### Catatan

- Jika muncul pesan "Akses Ditolak", hubungi Admin untuk didaftarkan.
- Gunakan akun Google yang sama dengan yang didaftarkan Admin.

---

## 2. Input RKKAL (Manual dan CSV)

RKKAL (Rencana Kegiatan dan Anggaran Lembaga) adalah data perencanaan anggaran.

### Mengakses Menu RKKAL

Buka sidebar menu **Arus Masuk** > **RKKAL**.

### Tab Input Manual

1. Pilih parameter:
   - **Tahun**: tahun anggaran.
   - **Jenjang**: jenjang pendidikan.
2. Isi tabel input:
   - **Kegiatan**: pilih huruf kegiatan dari dropdown (A-M).
   - **Kode Akun**: pilih kode akun 6 digit dari dropdown.
   - **Uraian**: deskripsi item anggaran.
   - **Volume**: jumlah unit.
   - **Satuan**: satuan ukur (paket, orang, bulan, dll).
   - **Harga**: harga per satuan.
3. Kolom **Jumlah** terisi otomatis (Volume x Harga).
4. Tambah baris jika diperlukan.
5. Klik **Simpan** untuk menyimpan semua data.

### Tab Upload CSV

Upload data RKKAL dari file CSV untuk input massal.

Format kolom CSV yang diterima:

```
Kode_Kegiatan,Kode_Akun,Uraian,Volume,Satuan,Harga_Satuan,Jumlah
```

Contoh isi file:

```
A,522151,Honorarium Narasumber,2,orang,500000,1000000
B,521211,ATK Pembelajaran,5,paket,100000,500000
C,524111,Transport Peserta,10,orang,150000,1500000
```

Langkah upload:
1. Siapkan file CSV sesuai format di atas.
2. Pilih **Tahun** dan **Jenjang**.
3. Klik **Pilih File** atau drag-and-drop file CSV.
4. Sistem menampilkan preview data.
5. Periksa data, lalu klik **Upload** untuk menyimpan.

### Tab Daftar RKKAL

Menampilkan semua data RKKAL yang sudah diinput:

- **Filter**: saring berdasarkan tahun, jenjang, atau kegiatan.
- **Edit**: klik baris data untuk mengubah.
- **Hapus**: hapus data yang salah (dengan konfirmasi).

---

## 3. Input Rekap SPJ (Transaksi Belanja)

Rekap SPJ mencatat setiap transaksi pengeluaran/belanja yang sudah terjadi.

### Mengakses Menu Rekap SPJ

Buka sidebar menu **Arus Keluar** > **Rekap SPJ**.

### Tab Input

Isi form transaksi:

1. **Tanggal**: tanggal transaksi dilakukan.
2. **Nama Toko**: nama vendor/toko tempat belanja.
3. **Prefix MAK**: pilih prefix dari dropdown.
4. **Kegiatan**: pilih huruf kegiatan (A-M).
5. **Kode Akun**: pilih kode akun 6 digit.
6. **Jenjang**: pilih jenjang pendidikan.
7. **Jumlah**: nominal transaksi (dalam Rupiah).
8. **Uraian**: deskripsi singkat transaksi.

Setelah mengisi Prefix MAK, Kegiatan, dan Kode Akun, **Preview Kode MAK** akan otomatis muncul di bawah form:

```
Contoh: 4789.BMA.003-B-522151
```

Klik **Simpan** untuk menyimpan transaksi.

### Tab Daftar Rekap SPJ

Menampilkan semua transaksi yang sudah diinput:

- **Filter**: saring berdasarkan tanggal, kegiatan, kode akun, atau jenjang.
- **Verifikasi**: tombol verifikasi tersedia untuk Admin (menandai transaksi sudah divalidasi).
- **Edit**: ubah data transaksi yang belum diverifikasi.
- **Hapus**: hapus transaksi (dengan konfirmasi).
- **Upload Bukti**: lampirkan foto/scan bukti transaksi (nota, faktur).
- **Cetak Kwitansi**: generate kwitansi resmi untuk transaksi tersebut.

### Catatan

- Transaksi yang sudah diverifikasi oleh Admin tidak bisa diedit atau dihapus.
- Kode MAK terbentuk otomatis dari kombinasi Prefix + Kegiatan + Kode Akun.

---

## 4. Melihat Realisasi Anggaran

Halaman ini menampilkan perbandingan antara anggaran yang direncanakan (Pagu) dengan yang sudah direalisasikan.

### Mengakses Realisasi Anggaran

Buka sidebar menu **Realisasi Anggaran**.

### Informasi yang Ditampilkan

Tabel realisasi menampilkan kolom:

| Kolom | Keterangan |
|-------|-----------|
| Pagu | Total anggaran yang direncanakan (dari RKKAL) |
| Realisasi | Total yang sudah dibelanjakan (dari Rekap SPJ) |
| Sisa | Selisih Pagu - Realisasi |
| % Serapan | Persentase realisasi terhadap pagu |

### Pengelompokan Data

Toggle tampilan antara dua mode:

- **Group by Akun**: data dikelompokkan berdasarkan kode akun 6 digit. Setiap akun menampilkan total pagu, realisasi, sisa, dan persentase.
- **Group by Kegiatan**: data dikelompokkan berdasarkan huruf kegiatan (A-M). Setiap kegiatan menampilkan total pagu, realisasi, sisa, dan persentase.

### Filter

- **Tahun**: pilih tahun anggaran yang ingin dilihat.
- **Jenjang**: pilih jenjang pendidikan.

### Cara Membaca Data

- Serapan di atas 80%: anggaran hampir habis, perlu perhatian.
- Serapan di bawah 50%: anggaran masih banyak tersisa.
- Sisa negatif: realisasi melebihi pagu (over budget).

---

## 5. Menggunakan Kalkulator Pajak

Kalkulator pajak membantu menghitung komponen pajak untuk transaksi belanja.

### Mengakses Kalkulator Pajak

Buka sidebar menu **Kalkulator Pajak**.

### Cara Penggunaan

1. Masukkan **Nilai Transaksi** (nominal belanja dalam Rupiah).
2. Sistem otomatis menghitung semua komponen pajak.

### Komponen Pajak yang Dihitung

| Jenis Pajak | Tarif | Keterangan |
|-------------|-------|-----------|
| PPN | 11% | Pajak Pertambahan Nilai |
| PPh Pasal 22 | 1.5% | Pajak penghasilan atas pembelian barang |
| PPh Pasal 23 | 2% | Pajak penghasilan atas jasa |
| PPh Pasal 21 | Progresif | Pajak penghasilan atas honorarium |

### Contoh Perhitungan

Untuk transaksi senilai Rp 10.000.000:

```
PPN (11%)       : Rp 1.100.000
PPh Pasal 22 (1.5%) : Rp   150.000
PPh Pasal 23 (2%)   : Rp   200.000
```

### Catatan

- Hasil kalkulator bersifat referensi untuk membantu saat membuat Rekap SPJ.
- Tidak semua transaksi dikenakan semua jenis pajak. Pilih jenis pajak yang sesuai dengan jenis transaksi:
  - **Pembelian barang**: PPN + PPh Pasal 22.
  - **Penggunaan jasa**: PPN + PPh Pasal 23.
  - **Honorarium/upah**: PPh Pasal 21.
- Konsultasikan dengan bagian keuangan jika ragu mengenai jenis pajak yang berlaku.

---

## 6. Mencetak Kwitansi

Cetak kwitansi resmi untuk setiap transaksi yang tercatat di Rekap SPJ.

### Langkah Mencetak

1. Buka sidebar menu **Arus Keluar** > **Rekap SPJ**.
2. Pada **Tab Daftar**, cari transaksi yang ingin dicetak kwitansinya.
3. Klik tombol **Kwitansi** pada baris transaksi tersebut.
4. Kwitansi format resmi akan tampil dalam popup/modal.
5. Untuk mencetak:
   - Tekan `Ctrl+P` (Windows/Linux) atau `Cmd+P` (Mac).
   - Atau klik tombol **Cetak** di dalam popup.
6. Untuk menyimpan sebagai PDF:
   - Pada dialog cetak, pilih **Destination** > **Save as PDF**.
   - Klik **Save**.

### Isi Kwitansi

Kwitansi yang dihasilkan memuat:
- Nomor kwitansi (otomatis dari Kode MAK).
- Tanggal transaksi.
- Nama toko/vendor.
- Uraian belanja.
- Jumlah (nominal Rupiah, terbilang).
- Kode MAK lengkap.
- Tempat tanda tangan (penerima dan bendahara).

### Catatan

- Kwitansi menggunakan format standar pertanggungjawaban keuangan.
- Pastikan data transaksi sudah benar sebelum mencetak.
- Kwitansi dapat dicetak ulang kapan saja dari menu Daftar Rekap SPJ.

---

## Tips Umum

- Selalu periksa kembali data sebelum menyimpan - terutama nominal dan kode akun.
- Gunakan fitur filter untuk menemukan data dengan cepat.
- Jika terjadi error atau halaman tidak merespon, coba refresh browser (F5).
- Hubungi Admin jika menemui masalah teknis atau butuh akses tambahan.
