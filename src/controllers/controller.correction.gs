/**
 * Controller: Correction Module
 * Inline editing without breaking other rows
 */

Controller.Correction = {
  /**
   * Process inline correction
   */
  inlineEdit: function(params) {
    try {
      const transactionId = params.transactionId;
      const field = params.field;
      const newValue = params.newValue;
      
      // Validate field
      const allowedFields = [
        'kode_anggaran', 'nama_kegiatan', 'jumlah_rupiah',
        'tahun_anggaran', 'bulan_pelaksanaan'
      ];
      
      if (!allowedFields.includes(field)) {
        return Response.json({
          status: 'error',
          message: 'Field tidak bisa diedit'
        });
      }
      
      // Get transaction
      const transaction = Database.getTransactionById(transactionId);
      if (!transaction) {
        return Response.json({
          status: 'error',
          message: 'Transaksi tidak ditemukan'
        });
      }
      
      // Update field
      let updatedValue = newValue;
      if (field === 'jumlah_rupiah') {
        updatedValue = this.parseRupiah(newValue);
      }
      
      transaction[field] = updatedValue;
      
      // Save updated transaction
      const saved = Database.updateTransaction(transactionId, transaction);
      
      if (saved) {
        return Response.json({
          status: 'success',
          message: 'Data berhasil diupdate',
          data: transaction
        });
      }
      
      return Response.json({
        status: 'error',
        message: 'Gagal update data'
      });
      
    } catch (error) {
      Logger.log('Correction Error: ' + error.message);
      return Response.json({
        status: 'error',
        message: 'Sistem error',
        logId: 'CORRECT_' + Date.now()
      });
    }
  },
  
  /**
   * Parse Rupiah string to number
   */
  parseRupiah: function(rupiahStr) {
    const cleaned = rupiahStr.replace(/[^0-9]/g, '');
    return parseInt(cleaned) || 0;
  },
  
  /**
   * Validate inline edit
   */
  validateEdit: function(field, newValue, existingValue) {
    // Validation rules per field
    switch (field) {
      case 'jumlah_rupiah':
        const num = this.parseRupiah(newValue);
        return num > 0;
      
      case 'kode_anggaran':
        return newValue.length >= 6; // Kode anggaran minimal 6 digit
      
      case 'nama_kegiatan':
        return newValue.length > 0 && newValue.length <= 255;
      
      default:
        return true;
    }
  }
};