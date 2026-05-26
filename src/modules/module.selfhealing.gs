/**
 * Self-Healing Module
 * Automatically creates missing folders, templates, and headers
 */

const SelfHealing = {
  /**
   * Check and heal database structure
   */
  checkAndHeal: function() {
    try {
      const ss = Database.getDatabase();
      if (!ss) return false;
      
      // Check and heal all required sheets
      const requiredSheets = [
        'Data_Transaksi',
        'Data_Sekolah',
        'Data_Subscription',
        'System_Logs',
        'Template_RKKAL'
      ];
      
      requiredSheets.forEach(function(sheetName) {
        if (!ss.getSheetByName(sheetName)) {
          this.createSheetWithHeaders(sheetName);
        }
      });
      
      return true;
      
    } catch (error) {
      Logger.log('Self-healing error: ' + error.message);
      return false;
    }
  },
  
  /**
   * Create sheet with default headers
   */
  createSheetWithHeaders: function(sheetName) {
    try {
      const ss = Database.getDatabase();
      const sheet = ss.insertSheet(sheetName);
      
      let headers = [];
      switch (sheetName) {
        case 'Data_Transaksi':
          headers = [
            'ID_Transaksi', 'Kode_Anggaran', 'Nama_Kegiatan', 'Jumlah_Rupiah',
            'Timestamp', 'Status_Verifikasi', 'School_ID', 'Kode_Program',
            'Kode_Komponen', 'Jenis_Belanja', 'Kuantitas', 'Harga_Satuan'
          ];
          break;
        case 'Data_Sekolah':
          headers = [
            'School_ID', 'Nama_Sekolah', 'Alamat_Sekolah', 'Kepala_Sekolah',
            'Bendahara', 'Status_Aktif', 'Tanggal_Daftar', 'Plan_Type'
          ];
          break;
        case 'Data_Subscription':
          headers = [
            'Subscription_ID', 'School_ID', 'Start_Date', 'End_Date',
            'Status', 'Payment_Status'
          ];
          break;
        case 'System_Logs':
          headers = ['Log_ID', 'Timestamp', 'Level', 'Module', 'Message', 'Details'];
          break;
        case 'Template_RKKAL':
          headers = ['Template_ID', 'School_ID', 'Template_JSON', 'Last_Updated', 'Status'];
          break;
      }
      
      sheet.appendRow(headers);
      return true;
      
    } catch (error) {
      Logger.log('Create sheet error: ' + error.message);
      return false;
    }
  },
  
  /**
   * Check if required columns exist in sheet
   */
  checkColumns: function(sheetName, requiredColumns) {
    try {
      const ss = Database.getDatabase();
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return false;
      
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      return requiredColumns.every(function(col) {
        return headers.includes(col);
      });
      
    } catch (error) {
      Logger.log('Check columns error: ' + error.message);
      return false;
    }
  }
};