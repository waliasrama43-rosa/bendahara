/**
 * ============================================================================
 *  ERP KEUANGAN SEKOLAH RAKYAT  —  FILE TUNGGAL (ALL-IN-ONE)
 * ============================================================================
 *  Cara pakai (mode salin-tempel di editor Apps Script):
 *   1. HAPUS semua file Script (.gs) lama di proyek Anda.
 *   2. Buat 1 file Script bernama "Code", tempel SELURUH isi file ini.
 *   3. Buat 1 file HTML bernama "index", tempel isi dari standalone/index.html.
 *   4. Simpan. Jalankan fungsi `selfTest` (tombol Run) untuk menguji.
 *   5. Deploy sebagai Web App (Execute as: Me, Access: Anyone).
 *
 *  File ini SUDAH lengkap & mandiri — tidak butuh file .gs lain.
 * ============================================================================
 */

/* =========================================================================
 *  WEB ENTRY POINTS
 * ========================================================================= */

function doGet(e) {
  return renderApp();
}

function doPost(e) {
  // JSON endpoint sederhana (UI tidak memakai ini; UI pakai google.script.run).
  try {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput('{"status":"error"}')
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Render aplikasi web (file HTML bernama "index").
 */
function renderApp() {
  var candidates = ['index', 'Index', 'src/index'];
  for (var i = 0; i < candidates.length; i++) {
    try {
      return HtmlService.createTemplateFromFile(candidates[i])
        .evaluate()
        .setTitle('ERP Keuangan Sekolah Rakyat')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } catch (err) { /* coba kandidat berikutnya */ }
  }
  return HtmlService.createHtmlOutput(
    '<h2>File UI tidak ditemukan</h2><p>Buat file HTML bernama <code>index</code> ' +
    'dan tempel isi dari standalone/index.html.</p>'
  );
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* =========================================================================
 *  DATABASE (Google Sheets)
 * ========================================================================= */

var Database = {
  SPREADSHEET_NAME: 'ERP_Sekolah_Rakyat',
  PROP_KEY: 'ERP_SPREADSHEET_ID',
  SEED_FLAG: 'ERP_SEEDED_V1',
  _ss: null,

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
    System_Logs: ['Log_ID', 'Timestamp', 'Level', 'Module', 'Message', 'Details']
  },

  init: function () {
    if (this._ss) return this._ss;
    var props = PropertiesService.getScriptProperties();
    var id = props.getProperty(this.PROP_KEY);
    var ss = null;
    if (id) {
      try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; }
    }
    if (!ss) {
      ss = SpreadsheetApp.create(this.SPREADSHEET_NAME);
      props.setProperty(this.PROP_KEY, ss.getId());
    }
    this._ss = ss;
    this.ensureSheets(ss);
    return ss;
  },

  ensureSheets: function (ss) {
    var self = this;
    Object.keys(this.HEADERS).forEach(function (name) {
      var sheet = ss.getSheetByName(name);
      if (!sheet) sheet = ss.insertSheet(name);
      if (sheet.getLastRow() === 0) sheet.appendRow(self.HEADERS[name]);
    });
    var def = ss.getSheetByName('Sheet1');
    if (def && ss.getSheets().length > 1 && def.getLastRow() === 0) {
      try { ss.deleteSheet(def); } catch (e) {}
    }
  },

  getDatabase: function () { return this.init(); },

  getSpreadsheetUrl: function () {
    try { return this.init().getUrl(); } catch (e) { return ''; }
  },

  countRows: function (sheetName) {
    var sheet = this.getSheet(sheetName);
    if (!sheet) return 0;
    var last = sheet.getLastRow();
    return last > 0 ? last - 1 : 0;
  },

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

  headerToKey: function (header) {
    return String(header).toLowerCase().replace(/\s+/g, '_');
  },

  insert: function (sheetName, data) {
    try {
      var sheet = this.getSheet(sheetName);
      if (!sheet) return false;
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var self = this;
      var row = headers.map(function (header) {
        var v = data[self.headerToKey(header)];
        return (v === undefined || v === null) ? '' : v;
      });
      sheet.appendRow(row);
      return true;
    } catch (error) {
      Logger.log('Insert error: ' + error.message);
      return false;
    }
  },

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
        if (!values[i][0]) continue;
        var obj = {};
        headers.forEach(function (h, j) { obj[self.headerToKey(h)] = values[i][j]; });
        out.push(obj);
      }
      return out;
    } catch (error) {
      Logger.log('readAll error: ' + error.message);
      return [];
    }
  },

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

  getTransactionsBySchool: function (schoolId, period) {
    var all = this.readAll('Data_Transaksi');
    var self = this;
    return all.filter(function (t) {
      if (schoolId && t.school_id && t.school_id !== schoolId) return false;
      if (!period || period === '*') return true;
      return self.extractPeriod(t.timestamp) === period;
    });
  },

  extractPeriod: function (dateStr) {
    try {
      if (!dateStr) return null;
      var date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date.getFullYear() + '-' + (date.getMonth() + 1);
    } catch (error) { return null; }
  },

  getStats: function (schoolId) {
    var stats = { totalTransaksi: 0, totalAnggaran: 0, terverifikasi: 0, pending: 0, ditolak: 0 };
    this.readAll('Data_Transaksi').forEach(function (t) {
      if (schoolId && t.school_id && t.school_id !== schoolId) return;
      stats.totalTransaksi++;
      stats.totalAnggaran += Number(t.jumlah_rupiah) || 0;
      var st = String(t.status_verifikasi || '').toLowerCase();
      if (st === 'verified' || st === 'terverifikasi' || st === 'approved') stats.terverifikasi++;
      else if (st === 'rejected' || st === 'ditolak') stats.ditolak++;
      else stats.pending++;
    });
    return stats;
  },

  getRABByPeriod: function (schoolId, period) {
    var rows = this.getTransactionsBySchool(schoolId, period);
    var map = {}, grandTotal = 0;
    rows.forEach(function (t) {
      var kode = t.kode_anggaran || '(tanpa kode)';
      var jumlah = Number(t.jumlah_rupiah) || 0;
      if (!map[kode]) map[kode] = { kode: kode, nama: t.nama_kegiatan || '', total: 0, jumlahItem: 0 };
      map[kode].total += jumlah;
      map[kode].jumlahItem += 1;
      grandTotal += jumlah;
    });
    var items = Object.keys(map).map(function (k) { return map[k]; });
    items.sort(function (a, b) { return b.total - a.total; });
    return { items: items, grandTotal: grandTotal };
  },

  ensureDefaultSchool: function () {
    var schools = this.readAll('Data_Sekolah');
    if (schools.length > 0) return schools[0].school_id;
    var schoolId = 'SCH001';
    this.insert('Data_Sekolah', {
      school_id: schoolId, nama_sekolah: 'Sekolah Rakyat (Default)',
      alamat_sekolah: '-', kepala_sekolah: '-', bendahara: '-',
      status_aktif: 'aktif', tanggal_daftar: new Date().toISOString(), plan_type: 'free'
    });
    return schoolId;
  },

  updateSchool: function (schoolId, patch) {
    var sheet = this.getSheet('Data_Sekolah');
    if (!sheet) return false;
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol = headers.indexOf('School_ID');
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][idCol] === schoolId) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) return false;
    function setVal(header, value) {
      var c = headers.indexOf(header);
      if (c !== -1 && value !== undefined) sheet.getRange(rowIndex, c + 1).setValue(value);
    }
    setVal('Nama_Sekolah', patch.namaSekolah);
    setVal('Alamat_Sekolah', patch.alamat);
    setVal('Kepala_Sekolah', patch.kepalaSekolah);
    setVal('Bendahara', patch.bendahara);
    return true;
  },

  seedDemoIfEmpty: function (schoolId) {
    try {
      var props = PropertiesService.getScriptProperties();
      if (props.getProperty(this.SEED_FLAG)) return;
      if (this.readAll('Data_Transaksi').length === 0) {
        var self = this;
        [
          { kode: '521211', nama: 'Belanja ATK Kantor', jumlah: 750000, status: 'verified' },
          { kode: '521811', nama: 'Konsumsi Rapat Komite', jumlah: 1250000, status: 'pending' },
          { kode: '523111', nama: 'Pemeliharaan Gedung Sekolah', jumlah: 3500000, status: 'pending' }
        ].forEach(function (s) {
          self.insert('Data_Transaksi', {
            id_transaksi: _genTrxId(), kode_anggaran: s.kode, nama_kegiatan: s.nama,
            jumlah_rupiah: s.jumlah, timestamp: new Date().toISOString(),
            status_verifikasi: s.status, school_id: schoolId
          });
        });
      }
      props.setProperty(this.SEED_FLAG, '1');
    } catch (e) { Logger.log('Seed error: ' + e.message); }
  }
};

