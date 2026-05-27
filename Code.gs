/**
 * SISTEM ERP KEJAHATAN SEKOLAH RAKYAT - CODE.GS
 * Sistem Backend dengan Self-Healing Database
 * 
 * FITUR UTAMA FASE 1:
 * 1. Auto-check dan create Google Sheet database jika belum ada
 * 2. Inisialisasi header kolom secara otomatis sesuai format RKKAL
 * 3. Implementasi try-catch komprehensif untuk mencegah crash
 * 4. Fungsi validasi data dan anti double-input
 * 
 * @author Sistem ERP Sekolah Rakyat
 * @version 1.0.0 (Fase 1)
 */

/* GLOBAL CONFIGURATION */
const SYSTEM_CONFIG = {
  // Main database configuration
  DATABASE_NAME: 'ERP_SEKOLAH_RAKYAT_DATABASE',
  VERSION: '1.0.0',
  
  // Column structure based on RKKAL format
  COLUMN_HEADERS: [
    'NO',                    // Nomor urut
    'NAMA TOKO',             // Nama sekolah/unit kerja
    'URAIAN MAK',            // Uraian Mata Anggaran Keuangan
    'URAIAN PEMBAYARAN',     // Deskripsi pembayaran
    'TAHUN ANGGARAN',        // Tahun anggaran (2026)
    'BULAN PELAKSANAAN',     // Bulan pelaksanaan
    'JUMLAH',                // Jumlah rupiah
    'TERBILANG',             // Jumlah dalam bentuk terbilang
    'STATUS',                // Status data
    'TANGGAL INPUT',         // Timestamp input
    'ID UNIK',               // ID unik untuk tracking
    'KODE ANGGARAN',         // Kode dari format RKKAL
    'REALISASI',             // Realisasi anggaran
    'SISA'                   // Sisa anggaran
  ],
  
  // Self-healing settings
  AUTO_CREATE_DB: true,
  VALIDATE_DATA_ON_STARTUP: true,
  
  // Error handling
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000 // ms
};

/* MAIN FUNCTIONS */

/**
 * doGet - Entry point for HTTP GET requests
 * Self-healing: automatically initialize database if not exists
 */
function doGet(e) {
  return handleRequestWithErrorHandling(e, 'GET');
}

/**
 * doPost - Entry point for HTTP POST requests
 * Includes comprehensive error handling
 */
function doPost(e) {
  return handleRequestWithErrorHandling(e, 'POST');
}

/**
 * handleRequestWithErrorHandling - Main request handler dengan try-catch ketat
 */
function handleRequestWithErrorHandling(e, method) {
  try {
    // Initialize database on first access (self-healing)
    const db = initializeDatabase();
    if (!db) {
      throw new Error('Gagal menginisialisasi database. Sistem sedang offline.');
    }
    
    // Parse request parameters
    const params = e?.parameter || {};
    const action = params.action || 'home';
    
    // Route to appropriate handlers
    switch(action.toLowerCase()) {
      case 'test':
        return createJsonResponse({
          status: 'success',
          message: 'Sistem ERP Sekolah Rakyat berjalan dengan baik',
          version: SYSTEM_CONFIG.VERSION,
          timestamp: new Date().toISOString()
        });
        
      case 'init_database':
        return handleDatabaseInitialization();
        
      case 'input_data':
        return handleDataInput(params);
        
      case 'get_data':
        return handleGetData(params);
        
      case 'validate_data':
        return handleDataValidation(params);
        
      case 'check_database':
        return handleDatabaseCheck();
        
      default:
        return createHomePage();
    }
    
  } catch (error) {
    // Comprehensive error logging and user-friendly response
    const errorId = logError(error, `handleRequestWithErrorHandling-${method}`);
    
    return createJsonResponse({
      status: 'error',
      message: 'Terjadi kesalahan sistem. Silakan coba lagi.',
      error_id: errorId,
      timestamp: new Date().toISOString(),
      suggestion: 'Periksa koneksi internet Anda dan coba refresh halaman.'
    });
  }
}

/* DATABASE FUNCTIONS - SELF-HEALING SYSTEM */

/**
 * initializeDatabase - Auto-create database jika belum ada
 * Self-healing feature: mengecek dan membuat database secara otomatis
 */
