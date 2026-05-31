/**
 * ============================================================================
 *  ERP KEUANGAN SEKOLAH RAKYAT  —  FILE TUNGGAL (ALL-IN-ONE)  v2
 * ============================================================================
 *  PEMBAHARUAN v2:
 *   - PEMISAHAN ARUS MASUK & ARUS KELUAR:
 *       • ARUS MASUK  = RKKAL (Rencana Kerja & Anggaran / Pagu)      -> Data_RKKAL
 *       • ARUS KELUAR = Rekap SPJ (Realisasi belanja / kwitansi)      -> Data_Rekap
 *   - Dropdown Kode Akun (Mata Anggaran / MAK) baku pemerintah.
 *   - Kode MAK lengkap pada Rekap (mis. DQ.7936.SBE.101.303.A.522151).
 *   - Input TANGGAL TRANSAKSI pada setiap realisasi/rekap.
 *
 *  Cara pakai (salin-tempel di editor Apps Script):
 *   1. HAPUS semua file Script (.gs) lama di proyek Anda.
 *   2. Buat 1 file Script bernama "Code", tempel SELURUH isi file ini.
 *   3. Buat 1 file HTML bernama "index", tempel isi dari standalone/index.html.
 *   4. Simpan. Jalankan fungsi `selfTest` (tombol Run) untuk menguji.
 *   5. Deploy sebagai Web App (Execute as: Me, Access: Anyone).
 * ============================================================================
 */

/* =========================================================================
 *  WEB ENTRY POINTS
 * ========================================================================= */

function doGet(e) {
  return renderApp();
}

function doPost(e) {
  try {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput('{"status":"error"}')
      .setMimeType(ContentService.MimeType.JSON);
  }
}

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
 *  REFERENSI / KONFIGURASI (untuk dropdown di UI)
 *  Sumber: 01_SRT3 RKKAL 2026 & 03_Rekap SPJ.
 *  Boleh ditambah/ubah sesuai kebutuhan satker Anda.
 * ========================================================================= */

var REF = {
  // Daftar Kode Akun / Mata Anggaran Kegiatan (MAK) 6 digit baku.
  KODE_AKUN: [
    { kode: '521111', nama: 'Belanja Keperluan Perkantoran' },
    { kode: '521112', nama: 'Belanja Pengadaan Bahan Makanan' },
    { kode: '521113', nama: 'Belanja Penambah Daya Tahan Tubuh' },
    { kode: '521211', nama: 'Belanja Bahan' },
    { kode: '521213', nama: 'Belanja Honor Output Kegiatan' },
    { kode: '521219', nama: 'Belanja Barang Non Operasional Lainnya' },
    { kode: '521811', nama: 'Belanja Barang Persediaan Barang Konsumsi' },
    { kode: '522111', nama: 'Belanja Langganan Listrik' },
    { kode: '522112', nama: 'Belanja Langganan Telepon' },
    { kode: '522113', nama: 'Belanja Langganan Air' },
    { kode: '522141', nama: 'Belanja Sewa' },
    { kode: '522151', nama: 'Belanja Jasa Profesi' },
    { kode: '522191', nama: 'Belanja Jasa Lainnya' },
    { kode: '523111', nama: 'Belanja Pemeliharaan Gedung dan Bangunan' },
    { kode: '523121', nama: 'Belanja Pemeliharaan Peralatan dan Mesin' },
    { kode: '524111', nama: 'Belanja Perjalanan Dinas Biasa' },
    { kode: '524113', nama: 'Belanja Perjalanan Dinas Dalam Kota' }
  ],

  // Kode Kegiatan (huruf) pada struktur RKKAL / segmen MAK.
  KEGIATAN: [
    { kode: 'A', nama: 'Kegiatan Belajar Mengajar' },
    { kode: 'B', nama: 'Praktikum Komunitas' },
    { kode: 'C', nama: 'Kegiatan Krida' },
    { kode: 'D', nama: 'Karya Ilmiah dan Latihan Olahraga Seni' },
    { kode: 'E', nama: 'Layanan Perkantoran' },
    { kode: 'F', nama: 'Operasional Perkantoran' },
    { kode: 'G', nama: 'Layanan Kesehatan / UKS' },
    { kode: 'M', nama: 'Perjalanan Dinas' }
  ],

  // Prefix segmen MAK (di depan huruf kegiatan & kode akun).
  // Format MAK lengkap: <PREFIX>.<KEGIATAN>.<KODE_AKUN>
  MAK_PREFIX: [
    { kode: 'DQ.7936.SBE.101.303', nama: 'SR Menengah Pertama (SBE)' },
    { kode: 'DQ.7936.SBB.101.303', nama: 'SR Menengah Atas (SBB)' },
    { kode: 'WA.7937.EBA.994.002', nama: 'Operasional Perkantoran (EBA)' }
  ],

  JENJANG: ['SD', 'SMP', 'SMA/SMK'],

  SATUAN: ['OK', 'OH', 'PKT', 'KEG', 'UNIT', 'ORG', 'BLN', 'LOK', 'PCS', 'KG', 'LITER'],

  BULAN: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],

  TAHUN: [2025, 2026, 2027, 2028]
};

function _akunNama(kode) {
  kode = String(kode || '').trim();
  var list = _loadConfigAkun();
  for (var i = 0; i < list.length; i++) {
    if (list[i].kode === kode) return list[i].nama;
  }
  return '';
}
function _kegiatanNama(kode) {
  kode = String(kode || '').trim().toUpperCase();
  var list = _loadConfigKegiatan();
  for (var i = 0; i < list.length; i++) {
    if (list[i].kode === kode) return list[i].nama;
  }
  return '';
}

/* =========================================================================
 *  DATABASE (Google Sheets)
 * ========================================================================= */

