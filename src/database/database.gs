/**
 * Database Module for Google Sheets
 * Handles CRUD operations for ERP data.
 *
 * IMPORTANT FIX: Apps Script has NO `SpreadsheetApp.openByName()` method.
 * The previous implementation called it and threw on every request, so the
 * dashboard never got data (cards showed "—"). We now persist the spreadsheet
 * id in Script Properties and open it by id (creating it on first run).
 */

var Database = {
  SPREADSHEET_NAME: 'ERP_Sekolah_Rakyat',
  PROP_KEY: 'ERP_SPREADSHEET_ID',
  SEED_FLAG: 'ERP_SEEDED_V1',

  // In-memory cache for the current execution
  _ss: null,

  // Canonical headers per sheet (used for create + self-heal)
  HEADERS: {
    Data_Transaksi: [
      'ID_Transaksi', 'Kode_Anggaran', 'Nama_Kegiatan', 'Jumlah_Rupiah',
      'Timestamp', 'Status_Verifikasi', 'School_ID', 'Kode_Program',
      'Kode_Komponen', 'Jenis_Belanja', 'Kuantitas', 'Harga_Satuan'
    ],
    Data_Sekolah: [
      'School_ID', 'Nama_Sekolah', 'Alamat_Sekolah', 'Kepala_Sekolah',
      'Bendahara', 'Status_Aktif', 'Tanggal_Daftar', 'Plan_Type'
    ],
    Data_Subscription: [
      'Subscription_ID', 'School_ID', 'Start_Date', 'End_Date',
      'Status', 'Payment_Status'
    ],
    System_Logs: ['Log_ID', 'Timestamp', 'Level', 'Module', 'Message', 'Details'],
    Template_RKKAL: ['Template_ID', 'School_ID', 'Template_JSON', 'Last_Updated', 'Status']
  },

  /**
   * Initialize / open the backing spreadsheet (idempotent).
   * Stores the id in Script Properties so it is stable across executions.
   */
  init: function () {
    if (this._ss) return this._ss;

    var props = PropertiesService.getScriptProperties();
    var id = props.getProperty(this.PROP_KEY);
    var ss = null;

    if (id) {
      try {
        ss = SpreadsheetApp.openById(id);
      } catch (e) {
        ss = null; // stored id is stale/invalid -> recreate below
      }
    }

    if (!ss) {
      ss = SpreadsheetApp.create(this.SPREADSHEET_NAME);
      props.setProperty(this.PROP_KEY, ss.getId());
    }

    this._ss = ss;
    this.ensureSheets(ss);
    return ss;
  },

  /**
   * Make sure every required sheet + header row exists (self-healing).
   */
  ensureSheets: function (ss) {
    var self = this;
    Object.keys(this.HEADERS).forEach(function (name) {
      var sheet = ss.getSheetByName(name);
      if (!sheet) {
        sheet = ss.insertSheet(name);
      }
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(self.HEADERS[name]);
      }
    });

    // Remove the default empty "Sheet1" if it is unused.
    var def = ss.getSheetByName('Sheet1');
    if (def && ss.getSheets().length > 1 && def.getLastRow() === 0) {
      try { ss.deleteSheet(def); } catch (e) { /* ignore */ }
    }
  },

  /**
   * Legacy alias kept for callers that used createAllSheets.
   */
  createAllSheets: function (ss) {
    this.ensureSheets(ss);
  },

  /**
   * Get database connection (creates/opens as needed).
   */
  getDatabase: function () {
    return this.init();
  },

  /**
   * Public URL of the backing spreadsheet (so users can open & verify data).
   */
  getSpreadsheetUrl: function () {
    try {
      return this.init().getUrl();
    } catch (e) {
      return '';
    }
  },

  /**
   * Count data rows (excluding header) in a sheet.
   */
  countRows: function (sheetName) {
    var sheet = this.getSheet(sheetName);
    if (!sheet) return 0;
    var last = sheet.getLastRow();
    return last > 0 ? last - 1 : 0;
  },

  /**
   * Get a sheet by name, ensuring the DB is initialized first.
   */
  getSheet: function (sheetName) {
    var ss = this.getDatabase();
    if (!ss) return null;
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet && this.HEADERS[sheetName]) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(this.HEADERS[sheetName]);
    }
    return sheet;
  },

  /**
   * Convert a header label into the object key convention used by callers.
   * e.g. "ID_Transaksi" -> "id_transaksi"
   */
  headerToKey: function (header) {
    return String(header).toLowerCase().replace(/\s+/g, '_');
  },

  /**
   * Insert data into a sheet, mapping object keys to the header order.
   */
  insert: function (sheetName, data) {
    try {
      var sheet = this.getSheet(sheetName);
      if (!sheet) return false;

      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var self = this;
      var row = headers.map(function (header) {
        var key = self.headerToKey(header);
        var val = data[key];
        return (val === undefined || val === null) ? '' : val;
      });

      sheet.appendRow(row);
      return true;
    } catch (error) {
      Logger.log('Insert error: ' + error.message);
      return false;
    }
  },

  /**
   * Read a whole sheet as an array of plain objects keyed by headerToKey().
   */
  readAll: function (sheetName) {
    try {
      var sheet = this.getSheet(sheetName);
      if (!sheet) return [];
      var values = sheet.getDataRange().getValues();
      if (values.length < 2) return [];

      var headers = values[0];
      var self = this;
      var out = [];
      for (var i = 1; i < values.length; i++) {
        var rowVals = values[i];
        if (!rowVals[0]) continue; // skip empty rows (no primary key)
        var obj = {};
        headers.forEach(function (h, j) {
          obj[self.headerToKey(h)] = rowVals[j];
        });
        out.push(obj);
      }
      return out;
    } catch (error) {
      Logger.log('readAll error: ' + error.message);
      return [];
    }
  },

  /**
   * Get a single transaction by id.
   */
  getTransactionById: function (transactionId) {
    try {
      var sheet = this.getSheet('Data_Transaksi');
      if (!sheet) return null;

      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === transactionId) {
          var obj = {};
          headers.forEach(function (h, j) { obj[h] = data[i][j]; });
          return obj;
        }
      }
      return null;
    } catch (error) {
      Logger.log('Get transaction error: ' + error.message);
      return null;
    }
  },

  /**
   * Update only the verification status column.
   */
  updateTransactionStatus: function (transactionId, status) {
    try {
      var sheet = this.getSheet('Data_Transaksi');
      if (!sheet) return false;

      var data = sheet.getDataRange().getValues();
      var statusCol = data[0].indexOf('Status_Verifikasi') + 1;
      if (statusCol < 1) statusCol = 6;

      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === transactionId) {
          sheet.getRange(i + 1, statusCol).setValue(status);
          return true;
        }
      }
      return false;
    } catch (error) {
      Logger.log('Update status error: ' + error.message);
      return false;
    }
  },

  /**
   * Update an entire transaction row from an object.
   */
  updateTransaction: function (transactionId, newData) {
    try {
      var sheet = this.getSheet('Data_Transaksi');
      if (!sheet) return false;

      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var self = this;

      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === transactionId) {
          for (var j = 0; j < headers.length; j++) {
            var field = self.headerToKey(headers[j]);
            if (newData[field] !== undefined) {
              sheet.getRange(i + 1, j + 1).setValue(newData[field]);
            }
          }
          return true;
        }
      }
      return false;
    } catch (error) {
      Logger.log('Update transaction error: ' + error.message);
      return false;
    }
  },

  /**
   * Delete a transaction row by id.
   */
  deleteTransaction: function (transactionId) {
    try {
      var sheet = this.getSheet('Data_Transaksi');
      if (!sheet) return false;
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === transactionId) {
          sheet.deleteRow(i + 1);
          return true;
        }
      }
      return false;
    } catch (error) {
      Logger.log('deleteTransaction error: ' + error.message);
      return false;
    }
  },

  /**
   * Get transactions filtered by school and (optionally) period "YYYY-M".
   * Pass period === '*' or falsy to get all for the school.
   */
  getTransactionsBySchool: function (schoolId, period) {
    var all = this.readAll('Data_Transaksi');
    var self = this;
    return all.filter(function (t) {
      if (schoolId && t.school_id && t.school_id !== schoolId) return false;
      if (!period || period === '*') return true;
      return self.extractPeriod(t.timestamp) === period;
    });
  },

  /**
   * Extract "YYYY-M" period from a timestamp value.
   */
  extractPeriod: function (dateStr) {
    try {
      if (!dateStr) return null;
      var date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date.getFullYear() + '-' + (date.getMonth() + 1);
    } catch (error) {
      return null;
    }
  },

  /**
   * Append a row to the System_Logs sheet.
   */
  logEvent: function (level, module, message, details) {
    try {
      var sheet = this.getSheet('System_Logs');
      if (!sheet) return false;
      sheet.appendRow([
        'LOG-' + Date.now(),
        new Date().toISOString(),
        level,
        module,
        message,
        details || ''
      ]);
      return true;
    } catch (error) {
      Logger.log('Log event error: ' + error.message);
      return false;
    }
  },

  /* --------------------------------------------------------------------- */
  /* Helpers used by the web UI (api.gs)                                   */
  /* --------------------------------------------------------------------- */

  /**
   * Aggregate dashboard statistics for a school.
   */
  getStats: function (schoolId) {
    var stats = {
      totalTransaksi: 0,
      totalAnggaran: 0,
      terverifikasi: 0,
      pending: 0,
      ditolak: 0
    };

    var rows = this.readAll('Data_Transaksi');
    rows.forEach(function (t) {
      if (schoolId && t.school_id && t.school_id !== schoolId) return;
      stats.totalTransaksi++;
      stats.totalAnggaran += Number(t.jumlah_rupiah) || 0;

      var st = String(t.status_verifikasi || '').toLowerCase();
      if (st === 'verified' || st === 'terverifikasi' || st === 'approved') {
        stats.terverifikasi++;
      } else if (st === 'rejected' || st === 'ditolak') {
        stats.ditolak++;
      } else {
        stats.pending++;
      }
    });

    return stats;
  },

  /**
   * Aggregate RAB per kode anggaran for a period.
   */
  getRABByPeriod: function (schoolId, period) {
    var rows = this.getTransactionsBySchool(schoolId, period);
    var map = {};
    var grandTotal = 0;

    rows.forEach(function (t) {
      var kode = t.kode_anggaran || '(tanpa kode)';
      var jumlah = Number(t.jumlah_rupiah) || 0;
      if (!map[kode]) {
        map[kode] = { kode: kode, nama: t.nama_kegiatan || '', total: 0, jumlahItem: 0 };
      }
      map[kode].total += jumlah;
      map[kode].jumlahItem += 1;
      grandTotal += jumlah;
    });

    var items = Object.keys(map).map(function (k) { return map[k]; });
    items.sort(function (a, b) { return b.total - a.total; });
    return { items: items, grandTotal: grandTotal };
  },

  /**
   * Ensure at least one school exists; return its id.
   */
  ensureDefaultSchool: function () {
    var schools = this.readAll('Data_Sekolah');
    if (schools.length > 0) return schools[0].school_id;

    var schoolId = 'SCH001';
    this.insert('Data_Sekolah', {
      school_id: schoolId,
      nama_sekolah: 'Sekolah Rakyat (Default)',
      alamat_sekolah: '-',
      kepala_sekolah: '-',
      bendahara: '-',
      status_aktif: 'aktif',
      tanggal_daftar: new Date().toISOString(),
      plan_type: 'free'
    });
    return schoolId;
  },

  /**
   * Seed a few demo transactions on first run so the dashboard shows real
   * numbers immediately. Runs once (guarded by a Script Property).
   */
  seedDemoIfEmpty: function (schoolId) {
    try {
      var props = PropertiesService.getScriptProperties();
      if (props.getProperty(this.SEED_FLAG)) return;

      var existing = this.readAll('Data_Transaksi');
      if (existing.length === 0) {
        var samples = [
          { kode: '521211', nama: 'Belanja ATK Kantor', jumlah: 750000, status: 'verified' },
          { kode: '521811', nama: 'Konsumsi Rapat Komite', jumlah: 1250000, status: 'pending' },
          { kode: '523111', nama: 'Pemeliharaan Gedung Sekolah', jumlah: 3500000, status: 'pending' }
        ];
        var self = this;
        samples.forEach(function (s) {
          self.insert('Data_Transaksi', {
            id_transaksi: 'TRX-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            kode_anggaran: s.kode,
            nama_kegiatan: s.nama,
            jumlah_rupiah: s.jumlah,
            timestamp: new Date().toISOString(),
            status_verifikasi: s.status,
            school_id: schoolId
          });
        });
      }

      props.setProperty(this.SEED_FLAG, '1');
    } catch (e) {
      Logger.log('Seed error: ' + e.message);
    }
  }
};
