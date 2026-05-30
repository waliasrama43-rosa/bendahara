# HANDOFF — Penyempurnaan ERP Keuangan Sekolah Rakyat

Dokumen ini merangkum status pekerjaan agar bisa dilanjutkan di percakapan baru.

## Konteks Proyek
- Repo: `waliasrama43-rosa/bendahara`
- Aplikasi: ERP Keuangan Sekolah Rakyat berbasis **Google Apps Script (Web App)** + Google Sheets sebagai database.
- Versi yang AKTIF dipakai user = folder **`standalone/`** (file tunggal):
  - `standalone/Code.gs`  → backend Apps Script
  - `standalone/index.html` → UI (1 halaman, vanilla JS, dipanggil via `google.script.run`)
  - `standalone/appsscript.json`
- Folder `src/` adalah versi modular lama (TIDAK dipakai aktif). Fokus pekerjaan ada di `standalone/`.

## Permintaan User (tujuan malam ini)
User bingung dengan alur lama. Yang diminta:
1. **Pisahkan ARUS MASUK vs ARUS KELUAR**:
   - Arus Masuk = **RKKAL** (Rencana Kerja & Anggaran / Pagu / anggaran rencana).
   - Arus Keluar = **Rekap SPJ** (realisasi belanja / kwitansi).
2. **Input RKKAL dan input Rekap dibedakan** (menu/form terpisah).
3. **Dropdown list untuk Kode Akun** (MAK 6 digit, mis. 521211, 522151).
4. **Kode MAK lengkap pada Rekap** (mis. `DQ.7936.SBE.101.303.A.522151`).
5. **Input TANGGAL TRANSAKSI** pada setiap transaksi rekap.

## Struktur Data dari File Excel (sudah dianalisis)
File ada di root repo. Dibaca pakai `python3 /projects/sandbox/read_excel.py <file.xlsx>` (butuh `pip install openpyxl`).

### 1) RKKAL — `01_SRT3 RKKAL 2026NEW.xlsx` (ARUS MASUK / Pagu)
- Sheet per jenjang: `smp`, `sma`, + `Sheet3`.
- Hierarki: Kegiatan (huruf A/B/C/D/F...) → Kode Akun (521211 dll) → uraian item.
- Kolom inti: KODE | URAIAN | VOLUME | (satuan) | HARGA SATUAN | JUMLAH BIAYA | jadwal per bulan/minggu.
- Contoh kegiatan: A=Kegiatan Belajar Mengajar, B=Praktikum Komunitas, C=Kegiatan Krida,
  D=Karya Ilmiah & Latihan Olah Seni, F=Operasional Perkantoran.

### 2) Rekap SPJ — `03_Rekap SPJ Jan26.xlsx` + CSV April (ARUS KELUAR / Realisasi)
- Kolom: NO | NAMA TOKO | URAIAN MAK (Akun belanja) | URAIAN PEMBAYARAN | TAHUN ANGGARAN | BULAN PELAKSANAAN | JUMLAH | TERBILANG.
- **Kode MAK lengkap** contoh: `DQ.7936.SBE.101.303.A.522151`, `WA.7937.EBA.994.002.F.521111`.
  - Format: `<PREFIX>.<HURUF_KEGIATAN>.<KODE_AKUN>`
  - PREFIX yang muncul:
    - `DQ.7936.SBE.101.303` (SR Menengah Pertama)
    - `DQ.7936.SBB.101.303` (SR Menengah Atas)
    - `WA.7937.EBA.994.002` (Operasional Perkantoran)
  - Kode akun tambahan dari rekap: 521112 (Bahan Makanan), 524111 (Uang Harian),
    524113 (Transport dalam kota), 521811 (Persediaan), 521219 (Barang Non Operasional).

## STATUS PEKERJAAN

### SUDAH SELESAI ✅ — `standalone/Code.gs` (backend v2)
File sudah DITULIS ULANG sepenuhnya dan **lulus cek sintaks** (`node --check`).
Isi penting:

