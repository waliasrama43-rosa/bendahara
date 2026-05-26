/**
 * Database Module for Google Sheets
 * Handles CRUD operations for ERP data
 */

const Database = {
  SPREADSHEET_NAME: 'ERP_Sekolah_Rakyat',
  
  /**
   * Initialize database connection
   */
  init: function() {
    try {
      let ss = SpreadsheetApp.openByName(this.SPREADSHEET_NAME);
      
      if (!ss) {
        // Auto-create if not exists
        ss = SpreadsheetApp.create(this.SPREADSHEET_NAME);
        this.createAllSheets(ss);
      }
      
      return ss;
      
    } catch (error) {
      Logger.log('Database init error: ' + error.message);
      return null;
    }
  },
  
  /**
   * Create all required sheets
   */
  createAllSheets: function(ss) {
    // Transactions Sheet
    const transactionsSheet = ss.insertSheet('Data_Transaksi');
    transactionsSheet.appendRow([
      'ID_Transaksi', 'Kode_Anggaran', 'Nama_Kegiatan', 'Jumlah_Rupiah',
      'Timestamp', 'Status_Verifikasi', 'School_ID', 'Kode_Program',
      'Kode_Komponen', 'Jenis_Belanja', 'Kuantitas', 'Harga_Satuan'
    ]);
    
    // Schools Sheet
    const schoolsSheet = ss.insertSheet('Data_Sekolah');
    schoolsSheet.appendRow([
      'School_ID', 'Nama_Sekolah', 'Alamat_Sekolah', 'Kepala_Sekolah',
      'Bendahara', 'Status_Aktif', 'Tanggal_Daftar', 'Plan_Type'
    ]);
    
    // Subscriptions Sheet
    const subscriptionSheet = ss.insertSheet('Data_Subscription');
    subscriptionSheet.appendRow([
      'Subscription_ID', 'School_ID', 'Start_Date', 'End_Date',
      'Status', 'Payment_Status'
    ]);
    
    // Logs Sheet
    const logsSheet = ss.insertSheet('System_Logs');
    logsSheet.appendRow(['Log_ID', 'Timestamp', 'Level', 'Module', 'Message', 'Details']);
  },
  
  /**
   * Get database connection
   */
  getDatabase: function() {
    return this.init();
  },
  
  /**
   * Insert data into sheet
   */
  insert: function(sheetName, data) {
    try {
      const ss = this.getDatabase();
      if (!ss) return false;
      
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return false;
      
      // Get existing headers
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      // Prepare row values in correct order
      const row = headers.map(function(header) {
        return data[header.toLowerCase().replace(/\s+/g, '_')] || '';
      });
      
      sheet.appendRow(row);
      return true;
      
    } catch (error) {
      Logger.log('Insert error: ' + error.message);
      return false;
    }
  },
  
  /**
   * Get transaction by ID
   */
  getTransactionById: function(transactionId) {
    try {
      const ss = this.getDatabase();
      const sheet = ss.getSheetByName('Data_Transaksi');
      
      if (!sheet) return null;
      
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] === transactionId) {
          // Convert to object
          const obj = {};
          headers.forEach(function(h, j) {
            obj[h] = row[j];
          });
          return obj;
        }
      }
      
      return null;
      
    } catch (error) {
      Logger.log('Get transaction error: ' + error.message);
      return null;
    }
  },
  
  /**
   * Update transaction status
   */
  updateTransactionStatus: function(transactionId, status) {
    try {
      const ss = this.getDatabase();
      const sheet = ss.getSheetByName('Data_Transaksi');
      
      if (!sheet) return false;
      
      const data = sheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === transactionId) {
          sheet.getRange(i + 1, 6).setValue(status); // Status_Verifikasi column
          return true;
        }
      }
      
      return false;
      
    } catch (error) {
      Logger.log('Update status error: ' + error.message);
      return false;
    }
  },
  
  /**
   * Update entire transaction
   */
  updateTransaction: function(transactionId, newData) {
    try {
      const ss = this.getDatabase();
      const sheet = ss.getSheetByName('Data_Transaksi');
      
      if (!sheet) return false;
      
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === transactionId) {
          // Update each field
          for (let j = 0; j < headers.length; j++) {
            const field = headers[j].toLowerCase().replace(/\s+/g, '_');
            if (newData[field] !== undefined) {
              sheet.getRange(i + 1, j + 1).setValue(newData[field]);
            }
          }
          return true;
        }
      }
      
      return false;
      
    } catch (error) {
      Logger.log('Update transaction error: ' + error.message);
      return false;
    }
  },
  
  /**
   * Get transactions by school and period
   */
  getTransactionsBySchool: function(schoolId, period) {
    try {
      const ss = this.getDatabase();
      const sheet = ss.getSheetByName('Data_Transaksi');
      
      if (!sheet) return [];
      
      const data = sheet.getDataRange().getValues();
      const results = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const rowSchoolId = row[6]; // School_ID column
        const rowPeriod = this.extractPeriod(row[4]); // Tahun and Bulan
        
        if (rowSchoolId === schoolId && (period === '*' || rowPeriod === period)) {
          const obj = {
            id_transaksi: row[0],
            kode_anggaran: row[1],
            nama_kegiatan: row[2],
            jumlah_rupiah: row[3],
            timestamp: row[4],
            status_verifikasi: row[5],
            school_id: row[6]
          };
          results.push(obj);
        }
      }
      
      return results;
      
    } catch (error) {
      Logger.log('Get transactions error: ' + error.message);
      return [];
    }
  },
  
  /**
   * Extract period from date
   */
  extractPeriod: function(dateStr) {
    try {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return date.getFullYear() + '-' + (date.getMonth() + 1);
    } catch (error) {
      return null;
    }
  },
  
  /**
   * Log system event
   */
  logEvent: function(level, module, message, details) {
    try {
      const ss = this.getDatabase();
      const sheet = ss.getSheetByName('System_Logs');
      
      if (!sheet) return false;
      
      sheet.appendRow([
        'LOG-' + Date.now(),
        new Date().toISOString(),
        level,
        module,
        message,
        details || ''
      ]);
      
      return true;
      
    } catch (error) {
      Logger.log('Log event error: ' + error.message);
      return false;
    }
  }
};