/* =========================================================================
 *  HELPERS
 * ========================================================================= */

function _resolveSchoolId(payload) {
  if (payload && payload.schoolId) return payload.schoolId;
  return Database.ensureDefaultSchool();
}
function _genTrxId() {
  return 'TRX-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8).toUpperCase();
}
function _parseRupiah(val) {
  if (typeof val === 'number') return Math.round(val);
  var cleaned = String(val == null ? '' : val).replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10) || 0;
}
function _splitCsvLine(line) {
  var result = [], cur = '', inQuotes = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if ((ch === ',' || ch === ';' || ch === '\t') && !inQuotes) {
      result.push(cur); cur = '';
    } else { cur += ch; }
  }
  result.push(cur);
  return result;
}

/* =========================================================================
 *  API (dipanggil dari UI via google.script.run)
 * ========================================================================= */

function apiBootstrap() {
  try {
    Database.init();
    var schoolId = Database.ensureDefaultSchool();
    Database.seedDemoIfEmpty(schoolId);
    var schools = Database.readAll('Data_Sekolah').map(function (s) {
      return { schoolId: s.school_id, nama: s.nama_sekolah };
    });
    return {
      ok: true, schoolId: schoolId, schools: schools,
      stats: Database.getStats(schoolId),
      spreadsheetUrl: Database.getSpreadsheetUrl(),
      serverTime: new Date().toISOString()
    };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiGetDashboard(payload) {
  try {
    var schoolId = _resolveSchoolId(payload);
    return { ok: true, schoolId: schoolId, stats: Database.getStats(schoolId) };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiGetTransactions(payload) {
  try {
    var schoolId = _resolveSchoolId(payload);
    var rows = Database.getTransactionsBySchool(schoolId, '*').map(function (t) {
      return {
        id: t.id_transaksi, kode: t.kode_anggaran, nama: t.nama_kegiatan,
        jumlah: Number(t.jumlah_rupiah) || 0, timestamp: t.timestamp,
        status: String(t.status_verifikasi || 'pending')
      };
    });
    rows.reverse();
    return { ok: true, rows: rows };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiSaveManualRows(payload) {
  try {
    payload = payload || {};
    var schoolId = _resolveSchoolId(payload);
    var rows = payload.rows || [];
    var saved = 0, skipped = 0, failed = 0;
    rows.forEach(function (r) {
      var kode = (r.kodeAnggaran || '').toString().trim();
      var nama = (r.namaKegiatan || '').toString().trim();
      var jumlah = _parseRupiah(r.jumlahRupiah);
      if (!kode && !nama && !jumlah) return;
      if (!kode || !nama || jumlah <= 0) { skipped++; return; }
      var ok = Database.insert('Data_Transaksi', {
        id_transaksi: _genTrxId(), kode_anggaran: kode, nama_kegiatan: nama,
        jumlah_rupiah: jumlah, timestamp: new Date().toISOString(),
        status_verifikasi: 'pending', school_id: schoolId
      });
      if (ok) saved++; else failed++;
    });
    if (failed > 0 && saved === 0) {
      return { ok: false, error: 'Gagal menulis ke Spreadsheet (' + failed + ' baris). Cek otorisasi.' };
    }
    return { ok: true, saved: saved, skipped: skipped, failed: failed };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiUploadCSV(payload) {
  try {
    payload = payload || {};
    var schoolId = _resolveSchoolId(payload);
    var csv = String(payload.csv || '').trim();
    if (!csv) return { ok: false, error: 'Data CSV kosong.' };
    var lines = csv.split(/\r?\n/);
    var processed = 0, errors = 0, startIndex = 0;
    var first = _splitCsvLine(lines[0]).join(' ').toLowerCase();
    if (first.indexOf('kode') !== -1 || first.indexOf('nama') !== -1 || first.indexOf('jumlah') !== -1) startIndex = 1;
    for (var i = startIndex; i < lines.length; i++) {
      if (!lines[i] || !lines[i].trim()) continue;
      var cols = _splitCsvLine(lines[i]);
      var kode = (cols[0] || '').trim();
      var nama = (cols[1] || '').trim();
      var jumlah = _parseRupiah(cols[2]);
      if (!kode || !nama || jumlah <= 0) { errors++; continue; }
      Database.insert('Data_Transaksi', {
        id_transaksi: _genTrxId(), kode_anggaran: kode, nama_kegiatan: nama,
        jumlah_rupiah: jumlah, timestamp: new Date().toISOString(),
        status_verifikasi: 'pending', school_id: schoolId
      });
      processed++;
    }
    return { ok: true, processed: processed, errors: errors };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiGetRAB(payload) {
  try {
    payload = payload || {};
    var schoolId = _resolveSchoolId(payload);
    var period = payload.period || '*';
    var r = Database.getRABByPeriod(schoolId, period);
    return { ok: true, period: period, items: r.items, grandTotal: r.grandTotal };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiVerifyTransaction(payload) {
  try {
    payload = payload || {};
    if (!payload.id) return { ok: false, error: 'ID transaksi wajib diisi.' };
    var status = payload.action === 'reject' ? 'rejected' : 'verified';
    var updated = Database.updateTransactionStatus(payload.id, status);
    return updated ? { ok: true, status: status } : { ok: false, error: 'Transaksi tidak ditemukan.' };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiGetSchool(payload) {
  try {
    var schoolId = _resolveSchoolId(payload);
    var schools = Database.readAll('Data_Sekolah');
    var found = null;
    for (var i = 0; i < schools.length; i++) {
      if (schools[i].school_id === schoolId) { found = schools[i]; break; }
    }
    return {
      ok: true,
      school: found ? {
        schoolId: found.school_id, namaSekolah: found.nama_sekolah,
        alamat: found.alamat_sekolah, kepalaSekolah: found.kepala_sekolah,
        bendahara: found.bendahara, planType: found.plan_type
      } : null
    };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiSaveSchool(payload) {
  try {
    payload = payload || {};
    var schoolId = _resolveSchoolId(payload);
    var ok = Database.updateSchool(schoolId, payload);
    return ok ? { ok: true } : { ok: false, error: 'Sekolah tidak ditemukan.' };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiDiagnostics() {
  try {
    return {
      ok: true,
      spreadsheetUrl: Database.getSpreadsheetUrl(),
      transaksiRows: Database.countRows('Data_Transaksi'),
      sekolahRows: Database.countRows('Data_Sekolah'),
      serverTime: new Date().toISOString()
    };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

/**
 * SELF TEST — pilih fungsi ini di editor lalu klik Run untuk menguji
 * penyimpanan TANPA perlu deploy. Lihat hasilnya di Execution log.
 */
function selfTest() {
  var before = Database.countRows('Data_Transaksi');
  var schoolId = Database.ensureDefaultSchool();
  var ok = Database.insert('Data_Transaksi', {
    id_transaksi: _genTrxId(), kode_anggaran: 'TEST',
    nama_kegiatan: 'SELF TEST ' + new Date().toLocaleString('id-ID'),
    jumlah_rupiah: 12345, timestamp: new Date().toISOString(),
    status_verifikasi: 'pending', school_id: schoolId
  });
  var after = Database.countRows('Data_Transaksi');
  var url = Database.getSpreadsheetUrl();
  var result = {
    insertReturned: ok, rowsBefore: before, rowsAfter: after,
    rowAdded: (after === before + 1), spreadsheetUrl: url
  };
  Logger.log('=== SELF TEST RESULT ===');
  Logger.log(JSON.stringify(result, null, 2));
  Logger.log('Buka spreadsheet ini untuk verifikasi: ' + url);
  return result;
}