var Database = {
  SPREADSHEET_NAME: 'ERP_Sekolah_Rakyat',
  PROP_KEY: 'ERP_SPREADSHEET_ID',
  SEED_FLAG: 'ERP_SEEDED_V2',
  _ss: null,

  HEADERS: {
    // ARUS MASUK — Rencana Kerja & Anggaran Kegiatan (Pagu)
    Data_RKKAL: [
      'ID_RKKAL', 'Tahun_Anggaran', 'Jenjang', 'Kode_Kegiatan', 'Nama_Kegiatan',
      'Kode_Akun', 'Nama_Akun', 'Uraian', 'Volume', 'Satuan',
      'Harga_Satuan', 'Jumlah_Biaya', 'School_ID', 'Timestamp'
    ],
    // ARUS KELUAR — Rekap SPJ / Realisasi belanja
    Data_Rekap: [
      'ID_Rekap', 'Tanggal_Transaksi', 'Nama_Toko', 'Kode_MAK', 'Kode_Akun',
      'Nama_Akun', 'Kode_Kegiatan', 'Uraian_Pembayaran', 'Tahun_Anggaran',
      'Bulan_Pelaksanaan', 'Jumlah', 'Terbilang', 'Jenjang',
      'Status_Verifikasi', 'Bukti_URL', 'School_ID', 'Timestamp'
    ],
    // Dipertahankan untuk kompatibilitas data lama.
    Data_Transaksi: [
      'ID_Transaksi', 'Kode_Anggaran', 'Nama_Kegiatan', 'Jumlah_Rupiah',
      'Timestamp', 'Status_Verifikasi', 'School_ID', 'Kode_Program',
      'Kode_Komponen', 'Jenis_Belanja', 'Kuantitas', 'Harga_Satuan',
      'Bulan', 'Jenjang', 'Bukti_URL'
    ],
    Data_Sekolah: [
      'School_ID', 'Nama_Sekolah', 'Alamat_Sekolah', 'Kepala_Sekolah',
      'Bendahara', 'Status_Aktif', 'Tanggal_Daftar', 'Plan_Type'
    ],
    System_Logs: ['Log_ID', 'Timestamp', 'Level', 'Module', 'Message', 'Details'],
    Config_Users: ['Email', 'Role', 'Name', 'Status'],
    Config_Akun: ['Kode', 'Nama', 'Aktif'],
    Config_Kegiatan: ['Kode', 'Nama', 'Aktif'],
    Config_Prefix: ['Kode', 'Nama', 'Aktif'],
    Config_Export: ['TemplateName', 'Type', 'Columns', 'HeaderRow'],
    Config_Import: ['TemplateName', 'Type', 'Mapping'],
    Config_UI: ['Key', 'Value']
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
    this._seedConfigSheets(ss);
  },

  _seedConfigSheets: function (ss) {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
    } catch (e) { return; }
    try {
      // Seed Config_Akun from REF.KODE_AKUN if empty
      var sheetAkun = ss.getSheetByName('Config_Akun');
      if (sheetAkun && sheetAkun.getLastRow() <= 1) {
        for (var i = 0; i < REF.KODE_AKUN.length; i++) {
          sheetAkun.appendRow([REF.KODE_AKUN[i].kode, REF.KODE_AKUN[i].nama, 'Y']);
        }
      }
      // Seed Config_Kegiatan from REF.KEGIATAN if empty
      var sheetKeg = ss.getSheetByName('Config_Kegiatan');
      if (sheetKeg && sheetKeg.getLastRow() <= 1) {
        for (var j = 0; j < REF.KEGIATAN.length; j++) {
          sheetKeg.appendRow([REF.KEGIATAN[j].kode, REF.KEGIATAN[j].nama, 'Y']);
        }
      }
      // Seed Config_Prefix from REF.MAK_PREFIX if empty
      var sheetPfx = ss.getSheetByName('Config_Prefix');
      if (sheetPfx && sheetPfx.getLastRow() <= 1) {
        for (var k = 0; k < REF.MAK_PREFIX.length; k++) {
          sheetPfx.appendRow([REF.MAK_PREFIX[k].kode, REF.MAK_PREFIX[k].nama, 'Y']);
        }
      }
      // Seed script owner as Admin in Config_Users if empty
      var sheetUsers = ss.getSheetByName('Config_Users');
      if (sheetUsers && sheetUsers.getLastRow() <= 1) {
        var ownerEmail = _getActiveUserEmail();
        if (ownerEmail) {
          sheetUsers.appendRow([ownerEmail, 'Admin', 'Owner', 'active']);
        }
      }
    } finally {
      lock.releaseLock();
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

  // ===== Generic helpers berbasis kolom ID (kolom pertama) =====
  updateRowById: function (sheetName, id, patch) {
    try {
      var sheet = this.getSheet(sheetName);
      if (!sheet) return false;
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var self = this;
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(id)) {
          for (var j = 0; j < headers.length; j++) {
            var key = self.headerToKey(headers[j]);
            if (patch[key] !== undefined) sheet.getRange(i + 1, j + 1).setValue(patch[key]);
          }
          return true;
        }
      }
      return false;
    } catch (error) {
      Logger.log('updateRowById error: ' + error.message);
      return false;
    }
  },

  deleteRowById: function (sheetName, id) {
    try {
      var sheet = this.getSheet(sheetName);
      if (!sheet) return false;
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(id)) {
          sheet.deleteRow(i + 1);
          return true;
        }
      }
      return false;
    } catch (error) {
      Logger.log('deleteRowById error: ' + error.message);
      return false;
    }
  },

  // ===== Sekolah =====
  ensureDefaultSchool: function () {
    var schools = this.readAll('Data_Sekolah');
    if (schools.length > 0) return schools[0].school_id;
    var schoolId = 'SCH001';
    this.insert('Data_Sekolah', {
      school_id: schoolId, nama_sekolah: 'Sekolah Rakyat Terintegrasi 3 Pasuruan',
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
  }
};

/* =========================================================================
 *  AUTHENTICATION LAYER
 * ========================================================================= */

function _getActiveUserEmail() {
  try {
    var email = Session.getActiveUser().getEmail();
    return email || '';
  } catch (e) {
    return '';
  }
}

function _getUserRole(email) {
  if (!email) return null;
  try {
    var rows = Database.readAll('Config_Users');
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].email).toLowerCase() === String(email).toLowerCase()) {
        return {
          email: rows[i].email,
          role: rows[i].role || 'Viewer',
          name: rows[i].name || '',
          status: rows[i].status || 'active'
        };
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

function _requireAuth(requiredRole) {
  var email = _getActiveUserEmail();
  // Graceful: if Session returns empty (editor/dev mode), treat as admin
  if (!email) {
    return { email: 'dev@localhost', role: 'Admin', name: 'Developer Mode', status: 'active' };
  }
  var user = _getUserRole(email);
  if (!user) {
    // Unknown user - treat as guest with limited access
    return { email: email, role: 'Guest', name: '', status: 'active' };
  }
  if (user.status !== 'active') {
    throw new Error('Akun tidak aktif. Hubungi administrator.');
  }
  if (requiredRole === 'Admin' && user.role !== 'Admin') {
    throw new Error('Akses ditolak. Hanya Admin yang bisa melakukan ini.');
  }
  return user;
}

function _withAuth(requiredRole, fn) {
  try {
    var user = _requireAuth(requiredRole);
    return fn(user);
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

function apiGetCurrentUser() {
  try {
    var email = _getActiveUserEmail();
    if (!email) {
      return { ok: true, email: 'dev@localhost', role: 'Admin', name: 'Developer Mode' };
    }
    var user = _getUserRole(email);
    if (user) {
      return { ok: true, email: user.email, role: user.role, name: user.name };
    }
    return { ok: true, email: email, role: 'Guest', name: '' };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

/* =========================================================================
 *  CONFIG SHEET CACHE (for _akunNama / _kegiatanNama)
 * ========================================================================= */

var _configCache = {
  akun: null,
  kegiatan: null,
  prefix: null
};

function _loadConfigAkun() {
  if (_configCache.akun) return _configCache.akun;
  try {
    var rows = Database.readAll('Config_Akun');
    if (rows && rows.length > 0) {
      _configCache.akun = rows.map(function (r) {
        return { kode: String(r.kode || ''), nama: String(r.nama || ''), aktif: String(r.aktif || 'Y') };
      });
      return _configCache.akun;
    }
  } catch (e) {}
  // Fallback to hardcoded REF
  _configCache.akun = REF.KODE_AKUN.map(function (r) {
    return { kode: r.kode, nama: r.nama, aktif: 'Y' };
  });
  return _configCache.akun;
}

function _loadConfigKegiatan() {
  if (_configCache.kegiatan) return _configCache.kegiatan;
  try {
    var rows = Database.readAll('Config_Kegiatan');
    if (rows && rows.length > 0) {
      _configCache.kegiatan = rows.map(function (r) {
        return { kode: String(r.kode || ''), nama: String(r.nama || ''), aktif: String(r.aktif || 'Y') };
      });
      return _configCache.kegiatan;
    }
  } catch (e) {}
  _configCache.kegiatan = REF.KEGIATAN.map(function (r) {
    return { kode: r.kode, nama: r.nama, aktif: 'Y' };
  });
  return _configCache.kegiatan;
}

function _loadConfigPrefix() {
  if (_configCache.prefix) return _configCache.prefix;
  try {
    var rows = Database.readAll('Config_Prefix');
    if (rows && rows.length > 0) {
      _configCache.prefix = rows.map(function (r) {
        return { kode: String(r.kode || ''), nama: String(r.nama || ''), aktif: String(r.aktif || 'Y') };
      });
      return _configCache.prefix;
    }
  } catch (e) {}
  _configCache.prefix = REF.MAK_PREFIX.map(function (r) {
    return { kode: r.kode, nama: r.nama, aktif: 'Y' };
  });
  return _configCache.prefix;
}

/* =========================================================================
 *  HELPERS
 * ========================================================================= */

function _resolveSchoolId(payload) {
  if (payload && payload.schoolId) return payload.schoolId;
  return Database.ensureDefaultSchool();
}
function _genId(prefix) {
  return (prefix || 'ID') + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}
function _parseRupiah(val) {
  if (typeof val === 'number') return Math.round(val);
  var s = String(val == null ? '' : val), cleaned = '';
  for (var i = 0; i < s.length; i++) { var ch = s.charAt(i); if (ch >= '0' && ch <= '9') cleaned += ch; }
  return parseInt(cleaned, 10) || 0;
}
function _parseNum(val) {
  if (typeof val === 'number') return val;
  var s = String(val == null ? '' : val).split(',').join('.');
  var n = parseFloat(s.replace(/[^0-9.\-]/g, ''));
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
function _normalizeJenjang(val) {
  var s = String(val == null ? '' : val).trim().toUpperCase();
  if (s === 'SD' || s === 'SMP' || s === 'SMA/SMK') return s;
  if (s === 'SMA' || s === 'SMK' || s === 'SMA-SMK') return 'SMA/SMK';
  return '';
}
function _normalizeBulan(val) {
  var s = String(val == null ? '' : val).trim();
  if (!s) return '';
  // Terima nama bulan langsung.
  for (var i = 0; i < REF.BULAN.length; i++) {
    if (REF.BULAN[i].toLowerCase() === s.toLowerCase()) return REF.BULAN[i];
  }
  // Terima format angka 1-12.
  var n = parseInt(s, 10);
  if (n >= 1 && n <= 12) return REF.BULAN[n - 1];
  return s;
}
function _normalizeTanggal(val) {
  if (!val) return '';
  // Simpan sebagai ISO 'YYYY-MM-DD' bila bisa diparse.
  var d = new Date(val);
  if (!isNaN(d.getTime())) {
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var dd = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + dd;
  }
  return String(val);
}
function _bulanFromTanggal(tanggalIso) {
  var d = new Date(tanggalIso);
  if (isNaN(d.getTime())) return '';
  return REF.BULAN[d.getMonth()];
}
function _tahunFromTanggal(tanggalIso) {
  var d = new Date(tanggalIso);
  if (isNaN(d.getTime())) return '';
  return d.getFullYear();
}

// Bangun Kode MAK lengkap dari komponen, atau bersihkan input manual.
function _buildKodeMak(prefix, kegiatan, akun, manual) {
  var m = String(manual || '').trim();
  if (m) return m;
  var p = String(prefix || '').trim().replace(/\.+$/, '');
  var k = String(kegiatan || '').trim().toUpperCase();
  var a = String(akun || '').trim();
  var parts = [];
  if (p) parts.push(p);
  if (k) parts.push(k);
  if (a) parts.push(a);
  return parts.join('.');
}

// Terbilang (server-side) untuk kolom Terbilang pada Rekap.
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
  if (n === 0) return 'nol rupiah';
  var s = w(n);
  while (s.indexOf('  ') >= 0) s = s.split('  ').join(' ');
  s = s.trim();
  return s.charAt(0).toUpperCase() + s.slice(1) + ' rupiah';
}

/* =========================================================================
 *  API UMUM (dipanggil dari UI via google.script.run)
 * ========================================================================= */

function apiGetRefs() {
  var akun = _loadConfigAkun().filter(function (r) { return r.aktif === 'Y'; });
  var kegiatan = _loadConfigKegiatan().filter(function (r) { return r.aktif === 'Y'; });
  var prefix = _loadConfigPrefix().filter(function (r) { return r.aktif === 'Y'; });
  var refs = {
    KODE_AKUN: akun.map(function (r) { return { kode: r.kode, nama: r.nama }; }),
    KEGIATAN: kegiatan.map(function (r) { return { kode: r.kode, nama: r.nama }; }),
    MAK_PREFIX: prefix.map(function (r) { return { kode: r.kode, nama: r.nama }; }),
    JENJANG: REF.JENJANG,
    SATUAN: REF.SATUAN,
    BULAN: REF.BULAN,
    TAHUN: REF.TAHUN
  };
  return { ok: true, refs: refs };
}

function apiBootstrap() {
  try {
    Database.init();
    var schoolId = Database.ensureDefaultSchool();
    seedDemoIfEmpty(schoolId);
    var schools = Database.readAll('Data_Sekolah').map(function (s) {
      return { schoolId: s.school_id, nama: s.nama_sekolah };
    });
    var akun = _loadConfigAkun().filter(function (r) { return r.aktif === 'Y'; });
    var kegiatan = _loadConfigKegiatan().filter(function (r) { return r.aktif === 'Y'; });
    var prefix = _loadConfigPrefix().filter(function (r) { return r.aktif === 'Y'; });
    var refs = {
      KODE_AKUN: akun.map(function (r) { return { kode: r.kode, nama: r.nama }; }),
      KEGIATAN: kegiatan.map(function (r) { return { kode: r.kode, nama: r.nama }; }),
      MAK_PREFIX: prefix.map(function (r) { return { kode: r.kode, nama: r.nama }; }),
      JENJANG: REF.JENJANG,
      SATUAN: REF.SATUAN,
      BULAN: REF.BULAN,
      TAHUN: REF.TAHUN
    };
    var uiConfig = _readUIConfig();
    return {
      ok: true, schoolId: schoolId, schools: schools,
      refs: refs,
      uiConfig: uiConfig,
      summary: _buildSummary(schoolId),
      spreadsheetUrl: Database.getSpreadsheetUrl(),
      serverTime: new Date().toISOString()
    };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

/* =========================================================================
 *  RKKAL — ARUS MASUK (Anggaran / Pagu)
 * ========================================================================= */

function apiSaveRKKAL(payload) {
  try {
    payload = payload || {};
    var schoolId = _resolveSchoolId(payload);
    var tahun = payload.tahun || (new Date().getFullYear());
    var jenjang = _normalizeJenjang(payload.jenjang);
    var rows = payload.rows || [];
    var saved = 0, skipped = 0, failed = 0;

    rows.forEach(function (r) {
      var akun = String(r.kodeAkun || '').trim();
      var keg = String(r.kodeKegiatan || '').trim().toUpperCase();
      var uraian = String(r.uraian || '').trim();
      var volume = _parseNum(r.volume);
      var harga = _parseRupiah(r.hargaSatuan);
      var jumlah = _parseRupiah(r.jumlahBiaya);
      if (jumlah <= 0 && volume > 0 && harga > 0) jumlah = Math.round(volume * harga);

      // Baris benar-benar kosong -> abaikan.
      if (!akun && !uraian && jumlah <= 0) return;
      // Tidak lengkap.
      if (!akun || !uraian || jumlah <= 0) { skipped++; return; }

      var ok = Database.insert('Data_RKKAL', {
        id_rkkal: _genId('RKK'),
        tahun_anggaran: tahun,
        jenjang: jenjang,
        kode_kegiatan: keg,
        nama_kegiatan: r.namaKegiatan ? String(r.namaKegiatan).trim() : _kegiatanNama(keg),
        kode_akun: akun,
        nama_akun: _akunNama(akun) || (r.namaAkun ? String(r.namaAkun).trim() : ''),
        uraian: uraian,
        volume: volume,
        satuan: String(r.satuan || '').trim(),
        harga_satuan: harga,
        jumlah_biaya: jumlah,
        school_id: schoolId,
        timestamp: new Date().toISOString()
      });
      if (ok) saved++; else failed++;
    });

    if (failed > 0 && saved === 0) {
      return { ok: false, error: 'Gagal menulis ke Spreadsheet (' + failed + ' baris). Cek otorisasi.' };
    }
    return { ok: true, saved: saved, skipped: skipped, failed: failed };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiGetRKKAL(payload) {
  try {
    payload = payload || {};
    var schoolId = _resolveSchoolId(payload);
    var tahun = payload.tahun ? String(payload.tahun) : '*';
    var jenjang = _normalizeJenjang(payload.jenjang);
    var rows = Database.readAll('Data_RKKAL').filter(function (r) {
      if (schoolId && r.school_id && r.school_id !== schoolId) return false;
      if (tahun !== '*' && String(r.tahun_anggaran) !== tahun) return false;
      if (jenjang && String(r.jenjang || '') !== jenjang) return false;
      return true;
    }).map(function (r) {
      return {
        id: r.id_rkkal,
        tahun: r.tahun_anggaran,
        jenjang: r.jenjang,
        kodeKegiatan: r.kode_kegiatan,
        namaKegiatan: r.nama_kegiatan,
        kodeAkun: r.kode_akun,
        namaAkun: r.nama_akun,
        uraian: r.uraian,
        volume: Number(r.volume) || 0,
        satuan: r.satuan,
        hargaSatuan: Number(r.harga_satuan) || 0,
        jumlahBiaya: Number(r.jumlah_biaya) || 0
      };
    });
    rows.reverse();
    var total = 0;
    rows.forEach(function (r) { total += r.jumlahBiaya; });
    return { ok: true, rows: rows, total: total };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiUpdateRKKAL(payload) {
  try {
    payload = payload || {};
    if (!payload.id) return { ok: false, error: 'ID RKKAL wajib diisi.' };
    var patch = {};
    if (payload.tahun !== undefined) patch.tahun_anggaran = payload.tahun;
    if (payload.jenjang !== undefined) patch.jenjang = _normalizeJenjang(payload.jenjang);
    if (payload.kodeKegiatan !== undefined) {
      patch.kode_kegiatan = String(payload.kodeKegiatan).trim().toUpperCase();
      patch.nama_kegiatan = _kegiatanNama(patch.kode_kegiatan) || (payload.namaKegiatan || '');
    }
    if (payload.kodeAkun !== undefined) {
      patch.kode_akun = String(payload.kodeAkun).trim();
      patch.nama_akun = _akunNama(patch.kode_akun) || (payload.namaAkun || '');
    }
    if (payload.uraian !== undefined) patch.uraian = String(payload.uraian).trim();
    if (payload.volume !== undefined) patch.volume = _parseNum(payload.volume);
    if (payload.satuan !== undefined) patch.satuan = String(payload.satuan).trim();
    if (payload.hargaSatuan !== undefined) patch.harga_satuan = _parseRupiah(payload.hargaSatuan);
    if (payload.jumlahBiaya !== undefined) patch.jumlah_biaya = _parseRupiah(payload.jumlahBiaya);
    var ok = Database.updateRowById('Data_RKKAL', payload.id, patch);
    return ok ? { ok: true } : { ok: false, error: 'Data RKKAL tidak ditemukan.' };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiDeleteRKKAL(payload) {
  try {
    payload = payload || {};
    if (!payload.id) return { ok: false, error: 'ID RKKAL wajib diisi.' };
    var ok = Database.deleteRowById('Data_RKKAL', payload.id);
    return ok ? { ok: true } : { ok: false, error: 'Data RKKAL tidak ditemukan.' };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

/* =========================================================================
 *  REKAP SPJ — ARUS KELUAR (Realisasi belanja)
 * ========================================================================= */

function _rekapRowFromPayload(r, schoolId) {
  var tanggal = _normalizeTanggal(r.tanggal);
  var jumlah = _parseRupiah(r.jumlah);
  var akun = String(r.kodeAkun || '').trim();
  var keg = String(r.kodeKegiatan || '').trim().toUpperCase();
  var kodeMak = _buildKodeMak(r.makPrefix, keg, akun, r.kodeMak);
  var bulan = _normalizeBulan(r.bulan) || _bulanFromTanggal(tanggal);
  var tahun = r.tahun || _tahunFromTanggal(tanggal) || (new Date().getFullYear());
  return {
    id_rekap: _genId('RKP'),
    tanggal_transaksi: tanggal,
    nama_toko: String(r.namaToko || '').trim(),
    kode_mak: kodeMak,
    kode_akun: akun,
    nama_akun: _akunNama(akun) || (r.namaAkun ? String(r.namaAkun).trim() : ''),
    kode_kegiatan: keg,
    uraian_pembayaran: String(r.uraian || '').trim(),
    tahun_anggaran: tahun,
    bulan_pelaksanaan: bulan,
    jumlah: jumlah,
    terbilang: _terbilang(jumlah),
    jenjang: _normalizeJenjang(r.jenjang),
    status_verifikasi: 'pending',
    bukti_url: '',
    school_id: schoolId,
    timestamp: new Date().toISOString()
  };
}

function apiSaveRekap(payload) {
  try {
    payload = payload || {};
    var schoolId = _resolveSchoolId(payload);
    var rows = payload.rows || [];
    var saved = 0, skipped = 0, failed = 0;

    rows.forEach(function (r) {
      var jumlah = _parseRupiah(r.jumlah);
      var toko = String(r.namaToko || '').trim();
      var uraian = String(r.uraian || '').trim();
      var akun = String(r.kodeAkun || '').trim();

      if (!toko && !uraian && !akun && jumlah <= 0) return; // kosong
      if (!toko || !akun || jumlah <= 0) { skipped++; return; } // tidak lengkap

      var row = _rekapRowFromPayload(r, schoolId);
      var ok = Database.insert('Data_Rekap', row);
      if (ok) saved++; else failed++;
    });

    if (failed > 0 && saved === 0) {
      return { ok: false, error: 'Gagal menulis ke Spreadsheet (' + failed + ' baris). Cek otorisasi.' };
    }
    return { ok: true, saved: saved, skipped: skipped, failed: failed };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiGetRekap(payload) {
  try {
    payload = payload || {};
    var schoolId = _resolveSchoolId(payload);
    var tahun = payload.tahun ? String(payload.tahun) : '*';
    var bulan = payload.bulan ? String(payload.bulan) : '*';
    var jenjang = _normalizeJenjang(payload.jenjang);

    var rows = Database.readAll('Data_Rekap').filter(function (r) {
      if (schoolId && r.school_id && r.school_id !== schoolId) return false;
      if (tahun !== '*' && String(r.tahun_anggaran) !== tahun) return false;
      if (bulan !== '*' && String(r.bulan_pelaksanaan) !== bulan) return false;
      if (jenjang && String(r.jenjang || '') !== jenjang) return false;
      return true;
    }).map(function (r) {
      return {
        id: r.id_rekap,
        tanggal: r.tanggal_transaksi,
        namaToko: r.nama_toko,
        kodeMak: r.kode_mak,
        kodeAkun: r.kode_akun,
        namaAkun: r.nama_akun,
        kodeKegiatan: r.kode_kegiatan,
        uraian: r.uraian_pembayaran,
        tahun: r.tahun_anggaran,
        bulan: r.bulan_pelaksanaan,
        jumlah: Number(r.jumlah) || 0,
        terbilang: r.terbilang,
        jenjang: r.jenjang,
        status: String(r.status_verifikasi || 'pending'),
        buktiUrl: r.bukti_url ? String(r.bukti_url) : ''
      };
    });
    // Urutkan terbaru di atas (berdasar tanggal lalu timestamp).
    rows.reverse();
    var total = 0;
    rows.forEach(function (r) { total += r.jumlah; });
    return { ok: true, rows: rows, total: total };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiUpdateRekap(payload) {
  try {
    payload = payload || {};
    if (!payload.id) return { ok: false, error: 'ID rekap wajib diisi.' };
    var patch = {};
    if (payload.tanggal !== undefined) patch.tanggal_transaksi = _normalizeTanggal(payload.tanggal);
    if (payload.namaToko !== undefined) patch.nama_toko = String(payload.namaToko).trim();
    if (payload.kodeAkun !== undefined) {
      patch.kode_akun = String(payload.kodeAkun).trim();
      patch.nama_akun = _akunNama(patch.kode_akun) || (payload.namaAkun || '');
    }
    if (payload.kodeKegiatan !== undefined) patch.kode_kegiatan = String(payload.kodeKegiatan).trim().toUpperCase();
    if (payload.kodeMak !== undefined || payload.makPrefix !== undefined) {
      patch.kode_mak = _buildKodeMak(payload.makPrefix,
        patch.kode_kegiatan !== undefined ? patch.kode_kegiatan : payload.kodeKegiatan,
        patch.kode_akun !== undefined ? patch.kode_akun : payload.kodeAkun,
        payload.kodeMak);
    }
    if (payload.uraian !== undefined) patch.uraian_pembayaran = String(payload.uraian).trim();
    if (payload.tahun !== undefined) patch.tahun_anggaran = payload.tahun;
    if (payload.bulan !== undefined) patch.bulan_pelaksanaan = _normalizeBulan(payload.bulan);
    if (payload.jenjang !== undefined) patch.jenjang = _normalizeJenjang(payload.jenjang);
    if (payload.jumlah !== undefined) {
      patch.jumlah = _parseRupiah(payload.jumlah);
      patch.terbilang = _terbilang(patch.jumlah);
    }
    var ok = Database.updateRowById('Data_Rekap', payload.id, patch);
    return ok ? { ok: true } : { ok: false, error: 'Data rekap tidak ditemukan.' };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiDeleteRekap(payload) {
  try {
    payload = payload || {};
    if (!payload.id) return { ok: false, error: 'ID rekap wajib diisi.' };
    var ok = Database.deleteRowById('Data_Rekap', payload.id);
    return ok ? { ok: true } : { ok: false, error: 'Data rekap tidak ditemukan.' };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiVerifyRekap(payload) {
  try {
    payload = payload || {};
    if (!payload.id) return { ok: false, error: 'ID rekap wajib diisi.' };
    var status = payload.action === 'reject' ? 'rejected' : 'verified';
    var ok = Database.updateRowById('Data_Rekap', payload.id, { status_verifikasi: status });
    return ok ? { ok: true, status: status } : { ok: false, error: 'Data rekap tidak ditemukan.' };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiUploadBuktiRekap(payload) {
  try {
    payload = payload || {};
    if (!payload.id) return { ok: false, error: 'ID rekap wajib diisi.' };
    if (!payload.dataBase64) return { ok: false, error: 'File kosong / gagal dibaca.' };
    var bytes = Utilities.base64Decode(payload.dataBase64);
    var blob = Utilities.newBlob(bytes, payload.mimeType || 'application/octet-stream', payload.filename || ('bukti-' + payload.id));
    var file = _buktiFolder().createFile(blob);
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
    var url = file.getUrl();
    Database.updateRowById('Data_Rekap', payload.id, { bukti_url: url });
    return { ok: true, url: url };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

/* =========================================================================
 *  DASHBOARD — PAGU (RKKAL) vs REALISASI (Rekap) vs SISA
 * ========================================================================= */

function _buildSummary(schoolId) {
  var rkkal = Database.readAll('Data_RKKAL').filter(function (r) {
    return !schoolId || !r.school_id || r.school_id === schoolId;
  });
  var rekap = Database.readAll('Data_Rekap').filter(function (r) {
    return !schoolId || !r.school_id || r.school_id === schoolId;
  });

  var pagu = 0;
  rkkal.forEach(function (r) { pagu += Number(r.jumlah_biaya) || 0; });

  var realisasi = 0, verif = 0, pending = 0, ditolak = 0;
  rekap.forEach(function (r) {
    var j = Number(r.jumlah) || 0;
    realisasi += j;
    var st = String(r.status_verifikasi || '').toLowerCase();
    if (st.indexOf('verif') > -1 || st.indexOf('approve') > -1) verif++;
    else if (st.indexOf('reject') > -1 || st.indexOf('tolak') > -1) ditolak++;
    else pending++;
  });

  return {
    pagu: pagu,
    realisasi: realisasi,
    sisa: pagu - realisasi,
    serapan: pagu > 0 ? Math.round((realisasi / pagu) * 1000) / 10 : 0,
    jumlahRKKAL: rkkal.length,
    jumlahRekap: rekap.length,
    verif: verif, pending: pending, ditolak: ditolak
  };
}

function apiGetDashboard(payload) {
  try {
    var schoolId = _resolveSchoolId(payload);
    return { ok: true, schoolId: schoolId, summary: _buildSummary(schoolId) };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

// Bandingkan Pagu vs Realisasi dikelompokkan per Kode Akun (atau per Kegiatan).
function apiGetRealisasi(payload) {
  try {
    payload = payload || {};
    var schoolId = _resolveSchoolId(payload);
    var tahun = payload.tahun ? String(payload.tahun) : '*';
    var jenjang = _normalizeJenjang(payload.jenjang);
    var groupBy = payload.groupBy === 'kegiatan' ? 'kegiatan' : 'akun';

    var map = {};
    function bucket(key, nama) {
      if (!map[key]) map[key] = { kode: key, nama: nama || '', pagu: 0, realisasi: 0 };
      return map[key];
    }

    Database.readAll('Data_RKKAL').forEach(function (r) {
      if (schoolId && r.school_id && r.school_id !== schoolId) return;
      if (tahun !== '*' && String(r.tahun_anggaran) !== tahun) return;
      if (jenjang && String(r.jenjang || '') !== jenjang) return;
      var key = groupBy === 'kegiatan' ? String(r.kode_kegiatan || '(?)') : String(r.kode_akun || '(?)');
      var nama = groupBy === 'kegiatan' ? r.nama_kegiatan : r.nama_akun;
      bucket(key, nama).pagu += Number(r.jumlah_biaya) || 0;
    });

    Database.readAll('Data_Rekap').forEach(function (r) {
      if (schoolId && r.school_id && r.school_id !== schoolId) return;
      if (tahun !== '*' && String(r.tahun_anggaran) !== tahun) return;
      if (jenjang && String(r.jenjang || '') !== jenjang) return;
      var key = groupBy === 'kegiatan' ? String(r.kode_kegiatan || '(?)') : String(r.kode_akun || '(?)');
      var nama = groupBy === 'kegiatan' ? r.nama_kegiatan : r.nama_akun;
      bucket(key, nama).realisasi += Number(r.jumlah) || 0;
    });

    var items = Object.keys(map).map(function (k) {
      var it = map[k];
      it.sisa = it.pagu - it.realisasi;
      it.serapan = it.pagu > 0 ? Math.round((it.realisasi / it.pagu) * 1000) / 10 : 0;
      return it;
    });
    items.sort(function (a, b) { return String(a.kode).localeCompare(String(b.kode)); });

    var totPagu = 0, totReal = 0;
    items.forEach(function (it) { totPagu += it.pagu; totReal += it.realisasi; });

    return {
      ok: true, groupBy: groupBy, items: items,
      totalPagu: totPagu, totalRealisasi: totReal, totalSisa: totPagu - totReal
    };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

/* =========================================================================
 *  BUKTI / KWITANSI — folder Google Drive
 * ========================================================================= */

function _buktiFolder() {
  var name = 'Bukti ERP Sekolah Rakyat';
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

/* =========================================================================
 *  EXPORT LAPORAN REKAP SPJ (CSV, sesuai format 03_Rekap SPJ)
 * ========================================================================= */

function apiExportRekap(payload) {
  try {
    payload = payload || {};
    var schoolId = _resolveSchoolId(payload);
    var tahun = payload.tahun ? String(payload.tahun) : '*';
    var bulan = payload.bulan ? String(payload.bulan) : '*';
    var jenjang = _normalizeJenjang(payload.jenjang);
    var templateName = payload.templateName || '';

    var school = null;
    var schools = Database.readAll('Data_Sekolah');
    for (var i = 0; i < schools.length; i++) {
      if (schools[i].school_id === schoolId) { school = schools[i]; break; }
    }

    var rows = Database.readAll('Data_Rekap').filter(function (r) {
      if (schoolId && r.school_id && r.school_id !== schoolId) return false;
      if (tahun !== '*' && String(r.tahun_anggaran) !== tahun) return false;
      if (bulan !== '*' && String(r.bulan_pelaksanaan) !== bulan) return false;
      if (jenjang && String(r.jenjang || '') !== jenjang) return false;
      return true;
    });

    function q(s) { return '"' + String(s == null ? '' : s).split('"').join('""') + '"'; }

    // Check for custom export template
    var tpl = null;
    if (templateName) {
      var tplRows = Database.readAll('Config_Export');
      for (var t = 0; t < tplRows.length; t++) {
        if (String(tplRows[t].templatename || '').trim() === templateName) {
          tpl = tplRows[t]; break;
        }
      }
    }

    var out = [];
    if (tpl && tpl.headerrow) {
      out.push(tpl.headerrow);
    } else {
      out.push(q('REKAP SPJ - ' + (school ? school.nama_sekolah : 'Sekolah')));
      out.push(q('Kepala Sekolah: ' + (school ? school.kepala_sekolah : '-') +
        ' | Bendahara: ' + (school ? school.bendahara : '-')));
      out.push(q('Tahun: ' + (tahun === '*' ? 'Semua' : tahun) +
        ' | Bulan: ' + (bulan === '*' ? 'Semua' : bulan) +
        ' | Jenjang: ' + (jenjang || 'Semua')));
      out.push('');
      out.push(['NO', 'TANGGAL', 'NAMA TOKO', 'URAIAN MAK (Akun belanja)', 'URAIAN PEMBAYARAN',
        'TAHUN ANGGARAN', 'BULAN PELAKSANAAN', 'JENJANG', 'JUMLAH', 'TERBILANG', 'STATUS', 'BUKTI'].map(q).join(','));
    }

    var total = 0;
    rows.forEach(function (r, idx) {
      var jml = Number(r.jumlah) || 0;
      total += jml;
      out.push([
        q(idx + 1), q(r.tanggal_transaksi), q(r.nama_toko), q(r.kode_mak),
        q(r.uraian_pembayaran), q(r.tahun_anggaran), q(r.bulan_pelaksanaan),
        q(r.jenjang || ''), q(jml), q(r.terbilang), q(r.status_verifikasi || 'pending'),
        q(r.bukti_url || '')
      ].join(','));
    });
    out.push(['', '', '', '', q('TOTAL'), '', '', '', q(total), q(_terbilang(total)), '', ''].join(','));

    return {
      ok: true,
      filename: 'Rekap_SPJ_' + (tahun === '*' ? 'semua' : tahun) + '_' + (bulan === '*' ? 'semua' : bulan) + '.csv',
      content: out.join('\r\n'),
      jumlahBaris: rows.length
    };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

// Export RKKAL (anggaran/pagu) ke CSV.
function apiExportRKKAL(payload) {
  try {
    payload = payload || {};
    var schoolId = _resolveSchoolId(payload);
    var tahun = payload.tahun ? String(payload.tahun) : '*';
    var jenjang = _normalizeJenjang(payload.jenjang);
    var templateName = payload.templateName || '';

    var rows = Database.readAll('Data_RKKAL').filter(function (r) {
      if (schoolId && r.school_id && r.school_id !== schoolId) return false;
      if (tahun !== '*' && String(r.tahun_anggaran) !== tahun) return false;
      if (jenjang && String(r.jenjang || '') !== jenjang) return false;
      return true;
    });

    function q(s) { return '"' + String(s == null ? '' : s).split('"').join('""') + '"'; }

    // Check for custom export template
    var tpl = null;
    if (templateName) {
      var tplRows = Database.readAll('Config_Export');
      for (var t = 0; t < tplRows.length; t++) {
        if (String(tplRows[t].templatename || '').trim() === templateName) {
          tpl = tplRows[t]; break;
        }
      }
    }

    var out = [];
    if (tpl && tpl.headerrow) {
      out.push(tpl.headerrow);
    } else {
      out.push(['KODE_KEGIATAN', 'NAMA_KEGIATAN', 'KODE_AKUN', 'NAMA_AKUN', 'URAIAN',
        'VOLUME', 'SATUAN', 'HARGA_SATUAN', 'JUMLAH_BIAYA', 'TAHUN', 'JENJANG'].map(q).join(','));
    }

    var total = 0;
    rows.forEach(function (r) {
      total += Number(r.jumlah_biaya) || 0;
      out.push([
        q(r.kode_kegiatan), q(r.nama_kegiatan), q(r.kode_akun), q(r.nama_akun),
        q(r.uraian), q(r.volume), q(r.satuan), q(r.harga_satuan),
        q(r.jumlah_biaya), q(r.tahun_anggaran), q(r.jenjang || '')
      ].join(','));
    });
    out.push(['', '', '', '', q('TOTAL PAGU'), '', '', '', q(total), '', ''].join(','));

    return {
      ok: true,
      filename: 'RKKAL_' + (tahun === '*' ? 'semua' : tahun) + '.csv',
      content: out.join('\r\n'),
      jumlahBaris: rows.length
    };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

/* =========================================================================
 *  UPLOAD CSV (RKKAL & Rekap) — opsional
 * ========================================================================= */

function apiUploadRKKALCsv(payload) {
  try {
    payload = payload || {};
    var schoolId = _resolveSchoolId(payload);
    var tahun = payload.tahun || (new Date().getFullYear());
    var jenjang = _normalizeJenjang(payload.jenjang);
    var templateName = payload.templateName || '';
    var csv = String(payload.csv || '').trim();
    if (!csv) return { ok: false, error: 'Data CSV kosong.' };
    var lines = csv.split('\r\n').join('\n').split('\r').join('\n').split('\n');
    var processed = 0, errors = 0, startIndex = 0;
    var first = _splitCsvLine(lines[0]).join(' ').toLowerCase();
    if (first.indexOf('kode') !== -1 || first.indexOf('akun') !== -1 || first.indexOf('uraian') !== -1) startIndex = 1;

    // Load import template mapping if provided
    var mapping = null;
    if (templateName) {
      var tplRows = Database.readAll('Config_Import');
      for (var t = 0; t < tplRows.length; t++) {
        if (String(tplRows[t].templatename || '').trim() === templateName) {
          try { mapping = JSON.parse(tplRows[t].mapping || '{}'); } catch (e) {}
          break;
        }
      }
    }

    // Kolom: Kode_Kegiatan, Kode_Akun, Uraian, Volume, Satuan, Harga_Satuan, [Jumlah_Biaya]
    for (var i = startIndex; i < lines.length; i++) {
      if (!lines[i] || !lines[i].trim()) continue;
      var c = _splitCsvLine(lines[i]);

      // Apply mapping if available (reorder columns based on mapping)
      if (mapping) {
        if (mapping.columns && Array.isArray(mapping.columns)) {
          var mapped = [];
          for (var mc = 0; mc < mapping.columns.length; mc++) {
            var colIdx = mapping.columns[mc];
            mapped.push(c[colIdx] !== undefined ? c[colIdx] : '');
          }
          c = mapped;
        } else if (typeof mapping === 'object' && !Array.isArray(mapping) && !mapping.columns) {
          // Object format: keys are CSV column indices, values are system field names
          var rkkalFields = ['kodeKegiatan','kodeAkun','uraian','volume','satuan','hargaSatuan','jumlahBiaya'];
          var remapped = [];
          for (var rf = 0; rf < rkkalFields.length; rf++) { remapped.push(''); }
          var keys = Object.keys(mapping);
          for (var mk = 0; mk < keys.length; mk++) {
            var csvIdx = parseInt(keys[mk], 10);
            var fieldName = String(mapping[keys[mk]]);
            var targetIdx = rkkalFields.indexOf(fieldName);
            if (targetIdx !== -1 && c[csvIdx] !== undefined) {
              remapped[targetIdx] = c[csvIdx];
            }
          }
          c = remapped;
        }
      }

      var keg = (c[0] || '').trim().toUpperCase();
      var akun = (c[1] || '').trim();
      var uraian = (c[2] || '').trim();
      var volume = _parseNum(c[3]);
      var satuan = (c[4] || '').trim();
      var harga = _parseRupiah(c[5]);
      var jumlah = _parseRupiah(c[6]);
      if (jumlah <= 0 && volume > 0 && harga > 0) jumlah = Math.round(volume * harga);
      if (!akun || !uraian || jumlah <= 0) { errors++; continue; }
      Database.insert('Data_RKKAL', {
        id_rkkal: _genId('RKK'), tahun_anggaran: tahun, jenjang: jenjang,
        kode_kegiatan: keg, nama_kegiatan: _kegiatanNama(keg), kode_akun: akun,
        nama_akun: _akunNama(akun), uraian: uraian, volume: volume, satuan: satuan,
        harga_satuan: harga, jumlah_biaya: jumlah, school_id: schoolId,
        timestamp: new Date().toISOString()
      });
      processed++;
    }
    return { ok: true, processed: processed, errors: errors };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiUploadRekapCsv(payload) {
  try {
    payload = payload || {};
    var schoolId = _resolveSchoolId(payload);
    var templateName = payload.templateName || '';
    var csv = String(payload.csv || '').trim();
    if (!csv) return { ok: false, error: 'Data CSV kosong.' };
    var lines = csv.split('\r\n').join('\n').split('\r').join('\n').split('\n');
    var processed = 0, errors = 0, startIndex = 0;
    var first = _splitCsvLine(lines[0]).join(' ').toLowerCase();
    if (first.indexOf('toko') !== -1 || first.indexOf('mak') !== -1 || first.indexOf('uraian') !== -1) startIndex = 1;

    // Load import template mapping if provided
    var mapping = null;
    if (templateName) {
      var tplRows = Database.readAll('Config_Import');
      for (var t = 0; t < tplRows.length; t++) {
        if (String(tplRows[t].templatename || '').trim() === templateName) {
          try { mapping = JSON.parse(tplRows[t].mapping || '{}'); } catch (e) {}
          break;
        }
      }
    }

    // Kolom: Tanggal, Nama_Toko, Kode_MAK, Uraian_Pembayaran, Tahun, Bulan, Jumlah, [Jenjang]
    for (var i = startIndex; i < lines.length; i++) {
      if (!lines[i] || !lines[i].trim()) continue;
      var c = _splitCsvLine(lines[i]);

      // Apply mapping if available
      if (mapping) {
        if (mapping.columns && Array.isArray(mapping.columns)) {
          var mapped = [];
          for (var mc = 0; mc < mapping.columns.length; mc++) {
            var colIdx = mapping.columns[mc];
            mapped.push(c[colIdx] !== undefined ? c[colIdx] : '');
          }
          c = mapped;
        } else if (typeof mapping === 'object' && !Array.isArray(mapping) && !mapping.columns) {
          // Object format: keys are CSV column indices, values are system field names
          var rekapFields = ['tanggal','namaToko','kodeMak','uraian','tahun','bulan','jumlah','jenjang'];
          var remapped = [];
          for (var rf = 0; rf < rekapFields.length; rf++) { remapped.push(''); }
          var keys = Object.keys(mapping);
          for (var mk = 0; mk < keys.length; mk++) {
            var csvIdx = parseInt(keys[mk], 10);
            var fieldName = String(mapping[keys[mk]]);
            var targetIdx = rekapFields.indexOf(fieldName);
            if (targetIdx !== -1 && c[csvIdx] !== undefined) {
              remapped[targetIdx] = c[csvIdx];
            }
          }
          c = remapped;
        }
      }

      var tanggal = _normalizeTanggal(c[0]);
      var toko = (c[1] || '').trim();
      var kodeMak = (c[2] || '').trim();
      var uraian = (c[3] || '').trim();
      var tahun = (c[4] || '').trim() || _tahunFromTanggal(tanggal);
      var bulan = _normalizeBulan(c[5]) || _bulanFromTanggal(tanggal);
      var jumlah = _parseRupiah(c[6]);
      var jenjang = _normalizeJenjang(c[7]);
      if (!toko || jumlah <= 0) { errors++; continue; }
      // Ekstrak kode akun (6 digit terakhir) & huruf kegiatan dari Kode MAK.
      var segs = kodeMak.split('.');
      var akun = '', keg = '';
      if (segs.length >= 2) { akun = segs[segs.length - 1].trim(); keg = segs[segs.length - 2].trim().toUpperCase(); }
      Database.insert('Data_Rekap', {
        id_rekap: _genId('RKP'), tanggal_transaksi: tanggal, nama_toko: toko,
        kode_mak: kodeMak, kode_akun: akun, nama_akun: _akunNama(akun),
        kode_kegiatan: keg, uraian_pembayaran: uraian, tahun_anggaran: tahun,
        bulan_pelaksanaan: bulan, jumlah: jumlah, terbilang: _terbilang(jumlah),
        jenjang: jenjang, status_verifikasi: 'pending', bukti_url: '',
        school_id: schoolId, timestamp: new Date().toISOString()
      });
      processed++;
    }
    return { ok: true, processed: processed, errors: errors };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

/* =========================================================================
 *  PROFIL SEKOLAH
 * ========================================================================= */

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
      rkkalRows: Database.countRows('Data_RKKAL'),
      rekapRows: Database.countRows('Data_Rekap'),
      sekolahRows: Database.countRows('Data_Sekolah'),
      serverTime: new Date().toISOString()
    };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

/* =========================================================================
 *  USER MANAGEMENT APIs (Admin only)
 * ========================================================================= */

function apiGetUsers() {
  return _withAuth('Admin', function () {
    var rows = Database.readAll('Config_Users');
    var users = rows.map(function (r) {
      return { email: r.email, role: r.role, name: r.name, status: r.status };
    });
    return { ok: true, users: users };
  });
}

function apiAddUser(payload) {
  return _withAuth('Admin', function () {
    payload = payload || {};
    if (!payload.email) return { ok: false, error: 'Email wajib diisi.' };
    var sheet = Database.getSheet('Config_Users');
    if (!sheet) return { ok: false, error: 'Sheet Config_Users tidak ditemukan.' };
    // Check if user already exists
    var existing = Database.readAll('Config_Users');
    for (var i = 0; i < existing.length; i++) {
      if (String(existing[i].email).toLowerCase() === String(payload.email).toLowerCase()) {
        return { ok: false, error: 'User sudah terdaftar.' };
      }
    }
    sheet.appendRow([
      String(payload.email).trim(),
      String(payload.role || 'Tendik').trim(),
      String(payload.name || '').trim(),
      'active'
    ]);
    return { ok: true };
  });
}

function apiUpdateUser(payload) {
  return _withAuth('Admin', function () {
    payload = payload || {};
    if (!payload.email) return { ok: false, error: 'Email wajib diisi.' };
    var sheet = Database.getSheet('Config_Users');
    if (!sheet) return { ok: false, error: 'Sheet Config_Users tidak ditemukan.' };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var emailCol = headers.indexOf('Email');
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][emailCol]).toLowerCase() === String(payload.email).toLowerCase()) {
        var roleCol = headers.indexOf('Role');
        var nameCol = headers.indexOf('Name');
        var statusCol = headers.indexOf('Status');
        if (payload.role !== undefined && roleCol !== -1) sheet.getRange(i + 1, roleCol + 1).setValue(payload.role);
        if (payload.name !== undefined && nameCol !== -1) sheet.getRange(i + 1, nameCol + 1).setValue(payload.name);
        if (payload.status !== undefined && statusCol !== -1) sheet.getRange(i + 1, statusCol + 1).setValue(payload.status);
        return { ok: true };
      }
    }
    return { ok: false, error: 'User tidak ditemukan.' };
  });
}

function apiDeleteUser(payload) {
  return _withAuth('Admin', function () {
    payload = payload || {};
    if (!payload.email) return { ok: false, error: 'Email wajib diisi.' };
    var sheet = Database.getSheet('Config_Users');
    if (!sheet) return { ok: false, error: 'Sheet Config_Users tidak ditemukan.' };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var emailCol = headers.indexOf('Email');
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][emailCol]).toLowerCase() === String(payload.email).toLowerCase()) {
        sheet.deleteRow(i + 1);
        return { ok: true };
      }
    }
    return { ok: false, error: 'User tidak ditemukan.' };
  });
}

/* =========================================================================
 *  REFERENCE DATA CRUD APIs (Admin only)
 * ========================================================================= */

// --- Config_Akun ---
function apiGetConfigAkun() {
  try {
    var rows = _loadConfigAkun();
    return { ok: true, items: rows };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiAddConfigAkun(payload) {
  return _withAuth('Admin', function () {
    payload = payload || {};
    if (!payload.kode) return { ok: false, error: 'Kode wajib diisi.' };
    var sheet = Database.getSheet('Config_Akun');
    if (!sheet) return { ok: false, error: 'Sheet tidak ditemukan.' };
    sheet.appendRow([String(payload.kode).trim(), String(payload.nama || '').trim(), 'Y']);
    _configCache.akun = null;
    return { ok: true };
  });
}

function apiUpdateConfigAkun(payload) {
  return _withAuth('Admin', function () {
    payload = payload || {};
    if (!payload.kode) return { ok: false, error: 'Kode wajib diisi.' };
    var sheet = Database.getSheet('Config_Akun');
    if (!sheet) return { ok: false, error: 'Sheet tidak ditemukan.' };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var kodeCol = headers.indexOf('Kode');
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][kodeCol]).trim() === String(payload.kode).trim()) {
        var namaCol = headers.indexOf('Nama');
        var aktifCol = headers.indexOf('Aktif');
        if (payload.nama !== undefined && namaCol !== -1) sheet.getRange(i + 1, namaCol + 1).setValue(payload.nama);
        if (payload.aktif !== undefined && aktifCol !== -1) sheet.getRange(i + 1, aktifCol + 1).setValue(payload.aktif);
        _configCache.akun = null;
        return { ok: true };
      }
    }
    return { ok: false, error: 'Kode tidak ditemukan.' };
  });
}

function apiDeleteConfigAkun(payload) {
  return _withAuth('Admin', function () {
    payload = payload || {};
    if (!payload.kode) return { ok: false, error: 'Kode wajib diisi.' };
    var sheet = Database.getSheet('Config_Akun');
    if (!sheet) return { ok: false, error: 'Sheet tidak ditemukan.' };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var kodeCol = headers.indexOf('Kode');
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][kodeCol]).trim() === String(payload.kode).trim()) {
        sheet.deleteRow(i + 1);
        _configCache.akun = null;
        return { ok: true };
      }
    }
    return { ok: false, error: 'Kode tidak ditemukan.' };
  });
}

// --- Config_Kegiatan ---
function apiGetConfigKegiatan() {
  try {
    var rows = _loadConfigKegiatan();
    return { ok: true, items: rows };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiAddConfigKegiatan(payload) {
  return _withAuth('Admin', function () {
    payload = payload || {};
    if (!payload.kode) return { ok: false, error: 'Kode wajib diisi.' };
    var sheet = Database.getSheet('Config_Kegiatan');
    if (!sheet) return { ok: false, error: 'Sheet tidak ditemukan.' };
    sheet.appendRow([String(payload.kode).trim(), String(payload.nama || '').trim(), 'Y']);
    _configCache.kegiatan = null;
    return { ok: true };
  });
}

function apiUpdateConfigKegiatan(payload) {
  return _withAuth('Admin', function () {
    payload = payload || {};
    if (!payload.kode) return { ok: false, error: 'Kode wajib diisi.' };
    var sheet = Database.getSheet('Config_Kegiatan');
    if (!sheet) return { ok: false, error: 'Sheet tidak ditemukan.' };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var kodeCol = headers.indexOf('Kode');
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][kodeCol]).trim() === String(payload.kode).trim()) {
        var namaCol = headers.indexOf('Nama');
        var aktifCol = headers.indexOf('Aktif');
        if (payload.nama !== undefined && namaCol !== -1) sheet.getRange(i + 1, namaCol + 1).setValue(payload.nama);
        if (payload.aktif !== undefined && aktifCol !== -1) sheet.getRange(i + 1, aktifCol + 1).setValue(payload.aktif);
        _configCache.kegiatan = null;
        return { ok: true };
      }
    }
    return { ok: false, error: 'Kode tidak ditemukan.' };
  });
}

function apiDeleteConfigKegiatan(payload) {
  return _withAuth('Admin', function () {
    payload = payload || {};
    if (!payload.kode) return { ok: false, error: 'Kode wajib diisi.' };
    var sheet = Database.getSheet('Config_Kegiatan');
    if (!sheet) return { ok: false, error: 'Sheet tidak ditemukan.' };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var kodeCol = headers.indexOf('Kode');
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][kodeCol]).trim() === String(payload.kode).trim()) {
        sheet.deleteRow(i + 1);
        _configCache.kegiatan = null;
        return { ok: true };
      }
    }
    return { ok: false, error: 'Kode tidak ditemukan.' };
  });
}

// --- Config_Prefix ---
function apiGetConfigPrefix() {
  try {
    var rows = _loadConfigPrefix();
    return { ok: true, items: rows };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiAddConfigPrefix(payload) {
  return _withAuth('Admin', function () {
    payload = payload || {};
    if (!payload.kode) return { ok: false, error: 'Kode wajib diisi.' };
    var sheet = Database.getSheet('Config_Prefix');
    if (!sheet) return { ok: false, error: 'Sheet tidak ditemukan.' };
    sheet.appendRow([String(payload.kode).trim(), String(payload.nama || '').trim(), 'Y']);
    _configCache.prefix = null;
    return { ok: true };
  });
}

function apiUpdateConfigPrefix(payload) {
  return _withAuth('Admin', function () {
    payload = payload || {};
    if (!payload.kode) return { ok: false, error: 'Kode wajib diisi.' };
    var sheet = Database.getSheet('Config_Prefix');
    if (!sheet) return { ok: false, error: 'Sheet tidak ditemukan.' };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var kodeCol = headers.indexOf('Kode');
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][kodeCol]).trim() === String(payload.kode).trim()) {
        var namaCol = headers.indexOf('Nama');
        var aktifCol = headers.indexOf('Aktif');
        if (payload.nama !== undefined && namaCol !== -1) sheet.getRange(i + 1, namaCol + 1).setValue(payload.nama);
        if (payload.aktif !== undefined && aktifCol !== -1) sheet.getRange(i + 1, aktifCol + 1).setValue(payload.aktif);
        _configCache.prefix = null;
        return { ok: true };
      }
    }
    return { ok: false, error: 'Kode tidak ditemukan.' };
  });
}

function apiDeleteConfigPrefix(payload) {
  return _withAuth('Admin', function () {
    payload = payload || {};
    if (!payload.kode) return { ok: false, error: 'Kode wajib diisi.' };
    var sheet = Database.getSheet('Config_Prefix');
    if (!sheet) return { ok: false, error: 'Sheet tidak ditemukan.' };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var kodeCol = headers.indexOf('Kode');
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][kodeCol]).trim() === String(payload.kode).trim()) {
        sheet.deleteRow(i + 1);
        _configCache.prefix = null;
        return { ok: true };
      }
    }
    return { ok: false, error: 'Kode tidak ditemukan.' };
  });
}

/* =========================================================================
 *  CHART DATA API
 * ========================================================================= */

function apiGetChartData(payload) {
  try {
    payload = payload || {};
    var schoolId = payload.schoolId || '';
    var tahun = payload.tahun ? String(payload.tahun) : '*';
    var jenjang = _normalizeJenjang(payload.jenjang);

    var rkkalData = Database.readAll('Data_RKKAL').filter(function (r) {
      if (schoolId && r.school_id && r.school_id !== schoolId) return false;
      if (tahun !== '*' && String(r.tahun_anggaran) !== tahun) return false;
      if (jenjang && String(r.jenjang || '') !== jenjang) return false;
      return true;
    });

    var rekapData = Database.readAll('Data_Rekap').filter(function (r) {
      if (schoolId && r.school_id && r.school_id !== schoolId) return false;
      if (tahun !== '*' && String(r.tahun_anggaran) !== tahun) return false;
      if (jenjang && String(r.jenjang || '') !== jenjang) return false;
      return true;
    });

    // (a) serapanPerKegiatan - proportion of spending per kegiatan
    var kegMap = {};
    rekapData.forEach(function (r) {
      var keg = String(r.kode_kegiatan || '(?)');
      if (!kegMap[keg]) kegMap[keg] = { kegiatan: keg, nama: _kegiatanNama(keg) || keg, realisasi: 0 };
      kegMap[keg].realisasi += Number(r.jumlah) || 0;
    });
    var serapanPerKegiatan = Object.keys(kegMap).map(function (k) { return kegMap[k]; });

    // (b) paguVsRealisasi - per kode akun
    var akunMap = {};
    rkkalData.forEach(function (r) {
      var kode = String(r.kode_akun || '(?)');
      if (!akunMap[kode]) akunMap[kode] = { kode: kode, nama: r.nama_akun || _akunNama(kode), pagu: 0, realisasi: 0 };
      akunMap[kode].pagu += Number(r.jumlah_biaya) || 0;
    });
    rekapData.forEach(function (r) {
      var kode = String(r.kode_akun || '(?)');
      if (!akunMap[kode]) akunMap[kode] = { kode: kode, nama: r.nama_akun || _akunNama(kode), pagu: 0, realisasi: 0 };
      akunMap[kode].realisasi += Number(r.jumlah) || 0;
    });
    var paguVsRealisasi = Object.keys(akunMap).map(function (k) { return akunMap[k]; });
    paguVsRealisasi.sort(function (a, b) { return String(a.kode).localeCompare(String(b.kode)); });

    // (c) trenBulanan - monthly spending trend for 12 months
    var bulanMap = {};
    for (var bi = 0; bi < REF.BULAN.length; bi++) {
      bulanMap[REF.BULAN[bi]] = 0;
    }
    rekapData.forEach(function (r) {
      var bln = String(r.bulan_pelaksanaan || '');
      if (bulanMap[bln] !== undefined) {
        bulanMap[bln] += Number(r.jumlah) || 0;
      }
    });
    var trenBulanan = REF.BULAN.map(function (b) {
      return { bulan: b, jumlah: bulanMap[b] || 0 };
    });

    return {
      ok: true,
      serapanPerKegiatan: serapanPerKegiatan,
      paguVsRealisasi: paguVsRealisasi,
      trenBulanan: trenBulanan
    };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

/* =========================================================================
 *  EXPORT TEMPLATE APIs (Admin only)
 * ========================================================================= */

function apiGetExportTemplates() {
  return _withAuth('Admin', function () {
    var rows = Database.readAll('Config_Export');
    var templates = rows.map(function (r) {
      return {
        name: r.templatename || '',
        type: r.type || '',
        columns: r.columns || '',
        headerRow: r.headerrow || ''
      };
    });
    return { ok: true, templates: templates };
  });
}

function apiSaveExportTemplate(payload) {
  return _withAuth('Admin', function () {
    payload = payload || {};
    if (!payload.name) return { ok: false, error: 'Nama template wajib diisi.' };
    var sheet = Database.getSheet('Config_Export');
    if (!sheet) return { ok: false, error: 'Sheet tidak ditemukan.' };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var nameCol = headers.indexOf('TemplateName');
    // Update if exists
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][nameCol]).trim() === String(payload.name).trim()) {
        var typeCol = headers.indexOf('Type');
        var colsCol = headers.indexOf('Columns');
        var hdrCol = headers.indexOf('HeaderRow');
        if (payload.type !== undefined && typeCol !== -1) sheet.getRange(i + 1, typeCol + 1).setValue(payload.type);
        if (payload.columns !== undefined && colsCol !== -1) sheet.getRange(i + 1, colsCol + 1).setValue(payload.columns);
        if (payload.headerRow !== undefined && hdrCol !== -1) sheet.getRange(i + 1, hdrCol + 1).setValue(payload.headerRow);
        return { ok: true };
      }
    }
    // Insert new
    sheet.appendRow([
      String(payload.name).trim(),
      String(payload.type || '').trim(),
      String(payload.columns || '').trim(),
      String(payload.headerRow || '').trim()
    ]);
    return { ok: true };
  });
}

function apiDeleteExportTemplate(payload) {
  return _withAuth('Admin', function () {
    payload = payload || {};
    if (!payload.name) return { ok: false, error: 'Nama template wajib diisi.' };
    var sheet = Database.getSheet('Config_Export');
    if (!sheet) return { ok: false, error: 'Sheet tidak ditemukan.' };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var nameCol = headers.indexOf('TemplateName');
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][nameCol]).trim() === String(payload.name).trim()) {
        sheet.deleteRow(i + 1);
        return { ok: true };
      }
    }
    return { ok: false, error: 'Template tidak ditemukan.' };
  });
}

/* =========================================================================
 *  IMPORT TEMPLATE APIs (Admin only)
 * ========================================================================= */

function apiGetImportTemplates() {
  return _withAuth('Admin', function () {
    var rows = Database.readAll('Config_Import');
    var templates = rows.map(function (r) {
      return {
        name: r.templatename || '',
        type: r.type || '',
        mapping: r.mapping || ''
      };
    });
    return { ok: true, templates: templates };
  });
}

function apiSaveImportTemplate(payload) {
  return _withAuth('Admin', function () {
    payload = payload || {};
    if (!payload.name) return { ok: false, error: 'Nama template wajib diisi.' };
    var sheet = Database.getSheet('Config_Import');
    if (!sheet) return { ok: false, error: 'Sheet tidak ditemukan.' };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var nameCol = headers.indexOf('TemplateName');
    // Update if exists
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][nameCol]).trim() === String(payload.name).trim()) {
        var typeCol = headers.indexOf('Type');
        var mapCol = headers.indexOf('Mapping');
        if (payload.type !== undefined && typeCol !== -1) sheet.getRange(i + 1, typeCol + 1).setValue(payload.type);
        if (payload.mapping !== undefined && mapCol !== -1) sheet.getRange(i + 1, mapCol + 1).setValue(payload.mapping);
        return { ok: true };
      }
    }
    // Insert new
    sheet.appendRow([
      String(payload.name).trim(),
      String(payload.type || '').trim(),
      String(payload.mapping || '').trim()
    ]);
    return { ok: true };
  });
}

function apiDeleteImportTemplate(payload) {
  return _withAuth('Admin', function () {
    payload = payload || {};
    if (!payload.name) return { ok: false, error: 'Nama template wajib diisi.' };
    var sheet = Database.getSheet('Config_Import');
    if (!sheet) return { ok: false, error: 'Sheet tidak ditemukan.' };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var nameCol = headers.indexOf('TemplateName');
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][nameCol]).trim() === String(payload.name).trim()) {
        sheet.deleteRow(i + 1);
        return { ok: true };
      }
    }
    return { ok: false, error: 'Template tidak ditemukan.' };
  });
}

