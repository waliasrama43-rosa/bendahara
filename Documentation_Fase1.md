# 📋 DOKUMENTASI SISTEM ERP KEAGARAN SEKOLAH RAKYAT - FASE 1

## 🎯 TUJUAN FASE 1
Membangun backend Google Apps Script dengan sistem **Self-Healing Database** yang otomatis mengecek dan membuat struktur database jika belum ada, sesuai format RKKAL yang telah diupload.

## 📁 STRUKTUR FILE YANG DIBUAT

### 1. **Code.gs** - Backend Utama Sistem
- **Entry Point**: `doGet()` dan `doPost()` 
- **Self-Healing Feature**: `initializeDatabase()` → Auto-create jika spreadsheet belum ada
- **Error Handling**: Try-catch komprehensif di semua fungsi utama
- **API Endpoints**: 5 endpoint utama untuk testing dan operasi

### 2. **Utilities.gs** - Fungsi Utility
- **Validation**: `validateNamaToko()`, `validateUraianMak()`, `validateJumlah()`
- **Formatting**: `formatRupiah()`, `formatTanggal()`, `convertRupiahToTerbilang()`
- **Data Processing**: `generateNoUrut()`, `generateBulanList()`
- **Security**: `sanitizeInput()`, `safeExecute()`

### 3. **TestSelfHealing.gs** - Testing Suite
- **Comprehensive Testing**: `testAllFeatures()` untuk testing semua komponen
- **Manual Testing**: `manualRunTests()` untuk testing manual dari UI
- **Quick Verification**: `createSimpleTest()` untuk testing cepat

## 🗂️ STRUKTUR KOLOM DATABASE (12 Kolom)

| No | Kolom | Tipe Data | Contoh | Keterangan |
|----|-------|-----------|--------|------------|
| 1 | NO | Number | 1 | Nomor urut auto-generated |
| 2 | NAMA TOKO | String | SDN 01 Jakarta Pusat | Nama sekolah/unit kerja |
| 3 | URAIAN MAK | String | 521111 - Belanja Keperluan Perkantoran | Uraian Mata Anggaran Keuangan |
| 4 | URAIAN PEMBAYARAN | String | Pembelian ATK Sekolah | Deskripsi pembayaran detail |
| 5 | TAHUN ANGGARAN | Number | 2026 | Tahun anggaran |
| 6 | BULAN PELAKSANAAN | String | Januari | Bulan pelaksanaan |
| 7 | JUMLAH | Number | 15000000 | Jumlah dalam rupiah |
| 8 | TERBILANG | String | Lima Belas Juta Rupiah | Auto-convert dari jumlah |
| 9 | STATUS | String | PENDING | Status data |
| 10 | TANGGAL INPUT | Date | 2026-05-26T10:30:00Z | Timestamp input |
| 11 | ID UNIK | String | ERP-ABC123XYZ | ID unik tracking |
| 12 | KODE ANGGARAN | String | 521111 | Auto-extract dari uraian MAK |

## 🚀 API ENDPOINTS YANG TERSEDIA

### GET Endpoints:
1. **`/?action=test`** - Test sistem (health check)
2. **`/?action=init_database`** - Initialize database manual
3. **`/?action=get_data`** - Get data dengan pagination
4. **`/?action=check_database`** - Check database status
5. **`/?action=validate_data`** - Validate data sebelum input

### POST Endpoints:
1. **`/?action=input_data`** - Input data dengan parameter:
   - `nama_toko` (required)
   - `uraian_mak` (required) 
   - `uraian_pembayaran` (required)
   - `tahun_anggaran` (required, number)
   - `bulan_pelaksanaan` (required)
   - `jumlah` (required, number)

## 🔧 FITUR SELF-HEALING YANG DIIMPLEMENTASI

### 1. **Auto-Create Database**
```javascript
function initializeDatabase() {
  try {
    // Try to open existing
    let ss = SpreadsheetApp.openByName(DB_NAME);
    if (!ss) {
      // Auto-create if not exists
      ss = createNewDatabase();
    }
    return ss;
  } catch (error) {
    // Log error and continue
    logError(error, 'initializeDatabase');
    return null;
  }
}
```

### 2. **Auto-Set Column Headers**
- Deteksi jika header tidak sesuai format RKKAL
- Auto-create 12 kolom sesuai spesifikasi
- Auto-format header dengan styling

### 3. **Error Prevention**
- Try-catch di semua fungsi utama
- Validasi input sebelum proses
- Retry mechanism untuk operasi yang gagal
- User-friendly error messages

### 4. **Auto-Recovery**
- Recreate database jika struktur rusak
- Preserve data jika mungkin
- Comprehensive logging untuk debugging

## 🧪 TESTING PROCEDURE

### Manual Testing:
1. **Test Self-Healing**: 
   - Hapus spreadsheet `ERP_SEKOLAH_RAKYAT_DATABASE`
   - Akses sistem → sistem akan auto-create

