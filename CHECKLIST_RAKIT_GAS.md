# ✅ CHECKLIST VERIFIKASI RAKIT GAS
# ERP Keuangan Sekolah Rakyat v4.0
# Branch: fase-2-4-erp-complete

---

## 🚨 BACA INI DULU — PALING PENTING!

**Google Apps Script memuat file sesuai URUTAN ABJAD NAMA FILE.**

File `controller_rkkal` berisi baris `const Controller = {}` yang **WAJIB
dimuat lebih dulu** sebelum 4 controller lain (correction, export, input,
validation) yang memakai `Controller.xxx = {}`.

Kalau urutan salah → muncul error: **"ReferenceError: Controller is not defined"**

### SOLUSINYA: Beri NOMOR DEPAN pada nama file (01_, 02_, ...)

Dengan nomor depan, GAS dijamin memuat persis sesuai urutan yang benar.
**JANGAN beri nama tanpa nomor** — itu penyebab utama error perakitan.

---

## 📋 TABEL 16 FILE — NAMA WAJIB PAKAI NOMOR DEPAN

| Urutan | Nama File di GAS | Salin isi dari file GitHub |
|--------|------------------|----------------------------|
| 1 | `01_schema` | `src/database/schema.gs` |
| 2 | `02_database` | `src/database/database.gs` |
| 3 | `03_queue` | `src/modules/module.queue.gs` |
| 4 | `04_selfhealing` | `src/modules/module.selfhealing.gs` |
| 5 | `05_telegram` | `src/modules/module.telegram.gs` |
| 6 | `06_dashboard` | `src/modules/module.dashboard.gs` |
| 7 | `07_controller_rkkal` | `src/controllers/controller.rkkal.gs` |
| 8 | `08_controller_input` | `src/controllers/controller.input.gs` |
| 9 | `09_controller_export` | `src/controllers/controller.export.gs` |
| 10 | `10_controller_validation` | `src/controllers/controller.validation.gs` |
| 11 | `11_controller_correction` | `src/controllers/controller.correction.gs` |
| 12 | `12_style_css` | `src/ui/style.css.gs` |
| 13 | `13_ui_components` | `src/ui/ui.components.gs` |
| 14 | `14_ui_js` | `src/ui/ui.js.gs` |
| 15 | `15_ui_pages` | `src/ui/ui.pages.gs` |
| 16 | `16_main` | `src/main.gs` |

> ⚠️ File `Code.gs` bawaan GAS: hapus isinya, ganti nama jadi `16_main`,
> lalu tempel isi `src/main.gs`. (Atau buat file `16_main` baru lalu hapus `Code`.)


---

## 🔗 LINK LANGSUNG KE TIAP FILE (klik → klik "Raw" → salin semua)

Ganti `BLOB` = `https://github.com/waliasrama43-rosa/bendahara/blob/fase-2-4-erp-complete`