/* =========================================================================
 *  UI THEME / CONFIG APIs
 * ========================================================================= */

function _readUIConfig() {
  try {
    var rows = Database.readAll('Config_UI');
    var config = {};
    for (var i = 0; i < rows.length; i++) {
      var key = String(rows[i].key || '').trim();
      if (key) config[key] = rows[i].value || '';
    }
    return config;
  } catch (e) {
    return {};
  }
}

function apiGetUIConfig() {
  try {
    var config = _readUIConfig();
    return { ok: true, config: config };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function apiSaveUIConfig(payload) {
  return _withAuth('Admin', function () {
    payload = payload || {};
    if (!payload.key) return { ok: false, error: 'Key wajib diisi.' };
    var sheet = Database.getSheet('Config_UI');
    if (!sheet) return { ok: false, error: 'Sheet tidak ditemukan.' };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var keyCol = headers.indexOf('Key');
    var valCol = headers.indexOf('Value');
    // Upsert: update if exists, insert if not
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][keyCol]).trim() === String(payload.key).trim()) {
        sheet.getRange(i + 1, valCol + 1).setValue(payload.value !== undefined ? payload.value : '');
        return { ok: true };
      }
    }
    // Insert new
    sheet.appendRow([String(payload.key).trim(), payload.value !== undefined ? String(payload.value) : '']);
    return { ok: true };
  });
}