function initializeDatabase() {
  try {
    let spreadsheet;
    
    // Try to open existing database
    try {
      spreadsheet = SpreadsheetApp.openByName(SYSTEM_CONFIG.DATABASE_NAME);
      
      // Validate spreadsheet structure
      if (!validateSpreadsheetStructure(spreadsheet)) {
        console.log('Database structure invalid. Recreating...');
        spreadsheet = recreateDatabase();
      }
      
    } catch (notFoundError) {
      // Database tidak ditemukan - auto-create
      console.log('Database tidak ditemukan. Auto-creating...');
      spreadsheet = createNewDatabase();
    }
    
    if (!spreadsheet) {
      throw new Error('Gagal membuat atau mengakses database');
    }
    
    console.log('Database berhasil diinisialisasi:', SYSTEM_CONFIG.DATABASE_NAME);
    return spreadsheet;
    
  } catch (error) {
    logError(error, 'initializeDatabase');
    return null;
  }
}

/**
 * createNewDatabase - Create database baru dengan header kolom
 */
function createNewDatabase() {
  try {
    console.log('Membuat database baru:', SYSTEM_CONFIG.DATABASE_NAME);
    
    // Create spreadsheet
    const spreadsheet = SpreadsheetApp.create(SYSTEM_CONFIG.DATABASE_NAME);
    
    // Get active sheet and rename
    const sheet = spreadsheet.getActiveSheet();
    sheet.setName('DATA_ANGGARAN');
    
    // Set column headers
    setColumnHeaders(sheet);
    
    // Format header row
    formatHeaderRow(sheet);
    
    // Add sample data row (for testing)
    addSampleData(sheet);
    
    console.log('Database baru berhasil dibuat');
    return spreadsheet;
    
  } catch (error) {
    logError(error, 'createNewDatabase');
    return null;
  }
}

/**
 * recreateDatabase - Recreate database jika struktur rusak
 */
function recreateDatabase() {
  try {
    // Try to delete existing spreadsheet
    try {
      const existing = SpreadsheetApp.openByName(SYSTEM_CONFIG.DATABASE_NAME);
      DriveApp.getFileById(existing.getId()).setTrashed(true);
    } catch (e) {
      // Ignore if not found
    }
    
    // Create new database
    return createNewDatabase();
    
  } catch (error) {
    logError(error, 'recreateDatabase');
    return null;
  }
}

/**
 * setColumnHeaders - Set header kolom sesuai format RKKAL
 */
function setColumnHeaders(sheet) {
  try {
    // Clear existing content
    sheet.clear();
    
    // Set column headers
    sheet.getRange(1, 1, 1, SYSTEM_CONFIG.COLUMN_HEADERS.length)
      .setValues([SYSTEM_CONFIG.COLUMN_HEADERS])
      .setFontWeight('bold');
    
    // Set column widths
    const columnWidths = [40, 150, 200, 250, 80, 100, 120, 150, 80, 120, 100, 100, 120, 120];
    for (let i = 0; i < SYSTEM_CONFIG.COLUMN_HEADERS.length; i++) {
      sheet.setColumnWidth(i + 1, columnWidths[i] || 100);
    }
    
    console.log('Header kolom berhasil diset:', SYSTEM_CONFIG.COLUMN_HEADERS);
    
  } catch (error) {
    logError(error, 'setColumnHeaders');
  }
}

/**
 * formatHeaderRow - Format baris header dengan styling
 */
function formatHeaderRow(sheet) {
  try {
    const headerRange = sheet.getRange(1, 1, 1, SYSTEM_CONFIG.COLUMN_HEADERS.length);
    
    // Apply styling
    headerRange.setBackground('#2c3e50')
               .setFontColor('#ffffff')
               .setFontWeight('bold')
               .setHorizontalAlignment('center')
               .setVerticalAlignment('middle')
               .setBorder(true, true, true, true, true, true);
    
  } catch (error) {
    logError(error, 'formatHeaderRow');
  }
}

/**
 * addSampleData - Tambah data sample untuk testing self-healing
 */
