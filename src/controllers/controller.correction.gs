/**
 * ============================================================
 * CONTROLLER CORRECTION - Inline Edit & Multi-tenancy School Mgmt
 * Fase 3: Inline edit tanpa break data lain + manajemen sekolah
 * ============================================================
 */

var Controller = (typeof Controller !== 'undefined' && Controller) ? Controller : {};

Controller.Correction = {

  // ── Inline Edit ──────────────────────────────────────────
  inlineEdit: function(params) {
    try {
      const trxId   = params.transactionId || params.trxId;
      const field   = params.field;
      const newValue= params.newValue;

      const EDITABLE = ['Kode_Anggaran','Uraian_MAK','Uraian_Pembayaran',
                        'Nama_Toko','Jumlah_Rupiah','Tahun_Anggaran',
                        'Bulan_Pelaksanaan','Catatan'];

      if (!EDITABLE.includes(field)) {
        return Response.json({ status:'error', message:`Field '${field}' tidak dapat diedit` });
      }

      const trx = Database.getTransactionById(trxId);
      if (!trx) {
        return Response.json({ status:'error', message:'Transaksi tidak ditemukan' });
      }

      // Validate new value
      const validCheck = this.validateField(field, newValue);
      if (!validCheck.valid) {
        return Response.json({ status:'error', message: validCheck.message });
      }

      // Cast value
      let finalValue = newValue;
      if (field === 'Jumlah_Rupiah') {
        finalValue = this.parseRupiah(newValue);
        trx['Terbilang'] = Controller.Export.numberToWords(finalValue);
        Database.update(DB_CONFIG.SHEETS.TRANSACTIONS,'ID_Transaksi',trxId,{ Terbilang: trx['Terbilang'] });
      }

      const ok = Database.update(DB_CONFIG.SHEETS.TRANSACTIONS,'ID_Transaksi',trxId,{ [field]:finalValue });
      if (!ok) return Response.json({ status:'error', message:'Gagal update data' });

      Database.logEvent('INFO','Correction',`Edit ${field} pada ${trxId}`,'',trx['School_ID']);

      return Response.json({
        status : 'success',
        message: `Field '${field}' berhasil diperbarui`,
        data   : { id_transaksi:trxId, field, old_value: trx[field], new_value: finalValue }
      });

    } catch(err) {
      Logger.log('Correction.inlineEdit ERROR: '+err.message);
      return Response.json({ status:'error', message:'Sistem error', logId:'CORRECT_'+Date.now() });
    }
  },

  validateField: function(field, value) {
    switch(field) {
      case 'Jumlah_Rupiah':
        return this.parseRupiah(value) > 0
          ? { valid:true } : { valid:false, message:'Jumlah harus angka positif' };
      case 'Kode_Anggaran':
        return (value||'').trim().length >= 3
          ? { valid:true } : { valid:false, message:'Kode anggaran minimal 3 karakter' };
      case 'Uraian_MAK': case 'Uraian_Pembayaran': case 'Nama_Toko':
        return (value||'').trim().length > 0
          ? { valid:true } : { valid:false, message:`${field} tidak boleh kosong` };
      default:
        return { valid:true };
    }
  },

  parseRupiah: function(str) {
    return parseFloat((str||'').toString().replace(/[^0-9.]/g,'')) || 0;
  }
};

// ── Multi-Tenancy School Manager (Fase 3) ────────────────────
Controller.School = {

  register: function(params) {
    try {
      const existing = Database.findOneBy(DB_CONFIG.SHEETS.SCHOOLS,'Email', params.email);
      if (existing) {
        return Response.json({ status:'error', message:'Email sudah terdaftar' });
      }

      const schoolId = 'SCH-'+Date.now();
      const data = {
        School_ID       : schoolId,
        Nama_Sekolah    : params.namaSekolah || '',
        Kode_Sekolah    : params.kodeSekolah || '',
        Alamat          : params.alamat || '',
        Kota_Kabupaten  : params.kota || '',
        Provinsi        : params.provinsi || '',
        Kepala_Sekolah  : params.kepalaSekolah || '',
        Bendahara       : params.bendahara || '',
        No_Telp         : params.noTelp || '',
        Email           : params.email || '',
        Status_Aktif    : 'aktif',
        Tanggal_Daftar  : new Date().toISOString(),
        Plan_Type       : params.planType || 'free',
        Telegram_Chat_ID: params.telegramChatId || '',
        Quota_Bulanan   : 100,
        Total_Transaksi : 0
      };

      Database.insert(DB_CONFIG.SHEETS.SCHOOLS, data);
      TelegramBot.sendWelcomeNotif(data);
      Database.logEvent('INFO','School.register','Sekolah baru: '+schoolId,'',schoolId);

      return Response.json({
        status : 'success',
        message: 'Sekolah berhasil didaftarkan',
        data   : { school_id: schoolId, nama: data.Nama_Sekolah, plan: data.Plan_Type }
      });

    } catch(err) {
      Logger.log('School.register ERROR: '+err.message);
      return Response.json({ status:'error', message:'Gagal mendaftarkan sekolah: '+err.message });
    }
  },

  getProfile: function(schoolId) {
    const school = Database.findOneBy(DB_CONFIG.SHEETS.SCHOOLS,'School_ID', schoolId);
    if (!school) return Response.json({ status:'error', message:'Sekolah tidak ditemukan' });
    return Response.json({ status:'success', data: school });
  },

  updateTelegramChatId: function(schoolId, chatId) {
    return Database.update(DB_CONFIG.SHEETS.SCHOOLS,'School_ID',schoolId,{ Telegram_Chat_ID: chatId });
  },

  getStats: function(schoolId) {
    const trxCount = Database.countRows(DB_CONFIG.SHEETS.TRANSACTIONS,'School_ID',schoolId);
    const totalJml = Database.sumField(DB_CONFIG.SHEETS.TRANSACTIONS,'School_ID',schoolId,'Jumlah_Rupiah');
    return {
      total_transaksi  : trxCount,
      total_jumlah     : totalJml,
      formatted_jumlah : 'Rp '+totalJml.toLocaleString('id-ID')
    };
  }
};