function apiUploadLogo(payload) {
  return _withAuth('Admin', function () {
    payload = payload || {};
    if (!payload.dataBase64) return { ok: false, error: 'File kosong / gagal dibaca.' };
    var bytes = Utilities.base64Decode(payload.dataBase64);
    var blob = Utilities.newBlob(bytes, payload.mimeType || 'image/png', payload.filename || 'logo.png');
    var folder = _buktiFolder();
    var file = folder.createFile(blob);
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
    var url = file.getUrl();
    // Store in Config_UI
    var sheet = Database.getSheet('Config_UI');
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var keyCol = headers.indexOf('Key');
      var valCol = headers.indexOf('Value');
      var found = false;
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][keyCol]).trim() === 'logoUrl') {
          sheet.getRange(i + 1, valCol + 1).setValue(url);
          found = true;
          break;
        }
      }
      if (!found) {
        sheet.appendRow(['logoUrl', url]);
      }
    }
    return { ok: true, logoUrl: url };
  });
}

/* =========================================================================
 *  DATA CONTOH + SELF TEST
 * ========================================================================= */

function seedDemoIfEmpty(schoolId) {
  try {
    var props = PropertiesService.getScriptProperties();
    if (props.getProperty(Database.SEED_FLAG)) return;
    if (Database.countRows('Data_RKKAL') === 0) {
      apiSeedDummy({ schoolId: schoolId });
    }
    props.setProperty(Database.SEED_FLAG, '1');
  } catch (e) { Logger.log('Seed error: ' + e.message); }
}

