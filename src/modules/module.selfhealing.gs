/**
 * ============================================================
 * MODULE SELF-HEALING - Auto-repair database & structure
 * Fase 2: Extended healing untuk semua sheet baru
 * ============================================================
 */

const SelfHealing = {

  // ── Full check & heal ────────────────────────────────────
  checkAndHeal: function() {
    try {
      const ss = Database.getDatabase();
      if (!ss) {
        Logger.log('SelfHealing: Database tidak dapat diakses, melakukan create ulang...');
        initDatabase();
        return false;
      }

      let healed = 0;
      Object.keys(SCHEMA).forEach(sheetName => {
        const sheet = ss.getSheetByName(sheetName);
        if (!sheet) {
          Logger.log('SelfHealing: Sheet hilang → ' + sheetName);
          createSheetIfNotExists(ss, sheetName);
          healed++;
        } else {
          // Heal header jika kosong
          const firstRow = sheet.getRange(1,1,1,Math.max(sheet.getLastColumn(),1)).getValues()[0];
          const nonEmpty = firstRow.filter(h => h && h.toString().trim()).length;
          if (nonEmpty < 2) {
            Logger.log('SelfHealing: Header rusak pada sheet → ' + sheetName);
            sheet.clearContents();
            sheet.appendRow(SCHEMA[sheetName]);
            _styleHeader(sheet, SCHEMA[sheetName].length);
            healed++;
          }
        }
      });

      Logger.log(`SelfHealing selesai: ${healed} sheet diperbaiki`);
      return true;

    } catch(err) {
      Logger.log('SelfHealing.checkAndHeal ERROR: '+err.message);
      return false;
    }
  },

  createSheetWithHeaders: function(sheetName) {
    try {
      const ss = Database.getDatabase();
      if (!ss) return false;
      const sheet = ss.insertSheet(sheetName);
      const headers = SCHEMA[sheetName] || ['ID','Data','Timestamp'];
      sheet.appendRow(headers);
      _styleHeader(sheet, headers.length);
      return true;
    } catch(e) {
      Logger.log('SelfHealing.createSheet ERROR: '+e.message);
      return false;
    }
  },

  checkColumns: function(sheetName, requiredCols) {
    try {
      const ss = Database.getDatabase();
      if (!ss) return false;
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return false;
      const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
      return requiredCols.every(c => headers.includes(c));
    } catch(e) {
      return false;
    }
  },

  // ── Diagnose semua sheet ─────────────────────────────────
  diagnose: function() {
    try {
      const ss = Database.getDatabase();
      if (!ss) return { ok:false, error:'Database tidak ada' };

      const report = {};
      Object.keys(SCHEMA).forEach(name => {
        const sheet = ss.getSheetByName(name);
        report[name] = {
          exists   : !!sheet,
          rows     : sheet ? Math.max(sheet.getLastRow()-1, 0) : 0,
          cols     : sheet ? sheet.getLastColumn() : 0,
          schema_ok: sheet ? this.checkColumns(name, SCHEMA[name].slice(0,3)) : false
        };
      });

      return { ok:true, sheets: report, timestamp: new Date().toISOString() };
    } catch(e) {
      return { ok:false, error: e.message };
    }
  },

  // ── Scheduled trigger (setiap 1 jam) ────────────────────
  scheduledCheck: function() {
    Logger.log('SelfHealing scheduled check dimulai...');
    const result = this.checkAndHeal();
    Database.logEvent('INFO','SelfHealing', result ? 'Scheduled check OK' : 'Check dengan perbaikan', '', '');
  }
};
