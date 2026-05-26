/**
 * Controller: Export Module
 * One-stop export to Excel format with template tolerance
 */

Controller.Export = {
  /**
   * Export data to Excel format
   */
  process: function(params) {
    try {
      const schoolId = params.schoolId;
      const period = params.period; // e.g., '2026-01' for January 2026
      
      // Get transactions for school
      const transactions = Database.getTransactionsBySchool(schoolId, period);
      
      // Generate Excel file
      const fileName = 'Laporan_SPJ_' + schoolId + '_' + period + '.xlsx';
      const blob = this.generateExcelFile(transactions, fileName);
      
      // Return download link or file blob
      return Response.json({
        status: 'success',
        message: 'Laporan berhasil dibuat',
        fileName: fileName,
        fileSize: blob.getBytes().length
      });
      
    } catch (error) {
      Logger.log('Export Error: ' + error.message);
      return Response.json({
        status: 'error',
        message: 'Gagal membuat laporan',
        logId: 'EXPORT_' + Date.now()
      });
    }
  },
  
  /**
   * Generate Excel file dynamically
   * Template-tolerant - works with variable number of rows
   */
  generateExcelFile: function(transactions, fileName) {
    try {
      // Create temporary spreadsheet
      const tempSS = SpreadsheetApp.create('Temp_Export_' + Date.now());
      const sheet = tempSS.getActiveSheet();
      
      // Add header (Excel standard format)
      sheet.appendRow([
        'NO', 'NAMA TOKO', 'URAIAN MAK (Akun belanja)', 
        'URAIAN PEMBAYARAN', 'TAHUN ANGGARAN', 'BULAN PELAKSANAAN',
        'JUMLAH', 'TERBILANG'
      ]);
      
      // Add data rows
      transactions.forEach(function(t, index) {
        const no = index + 1;
        const jumlah = t.jumlah_rupiah || 0;
        const terbilang = this.numberToWords(jumlah);
        const bulan = this.getMonthName(new Date(t.timestamp).getMonth());
        const tahun = new Date(t.timestamp).getFullYear();
        
        sheet.appendRow([
          no,
          'PT. Sekolah Rakyat', // Placeholder - would come from school profile
          t.kode_anggaran,
          t.nama_kegiatan,
          tahun,
          bulan,
          jumlah,
          terbilang
        ]);
      }, this);
      
      // Convert to blob
      const blob = tempSS.getBlob()
        .setName(fileName)
        .setContentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      // Clean up temp sheet
      DriveApp.getFileById(tempSS.getId()).setTrashed(true);
      
      return blob;
      
    } catch (error) {
      Logger.log('Generate Excel Error: ' + error.message);
      throw error;
    }
  },
  
  /**
   * Convert number to Indonesian words
   */
  numberToWords: function(num) {
    const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan'];
    const belasan = ['Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas', 'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'];
    const puluhan = ['', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh', 'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh'];
    
    if (num === 0) return 'Nol Rupiah';
    
    let words = '';
    
    // Handle亿 (100 million)
    if (num >= 100000000) {
      const亿 = Math.floor(num / 100000000);
      words += satuan[亿] + ' Ratus Juta ';
      num %= 100000000;
    }
    
    // Handle Juta
    if (num >= 1000000) {
      const juta = Math.floor(num / 1000000);
      words += (juta === 1 ? 'Satu Juta' : satuan[juta] + ' Juta') + ' ';
      num %= 1000000;
    }
    
    // Handle Ribu
    if (num >= 1000) {
      const ribu = Math.floor(num / 1000);
      words += (ribu === 1 ? 'Seribu' : satuan[ribu] + ' Ribu') + ' ';
      num %= 1000;
    }
    
    // Handle Ratus
    if (num >= 100) {
      const ratus = Math.floor(num / 100);
      words += (ratus === 1 ? 'Seratus' : satuan[ratus] + ' Ratus') + ' ';
      num %= 100;
    }
    
    // Handle Puluhan dan Satuan
    if (num > 0) {
      if (num >= 10 && num < 20) {
        words += belasan[num - 10] + ' ';
      } else {
        const puluh = Math.floor(num / 10);
        const s = num % 10;
        if (puluhan) words += puluhan[puluh] + ' ';
        if (s > 0) words += satuan[s] + ' ';
      }
    }
    
    return words.trim() + ' Rupiah';
  },
  
  /**
   * Get month name in Indonesian
   */
  getMonthName: function(monthIndex) {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return months[monthIndex] || 'Tidak Diketahui';
  }
};