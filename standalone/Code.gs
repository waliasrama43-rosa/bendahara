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
      'Kode_Komponen', 'Jenis_Belanja', 'Kuantitas', 'Harga_Satuan',
      'Bulan', 'Jenjang', 'Bukti_URL', 'Nama_Toko', 'Satuan'
    ],
    Data_Sekolah: [
      'School_ID', 'Nama_Sekolah', 'Alamat_Sekolah', 'Kepala_Sekolah',
      'Bendahara', 'Status_Aktif', 'Tanggal_Daftar', 'Plan_Type'
    ],
    System_Logs: ['Log_ID', 'Timestamp', 'Level', 'Module', 'Message', 'Details'],
    Users: ['Username', 'PasswordHash', 'Role', 'Nama', 'Status'],
    Data_Pagu: ['Pagu_ID', 'School_ID', 'Tahun', 'Kode_Output', 'Kode_Kegiatan', 'Kode_Komponen', 'Kode_Akun', 'Uraian', 'Volume', 'Satuan', 'Harga_Satuan', 'Pagu']
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
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(self.HEADERS[name]);
      } else {
        // Self-heal: tambahkan kolom baru yang belum ada di sheet lama.
        var existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        var missing = [];
        self.HEADERS[name].forEach(function (h) { if (existing.indexOf(h) === -1) missing.push(h); });
        if (missing.length) {
          sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
        }
      }
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
    return String(header).toLowerCase().split(' ').join('_');
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

  updateTransactionFields: function (transactionId, patch) {
    try {
      var sheet = this.getSheet('Data_Transaksi');
      if (!sheet) return false;
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var self = this;
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === transactionId) {
          for (var j = 0; j < headers.length; j++) {
            var key = self.headerToKey(headers[j]);
            if (patch[key] !== undefined) sheet.getRange(i + 1, j + 1).setValue(patch[key]);
          }
          return true;
        }
      }
      return false;
    } catch (error) {
      Logger.log('updateTransactionFields error: ' + error.message);
      return false;
    }
  },

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

  getTransactionsBySchool: function (schoolId, period) {
    var all = this.readAll('Data_Transaksi');
    var self = this;
    return all.filter(function (t) {
      if (schoolId && t.school_id && t.school_id !== schoolId) return false;
      if (!period || period === '*') return true;
      var p = t.bulan ? String(t.bulan) : self.extractPeriod(t.timestamp);
      return p === period;
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

  // Rekap jumlah & total anggaran per jenjang (untuk Dashboard).
  getJenjangBreakdown: function (schoolId) {
    var order = ['SD', 'SMP', 'SMA/SMK', '(lainnya)'];
    var map = { 'SD': { count: 0, total: 0 }, 'SMP': { count: 0, total: 0 }, 'SMA/SMK': { count: 0, total: 0 }, '(lainnya)': { count: 0, total: 0 } };
    this.getTransactionsBySchool(schoolId, '*').forEach(function (t) {
      var g = String(t.jenjang || '');
      if (g !== 'SD' && g !== 'SMP' && g !== 'SMA/SMK') g = '(lainnya)';
      map[g].count++;
      map[g].total += Number(t.jumlah_rupiah) || 0;
    });
    return order.map(function (k) { return { jenjang: k, count: map[k].count, total: map[k].total }; });
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
  var s = String(val == null ? '' : val), cleaned = '';
  for (var i = 0; i < s.length; i++) { var ch = s.charAt(i); if (ch >= '0' && ch <= '9') cleaned += ch; }
  return parseInt(cleaned, 10) || 0;
}

// Parse angka volume (boleh desimal, mis. "36" atau "36,5"). Koma dianggap desimal.
function _parseNum(val) {
  if (typeof val === 'number') return val;
  var s = String(val == null ? '' : val).trim(), t = '';
  for (var i = 0; i < s.length; i++) { var ch = s.charAt(i); if (ch >= '0' && ch <= '9') t += ch; else if (ch === '.' || ch === ',') t += '.'; }
  var n = parseFloat(t);
  return isNaN(n) ? 0 : n;
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

// Bulan disimpan sebagai "YYYY-M" (mis. "2026-3"). Default: bulan berjalan.
function _normalizeBulan(val) {
  var s = String(val == null ? '' : val).trim();
  var parts = s.split('-');
  var y = parseInt(parts[0], 10);
  var m = parseInt(parts[1], 10);
  if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12) return y + '-' + m;
  var now = new Date();
  return now.getFullYear() + '-' + (now.getMonth() + 1);
}

// Jenjang dibatasi: SD, SMP, SMA/SMK.
function _normalizeJenjang(val) {
  var s = String(val == null ? '' : val).trim().toUpperCase();
  if (s === 'SD' || s === 'SMP' || s === 'SMA/SMK') return s;
  if (s === 'SMA' || s === 'SMK' || s === 'SMA-SMK') return 'SMA/SMK';
  return '';
}

// Bukti disimpan sebagai JSON array [{name,url}] di kolom Bukti_URL.
// Backward-compatible: nilai lama berupa satu URL polos tetap terbaca.
function _parseBukti(val) {
  var s = String(val == null ? '' : val).trim();
  if (!s) return [];
  if (s.charAt(0) === '[') {
    try {
      var arr = JSON.parse(s);
      return arr.map(function (x) {
        if (typeof x === 'string') return { name: 'Bukti', url: x };
        return { name: x.name || 'Bukti', url: x.url || '' };
      }).filter(function (x) { return x.url; });
    } catch (e) { /* fallthrough */ }
  }
  return [{ name: 'Bukti', url: s }];
}

/* =========================================================================
 *  API (dipanggil dari UI via google.script.run)
 * ========================================================================= */

function apiBootstrap() {
  try {
    Database.init();
    var schoolId = Database.ensureDefaultSchool();
    Database.seedDemoIfEmpty(schoolId);
    _seedUsers();
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
    return { ok: true, schoolId: schoolId, stats: Database.getStats(schoolId), perJenjang: Database.getJenjangBreakdown(schoolId) };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiGetTransactions(payload) {
  try {
    var schoolId = _resolveSchoolId(payload);
    var rows = Database.getTransactionsBySchool(schoolId, '*').map(function (t) {
      return {
        id: t.id_transaksi, kode: t.kode_anggaran, nama: t.nama_kegiatan,
        jumlah: Number(t.jumlah_rupiah) || 0, timestamp: t.timestamp,
        status: String(t.status_verifikasi || 'pending'),
        bulan: t.bulan ? String(t.bulan) : '',
        jenjang: t.jenjang ? String(t.jenjang) : '',
        bukti: _parseBukti(t.bukti_url),
        namaToko: t.nama_toko ? String(t.nama_toko) : '',
        satuan: t.satuan ? String(t.satuan) : '',
        volume: Number(t.kuantitas) || 0,
        hargaSatuan: Number(t.harga_satuan) || 0
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
    var bulan = _normalizeBulan(payload.bulan);
    var jenjang = _normalizeJenjang(payload.jenjang);
    var saved = 0, skipped = 0, failed = 0;
    rows.forEach(function (r) {
      var kode = (r.kodeAnggaran || '').toString().trim();
      var nama = (r.namaKegiatan || '').toString().trim();
      var toko = (r.namaToko || '').toString().trim();
      var satuan = (r.satuan || '').toString().trim();
      var volume = _parseNum(r.volume);
      var harga = _parseRupiah(r.hargaSatuan);
      // Jumlah = volume x harga jika tersedia; jika tidak, pakai input jumlah.
      var jumlah = (volume > 0 && harga > 0) ? Math.round(volume * harga) : _parseRupiah(r.jumlahRupiah);
      if (!kode && !nama && !jumlah) return;
      if (!kode || !nama || jumlah <= 0) { skipped++; return; }
      var ok = Database.insert('Data_Transaksi', {
        id_transaksi: _genTrxId(), kode_anggaran: kode, nama_kegiatan: nama,
        jumlah_rupiah: jumlah, timestamp: new Date().toISOString(),
        status_verifikasi: 'pending', school_id: schoolId,
        bulan: bulan, jenjang: jenjang,
        nama_toko: toko, satuan: satuan, kuantitas: volume || '', harga_satuan: harga || ''
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
    var bulan = _normalizeBulan(payload.bulan);
    var jenjang = _normalizeJenjang(payload.jenjang);
    var csv = String(payload.csv || '').trim();
    if (!csv) return { ok: false, error: 'Data CSV kosong.' };
    var lines = csv.split('\r\n').join('\n').split('\r').join('\n').split('\n');
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
        status_verifikasi: 'pending', school_id: schoolId,
        bulan: bulan, jenjang: jenjang
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
    var g = _requireBendahara(payload); if (g) return g;
    if (!payload.id) return { ok: false, error: 'ID transaksi wajib diisi.' };
    var status = payload.action === 'reject' ? 'rejected' : 'verified';
    var updated = Database.updateTransactionStatus(payload.id, status);
    return updated ? { ok: true, status: status } : { ok: false, error: 'Transaksi tidak ditemukan.' };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiUpdateTransaction(payload) {
  try {
    payload = payload || {};
    if (!payload.id) return { ok: false, error: 'ID transaksi wajib diisi.' };
    var patch = {};
    if (payload.kodeAnggaran !== undefined) patch.kode_anggaran = String(payload.kodeAnggaran).trim();
    if (payload.namaKegiatan !== undefined) patch.nama_kegiatan = String(payload.namaKegiatan).trim();
    if (payload.namaToko !== undefined) patch.nama_toko = String(payload.namaToko).trim();
    if (payload.satuan !== undefined) patch.satuan = String(payload.satuan).trim();
    if (payload.volume !== undefined) patch.kuantitas = _parseNum(payload.volume);
    if (payload.hargaSatuan !== undefined) patch.harga_satuan = _parseRupiah(payload.hargaSatuan);
    var vv = patch.kuantitas, hh = patch.harga_satuan;
    if (vv > 0 && hh > 0) patch.jumlah_rupiah = Math.round(vv * hh);
    else if (payload.jumlahRupiah !== undefined) patch.jumlah_rupiah = _parseRupiah(payload.jumlahRupiah);
    if (payload.bulan !== undefined) patch.bulan = _normalizeBulan(payload.bulan);
    if (payload.jenjang !== undefined) patch.jenjang = _normalizeJenjang(payload.jenjang);
    if (payload.kodeAnggaran !== undefined && !patch.kode_anggaran) return { ok: false, error: 'Kode anggaran tidak boleh kosong.' };
    if (patch.nama_kegiatan === '' ) return { ok: false, error: 'Nama kegiatan tidak boleh kosong.' };
    var ok = Database.updateTransactionFields(payload.id, patch);
    return ok ? { ok: true } : { ok: false, error: 'Transaksi tidak ditemukan.' };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiDeleteTransaction(payload) {
  try {
    payload = payload || {};
    var g = _requireBendahara(payload); if (g) return g;
    if (!payload.id) return { ok: false, error: 'ID transaksi wajib diisi.' };
    var ok = Database.deleteTransaction(payload.id);
    return ok ? { ok: true } : { ok: false, error: 'Transaksi tidak ditemukan.' };
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
    var g = _requireBendahara(payload); if (g) return g;
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



/* =========================================================================
 *  BUKTI / KWITANSI — unggah file bukti ke Google Drive
 * ========================================================================= */

function _buktiFolder() {
  var name = 'Bukti ERP Sekolah Rakyat';
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

/**
 * Unggah file bukti (gambar/PDF) dan tautkan ke sebuah transaksi.
 * payload = { id, filename, mimeType, dataBase64 }
 * Catatan: butuh otorisasi akses Google Drive (akan diminta sekali).
 */
function apiUploadBukti(payload) {
  try {
    payload = payload || {};
    if (!payload.id) return { ok: false, error: 'ID transaksi wajib diisi.' };
    if (!payload.dataBase64) return { ok: false, error: 'File kosong / gagal dibaca.' };

    var bytes = Utilities.base64Decode(payload.dataBase64);
    var blob = Utilities.newBlob(bytes, payload.mimeType || 'application/octet-stream', payload.filename || ('bukti-' + payload.id));
    var file = _buktiFolder().createFile(blob);
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
    var url = file.getUrl();

    // Tambahkan ke daftar bukti yang sudah ada (mendukung banyak bukti per transaksi).
    var current = [];
    var rows = Database.readAll('Data_Transaksi');
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].id_transaksi === payload.id) { current = _parseBukti(rows[i].bukti_url); break; }
    }
    current.push({ name: payload.filename || ('Bukti ' + (current.length + 1)), url: url });
    Database.updateTransactionFields(payload.id, { bukti_url: JSON.stringify(current) });
    return { ok: true, url: url, count: current.length };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

/**
 * Hapus satu bukti dari daftar (berdasarkan index). File di Drive tidak ikut
 * terhapus (hanya tautannya yang dilepas).
 * payload = { id, index }
 */
function apiDeleteBukti(payload) {
  try {
    payload = payload || {};
    if (!payload.id) return { ok: false, error: 'ID transaksi wajib diisi.' };
    var cur = [];
    var rows = Database.readAll('Data_Transaksi');
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].id_transaksi === payload.id) { cur = _parseBukti(rows[i].bukti_url); break; }
    }
    var idx = Number(payload.index);
    if (idx >= 0 && idx < cur.length) cur.splice(idx, 1);
    Database.updateTransactionFields(payload.id, { bukti_url: cur.length ? JSON.stringify(cur) : '' });
    return { ok: true, count: cur.length };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

/* =========================================================================
 *  EXPORT LAPORAN SPJ (CSV dirakit di server, + estimasi PPN 11%)
 * ========================================================================= */

function apiExportData(payload) {
  try {
    payload = payload || {};
    var schoolId = _resolveSchoolId(payload);
    var period = payload.period || '*';
    var jenjang = _normalizeJenjang(payload.jenjang);

    var school = null;
    var schools = Database.readAll('Data_Sekolah');
    for (var i = 0; i < schools.length; i++) {
      if (schools[i].school_id === schoolId) { school = schools[i]; break; }
    }

    var rows = Database.getTransactionsBySchool(schoolId, period).filter(function (t) {
      if (jenjang && String(t.jenjang || '') !== jenjang) return false;
      return true;
    });

    function q(s) { return '"' + String(s == null ? '' : s).split('"').join('""') + '"'; }

    var out = [];
    out.push(q('LAPORAN SPJ - ' + (school ? school.nama_sekolah : 'Sekolah')));
    out.push(q('Kepala Sekolah: ' + (school ? school.kepala_sekolah : '-')));
    out.push(q('Bendahara: ' + (school ? school.bendahara : '-')));
    out.push(q('Periode: ' + (period === '*' ? 'Semua' : period) + ' | Jenjang: ' + (jenjang || 'Semua')));
    out.push('');
    out.push(['No', 'Kode Anggaran', 'Nama Kegiatan', 'Bulan', 'Jenjang',
      'DPP (Rp)', 'PPN 11% (Rp)', 'Total (Rp)', 'Status', 'Bukti'].map(q).join(','));

    var totDpp = 0, totPpn = 0, totAll = 0;
    rows.forEach(function (t, idx) {
      var dpp = Number(t.jumlah_rupiah) || 0;
      var ppn = Math.round(dpp * 0.11);
      var tot = dpp + ppn;
      var bk = _parseBukti(t.bukti_url);
      totDpp += dpp; totPpn += ppn; totAll += tot;
      out.push([
        q(idx + 1), q(t.kode_anggaran), q(t.nama_kegiatan), q(t.bulan || ''),
        q(t.jenjang || ''), q(dpp), q(ppn), q(tot),
        q(t.status_verifikasi || 'pending'), q(bk.length ? (bk.length + ' file') : '')
      ].join(','));
    });
    out.push(['', '', q('TOTAL'), '', '', q(totDpp), q(totPpn), q(totAll), '', ''].join(','));

    return {
      ok: true,
      filename: 'Laporan_SPJ_' + (period === '*' ? 'semua' : period) + '.csv',
      content: out.join('\r\n'),
      jumlahBaris: rows.length
    };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

/* =========================================================================
 *  DATA DUMMY untuk uji coba
 * ========================================================================= */

function _dummyRows(schoolId) {
  var y = new Date().getFullYear();
  var samples = [
    { k: '521211', n: 'Belanja ATK Kantor', j: 850000, b: y + '-1', g: 'SD', s: 'verified' },
    { k: '521211', n: 'Pembelian Kertas HVS', j: 450000, b: y + '-1', g: 'SD', s: 'verified' },
    { k: '521811', n: 'Konsumsi Rapat Komite', j: 1250000, b: y + '-2', g: 'SMP', s: 'pending' },
    { k: '522141', n: 'Sewa Sound System', j: 1500000, b: y + '-2', g: 'SMP', s: 'verified' },
    { k: '523111', n: 'Pemeliharaan Gedung', j: 3500000, b: y + '-3', g: 'SMA/SMK', s: 'pending' },
    { k: '521211', n: 'Spidol & Penghapus', j: 175000, b: y + '-3', g: 'SD', s: 'verified' },
    { k: '524111', n: 'Perjalanan Dinas Lomba', j: 2000000, b: y + '-4', g: 'SMA/SMK', s: 'pending' },
    { k: '521119', n: 'Honor Narasumber', j: 900000, b: y + '-4', g: 'SMP', s: 'verified' }
  ];
  return samples.map(function (r) {
    return {
      id_transaksi: _genTrxId(), kode_anggaran: r.k, nama_kegiatan: r.n,
      jumlah_rupiah: r.j, timestamp: new Date().toISOString(),
      status_verifikasi: r.s, school_id: schoolId, bulan: r.b, jenjang: r.g
    };
  });
}

function apiSeedDummy(payload) {
  try {
    var g = _requireBendahara(payload); if (g) return g;
    var schoolId = _resolveSchoolId(payload);
    var rows = _dummyRows(schoolId);
    var n = 0;
    rows.forEach(function (r) { if (Database.insert('Data_Transaksi', r)) n++; });
    return { ok: true, inserted: n };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

// Bisa dijalankan langsung dari editor Apps Script (pilih fungsi -> Run).
function seedDummyData() {
  var schoolId = Database.ensureDefaultSchool();
  var res = apiSeedDummy({ schoolId: schoolId });
  Logger.log('Dummy inserted: ' + JSON.stringify(res));
  return res;
}



/* =========================================================================
 *  LOGIN & PERAN (Bendahara/admin vs Pelaksana/tendik)
 * ========================================================================= */

function _hashPw(pw) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'erp-salt-v1:' + String(pw));
  var hex = '';
  for (var i = 0; i < raw.length; i++) {
    var b = (raw[i] + 256) % 256;
    var h = b.toString(16);
    hex += (h.length === 1 ? '0' : '') + h;
  }
  return hex;
}

// Buat akun default sekali saja (bisa diubah/ditambah di sheet "Users").
function _seedUsers() {
  try {
    var sheet = Database.getSheet('Users');
    if (!sheet) return;
    if (Database.countRows('Users') > 0) return;
    Database.insert('Users', { username: 'admin', passwordhash: _hashPw('bendahara123'), role: 'bendahara', nama: 'Bendahara Sekolah', status: 'aktif' });
    Database.insert('Users', { username: 'tendik', passwordhash: _hashPw('tendik123'), role: 'pelaksana', nama: 'Tendik (Pelaksana)', status: 'aktif' });
  } catch (e) { Logger.log('seedUsers error: ' + e.message); }
}

function _session(token) {
  if (!token) return null;
  try {
    var v = CacheService.getScriptCache().get('sess_' + token);
    return v ? JSON.parse(v) : null;
  } catch (e) { return null; }
}

// Kembalikan objek error jika BUKAN bendahara; null jika boleh lanjut.
function _requireBendahara(payload) {
  var s = _session(payload && payload.token);
  if (!s) return { ok: false, error: 'Sesi berakhir. Silakan login ulang.' };
  if (s.role !== 'bendahara') return { ok: false, error: 'Akses ditolak. Hanya Bendahara (admin) yang berwenang.' };
  return null;
}

function apiLogin(payload) {
  try {
    payload = payload || {};
    var u = String(payload.username || '').trim().toLowerCase();
    var p = String(payload.password || '');
    if (!u || !p) return { ok: false, error: 'Username & password wajib diisi.' };
    _seedUsers();
    var users = Database.readAll('Users');
    var hash = _hashPw(p);
    for (var i = 0; i < users.length; i++) {
      if (String(users[i].username || '').toLowerCase() === u && String(users[i].passwordhash || '') === hash) {
        if (String(users[i].status || 'aktif').toLowerCase() === 'nonaktif') return { ok: false, error: 'Akun nonaktif.' };
        var token = Utilities.getUuid();
        var sess = { username: u, role: String(users[i].role || 'pelaksana'), nama: String(users[i].nama || u) };
        CacheService.getScriptCache().put('sess_' + token, JSON.stringify(sess), 21600);
        return { ok: true, token: token, role: sess.role, nama: sess.nama };
      }
    }
    return { ok: false, error: 'Username atau password salah.' };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiCheckSession(payload) {
  var s = _session(payload && payload.token);
  return s ? { ok: true, role: s.role, nama: s.nama } : { ok: false };
}

function apiLogout(payload) {
  try {
    if (payload && payload.token) CacheService.getScriptCache().remove('sess_' + payload.token);
  } catch (e) {}
  return { ok: true };
}



/* =========================================================================
 *  EXPORT REKAP (format bendahara: NAMA TOKO, URAIAN MAK, dst + TERBILANG)
 * ========================================================================= */

var _BULAN_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function _periodLabelID(period) {
  var p = String(period || '').split('-');
  var y = parseInt(p[0], 10);
  var m = parseInt(p[1], 10);
  return {
    tahun: (y >= 2000 && y <= 2100) ? y : '',
    bulan: (m >= 1 && m <= 12) ? _BULAN_ID[m - 1] : ''
  };
}

// Terbilang (server) — angka bulat ke kata bahasa Indonesia.
function _terbilang(n) {
  n = Math.floor(Math.abs(Number(n) || 0));
  var sat = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  function w(x) {
    if (x < 12) return sat[x];
    if (x < 20) return w(x - 10) + ' belas';
    if (x < 100) return w(Math.floor(x / 10)) + ' puluh' + (x % 10 ? ' ' + w(x % 10) : '');
    if (x < 200) return 'seratus' + (x - 100 ? ' ' + w(x - 100) : '');
    if (x < 1000) return w(Math.floor(x / 100)) + ' ratus' + (x % 100 ? ' ' + w(x % 100) : '');
    if (x < 2000) return 'seribu' + (x - 1000 ? ' ' + w(x - 1000) : '');
    if (x < 1000000) return w(Math.floor(x / 1000)) + ' ribu' + (x % 1000 ? ' ' + w(x % 1000) : '');
    if (x < 1000000000) return w(Math.floor(x / 1000000)) + ' juta' + (x % 1000000 ? ' ' + w(x % 1000000) : '');
    return w(Math.floor(x / 1000000000)) + ' miliar' + (x % 1000000000 ? ' ' + w(x % 1000000000) : '');
  }
  if (n === 0) return 'nol';
  var s = w(n);
  while (s.indexOf('  ') >= 0) s = s.split('  ').join(' ');
  return s.trim();
}

/**
 * Export REKAP sesuai format bendahara.
 * Kolom: NO, NAMA TOKO, URAIAN MAK (Akun belanja), URAIAN PEMBAYARAN,
 *        TAHUN ANGGARAN, BULAN PELAKSANAAN, VOLUME, SATUAN, JUMLAH, TERBILANG.
 * payload = { schoolId, period, jenjang }
 */
function apiExportRekap(payload) {
  try {
    payload = payload || {};
    var schoolId = _resolveSchoolId(payload);
    var period = payload.period || '*';
    var jenjang = _normalizeJenjang(payload.jenjang);

    var rows = Database.getTransactionsBySchool(schoolId, period).filter(function (t) {
      if (jenjang && String(t.jenjang || '') !== jenjang) return false;
      return true;
    });

    function q(s) { return '"' + String(s == null ? '' : s).split('"').join('""') + '"'; }

    var header = ['NO', 'NAMA TOKO', 'URAIAN MAK (Akun belanja)', 'URAIAN PEMBAYARAN',
      'TAHUN ANGGARAN', 'BULAN PELAKSANAAN', 'VOLUME', 'SATUAN', 'JUMLAH', 'TERBILANG'];
    var out = [header.map(q).join(',')];
    var total = 0;

    rows.forEach(function (t, idx) {
      var jumlah = Number(t.jumlah_rupiah) || 0;
      total += jumlah;
      var lbl = _periodLabelID(t.bulan);
      var vol = Number(t.kuantitas) || '';
      out.push([
        q(idx + 1),
        q(t.nama_toko || ''),
        q(t.kode_anggaran || ''),
        q(t.nama_kegiatan || ''),
        q(lbl.tahun),
        q(lbl.bulan),
        q(vol),
        q(t.satuan || ''),
        q(jumlah),
        q(_terbilang(jumlah) + ' rupiah')
      ].join(','));
    });
    out.push(['', '', '', '', '', '', '', q('TOTAL'), q(total), ''].join(','));

    return {
      ok: true,
      filename: 'Rekap_' + (period === '*' ? 'semua' : period) + '.csv',
      content: out.join('\r\n'),
      jumlahBaris: rows.length
    };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}



/* =========================================================================
 *  TAHAP 1: PAGU / RKKAL  +  REALISASI
 * ========================================================================= */

function _digitsOnly(s){ var o=''; s=String(s); for(var i=0;i<s.length;i++){ var c=s.charAt(i); if(c>='0'&&c<='9') o+=c; } return o; }
function _looksNumeric(s){ s=String(s).trim(); if(!s) return false; var d=false; for(var i=0;i<s.length;i++){ var c=s.charAt(i); if(c>='0'&&c<='9'){d=true;} else if(c!=='.'&&c!==','&&c!==' '){ return false; } } return d; }
function _isUnit(s){ s=String(s).trim(); if(!s||s.length>6) return false; for(var i=0;i<s.length;i++){ var c=s.charAt(i); if(!((c>='A'&&c<='Z')||(c>='a'&&c<='z'))) return false; } return true; }
function _toFloat(s){ var t='',dot=false; s=String(s); for(var i=0;i<s.length;i++){ var c=s.charAt(i); if(c>='0'&&c<='9') t+=c; else if((c==='.'||c===',')&&!dot){ t+='.'; dot=true; } } var n=parseFloat(t); return isNaN(n)?0:n; }

// Klasifikasi kode hierarki RKA-KL: output (7936.101), kegiatan (303),
// komponen (D, huruf), akun/MAK (521219, 6 digit).
function _classifyKode(v){
  v=String(v).trim();
  if(!v) return null;
  if(v.indexOf('.')>0){ var j=v.split('.').join(''); if(_digitsOnly(j)===j && j.length>=4) return 'output'; }
  var dg=_digitsOnly(v);
  if(dg===v){ if(v.length===6) return 'akun'; if(v.length===3) return 'kegiatan'; return null; }
  if(v.length===1 && v>='A' && v<='Z') return 'komponen';
  return null;
}

function _parsePaguDetail(cells){
  var c=[]; for(var i=0;i<cells.length;i++) c.push(String(cells[i]).trim());
  var nums=[]; for(var i=0;i<c.length;i++){ if(_looksNumeric(c[i]) && _digitsOnly(c[i]).length>0) nums.push(i); }
  if(nums.length<1) return null;
  var jIdx=nums[nums.length-1];
  var pagu=parseInt(_digitsOnly(c[jIdx]),10)||0;
  if(pagu<=0) return null;
  var hIdx=-1, harga=0;
  if(nums.length>=2){ hIdx=nums[nums.length-2]; harga=parseInt(_digitsOnly(c[hIdx]),10)||0; }
  var vol=0, sat='';
  for(var i=0;i<c.length;i++){
    if(i===jIdx||i===hIdx) continue;
    var parts=c[i].split(' ');
    if(parts.length>=2 && _looksNumeric(parts[0]) && _isUnit(parts[parts.length-1])){ vol=_toFloat(parts[0]); sat=parts[parts.length-1]; break; }
  }
  if(!sat){
    for(var i=0;i<c.length;i++){
      if(i===jIdx||i===hIdx) continue;
      if(_isUnit(c[i])){ sat=c[i].trim(); for(var k=i-1;k>=0;k--){ if(_looksNumeric(c[k])){ vol=_toFloat(c[k]); break; } } break; }
    }
  }
  var uraian='';
  for(var i=0;i<c.length;i++){ if(i===jIdx||i===hIdx) continue; if(_looksNumeric(c[i])||_isUnit(c[i])) continue; if(c[i].length>uraian.length) uraian=c[i]; }
  return { uraian: uraian, vol: vol, sat: sat, harga: harga, pagu: pagu };
}

// Parser RKKAL/RAB hasil copy dari Excel (antar-kolom dipisah TAB).
function _parseRkkalText(text){
  var lines=String(text||'').split('\r\n').join('\n').split('\r').join('\n').split('\n');
  var ctx={ output:'', kegiatan:'', komponen:'', akun:'' };
  var out=[];
  for(var li=0; li<lines.length; li++){
    var line=lines[li]; if(!line || !line.trim()) continue;
    var cells = line.indexOf('\t')>=0 ? line.split('\t') : [line];
    var first=String(cells[0]||'').trim();
    var kls=_classifyKode(first);
    if(kls){ ctx[kls]=first; continue; }
    var d=_parsePaguDetail(cells);
    if(d && d.uraian){
      out.push({ kodeOutput:ctx.output, kodeKegiatan:ctx.kegiatan, kodeKomponen:ctx.komponen, kodeAkun:ctx.akun, uraian:d.uraian, volume:d.vol, satuan:d.sat, harga:d.harga, pagu:d.pagu });
    }
  }
  return out;
}

function _insertPagu(schoolId, tahun, r){
  return Database.insert('Data_Pagu', {
    pagu_id: 'PAGU-' + Date.now() + '-' + Math.random().toString(36).substr(2,5).toUpperCase(),
    school_id: schoolId, tahun: tahun,
    kode_output: r.kodeOutput || '', kode_kegiatan: r.kodeKegiatan || '', kode_komponen: r.kodeKomponen || '',
    kode_akun: r.kodeAkun || '', uraian: r.uraian || '', volume: r.volume || '', satuan: r.satuan || '',
    harga_satuan: r.harga || '', pagu: r.pagu || 0
  });
}

// Import RKKAL via tempel teks (best-effort). payload = { tahun, text }
function apiImportPaguRKKAL(payload){
  try{
    payload = payload || {};
    var g=_requireBendahara(payload); if(g) return g;
    var schoolId=_resolveSchoolId(payload);
    var tahun=String(payload.tahun || new Date().getFullYear());
    var parsed=_parseRkkalText(payload.text);
    if(!parsed.length) return { ok:false, error:'Tidak ada baris pagu yang terbaca. Pastikan menyalin dari Excel (antar kolom ter-pisah Tab).' };
    var n=0; parsed.forEach(function(r){ if(_insertPagu(schoolId, tahun, r)) n++; });
    return { ok:true, inserted:n, preview: parsed.slice(0,8) };
  }catch(e){ return { ok:false, error:String(e && e.message || e) }; }
}

// Simpan baris pagu manual. payload = { tahun, rows:[{kodeAkun,uraian,volume,satuan,harga}] }
function apiSavePaguRows(payload){
  try{
    payload = payload || {};
    var g=_requireBendahara(payload); if(g) return g;
    var schoolId=_resolveSchoolId(payload);
    var tahun=String(payload.tahun || new Date().getFullYear());
    var rows=payload.rows||[]; var saved=0;
    rows.forEach(function(r){
      var kode=(r.kodeAkun||'').toString().trim();
      var uraian=(r.uraian||'').toString().trim();
      var vol=_parseNum(r.volume);
      var harga=_parseRupiah(r.harga);
      var pagu=(vol>0&&harga>0)?Math.round(vol*harga):_parseRupiah(r.pagu);
      if(!kode && !uraian && !pagu) return;
      if(!uraian || pagu<=0) return;
      if(_insertPagu(schoolId, tahun, { kodeAkun:kode, uraian:uraian, volume:vol, satuan:(r.satuan||'').toString().trim(), harga:harga, pagu:pagu })) saved++;
    });
    return { ok:true, saved:saved };
  }catch(e){ return { ok:false, error:String(e && e.message || e) }; }
}

function apiGetPagu(payload){
  try{
    payload = payload || {};
    var schoolId=_resolveSchoolId(payload);
    var tahun=payload.tahun ? String(payload.tahun) : '';
    var rows=Database.readAll('Data_Pagu').filter(function(p){
      if(schoolId && p.school_id && p.school_id!==schoolId) return false;
      if(tahun && String(p.tahun)!==tahun) return false;
      return true;
    }).map(function(p){
      return { id:p.pagu_id, tahun:String(p.tahun||''), kodeAkun:String(p.kode_akun||''), uraian:String(p.uraian||''),
        volume:Number(p.volume)||0, satuan:String(p.satuan||''), harga:Number(p.harga_satuan)||0, pagu:Number(p.pagu)||0 };
    });
    var total=0; rows.forEach(function(r){ total+=r.pagu; });
    return { ok:true, rows:rows, total:total };
  }catch(e){ return { ok:false, error:String(e && e.message || e) }; }
}

function apiClearPagu(payload){
  try{
    payload = payload || {};
    var g=_requireBendahara(payload); if(g) return g;
    var schoolId=_resolveSchoolId(payload);
    var tahun=String(payload.tahun||'');
    var sheet=Database.getSheet('Data_Pagu'); if(!sheet) return { ok:true, deleted:0 };
    var data=sheet.getDataRange().getValues(); var headers=data[0];
    var cSchool=headers.indexOf('School_ID'), cTahun=headers.indexOf('Tahun');
    var deleted=0;
    for(var i=data.length-1;i>=1;i--){
      var okSchool=!schoolId || data[i][cSchool]===schoolId;
      var okTahun=!tahun || String(data[i][cTahun])===tahun;
      if(okSchool && okTahun){ sheet.deleteRow(i+1); deleted++; }
    }
    return { ok:true, deleted:deleted };
  }catch(e){ return { ok:false, error:String(e && e.message || e) }; }
}

// Realisasi: Pagu (RKKAL) vs Realisasi (transaksi) vs Saldo, per kode akun.
function apiGetRealisasi(payload){
  try{
    payload = payload || {};
    var schoolId=_resolveSchoolId(payload);
    var tahun=String(payload.tahun || new Date().getFullYear());

    var paguMap={};
    Database.readAll('Data_Pagu').forEach(function(p){
      if(schoolId && p.school_id && p.school_id!==schoolId) return;
      if(String(p.tahun)!==tahun) return;
      var k=String(p.kode_akun||'(tanpa kode)');
      if(!paguMap[k]) paguMap[k]={ kode:k, uraian:String(p.uraian||''), pagu:0, realisasi:0 };
      paguMap[k].pagu += Number(p.pagu)||0;
    });

    Database.getTransactionsBySchool(schoolId, '*').forEach(function(t){
      var ph=t.bulan ? String(t.bulan).split('-')[0] : (t.timestamp ? String(new Date(t.timestamp).getFullYear()) : '');
      if(ph!==tahun) return;
      var k=String(t.kode_anggaran||'(tanpa kode)');
      if(!paguMap[k]) paguMap[k]={ kode:k, uraian:String(t.nama_kegiatan||''), pagu:0, realisasi:0 };
      paguMap[k].realisasi += Number(t.jumlah_rupiah)||0;
    });

    var items=Object.keys(paguMap).map(function(k){
      var o=paguMap[k]; o.saldo=o.pagu-o.realisasi;
      o.persen = o.pagu>0 ? Math.round(o.realisasi/o.pagu*1000)/10 : 0;
      return o;
    });
    items.sort(function(a,b){ return b.pagu-a.pagu; });
    var tot={ pagu:0, realisasi:0, saldo:0 };
    items.forEach(function(o){ tot.pagu+=o.pagu; tot.realisasi+=o.realisasi; tot.saldo+=o.saldo; });
    return { ok:true, tahun:tahun, items:items, total:tot };
  }catch(e){ return { ok:false, error:String(e && e.message || e) }; }
}
