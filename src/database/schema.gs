/**
 * ============================================================
 * DATABASE SCHEMA - ERP Keuangan Sekolah Rakyat
 * Fase 2: Extended schema untuk multi-tenancy & fitur lengkap
 * ============================================================
 */

const DB_CONFIG = {
  SPREADSHEET_NAME: 'ERP_Sekolah_Rakyat',
  VERSION: '2.0.0',
  SHEETS: {
    TRANSACTIONS : 'Data_Transaksi',
    SCHOOLS      : 'Data_Sekolah',
    SUBSCRIPTIONS: 'Data_Subscription',
    LOGS         : 'System_Logs',
    TEMPLATES    : 'Template_RKKAL',
    RKKAL        : 'Data_RKKAL',
    REALISASI    : 'Data_Realisasi',
    NOTIFICATIONS: 'Notifikasi'
  }
};

// ── Header Definitions ──────────────────────────────────────
const SCHEMA = {
  Data_Transaksi: [
    'ID_Transaksi','School_ID','Kode_Anggaran','Uraian_MAK',
    'Uraian_Pembayaran','Nama_Toko','Jumlah_Rupiah','Terbilang',
    'Tahun_Anggaran','Bulan_Pelaksanaan','Status_Verifikasi',
    'Timestamp','Input_By','Kode_Program','Kode_Komponen',
    'Jenis_Belanja','Kuantitas','Harga_Satuan','Catatan'
  ],
  Data_Sekolah: [
    'School_ID','Nama_Sekolah','Kode_Sekolah','Alamat',
    'Kota_Kabupaten','Provinsi','Kepala_Sekolah','Bendahara',
    'No_Telp','Email','Status_Aktif','Tanggal_Daftar','Plan_Type',
    'Telegram_Chat_ID','Quota_Bulanan','Total_Transaksi'
  ],
  Data_Subscription: [
    'Subscription_ID','School_ID','Plan_Type','Start_Date',
    'End_Date','Status','Payment_Status','Amount','Notes'
  ],
  System_Logs: [
    'Log_ID','Timestamp','Level','Module','School_ID','Message','Details'
  ],
  Template_RKKAL: [
    'Template_ID','School_ID','Tahun_Anggaran','Template_JSON',
    'Last_Updated','Status','Total_Pagu'
  ],
  Data_RKKAL: [
    'RKKAL_ID','School_ID','Tahun_Anggaran','Kode_Program',
    'Kode_Kegiatan','Kode_Komponen','Kode_Akun','Uraian',
    'Volume','Satuan','Harga_Satuan','Pagu_Anggaran',
    'Realisasi_Jan','Realisasi_Feb','Realisasi_Mar','Realisasi_Apr',
    'Realisasi_Mei','Realisasi_Jun','Realisasi_Jul','Realisasi_Agu',
    'Realisasi_Sep','Realisasi_Okt','Realisasi_Nov','Realisasi_Des',
    'Total_Realisasi','Sisa_Anggaran','Persen_Realisasi'
  ],
  Data_Realisasi: [
    'Realisasi_ID','School_ID','RKKAL_ID','Kode_Anggaran',
    'Bulan','Tahun','Jumlah','Timestamp','Status','Transaksi_IDs'
  ],
  Notifikasi: [
    'Notif_ID','School_ID','Telegram_Chat_ID','Pesan',
    'Timestamp','Status_Kirim','Jenis','Reference_ID'
  ]
};

// ── initDatabase ─────────────────────────────────────────────
function initDatabase() {
  try {
    let ss;
    try {
      ss = SpreadsheetApp.openByName(DB_CONFIG.SPREADSHEET_NAME);
    } catch (e) {
      ss = null;
    }

    if (!ss) {
      ss = SpreadsheetApp.create(DB_CONFIG.SPREADSHEET_NAME);
    }

    // Ensure every sheet exists with correct headers
    Object.entries(SCHEMA).forEach(([name, headers]) => {
      let sheet = ss.getSheetByName(name);
      if (!sheet) {
        sheet = ss.insertSheet(name);
        sheet.appendRow(headers);
        _styleHeader(sheet, headers.length);
      } else {
        // Heal missing headers
        const existing = sheet.getRange(1,1,1,Math.max(sheet.getLastColumn(),1)).getValues()[0];
        if (existing.filter(h => h && h.toString().trim()).length < 3) {
          sheet.clearContents();
          sheet.appendRow(headers);
          _styleHeader(sheet, headers.length);
        }
      }
    });

    // Remove default "Sheet1" if present
    const defaultSheet = ss.getSheetByName('Sheet1');
    if (defaultSheet && ss.getSheets().length > 1) {
      ss.deleteSheet(defaultSheet);
    }

    return ss;
  } catch (err) {
    Logger.log('initDatabase ERROR: ' + err.message);
    return null;
  }
}

function _styleHeader(sheet, colCount) {
  const range = sheet.getRange(1, 1, 1, colCount);
  range.setBackground('#1a237e')
       .setFontColor('#ffffff')
       .setFontWeight('bold')
       .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}

function getDatabase() { return initDatabase(); }

function createSheetIfNotExists(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (SCHEMA[sheetName]) {
      sheet.appendRow(SCHEMA[sheetName]);
      _styleHeader(sheet, SCHEMA[sheetName].length);
    }
  }
  return sheet;
}

function checkDataRace(sheetName, rowData) {
  try {
    const lock = LockService.getPublicLock();
    return lock.tryLock(10000);
  } catch (e) {
    return false;
  }
}