1. [01_schema](https://github.com/waliasrama43-rosa/bendahara/blob/fase-2-4-erp-complete/src/database/schema.gs)
2. [02_database](https://github.com/waliasrama43-rosa/bendahara/blob/fase-2-4-erp-complete/src/database/database.gs)
3. [03_queue](https://github.com/waliasrama43-rosa/bendahara/blob/fase-2-4-erp-complete/src/modules/module.queue.gs)
4. [04_selfhealing](https://github.com/waliasrama43-rosa/bendahara/blob/fase-2-4-erp-complete/src/modules/module.selfhealing.gs)
5. [05_telegram](https://github.com/waliasrama43-rosa/bendahara/blob/fase-2-4-erp-complete/src/modules/module.telegram.gs)
6. [06_dashboard](https://github.com/waliasrama43-rosa/bendahara/blob/fase-2-4-erp-complete/src/modules/module.dashboard.gs)
7. [07_controller_rkkal](https://github.com/waliasrama43-rosa/bendahara/blob/fase-2-4-erp-complete/src/controllers/controller.rkkal.gs)
8. [08_controller_input](https://github.com/waliasrama43-rosa/bendahara/blob/fase-2-4-erp-complete/src/controllers/controller.input.gs)
9. [09_controller_export](https://github.com/waliasrama43-rosa/bendahara/blob/fase-2-4-erp-complete/src/controllers/controller.export.gs)
10. [10_controller_validation](https://github.com/waliasrama43-rosa/bendahara/blob/fase-2-4-erp-complete/src/controllers/controller.validation.gs)
11. [11_controller_correction](https://github.com/waliasrama43-rosa/bendahara/blob/fase-2-4-erp-complete/src/controllers/controller.correction.gs)
12. [12_style_css](https://github.com/waliasrama43-rosa/bendahara/blob/fase-2-4-erp-complete/src/ui/style.css.gs)
13. [13_ui_components](https://github.com/waliasrama43-rosa/bendahara/blob/fase-2-4-erp-complete/src/ui/ui.components.gs)
14. [14_ui_js](https://github.com/waliasrama43-rosa/bendahara/blob/fase-2-4-erp-complete/src/ui/ui.js.gs)
15. [15_ui_pages](https://github.com/waliasrama43-rosa/bendahara/blob/fase-2-4-erp-complete/src/ui/ui.pages.gs)
16. [16_main](https://github.com/waliasrama43-rosa/bendahara/blob/fase-2-4-erp-complete/src/main.gs)

---

## ☑️ CHECKLIST LANGKAH PERAKITAN

```
PERSIAPAN
□ Login Gmail (akun khusus sekolah)
□ Buka script.google.com → "+ Proyek baru"
□ Beri nama proyek: ERP_Sekolah_Rakyat

SALIN KODE (ikuti urutan nomor 01-16!)
□ 01_schema          tersalin & disimpan (Ctrl+S)
□ 02_database        tersalin & disimpan
□ 03_queue           tersalin & disimpan
□ 04_selfhealing     tersalin & disimpan
□ 05_telegram        tersalin & disimpan
□ 06_dashboard       tersalin & disimpan
□ 07_controller_rkkal      tersalin & disimpan
□ 08_controller_input      tersalin & disimpan
□ 09_controller_export     tersalin & disimpan
□ 10_controller_validation tersalin & disimpan
□ 11_controller_correction tersalin & disimpan
□ 12_style_css       tersalin & disimpan
□ 13_ui_components   tersalin & disimpan
□ 14_ui_js           tersalin & disimpan
□ 15_ui_pages        tersalin & disimpan
□ 16_main            tersalin & disimpan (file Code bawaan diganti ini)
□ Pastikan TIDAK ada file "Code" kosong tersisa
```


```
DEPLOY
□ Klik Deploy → Deployment baru
□ Pilih jenis: Aplikasi web
□ Jalankan sebagai: Saya (email kamu)
□ Akses: Semua orang
□ Klik Deploy → Otorisasi akses → Izinkan
□ SALIN URL Web App → simpan baik-baik!

UJI FONDASI (8 tes wajib lulus)
□ Tes 1: buka URL + ?action=health_check → muncul "status":"healthy"
□ Tes 2: buka URL polos → muncul UI dashboard (sidebar + kartu statistik)
□ Tes 3: cek Google Drive → ada file "ERP_Sekolah_Rakyat"
□ Tes 4: file itu punya 8 tab sheet
□ Tes 5: menu Daftar Sekolah → daftar 1 sekolah → dapat School ID
□ Tes 6: simpan School ID di menu Pengaturan
□ Tes 7: menu Input Data SPJ → isi 1 transaksi → tersimpan
□ Tes 8: menu Lihat Transaksi → data muncul di tabel
```

---

## 🔧 JIKA TETAP ADA ERROR

### ❌ "ReferenceError: Controller is not defined"
**Sebab:** Nama file belum pakai nomor depan, atau urutan kebalik.
**Solusi:** Pastikan `07_controller_rkkal` ada SEBELUM file controller lain.
Ganti nama semua file controller sesuai tabel (pakai nomor depan).

### ❌ "ReferenceError: DB_CONFIG is not defined"
**Sebab:** File `01_schema` belum dimuat / belum dibuat.
**Solusi:** Pastikan `01_schema` ada dan tersimpan.

### ❌ Halaman putih / blank
**Sebab:** File UI (12-15) belum lengkap.
**Solusi:** Cek `12_style_css`, `13_ui_components`, `14_ui_js`, `15_ui_pages` ada semua.

### ❌ "You do not have permission"
**Solusi:** Deploy → Kelola deployment → edit → Akses: "Semua orang" → Deploy.

### ❌ Database tidak terbuat
**Solusi:** Buka URL + `?action=init_db`

---

## 📞 SETELAH 8 TES LULUS

Berarti **fondasi 100% solid**. Lapor ke Kiro di sesi berikutnya:
> "Fondasi sudah jalan, 8 tes lulus. Lanjut FASE 5: RKKAL Fleksibel & RAB Generator."

---

*Checklist ini dibuat Kiro AI — verifikasi 16 file selesai, urutan load sudah dikoreksi.*