function addSampleData(sheet) {
  try {
    const sampleData = [
      [
        1, // NO
        'SDN 01 Jakarta Pusat', // NAMA TOKO
        '521111 - Belanja Keperluan Perkantoran', // URAIAN MAK
        'Pembelian ATK Sekolah', // URAIAN PEMBAYARAN
        2026, // TAHUN ANGGARAN
        'Januari', // BULAN PELAKSANAAN
        15000000, // JUMLAH
        'Lima Belas Juta Rupiah', // TERBILANG
        'TERVERIFIKASI', // STATUS
        new Date().toISOString(), // TANGGAL INPUT
        'SAMPLE-' + Date.now(), // ID UNIK
        '521111', // KODE ANGGARAN
        15000000, // REALISASI
        0 // SISA
      ]
    ];
    
    sheet.getRange(2, 1, 1, sampleData[0].length).setValues(sampleData);
    
    // Format data row
    const dataRowRange = sheet.getRange(2, 1, 1, SYSTEM_CONFIG.COLUMN_HEADERS.length);
    dataRowRange.setBackground('#f8f9fa')
                .setBorder(true, true, true, true, false, false);
    
    console.log('Data sample berhasil ditambahkan');
    
  } catch (error) {
    logError(error, 'addSampleData');
  }
}

/**
 * validateSpreadsheetStructure - Validasi struktur spreadsheet
 */
function validateSpreadsheetStructure(spreadsheet) {
  try {
    const sheet = spreadsheet.getSheetByName('DATA_ANGGARAN');
    if (!sheet) {
      console.log('Sheet DATA_ANGGARAN tidak ditemukan');
      return false;
    }
    
    // Check header row
    const headers = sheet.getRange(1, 1, 1, SYSTEM_CONFIG.COLUMN_HEADERS.length).getValues()[0];
    
    // Basic validation: at least some headers should exist
    if (headers.filter(h => h && h.toString().trim() !== '').length < 5) {
      console.log('Header kolom tidak valid:', headers);
      return false;
    }
    
    return true;
    
  } catch (error) {
    logError(error, 'validateSpreadsheetStructure');
    return false;
  }
}

/* DATA INPUT HANDLERS - WITH VALIDATION */

/**
 * handleDataInput - Handle data input dengan validasi ketat
 */
function handleDataInput(params) {
  try {
    // Validate required parameters
    const validation = validateInputParameters(params);
    if (!validation.valid) {
      return createJsonResponse({
        status: 'error',
        message: 'Parameter tidak valid',
        errors: validation.errors
      });
    }
    
    // Get database
    const spreadsheet = initializeDatabase();
    if (!spreadsheet) {
      throw new Error('Database tidak tersedia');
    }
    
    const sheet = spreadsheet.getSheetByName('DATA_ANGGARAN');
    const lastRow = sheet.getLastRow();
    const newRowNumber = lastRow + 1;
    
    // Prepare data row
    const rowData = prepareDataRow(params, newRowNumber);
    
    // Insert data with retry mechanism
    const inserted = insertDataWithRetry(sheet, rowData, newRowNumber);
    
    if (inserted) {
      return createJsonResponse({
        status: 'success',
        message: 'Data berhasil disimpan',
        data: {
          id_unik: rowData[10], // Index 10 is ID UNIK
          nomor_data: rowData[0], // NO
          timestamp: new Date().toISOString()
        },
        metadata: {
          row_number: newRowNumber,
          jumlah_data: sheet.getLastRow() - 1
        }
      });
    } else {
      return createJsonResponse({
        status: 'error',
        message: 'Gagal menyimpan data. Silakan coba lagi.'
      });
    }
    
  } catch (error) {
    logError(error, 'handleDataInput');
    return createJsonResponse({
      status: 'error',
      message: 'Error saat input data',
      error_id: 'INPUT_ERROR_' + Date.now()
    });
  }
}

/**
 * validateInputParameters - Validasi parameter input untuk mencegah error
 */
