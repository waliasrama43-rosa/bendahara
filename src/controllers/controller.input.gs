/**
 * Controller: Data Input Module
 * Column-based input interface:
 * - Kolom A: Kode Anggaran
 * - Kolom B: Nama Kegiatan
 * - Kolom C: Jumlah Rupiah
 */

var Controller = (typeof Controller !== 'undefined' && Controller) || {};

Controller.Input = {
  /**
   * Process data input from user form
   */
  process: function(params) {
    try {
      const schoolId = params.schoolId;
      const kodeAnggaran = params.kodeAnggaran;
      const namaKegiatan = params.namaKegiatan;
      const jumlahRupiah = params.jumlahRupiah;
      
      // Validate required fields
      if (!kodeAnggaran || !namaKegiatan || !jumlahRupiah) {
        return Response.json({
          status: 'error',
          message: 'Semua kolom wajib diisi'
        });
      }
      
      // Convert jumlah to number
      const jumlah = this.parseRupiah(jumlahRupiah);
      
      // Generate transaction data
      const data = {
        id_transaksi: this.generateTransactionId(),
        kode_anggaran: kodeAnggaran,
        nama_kegiatan: namaKegiatan,
        jumlah_rupiah: jumlah,
        timestamp: new Date().toISOString(),
        status_verifikasi: 'pending',
        school_id: schoolId
      };
      
      // Insert into database
      const inserted = Database.insert('Data_Transaksi', data);
      
      if (inserted) {
        return Response.json({
          status: 'success',
          message: 'Data berhasil dimasukkan',
          data: data
        });
      }
      
      return Response.json({
        status: 'error',
        message: 'Gagal memasukkan data'
      });
      
    } catch (error) {
      Logger.log('Input Error: ' + error.message);
      return Response.json({
        status: 'error',
        message: 'Sistem error',
        logId: 'INPUT_' + Date.now()
      });
    }
  },
  
  /**
   * Parse Rupiah string to number
   */
  parseRupiah: function(rupiahStr) {
    // Remove non-numeric characters except digits
    const cleaned = rupiahStr.replace(/[^0-9]/g, '');
    return parseInt(cleaned) || 0;
  },
  
  /**
   * Generate unique transaction ID
   */
  generateTransactionId: function() {
    return 'TRX-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
};