- **Objek `REF`** untuk semua dropdown:
  - `REF.KODE_AKUN` (17 akun baku: 521111, 521112, 521113, 521211, 521213, 521219, 521811,
    522111, 522112, 522113, 522141, 522151, 522191, 523111, 523121, 524111, 524113)
  - `REF.KEGIATAN` (A,B,C,D,E,F,G,M + nama)
  - `REF.MAK_PREFIX` (3 prefix di atas)
  - `REF.JENJANG`, `REF.SATUAN`, `REF.BULAN`, `REF.TAHUN`
- **Sheet baru** di Google Sheets:
  - `Data_RKKAL` (arus masuk): ID_RKKAL, Tahun_Anggaran, Jenjang, Kode_Kegiatan, Nama_Kegiatan,
    Kode_Akun, Nama_Akun, Uraian, Volume, Satuan, Harga_Satuan, Jumlah_Biaya, School_ID, Timestamp
  - `Data_Rekap` (arus keluar): ID_Rekap, Tanggal_Transaksi, Nama_Toko, Kode_MAK, Kode_Akun,
    Nama_Akun, Kode_Kegiatan, Uraian_Pembayaran, Tahun_Anggaran, Bulan_Pelaksanaan, Jumlah,
    Terbilang, Jenjang, Status_Verifikasi, Bukti_URL, School_ID, Timestamp
  - `Data_Transaksi` lama tetap ada (kompatibilitas), `Data_Sekolah`, `System_Logs`.
  - `ensureSheets` punya self-heal (auto-tambah kolom yang kurang di sheet lama).
- **API yang tersedia (dipanggil dari UI):**
  - Umum: `apiBootstrap`, `apiGetRefs`, `apiGetDashboard`, `apiDiagnostics`
  - RKKAL: `apiSaveRKKAL`, `apiGetRKKAL`, `apiUpdateRKKAL`, `apiDeleteRKKAL`, `apiUploadRKKALCsv`, `apiExportRKKAL`
  - Rekap: `apiSaveRekap`, `apiGetRekap`, `apiUpdateRekap`, `apiDeleteRekap`, `apiVerifyRekap`,
    `apiUploadBuktiRekap`, `apiUploadRekapCsv`, `apiExportRekap`
  - Realisasi: `apiGetRealisasi` (group by `akun` / `kegiatan`, hitung Pagu vs Realisasi vs Sisa)
  - Sekolah: `apiGetSchool`, `apiSaveSchool`
  - Util: `apiSeedDummy`, `seedDummyData`, `selfTest` (uji simpan dari editor Apps Script)
- Helper penting: `_buildKodeMak(prefix, kegiatan, akun, manual)`, `_terbilang(n)`,
  `_normalizeTanggal`, `_normalizeBulan`, `_rekapRowFromPayload`, `_buildSummary`.
- `apiBootstrap` mengembalikan `refs`, `summary`, `schoolId`, `spreadsheetUrl`.
- `apiGetDashboard` → `summary` = { pagu, realisasi, sisa, serapan, jumlahRKKAL, jumlahRekap, verif, pending, ditolak }.

### BELUM SELESAI ⬜ — `standalone/index.html` (frontend)
File index.html MASIH versi LAMA (memakai API lama: `apiSaveManualRows`, `apiUploadCSV`,
`apiGetRAB`, `apiGetTransactions`, `apiVerifyTransaction`, dll yang **sudah tidak ada** di backend v2).
**Harus ditulis ulang** agar cocok dengan backend v2.

CSS lama BAGUS dan boleh dipertahankan (sudah responsif, ada cards/tabs/table/modal/toast/loading).
Helper lama yang bisa dipakai ulang: `gcall`, `toast`, `rupiah`, `esc`, `fmtDate`, `openModal`,
`closeModal`, `terbilang` (UI), kalkulator pajak (`renderPajak`/`hitungPajak`).

