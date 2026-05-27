/**
 * ============================================================
 * DATABASE MODULE - CRUD Operations
 * Fase 2: Full CRUD + multi-sheet support
 * ============================================================
 */

const Database = {

  // ── Connection ───────────────────────────────────────────
  getDatabase: function() { return initDatabase(); },

  // ── INSERT ───────────────────────────────────────────────
  insert: function(sheetName, dataObj) {
    try {
      const ss = this.getDatabase();
      if (!ss) return false;
      const sheet = ss.getSheetByName(sheetName) || createSheetIfNotExists(ss, sheetName);
      const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
      const row = headers.map(h => {
        const key = h.toString().toLowerCase().replace(/\s+/g,'_');
        return dataObj[key] !== undefined ? dataObj[key] : (dataObj[h] !== undefined ? dataObj[h] : '');
      });
      sheet.appendRow(row);
      return true;
    } catch(e) {
      Logger.log('DB.insert ERROR ['+sheetName+']: '+e.message);
      return false;
    }
  },

  // ── INSERT BATCH ─────────────────────────────────────────
  insertBatch: function(sheetName, rows) {
    try {
      if (!rows || rows.length === 0) return 0;
      const ss = this.getDatabase();
      if (!ss) return 0;
      const sheet = ss.getSheetByName(sheetName) || createSheetIfNotExists(ss, sheetName);
      const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
      const values = rows.map(dataObj =>
        headers.map(h => {
          const key = h.toString().toLowerCase().replace(/\s+/g,'_');
          return dataObj[key] !== undefined ? dataObj[key] : (dataObj[h] !== undefined ? dataObj[h] : '');
        })
      );
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow+1, 1, values.length, headers.length).setValues(values);
      return values.length;
    } catch(e) {
      Logger.log('DB.insertBatch ERROR: '+e.message);
      return 0;
    }
  },

  // ── GET ALL ──────────────────────────────────────────────
  getAll: function(sheetName) {
    try {
      const ss = this.getDatabase();
      if (!ss) return [];
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet || sheet.getLastRow() <= 1) return [];
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      return data.slice(1).map(row => {
        const obj = {};
        headers.forEach((h,i) => { obj[h] = row[i]; });
        return obj;
      });
    } catch(e) {
      Logger.log('DB.getAll ERROR: '+e.message);
      return [];
    }
  },

  // ── FIND BY ──────────────────────────────────────────────
  findBy: function(sheetName, field, value) {
    return this.getAll(sheetName).filter(row => row[field] == value);
  },

  findOneBy: function(sheetName, field, value) {
    return this.getAll(sheetName).find(row => row[field] == value) || null;
  },

  // ── GET TRANSACTION BY ID ────────────────────────────────
  getTransactionById: function(transactionId) {
    return this.findOneBy(DB_CONFIG.SHEETS.TRANSACTIONS, 'ID_Transaksi', transactionId);
  },

  // ── GET TRANSACTIONS BY SCHOOL ───────────────────────────
  getTransactionsBySchool: function(schoolId, period) {
    const all = this.getAll(DB_CONFIG.SHEETS.TRANSACTIONS);
    return all.filter(row => {
      if (row['School_ID'] !== schoolId) return false;
      if (!period || period === '*') return true;
      const ts = row['Timestamp'] ? new Date(row['Timestamp']) : null;
      if (!ts) return false;
      const rowPeriod = ts.getFullYear() + '-' + String(ts.getMonth()+1).padStart(2,'0');
      return rowPeriod === period;
    });
  },

  // ── UPDATE by ID field ───────────────────────────────────
  update: function(sheetName, idField, idValue, newData) {
    try {
      const ss = this.getDatabase();
      if (!ss) return false;
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return false;
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const idCol = headers.indexOf(idField);
      if (idCol === -1) return false;
      for (let i = 1; i < data.length; i++) {
        if (data[i][idCol] == idValue) {
          headers.forEach((h, j) => {
            const key = h.toString().toLowerCase().replace(/\s+/g,'_');
            if (newData[key] !== undefined) sheet.getRange(i+1, j+1).setValue(newData[key]);
            else if (newData[h] !== undefined) sheet.getRange(i+1, j+1).setValue(newData[h]);
          });
          return true;
        }
      }
      return false;
    } catch(e) {
      Logger.log('DB.update ERROR: '+e.message);
      return false;
    }
  },

  updateTransactionStatus: function(transactionId, status) {
    return this.update(DB_CONFIG.SHEETS.TRANSACTIONS,'ID_Transaksi',transactionId,{Status_Verifikasi:status});
  },

  updateTransaction: function(transactionId, newData) {
    return this.update(DB_CONFIG.SHEETS.TRANSACTIONS,'ID_Transaksi',transactionId, newData);
  },

  // ── DELETE ───────────────────────────────────────────────
  deleteRow: function(sheetName, idField, idValue) {
    try {
      const ss = this.getDatabase();
      if (!ss) return false;
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return false;
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const idCol = headers.indexOf(idField);
      if (idCol === -1) return false;
      for (let i = data.length - 1; i >= 1; i--) {
        if (data[i][idCol] == idValue) {
          sheet.deleteRow(i + 1);
          return true;
        }
      }
      return false;
    } catch(e) {
      Logger.log('DB.deleteRow ERROR: '+e.message);
      return false;
    }
  },

  // ── LOGGING ──────────────────────────────────────────────
  logEvent: function(level, module, message, details, schoolId) {
    try {
      const ss = this.getDatabase();
      if (!ss) return false;
      const sheet = ss.getSheetByName(DB_CONFIG.SHEETS.LOGS) || createSheetIfNotExists(ss, DB_CONFIG.SHEETS.LOGS);
      sheet.appendRow([
        'LOG-'+Date.now(),
        new Date().toISOString(),
        level, module,
        schoolId || '',
        message,
        details || ''
      ]);
      return true;
    } catch(e) {
      Logger.log('DB.logEvent ERROR: '+e.message);
      return false;
    }
  },

  // ── SUMMARY / AGGREGATION ────────────────────────────────
  sumField: function(sheetName, filterField, filterValue, sumField_) {
    const rows = filterField ? this.findBy(sheetName, filterField, filterValue) : this.getAll(sheetName);
    return rows.reduce((s, r) => s + (parseFloat(r[sumField_]) || 0), 0);
  },

  countRows: function(sheetName, filterField, filterValue) {
    if (!filterField) return this.getAll(sheetName).length;
    return this.findBy(sheetName, filterField, filterValue).length;
  }
};
