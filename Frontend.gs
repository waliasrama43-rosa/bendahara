/**
 * FRONTEND.GS - Web Interface untuk Sistem ERP Sekolah Rakyat
 * FASE 2: Frontend Web App dengan RKKAL Upload dan Excel Export
 */

/* GLOBAL FRONTEND CONFIG */
const FRONTEND_CONFIG = {
  APP_NAME: 'ERP Keuangan Sekolah Rakyat',
  VERSION: '2.0.0',
  API_BASE: ScriptApp.getService().getUrl(),
  
  // UI Configuration
  THEME_COLORS: {
    primary: '#2c3e50',
    secondary: '#3498db',
    success: '#27ae60',
    warning: '#f39c12',
    danger: '#e74c3c',
    light: '#f8f9fa',
    dark: '#34495e'
  },
  
  // Features
  FEATURES_ENABLED: {
    DATA_INPUT: true,
    RKKAL_UPLOAD: true,
    EXCEL_EXPORT: true,
    DATA_VIEW: true,
    DASHBOARD: true,
    MULTI_SCHOOL: false, // Will be enabled in Phase 3
    TELEGRAM_BOT: false  // Will be enabled in Phase 3
  }
};

/* MAIN FRONTEND FUNCTIONS */

/**
 * serveFrontend - Main frontend entry point
 */
