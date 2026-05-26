/**
 * Database Schema for ERP Keuangan Sekolah Rakyat
 * Google Sheets-based relational database
 */

const DB_CONFIG = {
  SPREADSHEET_NAME: 'ERP_Sekolah_Rakyat',
  SHEETS: {
    TRANSACTIONS: 'Data_Transaksi',
    SCHOOLS: 'Data_Sekolah',
    SUBSCRIPTIONS: 'Data_Subscription',
    LOGS: 'System_Logs',
    TEMPLATES: 'Template_RKKAL'
  }
};

/**
 * Initialize database schema with self-healing
 */
function initDatabase() {
  try {
    // Check if spreadsheet exists
    let ss = SpreadsheetApp.openByName(DB_CONFIG.SPREADSHEET_NAME);
    
    // Auto-create if missing
    if (!ss) {
      ss = SpreadsheetApp.create(DB_CONFIG.SPREADSHEET_NAME);
      
      // Auto-create sheets with headers
      createAllSheetsWithHeaders(ss);
    }
    
    return ss;
    
  } catch (error) {
    Logger.log('Database init error: ' + error.message);
    return null;
  }
}

/**
 * Create all sheets with required headers
 */
function createAllSheetsWithHeaders(ss) {
  // 1. Transactions Sheet
  let transactionsSheet = createSheetIfNotExists(ss, DB_CONFIG.SHEETS.TRANSACTIONS);
  transactionsSheet.clear();
  transactionsSheet.appendRow([
    'ID_Transaksi',
    'Kode_Anggaran',
    'Nama_Kegiatan',
    'Jumlah_Rupiah',
    'Timestamp',
    'Status_Verifikasi',
    'School_ID',
    'Kode_Program',
    'Kode_Komponen',
    'Jenis_Belanja',
    'Kuantitas',
    'Harga_Satuan'
  ]);
  
  // 2. Schools Sheet
  let schoolsSheet = createSheetIfNotExists(ss, DB_CONFIG.SHEETS.SCHOOLS);
  schoolsSheet.clear();
  schoolsSheet.appendRow([
    'School_ID',
    'Nama_Sekolah',
    'Alamat_Sekolah',
    'Kepala_Sekolah',
    'Bendahara',
    'Status_Aktif',
    'Tanggal_Daftar',
    'Plan_Type'
  ]);
  
  // 3. Subscriptions Sheet
  let subscriptionSheet = createSheetIfNotExists(ss, DB_CONFIG.SHEETS.SUBSCRIPTIONS);
  subscriptionSheet.clear();
  subscriptionSheet.appendRow([
    'Subscription_ID',
    'School_ID',
    'Start_Date',
    'End_Date',
    'Status',
    'Payment_Status'
  ]);
  
  // 4. Logs Sheet
  let logsSheet = createSheetIfNotExists(ss, DB_CONFIG.SHEETS.LOGS);
  logsSheet.clear();
  logsSheet.appendRow([
    'Log_ID',
    'Timestamp',
    'Level',
    'Module',
    'Message',
    'Details'
  ]);
  
  // 5. Templates Sheet
  let templatesSheet = createSheetIfNotExists(ss, 'Template_RKKAL');
  templatesSheet.clear();
  templatesSheet.appendRow([
    'Template_ID',
    'School_ID',
    'Template_JSON',
    'Last_Updated',
    'Status'
  ]);
}

/**
 * Create sheet if not exists
 */
function createSheetIfNotExists(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * Get database connection
 */
function getDatabase() {
  return initDatabase();
}

/**
 * Validate data race conditions
 */
function checkDataRace(sheetName, rowData) {
  try {
    const ss = getDatabase();
    const sheet = ss.getSheetByName(sheetName);
    
    // Simple race condition check - lock mechanism
    const lock = LockService.getPublicLock();
    const acquired = lock.tryLock(10000); // 10 seconds
    
    if (!acquired) {
      Logger.log('Data race detected - locktimeout');
      return false;
    }
    
    return true;
    
  } catch (error) {
    Logger.log('Race check error: ' + error.message);
    return false;
  }
}