/**
 * ============================================================
 * CONTROLLER VALIDATION - Verifikasi Transaksi & Budget Guard
 * Fase 2: Validasi terhadap pagu RKKAL + workflow approval
 * ============================================================
 */

Controller.Validation = {

  verify: function(params) {
    try {
      const trxId  = params.transactionId || params.trxId;
      const action = params.action || 'verify'; // verify | approve | reject

      if (!trxId) {
        return Response.json({ status:'error', message:'ID Transaksi wajib diisi' });
      }

      const trx = Database.getTransactionById(trxId);
      if (!trx) {
        return Response.json({ status:'error', message:'Transaksi tidak ditemukan: '+trxId });
      }

      // ── Budget validation ─────────────────────────────
      const budgetCheck = this.validateBudget(trx);
      if (!budgetCheck.valid) {
        return Response.json({
          status : 'error',
          message: budgetCheck.message,
          data   : budgetCheck
        });
      }

      // ── Update status ─────────────────────────────────
      const newStatus = action === 'approve' ? 'verified'
                      : action === 'reject'  ? 'rejected'
                      : 'pending_review';

      const updated = Database.updateTransactionStatus(trxId, newStatus);
      if (!updated) {
        return Response.json({ status:'error', message:'Gagal memperbarui status transaksi' });
      }

      // ── Notify via Telegram ───────────────────────────
      TelegramBot.sendStatusNotif(trx, newStatus);

      Database.logEvent('INFO','Validation',`Transaksi ${trxId} → ${newStatus}`,'',trx['School_ID']);

      return Response.json({
        status : 'success',
        message: `Transaksi berhasil di-${action}`,
        data   : { id_transaksi:trxId, new_status:newStatus, budget_info: budgetCheck }
      });

    } catch(err) {
      Logger.log('Validation.verify ERROR: '+err.message);
      return Response.json({ status:'error', message:'Sistem error', logId:'VALID_'+Date.now() });
    }
  },

  // ── Budget validation against RKKAL ──────────────────────
  validateBudget: function(trx) {
    try {
      const kode    = trx['Kode_Anggaran'] || '';
      const jumlah  = parseFloat(trx['Jumlah_Rupiah']) || 0;
      const schoolId= trx['School_ID'] || '';
      const tahun   = parseInt(trx['Tahun_Anggaran']) || new Date().getFullYear();

      // Find matching RKKAL row
      const rkkalRows = Database.findBy(DB_CONFIG.SHEETS.RKKAL, 'School_ID', schoolId)
                                .filter(r => r['Kode_Akun'] === kode && r['Tahun_Anggaran'] == tahun);

      if (rkkalRows.length === 0) {
        // No RKKAL found → allow with warning
        return { valid:true, message:'RKKAL tidak ditemukan, transaksi diizinkan dengan catatan',
                 pagu:0, terpakai:0, sisa:0, has_rkkal:false };
      }

      const rkkal = rkkalRows[0];
      const pagu  = parseFloat(rkkal['Pagu_Anggaran']) || 0;
      const totalReal = parseFloat(rkkal['Total_Realisasi']) || 0;
      const sisa  = pagu - totalReal;

      if (jumlah > sisa) {
        return {
          valid  : false,
          message: `Melebihi sisa anggaran. Sisa: Rp ${sisa.toLocaleString('id-ID')}`,
          pagu   : pagu, terpakai: totalReal, sisa: sisa, has_rkkal: true
        };
      }

      return {
        valid  : true,
        message: 'Transaksi dalam batas anggaran',
        pagu   : pagu, terpakai: totalReal, sisa: sisa - jumlah, has_rkkal: true
      };

    } catch(err) {
      Logger.log('validateBudget ERROR: '+err.message);
      return { valid:true, message:'Validasi budget gagal (fallback allow)', pagu:0, terpakai:0, sisa:0 };
    }
  },

  getBudgetLimit : function(kode, schoolId) { return 1000000000; },
  getSpentAmount : function(kode, schoolId) { return 0; }
};