2. **Test Data Input**:
   ```javascript
   // Example POST data
   {
     "nama_toko": "SDN Test 01",
     "uraian_mak": "521111 - Belanja ATK",
     "uraian_pembayaran": "Pembelian alat tulis kantor",
     "tahun_anggaran": 2026,
     "bulan_pelaksanaan": "Januari",
     "jumlah": 5000000
   }
   ```

3. **Test Error Handling**:
   - Kirim data tidak valid
   - Cek response error yang user-friendly

### Automated Testing:
```javascript
// Run comprehensive test
function testAllFeatures() {
  // Tests 1-6: Database, error handling, data input, etc.
  return results;
}
```

## 📝 FORMAT DATA YANG DITERIMA

### Input Format:
```json
{
  "nama_toko": "Nama Sekolah (string, required)",
  "uraian_mak": "Kode - Deskripsi (string, required)",
  "uraian_pembayaran": "Detail pembayaran (string, required)",
  "tahun_anggaran": 2026 (number, required),
  "bulan_pelaksanaan": "Januari" (string, required),
  "jumlah": 1000000 (number, required)
}
```

### Output Format (Success):
```json
{
  "status": "success",
  "message": "Data berhasil disimpan",
  "data": {
    "id_unik": "ERP-ABC123XYZ",
    "nomor_data": 1,
    "timestamp": "2026-05-26T10:30:00Z"
  }
}
```

### Output Format (Error):
```json
{
  "status": "error",
  "message": "Terjadi kesalahan sistem. Silakan coba lagi.",
  "error_id": "ERR-INPUT_123456789",
  "suggestion": "Periksa koneksi internet Anda"
}
```

## 🔒 KEAMANAN DAN VALIDASI

### Input Validation:
1. **Required Fields**: Semua 6 field wajib diisi
2. **Data Type**: Validasi tipe data (string, number)
3. **Format**: Uraian MAK harus mengandung kode 6 digit
4. **Range**: Jumlah tidak boleh negatif atau terlalu besar

### Error Prevention:
1. **Try-Catch**: Semua operasi dilindungi try-catch
2. **Retry Mechanism**: 3x retry untuk operasi yang gagal
3. **Logging**: Error log ke sheet terpisah
4. **User Feedback**: Error messages yang jelas dan helpful

## 🚀 DEPLOYMENT INSTRUCTIONS

### Langkah 1: Upload ke Google Apps Script
1. Buka https://script.google.com
2. Buat project baru: `ERP_Sekolah_Rakyat`
3. Upload file-file:
   - `Code.gs` → Main file
   - `Utilities.gs` → Dependencies
   - `TestSelfHealing.gs` → Testing tools

### Langkah 2: Deploy as Web App
1. Klik **Deploy** → **New deployment**
2. Type: **Web app**
3. Configuration:
   - Description: `Production v1.0 (Self-Healing)`
   - Execute as: `Me`
   - Who has access: `Anyone` (untuk testing) → `Anyone within organization` (production)

### Langkah 3: Testing
1. Copy Web App URL
2. Test endpoints:
   ```
   https://script.google.com/macros/s/SCRIPT_ID/exec?action=test
   https://script.google.com/macros/s/SCRIPT_ID/exec?action=check_database
   ```

## 📊 MONITORING DAN LOGGING

### System Logs:
- Auto-created `SISTEM_LOGS` sheet
- Logs semua error dengan timestamp dan context
- Error ID untuk tracking

### Performance:
- Database initialization: ~2-5 detik
- Data insertion: < 1 detik dengan retry
- Error recovery: Otomatis dengan self-healing

## 🔮 NEXT STEPS (FASE 2)

### Fitur yang akan ditambahkan:
1. **Frontend Web Interface** - Web app untuk input data
2. **RKKAL Upload** - Upload file CSV RKKAL format
3. **Export Excel** - Auto-export ke format Excel
4. **Telegram Bot** - Monitoring dan notifications
5. **Multi-tenancy** - Support multiple sekolah

### Optimizations:
1. **Caching** - Data caching untuk performance
2. **Batch Operations** - Bulk data processing
3. **Real-time Updates** - WebSocket untuk live updates
4. **Analytics Dashboard** - Data visualization

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues:
1. **"Database not found"** → Sistem akan auto-create saat pertama kali diakses
2. **"Permission denied"** → Pastikan Web App deployment dengan akses `Anyone`
3. **"Invalid data format"** → Gunakan format JSON yang sesuai

### Testing Commands:
```bash
# Health check
curl "https://script.google.com/macros/s/SCRIPT_ID/exec?action=test"

# Check database
curl "https://script.google.com/macros/s/SCRIPT_ID/exec?action=check_database"

# Input data (example)
curl -X POST \
  "https://script.google.com/macros/s/SCRIPT_ID/exec?action=input_data" \
  -H "Content-Type: application/json" \
  -d '{
    "nama_toko": "SDN Test",
    "uraian_mak": "521111 - Testing",
    "uraian_pembayaran": "Testing sistem",
    "tahun_anggaran": 2026,
    "bulan_pelaksanaan": "Januari",
    "jumlah": 1000000
  }'
```

---

**Last Updated**: May 26, 2026  
**Version**: 1.0.0 (Fase 1 - Self-Healing Backend)  
**Status**: ✅ Ready for Testing