#### Rencana UI baru (yang harus dibangun):
Navigasi (sidebar):
1. **Dashboard** → kartu: Total Pagu, Total Realisasi, Sisa Anggaran, % Serapan (+ jumlah item & pending). Pakai `apiGetDashboard`.
2. **Arus Masuk — RKKAL** → tab: Input Manual / Daftar RKKAL / Upload CSV.
   - Input Manual: filter Tahun + Jenjang; tabel baris dgn kolom: Kode Kegiatan (dropdown `REF.KEGIATAN`),
     Kode Akun (dropdown `REF.KODE_AKUN`), Uraian, Volume, Satuan (dropdown `REF.SATUAN`), Harga Satuan,
     Jumlah (auto = volume×harga). Simpan → `apiSaveRKKAL({tahun, jenjang, rows:[...]})`.
   - Daftar RKKAL: `apiGetRKKAL` → tabel + edit (`apiUpdateRKKAL`) + hapus (`apiDeleteRKKAL`).
   - Upload CSV: kolom `Kode_Kegiatan,Kode_Akun,Uraian,Volume,Satuan,Harga_Satuan,[Jumlah]` → `apiUploadRKKALCsv`.
3. **Arus Keluar — Rekap SPJ** → tab: Input Transaksi / Daftar Rekap / Upload CSV.
   - Input Transaksi (form 1 transaksi): **Tanggal Transaksi (input date)**, Nama Toko,
     Sumber Dana (dropdown `REF.MAK_PREFIX`), Kegiatan (dropdown `REF.KEGIATAN`),
     Kode Akun (dropdown `REF.KODE_AKUN`), Jenjang, Tahun, Bulan (auto dari tanggal, bisa diubah),
     Jumlah, Uraian Pembayaran. Tampilkan **preview Kode MAK** live (prefix.kegiatan.akun).
     Sediakan field "Kode MAK manual" sebagai override opsional. Simpan → `apiSaveRekap({rows:[{...}]})`.
   - Daftar Rekap: `apiGetRekap` (filter tahun/bulan/jenjang) → tabel: Tanggal, Nama Toko, Kode MAK,
     Uraian, Jumlah, Jenjang, Status + aksi: Setujui/Tolak (`apiVerifyRekap`), Edit (`apiUpdateRekap`),
     Hapus (`apiDeleteRekap`), Kwitansi (cetak), Upload Bukti (`apiUploadBuktiRekap`).
   - Upload CSV: kolom `Tanggal,Nama_Toko,Kode_MAK,Uraian_Pembayaran,Tahun,Bulan,Jumlah,[Jenjang]` → `apiUploadRekapCsv`.
4. **Realisasi Anggaran** → `apiGetRealisasi` (toggle group by Akun/Kegiatan): tabel Pagu | Realisasi | Sisa | % Serapan.
5. **Kalkulator Pajak** → pertahankan dari index lama (`renderPajak`/`hitungPajak`).
6. **Export Laporan** → tombol Export Rekap SPJ (`apiExportRekap`) + Export RKKAL (`apiExportRKKAL`) + Isi Data Contoh (`apiSeedDummy`).
7. **Pengaturan Sekolah** → pertahankan (`apiGetSchool`/`apiSaveSchool`).

Helper dropdown baru yang perlu dibuat di JS (pakai `STATE.refs` dari `apiBootstrap`):
`akunOptions(sel)`, `kegiatanOptions(sel)`, `makPrefixOptions(sel)`, `satuanOptions(sel)`,
`tahunOptions(sel)`, `bulanNamaOptions(sel)`.

## LANGKAH BERIKUTNYA (untuk percakapan baru)
1. Tulis ulang `standalone/index.html` sesuai rencana UI di atas (cocokkan ke API backend v2).
2. (Opsional) Samakan `src/index.html` bila ingin versi modular ikut diperbarui.
3. Commit & push ke branch baru, buka PR. (Catatan: push GitHub harus pakai tool `github_push_to_remote`,
   bukan `git push` langsung — sempat ada kendala AuthToken pada gateway.)
4. Minta user deploy ulang Web App di Apps Script & jalankan `selfTest` untuk verifikasi.

## Catatan Teknis
- Jangan pakai `cd` di bash; pakai parameter `cwd`.
- `read_excel.py` ada di `/projects/sandbox/read_excel.py`.
- Cek sintaks Apps Script: `cp Code.gs /tmp/x.js && node --check /tmp/x.js`.
