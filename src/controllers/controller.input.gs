/**
 * ============================================================
 * CONTROLLER INPUT - Data Entry
 * Fase 2: Input data SPJ dengan validasi lengkap & auto-terbilang
 * ============================================================
 */

Controller.Input = {

  process: function(params) {
    try {
      // ── Anti-spam check ────────────────────────────────
      const spamCheck = Queue.check({ userId: params.schoolId || 'anon', action:'input_data' });
      if (spamCheck.status === 'spam') {
        return Response.json({ status:'error', message: spamCheck.message, retryAfter: spamCheck.retryAfter });
      }

      // ── Validation ─────────────────────────────────────
      const validation = this.validate(params);
      if (!validation.valid) {
        return Response.json({ status:'error', message:'Validasi gagal', errors: validation.errors });
      }

      // ── Prepare transaction ────────────────────────────
      const jumlah = this.parseRupiah(params.jumlahRupiah || params.jumlah);
      const trxId  = this.generateTransactionId();
      const data   = {
        ID_Transaksi     : trxId,
        School_ID        : params.schoolId || '',
        Kode_Anggaran    : params.kodeAnggaran || params.uraian_mak || '',
        Uraian_MAK       : params.uraianMak || params.uraian_mak || '',
        Uraian_Pembayaran: params.uraianPembayaran || params.uraian_pembayaran || '',
        Nama_Toko        : params.namaToko || params.nama_toko || '',
        Jumlah_Rupiah    : jumlah,
        Terbilang        : Controller.Export.numberToWords(jumlah),
        Tahun_Anggaran   : parseInt(params.tahunAnggaran || params.tahun_anggaran) || new Date().getFullYear(),
        Bulan_Pelaksanaan: params.bulanPelaksanaan || params.bulan_pelaksanaan || '',
        Status_Verifikasi: 'pending',
        Timestamp        : new Date().toISOString(),
        Input_By         : params.inputBy || 'web_form',
        Kode_Program     : this._extractKode(params.kodeAnggaran || params.uraian_mak || ''),
        Jenis_Belanja    : params.jenisBelanja || '',
        Kuantitas        : parseFloat(params.kuantitas) || 1,
        Harga_Satuan     : parseFloat(params.hargaSatuan) || jumlah,
        Catatan          : params.catatan || ''
      };

      // ── Insert ─────────────────────────────────────────
      const lock = LockService.getPublicLock();
      let inserted = false;
      try {
        lock.waitLock(10000);
        inserted = Database.insert(DB_CONFIG.SHEETS.TRANSACTIONS, data);
      } finally {
        lock.releaseLock();
      }

      if (!inserted) {
        return Response.json({ status:'error', message:'Gagal menyimpan data ke database' });
      }

      // ── Update RKKAL realisasi ──────────────────────────
      if (params.rkkalId) {
        Controller.RKKAL.updateRealisasi(params.rkkalId, data.Bulan_Pelaksanaan, jumlah);
      }

      // ── Kirim notifikasi Telegram ──────────────────────
      TelegramBot.sendTransactionNotif(data);

      // ── Log ────────────────────────────────────────────
      Database.logEvent('INFO','Input','Transaksi baru: '+trxId,'',data.School_ID);

      return Response.json({
        status : 'success',
        message: 'Data berhasil disimpan',
        data   : { id_transaksi:trxId, jumlah: jumlah, terbilang: data.Terbilang }
      });

    } catch(err) {
      Logger.log('Input.process ERROR: '+err.message);
      return Response.json({ status:'error', message:'Sistem error', logId:'INPUT_'+Date.now() });
    }
  },

  // ── Validation ───────────────────────────────────────────
  validate: function(params) {
    const errors = [];
    const jumlah = this.parseRupiah(params.jumlahRupiah || params.jumlah || '');
    if (!(params.namaToko || params.nama_toko || '').trim())          errors.push('Nama toko/sekolah wajib diisi');
    if (!(params.kodeAnggaran || params.uraian_mak || '').trim())     errors.push('Kode / Uraian MAK wajib diisi');
    if (!(params.uraianPembayaran || params.uraian_pembayaran || '').trim()) errors.push('Uraian Pembayaran wajib diisi');
    if (!jumlah || jumlah <= 0)                                       errors.push('Jumlah harus angka positif');
    if (!(params.bulanPelaksanaan || params.bulan_pelaksanaan || '').trim()) errors.push('Bulan Pelaksanaan wajib diisi');
    return { valid: errors.length === 0, errors };
  },

  parseRupiah: function(str) {
    if (!str) return 0;
    return parseFloat(str.toString().replace(/[^0-9.]/g,'')) || 0;
  },

  generateTransactionId: function() {
    return 'TRX-'+Date.now()+'-'+Math.random().toString(36).substr(2,9).toUpperCase();
  },

  _extractKode: function(uraian) {
    const m = uraian.match(/^(\d+)/);
    return m ? m[1] : '';
  }
};