function apiSeedDummy(payload) {
  try {
    var schoolId = _resolveSchoolId(payload);
    var y = 2026;

    // --- RKKAL (Pagu) ---
    var rkkal = [
      { keg: 'A', akun: '521211', uraian: 'ATK Kelas [1 PKT x 12 BLN x 3 KLS]', vol: 36, sat: 'OK', harga: 500000 },
      { keg: 'A', akun: '522151', uraian: 'Honor Instruktur [4 ORG x 2 Jam x 3 Keg]', vol: 24, sat: 'OK', harga: 500000 },
      { keg: 'B', akun: '521211', uraian: 'Snack dan Konsumsi Siswa [25 ORG]', vol: 150, sat: 'OK', harga: 53000 },
      { keg: 'D', akun: '521219', uraian: 'Biaya Pendaftaran Perlombaan', vol: 15, sat: 'OK', harga: 1000000 },
      { keg: 'F', akun: '521111', uraian: 'Keperluan Sehari-hari Perkantoran', vol: 12, sat: 'BLN', harga: 1000000 }
    ];
    var nR = 0;
    rkkal.forEach(function (r) {
      var jumlah = Math.round(r.vol * r.harga);
      if (Database.insert('Data_RKKAL', {
        id_rkkal: _genId('RKK'), tahun_anggaran: y, jenjang: 'SMP',
        kode_kegiatan: r.keg, nama_kegiatan: _kegiatanNama(r.keg), kode_akun: r.akun,
        nama_akun: _akunNama(r.akun), uraian: r.uraian, volume: r.vol, satuan: r.sat,
        harga_satuan: r.harga, jumlah_biaya: jumlah, school_id: schoolId,
        timestamp: new Date().toISOString()
      })) nR++;
    });

    // --- Rekap (Realisasi) ---
    var rekap = [
      { tgl: '2026-04-03', toko: 'Yudho prawira', prefix: 'DQ.7936.SBB.101.303', keg: 'A', akun: '522151', uraian: 'Honor Instruktur Ekstra Kurikuler Pramuka', bln: 'April', jml: 500000, jen: 'SMA/SMK' },
      { tgl: '2026-04-05', toko: 'Faridah Water', prefix: 'DQ.7936.SBE.101.303', keg: 'F', akun: '521112', uraian: 'Belanja air minum siswa', bln: 'April', jml: 840000, jen: 'SMP' },
      { tgl: '2026-04-10', toko: 'Pertamina', prefix: 'WA.7937.EBA.994.002', keg: 'F', akun: '521111', uraian: 'Pembelian BBM operasional', bln: 'April', jml: 1400000, jen: 'SMP' },
      { tgl: '2026-04-12', toko: 'Blitar Park', prefix: 'DQ.7936.SBE.101.303', keg: 'D', akun: '521219', uraian: 'Biaya masuk Lokasi Study Outingclass', bln: 'April', jml: 11100000, jen: 'SMP' }
    ];
    var nK = 0;
    rekap.forEach(function (r) {
      var row = _rekapRowFromPayload({
        tanggal: r.tgl, namaToko: r.toko, makPrefix: r.prefix, kodeKegiatan: r.keg,
        kodeAkun: r.akun, uraian: r.uraian, tahun: y, bulan: r.bln, jumlah: r.jml, jenjang: r.jen
      }, schoolId);
      if (Database.insert('Data_Rekap', row)) nK++;
    });

    return { ok: true, rkkal: nR, rekap: nK };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function seedDummyData() {
  var schoolId = Database.ensureDefaultSchool();
  var res = apiSeedDummy({ schoolId: schoolId });
  Logger.log('Dummy inserted: ' + JSON.stringify(res));
  return res;
}

/**
 * SELF TEST — pilih fungsi ini di editor lalu klik Run untuk menguji
 * penyimpanan TANPA perlu deploy. Lihat hasilnya di Execution log.
 */
function selfTest() {
  var schoolId = Database.ensureDefaultSchool();
  var beforeR = Database.countRows('Data_RKKAL');
  var beforeK = Database.countRows('Data_Rekap');

  Database.insert('Data_RKKAL', {
    id_rkkal: _genId('RKK'), tahun_anggaran: 2026, jenjang: 'SMP',
    kode_kegiatan: 'A', nama_kegiatan: _kegiatanNama('A'), kode_akun: '521211',
    nama_akun: _akunNama('521211'), uraian: 'SELF TEST RKKAL', volume: 1, satuan: 'PKT',
    harga_satuan: 12345, jumlah_biaya: 12345, school_id: schoolId, timestamp: new Date().toISOString()
  });
  var rekapRow = _rekapRowFromPayload({
    tanggal: new Date().toISOString(), namaToko: 'SELF TEST TOKO', makPrefix: 'DQ.7936.SBE.101.303',
    kodeKegiatan: 'A', kodeAkun: '522151', uraian: 'SELF TEST REKAP', jumlah: 67890, jenjang: 'SMP'
  }, schoolId);
  Database.insert('Data_Rekap', rekapRow);

  var result = {
    rkkalBefore: beforeR, rkkalAfter: Database.countRows('Data_RKKAL'),
    rekapBefore: beforeK, rekapAfter: Database.countRows('Data_Rekap'),
    kodeMakContoh: rekapRow.kode_mak, terbilangContoh: rekapRow.terbilang,
    spreadsheetUrl: Database.getSpreadsheetUrl()
  };
  Logger.log('=== SELF TEST RESULT ===');
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