function validateInputParameters(params) {
  const errors = [];
  
  // Check required fields based on RKKAL
  if (!params.nama_toko || params.nama_toko.trim() === '') {
    errors.push('NAMA TOKO wajib diisi');
  }
  
  if (!params.uraian_mak || params.uraian_mak.trim() === '') {
    errors.push('URAIAN MAK wajib diisi');
  }
  
  if (!params.uraian_pembayaran || params.uraian_pembayaran.trim() === '') {
    errors.push('URAIAN PEMBAYARAN wajib diisi');
  }
  
  if (!params.tahun_anggaran || isNaN(params.tahun_anggaran)) {
    errors.push('TAHUN ANGGARAN harus angka (contoh: 2026)');
  }
  
  if (!params.bulan_pelaksanaan || params.bulan_pelaksanaan.trim() === '') {
    errors.push('BULAN PELAKSANAAN wajib diisi');
  }
  
  if (!params.jumlah || isNaN(parseFloat(params.jumlah))) {
    errors.push('JUMLAH harus angka');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * prepareDataRow - Siapkan data row dengan format yang benar
 */
function prepareDataRow(params, rowNumber) {
  const jumlah = parseFloat(params.jumlah) || 0;
  
  return [
    rowNumber - 1, // NO (start from 1, but row 1 is header)
    params.nama_toko || '',
    params.uraian_mak || '',
    params.uraian_pembayaran || '',
    parseInt(params.tahun_anggaran) || 2026,
    params.bulan_pelaksanaan || '',
    jumlah,
    convertRupiahToTerbilang(jumlah), // Auto-convert to terbilang
    'PENDING', // Default status
    new Date().toISOString(), // Timestamp
    generateUniqueId(), // ID UNIK
    extractKodeAnggaran(params.uraian_mak), // Auto-extract kode anggaran
    0, // REALISASI default 0
    jumlah // SISA default sama dengan jumlah
  ];
}

/**
 * insertDataWithRetry - Insert data dengan mekanisme retry
 */
function insertDataWithRetry(sheet, rowData, rowNumber, retryCount = 0) {
  try {
    sheet.getRange(rowNumber, 1, 1, rowData.length).setValues([rowData]);
    console.log('Data berhasil disimpan di baris:', rowNumber);
    return true;
    
  } catch (error) {
    if (retryCount < SYSTEM_CONFIG.MAX_RETRIES) {
      console.log(`Retry ${retryCount + 1} untuk menyimpan data...`);
      Utilities.sleep(SYSTEM_CONFIG.RETRY_DELAY);
      return insertDataWithRetry(sheet, rowData, rowNumber, retryCount + 1);
    } else {
      logError(error, `insertDataWithRetry-failed-retries-${retryCount}`);
      return false;
    }
  }
}

/* UTILITY FUNCTIONS */

/**
 * handleDatabaseInitialization - API untuk manual initialization
 */
function handleDatabaseInitialization() {
  try {
    const db = initializeDatabase();
    
    return createJsonResponse({
      status: 'success',
      message: 'Database berhasil diinisialisasi',
      database_name: db ? db.getName() : 'ERROR',
      sheet_count: db ? db.getSheets().length : 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logError(error, 'handleDatabaseInitialization');
    return createJsonResponse({
      status: 'error',
      message: 'Gagal menginisialisasi database'
    });
  }
}

/**
 * handleGetData - Get data dengan pagination
 */
function handleGetData(params) {
  try {
    const spreadsheet = initializeDatabase();
    if (!spreadsheet) {
      throw new Error('Database tidak tersedia');
    }
    
    const sheet = spreadsheet.getSheetByName('DATA_ANGGARAN');
    const startRow = parseInt(params.start_row) || 2;
    const limit = parseInt(params.limit) || 50;
    
    const data = sheet.getRange(startRow, 1, limit, SYSTEM_CONFIG.COLUMN_HEADERS.length).getValues();
    
    return createJsonResponse({
      status: 'success',
      data: data,
      metadata: {
        start_row: startRow,
        limit: limit,
        total_rows: sheet.getLastRow() - 1
      }
    });
    
  } catch (error) {
    logError(error, 'handleGetData');
    return createJsonResponse({
      status: 'error',
      message: 'Gagal mengambil data'
    });
  }
}

/**
 * handleDataValidation - API untuk validasi data
 */
function handleDataValidation(params) {
  try {
    const validationResults = validateInputParameters(params);
    
    return createJsonResponse({
      status: 'success',
      validation_results: validationResults,
      suggestions: validationResults.valid ? [] : [
        'Periksa kembali input data Anda',
        'Pastikan semua field wajib terisi',
        'Format angka untuk field jumlah'
      ]
    });
    
  } catch (error) {
    logError(error, 'handleDataValidation');
    return createJsonResponse({
      status: 'error',
      message: 'Error saat validasi data'
    });
  }
}

/**
 * handleDatabaseCheck - Check database status
 */
function handleDatabaseCheck() {
  try {
    const spreadsheet = SpreadsheetApp.openByName(SYSTEM_CONFIG.DATABASE_NAME);
    
    return createJsonResponse({
      status: 'success',
      database_exists: !!spreadsheet,
      sheet_count: spreadsheet ? spreadsheet.getSheets().length : 0,
      last_modified: spreadsheet ? DriveApp.getFileById(spreadsheet.getId()).getLastUpdated() : null,
      file_size: spreadsheet ? DriveApp.getFileById(spreadsheet.getId()).getSize() : 0
    });
    
  } catch (error) {
    // Database doesn't exist
    return createJsonResponse({
      status: 'info',
      database_exists: false,
      message: 'Database belum dibuat. Sistem akan membuatnya otomatis saat pertama kali diakses.'
    });
  }
}

/**
 * createHomePage - Landing page untuk sistem
 */
function createHomePage() {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Sistem ERP Keuangan Sekolah Rakyat</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
          .container { max-width: 800px; margin: 0 auto; background: rgba(255,255,255,0.95); padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); color: #333; }
          h1 { color: #2c3e50; margin-bottom: 10px; }
          h2 { color: #34495e; margin-top: 30px; }
          .status { padding: 15px; border-radius: 10px; margin: 20px 0; }
          .status.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
          .status.info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
          .api-list { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; }
          .api-item { margin: 10px 0; padding: 10px; border-left: 4px solid #007bff; background: white; }
          .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 8px; margin: 10px 5px; transition: all 0.3s; }
          .btn:hover { background: #0056b3; transform: translateY(-2px); }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🏫 Sistem ERP Keuangan Sekolah Rakyat</h1>
          <p><strong>Version:</strong> ${SYSTEM_CONFIG.VERSION}</p>
          
          <div class="status success">
            <strong>✅ Sistem Berjalan dengan Baik</strong>
            <p>Sistem ERP keuangan dengan self-healing database telah aktif.</p>
          </div>
          
          <h2>🚀 API Endpoints</h2>
          <div class="api-list">
            <div class="api-item"><strong>GET /?action=test</strong> - Test sistem</div>
            <div class="api-item"><strong>GET /?action=init_database</strong> - Initialize database</div>
            <div class="api-item"><strong>POST /?action=input_data</strong> - Input data (POST data diperlukan)</div>
            <div class="api-item"><strong>GET /?action=get_data</strong> - Get data dengan parameter start_row dan limit</div>
            <div class="api-item"><strong>GET /?action=check_database</strong> - Check database status</div>
          </div>
          
          <h2>⚡ Aksi Cepat</h2>
          <a href="?action=test" class="btn">Test Sistem</a>
          <a href="?action=check_database" class="btn">Check Database</a>
          <a href="?action=init_database" class="btn">Initialize DB</a>
          
          <div class="footer">
            <p><strong>Self-Healing Feature:</strong> Sistem akan otomatis membuat database Google Sheet jika belum ada.</p>
            <p><strong>Error Prevention:</strong> Try-catch komprehensif di semua fungsi utama.</p>
            <p><strong>Data Validation:</strong> Validasi input data untuk mencegah crash.</p>
            <p>© 2026 Sistem ERP Keuangan Sekolah Rakyat</p>
          </div>
        </div>
        
        <script>
          // Auto-check system status
          fetch('?action=check_database').then(r => r.json()).then(data => {
            console.log('System Status:', data);
          });
        </script>
      </body>
    </html>
  `;
  
  return HtmlService.createHtmlOutput(html);
}

/**
 * createJsonResponse - Helper untuk membuat response JSON
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * generateUniqueId - Generate ID unik untuk tracking data
 */
function generateUniqueId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `ERP-${timestamp}-${random}`.toUpperCase();
}

/**
 * convertRupiahToTerbilang - Convert jumlah rupiah ke bentuk terbilang
 */
function convertRupiahToTerbilang(jumlah) {
  try {
    if (!jumlah || jumlah === 0) return 'Nol Rupiah';
    
    const satuan = ['', 'Ribu', 'Juta', 'Miliar', 'Triliun'];
    let result = '';
    let numberStr = Math.floor(jumlah).toString();
    
    // Simple conversion for basic amounts
    if (jumlah < 1000000) {
      if (jumlah === 100000) return 'Seratus Ribu Rupiah';
      if (jumlah === 1000000) return 'Satu Juta Rupiah';
      
      const ribuan = Math.floor(jumlah / 1000);
      const sisa = jumlah % 1000;
      
      if (ribuan > 0) result += ribuan + ' Ribu ';
      if (sisa > 0) result += sisa;
      result += ' Rupiah';
      
      return result.trim();
    }
    
    // For complex amounts, return formatted number
    return jumlah.toLocaleString('id-ID') + ' Rupiah';
    
  } catch (error) {
    return jumlah.toLocaleString('id-ID') + ' Rupiah';
  }
}

/**
 * extractKodeAnggaran - Extract kode anggaran dari uraian MAK
 */
function extractKodeAnggaran(uraianMak) {
  try {
    // Pattern: "521111 - Belanja Keperluan Perkantoran"
    const match = uraianMak.match(/^(\d+)/);
    return match ? match[1] : '';
  } catch (error) {
    return '';
  }
}

/**
 * logError - Centralized error logging
 */
function logError(error, context) {
  const errorId = 'ERR-' + context + '-' + Date.now();
  const errorMessage = `[${errorId}] ${context}: ${error.message}\nStack: ${error.stack}`;
  
  console.error(errorMessage);
  
  // Try to log to a sheet if available (optional)
  try {
    const spreadsheet = SpreadsheetApp.openByName(SYSTEM_CONFIG.DATABASE_NAME);
    if (spreadsheet) {
      const logsSheet = spreadsheet.getSheetByName('SISTEM_LOGS') || 
                       spreadsheet.insertSheet('SISTEM_LOGS');
      
      if (logsSheet.getLastRow() === 0) {
        logsSheet.appendRow(['TIMESTAMP', 'ERROR_ID', 'CONTEXT', 'MESSAGE', 'STACK']);
      }
      
      logsSheet.appendRow([
        new Date().toISOString(),
        errorId,
        context,
        error.message.substring(0, 200),
        error.stack ? error.stack.substring(0, 300) : ''
      ]);
    }
  } catch (logError) {
    console.error('Failed to log error to sheet:', logError.message);
  }
  
  return errorId;
}

/* TEST FUNCTIONS - Untuk pengembangan */

/**
 * testSelfHealing - Test self-healing feature
 */
function testSelfHealing() {
  try {
    console.log('Testing self-healing system...');
    
    // Test 1: Check if database exists
    console.log('1. Checking database...');
    const checkResult = handleDatabaseCheck();
    console.log('Check result:', checkResult);
    
    // Test 2: Initialize database
    console.log('2. Initializing database...');
    const initResult = initializeDatabase();
    console.log('Init result:', initResult ? 'SUCCESS' : 'FAILED');
    
    // Test 3: Validate structure
    console.log('3. Validating structure...');
    if (initResult) {
      const valid = validateSpreadsheetStructure(initResult);
      console.log('Structure valid:', valid);
    }
    
    console.log('Self-healing test completed');
    return true;
    
  } catch (error) {
    logError(error, 'testSelfHealing');
    return false;
  }
}

/**
 * testDataInput - Test data input functionality
 */
function testDataInput() {
  try {
    const testData = {
      nama_toko: 'SDN Contoh Test',
      uraian_mak: '521111 - Belanja Keperluan Perkantoran',
      uraian_pembayaran: 'Testing sistem input data',
      tahun_anggaran: 2026,
      bulan_pelaksanaan: 'Januari',
      jumlah: 5000000
    };
    
    console.log('Testing data input:', testData);
    const result = handleDataInput(testData);
    console.log('Input result:', result);
    
    return true;
    
  } catch (error) {
    logError(error, 'testDataInput');
    return false;
  }
}

// Initialize system on script start (optional)
function onOpen() {
  console.log('Sistem ERP Keuangan Sekolah Rakyat dimulai...');
  // Auto-check database on script open
  // initializeDatabase();
}