/**
 * ============================================================
 * MODULE TELEGRAM BOT - Monitoring & Notifikasi Real-time
 * Fase 3: Telegram Bot untuk alert transaksi, approval & report
 * ============================================================
 *
 * SETUP:
 * 1. Buat bot di @BotFather → dapatkan BOT_TOKEN
 * 2. Isi TELEGRAM_CONFIG.BOT_TOKEN
 * 3. Sekolah daftarkan chat_id mereka via perintah /daftar <school_id>
 * 4. Set webhook: https://api.telegram.org/bot<TOKEN>/setWebhook?url=<SCRIPT_URL>
 */

const TELEGRAM_CONFIG = {
  BOT_TOKEN  : PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN') || '',
  API_BASE   : 'https://api.telegram.org/bot',
  // Chat ID admin untuk notifikasi sistem
  ADMIN_CHAT : PropertiesService.getScriptProperties().getProperty('TELEGRAM_ADMIN_CHAT') || '',
  ENABLED    : !!(PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN'))
};

const TelegramBot = {

  // ── Send Message ──────────────────────────────────────────
  send: function(chatId, text, parseMode) {
    if (!TELEGRAM_CONFIG.ENABLED || !chatId) return false;
    try {
      const url = TELEGRAM_CONFIG.API_BASE + TELEGRAM_CONFIG.BOT_TOKEN + '/sendMessage';
      const payload = {
        chat_id    : chatId.toString(),
        text       : text,
        parse_mode : parseMode || 'HTML'
      };
      const options = {
        method : 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
      const resp = UrlFetchApp.fetch(url, options);
      const data = JSON.parse(resp.getContentText());
      if (!data.ok) Logger.log('Telegram send ERROR: '+JSON.stringify(data));
      return data.ok;
    } catch(e) {
      Logger.log('TelegramBot.send ERROR: '+e.message);
      return false;
    }
  },

  // ── Send to Admin ─────────────────────────────────────────
  sendAdmin: function(text) {
    return this.send(TELEGRAM_CONFIG.ADMIN_CHAT, text);
  },

  // ── Transaction notification ──────────────────────────────
  sendTransactionNotif: function(trx) {
    try {
      const school = Database.findOneBy(DB_CONFIG.SHEETS.SCHOOLS,'School_ID', trx['School_ID']);
      const chatId = school ? school['Telegram_Chat_ID'] : '';
      if (!chatId) return false;

      const jumlah = parseFloat(trx['Jumlah_Rupiah']) || 0;
      const msg = `🏫 <b>TRANSAKSI BARU</b>\n\n`+
        `📋 <b>ID:</b> ${trx['ID_Transaksi']}\n`+
        `🏪 <b>Toko:</b> ${trx['Nama_Toko']||'-'}\n`+
        `📁 <b>MAK:</b> ${trx['Kode_Anggaran']||'-'}\n`+
        `📝 <b>Uraian:</b> ${(trx['Uraian_Pembayaran']||'').substring(0,80)}\n`+
        `💰 <b>Jumlah:</b> Rp ${jumlah.toLocaleString('id-ID')}\n`+
        `📅 <b>Bulan:</b> ${trx['Bulan_Pelaksanaan']||'-'} ${trx['Tahun_Anggaran']||''}\n`+
        `⏰ <b>Waktu:</b> ${new Date().toLocaleString('id-ID')}\n\n`+
        `✅ Status: <i>Menunggu verifikasi</i>`;

      this.send(chatId, msg);
      // Also notify admin
      this.sendAdmin(`📊 [NOTIF] Transaksi baru dari ${school?school['Nama_Sekolah']:trx['School_ID']}: Rp ${jumlah.toLocaleString('id-ID')}`);
      return true;
    } catch(e) {
      Logger.log('sendTransactionNotif ERROR: '+e.message);
      return false;
    }
  },

  // ── Status update notification ────────────────────────────
  sendStatusNotif: function(trx, newStatus) {
    try {
      const school = Database.findOneBy(DB_CONFIG.SHEETS.SCHOOLS,'School_ID',trx['School_ID']);
      const chatId = school ? school['Telegram_Chat_ID'] : '';
      if (!chatId) return false;

      const icon = newStatus === 'verified' ? '✅' : newStatus === 'rejected' ? '❌' : '⏳';
      const msg = `${icon} <b>UPDATE STATUS TRANSAKSI</b>\n\n`+
        `📋 <b>ID:</b> ${trx['ID_Transaksi']}\n`+
        `💰 <b>Jumlah:</b> Rp ${(parseFloat(trx['Jumlah_Rupiah'])||0).toLocaleString('id-ID')}\n`+
        `🔄 <b>Status Baru:</b> <i>${newStatus.toUpperCase()}</i>\n`+
        `⏰ <b>Waktu:</b> ${new Date().toLocaleString('id-ID')}`;

      return this.send(chatId, msg);
    } catch(e) {
      Logger.log('sendStatusNotif ERROR: '+e.message);
      return false;
    }
  },

  // ── Welcome notification ──────────────────────────────────
  sendWelcomeNotif: function(school) {
    try {
      const chatId = school['Telegram_Chat_ID'];
      if (!chatId) return false;
      const msg = `🎉 <b>Selamat Datang di ERP Keuangan Sekolah Rakyat!</b>\n\n`+
        `🏫 <b>Sekolah:</b> ${school['Nama_Sekolah']}\n`+
        `🆔 <b>School ID:</b> ${school['School_ID']}\n`+
        `📅 <b>Plan:</b> ${school['Plan_Type']}\n\n`+
        `Bot ini akan mengirimkan notifikasi untuk:\n`+
        `• ✅ Transaksi baru\n• 🔄 Update status transaksi\n• 📊 Laporan bulanan\n• ⚠️ Alert anggaran\n\n`+
        `Ketik /help untuk melihat perintah yang tersedia.`;
      return this.send(chatId, msg);
    } catch(e) {
      Logger.log('sendWelcomeNotif ERROR: '+e.message);
      return false;
    }
  },

  // ── Budget alert ──────────────────────────────────────────
  sendBudgetAlert: function(schoolId, kodeAnggaran, persen, sisa) {
    try {
      const school = Database.findOneBy(DB_CONFIG.SHEETS.SCHOOLS,'School_ID',schoolId);
      const chatId = school ? school['Telegram_Chat_ID'] : '';
      if (!chatId) return false;
      const icon = persen >= 90 ? '🚨' : persen >= 75 ? '⚠️' : 'ℹ️';
      const msg = `${icon} <b>ALERT ANGGARAN</b>\n\n`+
        `📁 <b>Kode:</b> ${kodeAnggaran}\n`+
        `📊 <b>Terpakai:</b> ${persen}%\n`+
        `💵 <b>Sisa:</b> Rp ${(sisa||0).toLocaleString('id-ID')}\n\n`+
        (persen >= 90 ? '⚠️ Anggaran hampir habis!' : 'Pantau penggunaan anggaran Anda.');
      return this.send(chatId, msg);
    } catch(e) {
      Logger.log('sendBudgetAlert ERROR: '+e.message);
      return false;
    }
  },

  // ── Monthly report summary ────────────────────────────────
  sendMonthlyReport: function(schoolId, bulan, tahun) {
    try {
      const period = tahun+'-'+String(bulan).padStart(2,'0');
      const trxs   = Database.getTransactionsBySchool(schoolId, period);
      const total  = trxs.reduce((s,t) => s+(parseFloat(t['Jumlah_Rupiah'])||0), 0);
      const stats  = Controller.School.getStats(schoolId);
      const school = Database.findOneBy(DB_CONFIG.SHEETS.SCHOOLS,'School_ID',schoolId);
      const chatId = school ? school['Telegram_Chat_ID'] : '';
      if (!chatId) return false;

      const bulanNama = Controller.Export.getMonthName(bulan-1);
      const msg = `📊 <b>LAPORAN BULANAN - ${bulanNama} ${tahun}</b>\n\n`+
        `🏫 ${school['Nama_Sekolah']}\n\n`+
        `📝 Jumlah Transaksi: ${trxs.length}\n`+
        `💰 Total Pengeluaran: Rp ${total.toLocaleString('id-ID')}\n`+
        `📈 Total Sepanjang Waktu: Rp ${stats.total_jumlah.toLocaleString('id-ID')}\n\n`+
        `⏰ Dibuat: ${new Date().toLocaleString('id-ID')}`;

      return this.send(chatId, msg);
    } catch(e) {
      Logger.log('sendMonthlyReport ERROR: '+e.message);
      return false;
    }
  },

  // ── Handle incoming webhook messages ────────────────────────
  handleWebhook: function(update) {
    try {
      if (!update || !update.message) return false;
      const msg    = update.message;
      const chatId = msg.chat.id.toString();
      const text   = (msg.text || '').trim();

      // Command router
      if (text.startsWith('/start') || text.startsWith('/help')) {
        this.send(chatId,
          `🏫 <b>ERP Keuangan Sekolah Rakyat</b>\n\n`+
          `Perintah tersedia:\n`+
          `• /daftar &lt;school_id&gt; – Daftarkan chat ini ke sekolah Anda\n`+
          `• /status – Cek status koneksi\n`+
          `• /laporan &lt;YYYY-MM&gt; – Laporan bulanan\n`+
          `• /anggaran – Cek sisa anggaran\n`+
          `• /help – Tampilkan bantuan ini`
        );
      }
      else if (text.startsWith('/daftar ')) {
        const schoolId = text.split(' ')[1] || '';
        const ok = Controller.School.updateTelegramChatId(schoolId, chatId);
        this.send(chatId, ok
          ? `✅ Berhasil! Chat ini terhubung ke sekolah <b>${schoolId}</b>.`
          : `❌ School ID tidak ditemukan: <b>${schoolId}</b>`
        );
      }
      else if (text === '/status') {
        const diag = SelfHealing.diagnose();
        const sheetCount = diag.ok ? Object.keys(diag.sheets).length : 0;
        this.send(chatId, diag.ok
          ? `✅ Sistem online. ${sheetCount} sheet terdeteksi.\n⏰ ${diag.timestamp}`
          : `❌ Sistem error: ${diag.error}`
        );
      }
      else if (text.startsWith('/laporan ')) {
        const period = text.split(' ')[1] || '';
        const school = this._findSchoolByChatId(chatId);
        if (!school) { this.send(chatId, '❌ Chat ini belum terdaftar. Gunakan /daftar <school_id>'); return; }
        const parts = period.split('-');
        this.sendMonthlyReport(school['School_ID'], parseInt(parts[1]), parseInt(parts[0]));
      }
      else {
        this.send(chatId, 'Saya tidak mengerti perintah itu. Ketik /help untuk bantuan.');
      }
      return true;
    } catch(e) {
      Logger.log('handleWebhook ERROR: '+e.message);
      return false;
    }
  },

  _findSchoolByChatId: function(chatId) {
    return Database.findOneBy(DB_CONFIG.SHEETS.SCHOOLS,'Telegram_Chat_ID', chatId);
  },

  // ── Bulk monthly reports (trigger harian) ────────────────
  triggerMonthlyReports: function() {
    const now   = new Date();
    const bulan = now.getMonth() + 1;
    const tahun = now.getFullYear();
    const schools = Database.getAll(DB_CONFIG.SHEETS.SCHOOLS).filter(s => s['Telegram_Chat_ID']);
    schools.forEach(s => {
      try { this.sendMonthlyReport(s['School_ID'], bulan, tahun); }
      catch(e) { Logger.log('triggerMonthlyReports err for '+s['School_ID']+': '+e.message); }
    });
  }
};
