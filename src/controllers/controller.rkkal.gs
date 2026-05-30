/**
 * Controller: RKKAL Input Module
 * Column-based input interface:
 * - Kolom A: Kode Anggaran
 * - Kolom B: Nama Kegiatan
 * - Kolom C: Jumlah Rupiah
 */

var Controller = (typeof Controller !== 'undefined' && Controller) || {};

Controller.RKKAL = {
  Upload: {
    /**
     * Process RKKAL file upload
     */
    process: function(params) {
      try {
        const file = params.file || params.csvData;
        const schoolId = params.schoolId;
        
        // Parse CSV or JSON data
        const parsedData = this.parseRKKAL(file);
        
        // Validate and process each row
        const results = [];
        parsedData.forEach(function(row) {
          results.push(validateAndProcessRow(row, schoolId));
        });
        
        return Response.json({
          status: 'success',
          message: 'RKKAL berhasil diproses',
          processed: results.filter(r => r.success).length,
          errors: results.filter(r => !r.success).length
        });
        
      } catch (error) {
        Logger.log('RKKAL Upload Error: ' + error.message);
        return Response.json({
          status: 'error',
          message: 'Gagal memproses RKKAL',
          logId: 'RKKAL_' + Date.now()
        });
      }
    },
    
    /**
     * Parse RKKAL format
     */
    parseRKKAL: function(fileContent) {
      // Handle both CSV and structured JSON
      if (typeof fileContent === 'string') {
        return this.parseCSV(fileContent);
      }
      return fileContent;
    },
    
    /**
     * Parse CSV content
     */
    parseCSV: function(csvContent) {
      const rows = csvContent.split('\n');
      const data = [];
      
      for (let i = 1; i < rows.length; i++) {
        if (rows[i].trim() === '') continue;
        
        const columns = rows[i].split(',');
        data.push({
          kodeProgram: columns[0] || '',
          kodeKegiatan: columns[1] || '',
          kodeKomponen: columns[2] || '',
          kodeSubKomponen: columns[3] || '',
          kodeAkun: columns[4] || '',
          jenisBelanja: columns[5] || '',
          kuantitas: columns[6] || '0',
          hargaSatuan: columns[7] || '0',
          jumlah: columns[8] || '0'
        });
      }
      
      return data;
    }
  }
};

/**
 * Validate and process single RKKAL row
 */
function validateAndProcessRow(row, schoolId) {
  try {
    const isValid = validateRKKALRow(row);
    
    if (!isValid) {
      Logger.log('Invalid RKKAL row: ' + JSON.stringify(row));
      return { success: false, row: row, error: 'Data tidak valid' };
    }
    
    // Process valid row
    const data = {
      id_transaksi: generateTransactionId(),
      kode_anggaran: row.kodeAkun || row.kodeProgram,
      nama_kegiatan: row.jenisBelanja,
      jumlah_rupiah: row.jumlah,
      timestamp: new Date(),
      status_verifikasi: 'pending',
      school_id: schoolId,
      kode_program: row.kodeProgram,
      kode_komponen: row.kodeKomponen,
      jenis_belanja: row.jenisBelanja,
      kuantitas: row.kuantitas,
      harga_satuan: row.hargaSatuan
    };
    
    Database.insert('Data_Transaksi', data);
    
    return { success: true, id: data.id_transaksi };
    
  } catch (error) {
    Logger.log('Process Row Error: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Validate RKKAL row structure
 */
function validateRKKALRow(row) {
  return !!row.kodeAkun && !!row.jenisBelanja;
}

/**
 * Generate transaction ID
 */
function generateTransactionId() {
  return 'TRX-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}