function serveFrontend() {
  return HtmlService.createTemplateFromFile('main')
    .evaluate()
    .setTitle(FRONTEND_CONFIG.APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setFaviconUrl('https://img.icons8.com/color/96/000000/school--v1.png');
}

/**
 * serveDashboard - Dashboard page
 */
function serveDashboard() {
  return HtmlService.createTemplateFromFile('dashboard')
    .evaluate()
    .setTitle('Dashboard - ' + FRONTEND_CONFIG.APP_NAME);
}

/**
 * serveDataInput - Data input page
 */
function serveDataInput() {
  return HtmlService.createTemplateFromFile('data-input')
    .evaluate()
    .setTitle('Input Data - ' + FRONTEND_CONFIG.APP_NAME);
}

/**
 * serveUploadRKKAL - RKKAL upload page
 */
function serveUploadRKKAL() {
  return HtmlService.createTemplateFromFile('upload-rkkal')
    .evaluate()
    .setTitle('Upload RKKAL - ' + FRONTEND_CONFIG.APP_NAME);
}

/**
 * serveDataView - Data view page
 */
function serveDataView() {
  return HtmlService.createTemplateFromFile('data-view')
    .evaluate()
    .setTitle('Lihat Data - ' + FRONTEND_CONFIG.APP_NAME);
}

/**
 * serveExport - Export page
 */
function serveExport() {
  return HtmlService.createTemplateFromFile('export')
    .evaluate()
    .setTitle('Export Data - ' + FRONTEND_CONFIG.APP_NAME);
}

/* BACKEND API INTEGRATION */

/**
 * getSystemInfo - Get system information
 */
function getSystemInfo() {
  try {
    const spreadsheet = SpreadsheetApp.openByName('ERP_SEKOLAH_RAKYAT_DATABASE');
    
    return {
      success: true,
      data: {
        app_name: FRONTEND_CONFIG.APP_NAME,
        version: FRONTEND_CONFIG.VERSION,
        features: FRONTEND_CONFIG.FEATURES_ENABLED,
        database: {
          exists: !!spreadsheet,
          name: spreadsheet ? spreadsheet.getName() : null,
          total_sheets: spreadsheet ? spreadsheet.getSheets().length : 0
        },
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: {
        app_name: FRONTEND_CONFIG.APP_NAME,
        version: FRONTEND_CONFIG.VERSION,
        features: FRONTEND_CONFIG.FEATURES_ENABLED,
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * getDashboardData - Get dashboard statistics
 */
function getDashboardData() {
  try {
    const spreadsheet = SpreadsheetApp.openByName('ERP_SEKOLAH_RAKYAT_DATABASE');
    if (!spreadsheet) {
      return { success: false, error: 'Database not found' };
    }
    
    const sheet = spreadsheet.getSheetByName('DATA_ANGGARAN');
    if (!sheet) {
      return { success: false, error: 'DATA_ANGGARAN sheet not found' };
    }
    
    const lastRow = sheet.getLastRow();
    const dataCount = lastRow > 1 ? lastRow - 1 : 0;
    
    // Calculate total amount
    let totalAmount = 0;
    if (dataCount > 0) {
      const amounts = sheet.getRange(2, 7, dataCount, 1).getValues(); // Column 7 = JUMLAH
      totalAmount = amounts.reduce((sum, row) => sum + (parseFloat(row[0]) || 0), 0);
    }
    
    // Get recent schools
    const recentSchools = [];
    if (dataCount > 0) {
      const schoolNames = sheet.getRange(2, 2, Math.min(dataCount, 5), 1).getValues(); // Column 2 = NAMA TOKO
      recentSchools.push(...schoolNames.map(row => row[0] || 'Unknown').filter(name => name && name.trim()));
    }
    
    // Get status distribution
    let pendingCount = 0;
    let verifiedCount = 0;
    if (dataCount > 0) {
      const statuses = sheet.getRange(2, 9, dataCount, 1).getValues(); // Column 9 = STATUS
      statuses.forEach(row => {
        const status = (row[0] || '').toString().toUpperCase();
        if (status.includes('VERIFIED') || status.includes('TERVERIFIKASI')) {
          verifiedCount++;
        } else if (status.includes('PENDING')) {
          pendingCount++;
        }
      });
    }
    
    // Get monthly distribution (simplified)
    const monthStats = {};
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                   'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    months.forEach(month => monthStats[month] = 0);
    
    if (dataCount > 0) {
      const monthData = sheet.getRange(2, 6, dataCount, 1).getValues(); // Column 6 = BULAN PELAKSANAAN
      monthData.forEach(row => {
        const month = (row[0] || '').toString().trim();
        if (months.includes(month)) {
          monthStats[month]++;
        }
      });
    }
    
    return {
      success: true,
      data: {
        summary: {
          total_data: dataCount,
          total_amount: totalAmount,
          formatted_amount: formatRupiah(totalAmount),
          pending_count: pendingCount,
          verified_count: verifiedCount,
          schools_count: new Set(recentSchools).size
        },
        recent_schools: [...new Set(recentSchools)].slice(0, 10),
        month_distribution: monthStats,
        last_updated: new Date().toISOString()
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: {
        summary: { total_data: 0, total_amount: 0, formatted_amount: 'Rp 0' }
      }
    };
  }
}

/**
 * uploadRKKALFile - Process uploaded RKKAL CSV file
 */
function uploadRKKALFile(fileName, fileContent) {
  try {
    console.log('Processing RKKAL file:', fileName);
    
    // Parse CSV content
    const rows = parseCSVContent(fileContent);
    console.log('Parsed rows:', rows.length);
    
    if (rows.length < 2) {
      return { success: false, error: 'File kosong atau tidak valid' };
    }
    
    // Get database
    const spreadsheet = SpreadsheetApp.openByName('ERP_SEKOLAH_RAKYAT_DATABASE');
    if (!spreadsheet) {
      throw new Error('Database tidak ditemukan');
    }
    
    const sheet = spreadsheet.getSheetByName('DATA_ANGGARAN');
    const lastRow = sheet.getLastRow();
    const startRow = lastRow + 1;
    
    // Process and insert rows
    const processedRows = processRKKALRows(rows);
    console.log('Processed rows for insertion:', processedRows.length);
    
    let insertedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Insert rows with validation
    processedRows.forEach((rowData, index) => {
      try {
        const finalRowNumber = startRow + index;
        const dataRow = prepareRKKALDataRow(rowData, finalRowNumber);
        
        if (dataRow) {
          sheet.getRange(finalRowNumber, 1, 1, dataRow.length).setValues([dataRow]);
          insertedCount++;
        }
      } catch (rowError) {
        errorCount++;
        errors.push(`Row ${index + 1}: ${rowError.message}`);
      }
    });
    
    // Format inserted rows
    if (insertedCount > 0) {
      const insertedRange = sheet.getRange(startRow, 1, insertedCount, SYSTEM_CONFIG.COLUMN_HEADERS.length);
      insertedRange.setBackground('#f0f8ff')
                   .setBorder(true, true, true, true, false, false);
    }
    
    return {
      success: true,
      data: {
        file_name: fileName,
        rows_parsed: rows.length - 1, // Exclude header
        rows_inserted: insertedCount,
        rows_failed: errorCount,
        errors: errors,
        start_row: startRow,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('Error in uploadRKKALFile:', error);
    return {
      success: false,
      error: error.message,
      data: {
        file_name: fileName,
        rows_parsed: 0,
        rows_inserted: 0,
        rows_failed: 0,
        errors: [error.message],
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * parseCSVContent - Parse CSV content
 */
function parseCSVContent(content) {
  try {
    // Basic CSV parsing
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    const rows = [];
    lines.forEach(line => {
      // Simple comma parsing, handle quoted fields
      const row = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      // Add last field
      row.push(current.trim());
      rows.push(row);
    });
    
    return rows;
    
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
}

/**
 * processRKKALRows - Process RKKAL rows to extract relevant data
 */
function processRKKALRows(rows) {
  const processedRows = [];
  
  // RKKAL format: KODE, PROGRAM/KEGIATAN, PERHITUNGAN TAHUN, etc.
  // We need to map to our format
  
  for (let i = 1; i < rows.length; i++) { // Skip header
    const row = rows[i];
    
    if (row.length < 10) continue; // Skip incomplete rows
    
    try {
      // Extract data based on RKKAL format pattern
      const kode = row[0] || '';
      const programKegiatan = row[1] || '';
      const perhitungan = row[2] || '';
      const volume = row[3] || '';
      const pkt = row[4] || '';
      const hargaSatuan = row[5] || '';
      const jumlahBiaya = row[6] || '';
      
      // Only process rows with actual data
      if (!kode.trim() && !programKegiatan.trim()) continue;
      
      // Create processed row object
      const processedRow = {
        kode_anggaran: kode.trim(),
        program_kegiatan: programKegiatan.trim(),
        uraian_mak: `${kode.trim()} - ${programKegiatan.trim()}`,
        uraian_pembayaran: programKegiatan.trim(),
        tahun_anggaran: 2026, // Default from RKKAL 2026
        jumlah: extractAmount(jumlahBiaya),
        volume: volume,
        pkt: pkt,
        harga_satuan: hargaSatuan,
        is_valid: validateRKKALRow(kode, jumlahBiaya)
      };
      
      if (processedRow.is_valid) {
        processedRows.push(processedRow);
      }
      
    } catch (error) {
      console.log('Error processing row', i, error);
    }
  }
  
  return processedRows;
}

/**
 * extractAmount - Extract amount from RKKAL format
 */
function extractAmount(amountStr) {
  try {
    // Clean the amount string
    let cleanStr = amountStr.toString()
      .replace(/[^0-9.,-]/g, '')
      .replace(/,/g, '')
      .replace(/_-|\*|_/g, '');
    
    // Handle negative indicators
    const isNegative = amountStr.includes('_-') || amountStr.includes('-*');
    
    let amount = parseFloat(cleanStr);
    if (isNaN(amount)) amount = 0;
    if (isNegative) amount = -Math.abs(amount);
    
    return amount;
  } catch (error) {
    return 0;
  }
}

/**
 * validateRKKALRow - Validate RKKAL row
 */
function validateRKKALRow(kode, jumlah) {
  // Basic validation
  const hasKode = kode && kode.trim() !== '';
  const hasJumlah = jumlah && jumlah.trim() !== '';
  
  return hasKode && hasJumlah;
}

/**
 * prepareRKKALDataRow - Prepare RKKAL data for insertion
 */
function prepareRKKALDataRow(rowData, rowNumber) {
  try {
    const jumlah = parseFloat(rowData.jumlah) || 0;
    
    return [
      rowNumber - 1, // NO (start from 1, but header is at row 1)
      'IMPORTED_RKKAL', // NAMA TOKO (will be updated later)
      rowData.uraian_mak || '',
      rowData.uraian_pembayaran || '',
      2026, // TAHUN ANGGARAN
      'Import RKKAL', // BULAN PELAKSANAAN
      Math.abs(jumlah), // JUMLAH (absolute value)
      convertRupiahToTerbilang(Math.abs(jumlah)),
      'IMPORTED', // STATUS
      new Date().toISOString(),
      'RKKAL_' + generateUniqueId(),
      rowData.kode_anggaran || '',
      Math.abs(jumlah), // REALISASI (same as jumlah for import)
      0 // SISA
    ];
  } catch (error) {
    console.error('Error preparing RKKAL data row:', error);
    return null;
  }
}

/**
 * exportToExcel - Export data to Excel format
 */
function exportToExcel(format = 'xlsx') {
  try {
    const spreadsheet = SpreadsheetApp.openByName('ERP_SEKOLAH_RAKYAT_DATABASE');
    if (!spreadsheet) {
      throw new Error('Database tidak ditemukan');
    }
    
    const sheet = spreadsheet.getSheetByName('DATA_ANGGARAN');
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      throw new Error('Tidak ada data untuk di-export');
    }
    
    // Create export spreadsheet
    const exportName = `Export_ERP_Sekolah_Rakyat_${new Date().toISOString().slice(0, 10)}`;
    const exportSpreadsheet = SpreadsheetApp.create(exportName);
    const exportSheet = exportSpreadsheet.getActiveSheet();
    
    // Copy data
    const dataRange = sheet.getRange(1, 1, lastRow, SYSTEM_CONFIG.COLUMN_HEADERS.length);
    const data = dataRange.getValues();
    exportSheet.getRange(1, 1, lastRow, SYSTEM_CONFIG.COLUMN_HEADERS.length).setValues(data);
    
    // Apply formatting
    exportSheet.getRange(1, 1, 1, SYSTEM_CONFIG.COLUMN_HEADERS.length)
      .setBackground('#2c3e50')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    
    // Auto-resize columns
    for (let i = 1; i <= SYSTEM_CONFIG.COLUMN_HEADERS.length; i++) {
      exportSheet.autoResizeColumn(i);
    }
    
    // Add export info
    const infoRow = lastRow + 2;
    exportSheet.getRange(infoRow, 1).setValue(`Data Export - ${FRONTEND_CONFIG.APP_NAME}`);
    exportSheet.getRange(infoRow + 1, 1).setValue(`Tanggal Export: ${new Date().toLocaleString('id-ID')}`);
    exportSheet.getRange(infoRow + 2, 1).setValue(`Total Data: ${lastRow - 1} records`);
    
    // Get file URL for download
    const fileId = exportSpreadsheet.getId();
    const file = DriveApp.getFileById(fileId);
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    return {
      success: true,
      data: {
        export_name: exportName,
        file_id: fileId,
        file_url: file.getUrl(),
        download_url: downloadUrl,
        row_count: lastRow - 1,
        format: format,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: {
        export_name: null,
        file_id: null,
        row_count: 0,
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * getDataForView - Get data for data view page
 */
function getDataForView(params = {}) {
  try {
    const { page = 1, limit = 20, search = '', sort_by = 'NO', sort_order = 'desc' } = params;
    
    const spreadsheet = SpreadsheetApp.openByName('ERP_SEKOLAH_RAKYAT_DATABASE');
    if (!spreadsheet) {
      return { success: false, error: 'Database tidak ditemukan' };
    }
    
    const sheet = spreadsheet.getSheetByName('DATA_ANGGARAN');
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return { success: true, data: [], total: 0, page: 1, limit: limit };
    }
    
    // Get all data (excluding header)
    const dataRange = sheet.getRange(2, 1, lastRow - 1, SYSTEM_CONFIG.COLUMN_HEADERS.length);
    const allData = dataRange.getValues();
    
    // Apply search filter
    let filteredData = allData;
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filteredData = allData.filter(row => {
        return row.some(cell => 
          (cell || '').toString().toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Apply sorting
    const columnIndex = SYSTEM_CONFIG.COLUMN_HEADERS.indexOf(sort_by);
    if (columnIndex !== -1) {
      filteredData.sort((a, b) => {
        const aVal = a[columnIndex];
        const bVal = b[columnIndex];
        
        if (sort_order === 'asc') {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
      });
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, filteredData.length);
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    // Format data for display
    const formattedData = paginatedData.map(row => {
      const rowObj = {};
      SYSTEM_CONFIG.COLUMN_HEADERS.forEach((header, index) => {
        rowObj[header.toLowerCase().replace(/ /g, '_')] = row[index];
      });
      
      // Add formatted values
      if (rowObj.jumlah) {
        rowObj.formatted_jumlah = formatRupiah(rowObj.jumlah);
      }
      
      if (rowObj.tanggal_input) {
        rowObj.formatted_tanggal = formatTanggal(rowObj.tanggal_input);
      }
      
      return rowObj;
    });
    
    return {
      success: true,
      data: {
        records: formattedData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredData.length,
          pages: Math.ceil(filteredData.length / limit)
        },
        filters: {
          search: search,
          sort_by: sort_by,
          sort_order: sort_order
        }
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: {
        records: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 }
      }
    };
  }
}

/**
 * addDataFromFrontend - Add data from frontend form
 */
function addDataFromFrontend(formData) {
  try {
    // Validate required fields
    const requiredFields = ['nama_toko', 'uraian_mak', 'uraian_pembayaran', 'tahun_anggaran', 'bulan_pelaksanaan', 'jumlah'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Field wajib tidak diisi: ${missingFields.join(', ')}`
      };
    }
    
    // Prepare data for backend
    const backendData = {
      nama_toko: formData.nama_toko,
      uraian_mak: formData.uraian_mak,
      uraian_pembayaran: formData.uraian_pembayaran,
      tahun_anggaran: parseInt(formData.tahun_anggaran),
      bulan_pelaksanaan: formData.bulan_pelaksanaan,
      jumlah: parseFloat(formData.jumlah)
    };
    
    // Call backend function (from Code.gs)
    const result = handleDataInput(backendData);
    
    return {
      success: result.status === 'success',
      message: result.message || (result.status === 'success' ? 'Data berhasil ditambahkan' : 'Gagal menambahkan data'),
      data: result.data || {},
      backend_result: result
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/* UTILITY FUNCTIONS FOR FRONTEND */

/**
 * formatRupiah - Format number to Rupiah
 */
function formatRupiah(amount) {
  return 'Rp ' + (amount || 0).toLocaleString('id-ID');
}

/**
 * formatTanggal - Format date
 */
function formatTanggal(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateStr;
  }
}

/**
 * convertRupiahToTerbilang - Convert amount to terbilang
 */
function convertRupiahToTerbilang(amount) {
  // Reuse from Utilities.gs
  if (!amount || amount === 0) return 'Nol Rupiah';
  
  const satuan = ['', 'Ribu', 'Juta', 'Miliar', 'Triliun'];
  let result = '';
  const numberStr = Math.floor(amount).toString();
  
  if (amount < 1000000) {
    if (amount === 100000) return 'Seratus Ribu Rupiah';
    if (amount === 1000000) return 'Satu Juta Rupiah';
    
    const ribuan = Math.floor(amount / 1000);
    const sisa = amount % 1000;
    
    if (ribuan > 0) result += ribuan + ' Ribu ';
    if (sisa > 0) result += sisa;
    result += ' Rupiah';
    
    return result.trim();
  }
  
  return amount.toLocaleString('id-ID') + ' Rupiah';
}

/**
 * generateUniqueId - Generate unique ID
 */
function generateUniqueId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `ERP-${timestamp}-${random}`.toUpperCase();
}

/* INTEGRATION FUNCTIONS */

/**
 * getAvailableSchools - Get list of schools from database
 */
function getAvailableSchools() {
  try {
    const spreadsheet = SpreadsheetApp.openByName('ERP_SEKOLAH_RAKYAT_DATABASE');
    if (!spreadsheet) return { success: false, error: 'Database not found', data: [] };
    
    const sheet = spreadsheet.getSheetByName('DATA_ANGGARAN');
    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: true, data: [] };
    }
    
    const schoolColumn = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
    const uniqueSchools = [...new Set(schoolColumn.map(row => row[0] || '').filter(name => name.trim()))];
    
    return {
      success: true,
      data: uniqueSchools.sort()
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

/**
 * getMonthsList - Get months list for dropdown
 */
function getMonthsList() {
  return ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
}

/**
 * getYearsList - Get years list for dropdown
 */
function getYearsList() {
  const currentYear = new Date().getFullYear();
  const years = [];
  
  for (let i = -1; i <= 2; i++) {
    years.push(currentYear + i);
  }
  
  return years.sort((a, b) => b - a);
}

/**
 * validateDataBeforeSubmit - Validate data before submission
 */
function validateDataBeforeSubmit(data) {
  const errors = [];
  
  if (!data.nama_toko || data.nama_toko.trim() === '') {
    errors.push('NAMA TOKO wajib diisi');
  }
  
  if (!data.uraian_mak || data.uraian_mak.trim() === '') {
    errors.push('URAIAN MAK wajib diisi');
  }
  
  if (!data.uraian_pembayaran || data.uraian_pembayaran.trim() === '') {
    errors.push('URAIAN PEMBAYARAN wajib diisi');
  }
  
  if (!data.tahun_anggaran || isNaN(parseInt(data.tahun_anggaran))) {
    errors.push('TAHUN ANGGARAN harus berupa angka');
  }
  
  if (!data.bulan_pelaksanaan || data.bulan_pelaksanaan.trim() === '') {
    errors.push('BULAN PELAKSANAAN wajib diisi');
  }
  
  if (!data.jumlah || isNaN(parseFloat(data.jumlah)) || parseFloat(data.jumlah) <= 0) {
    errors.push('JUMLAH harus berupa angka positif');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}