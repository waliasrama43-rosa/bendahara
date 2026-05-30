/**
 * Web UI API layer.
 *
 * These are plain, top-level functions called from the browser via
 * `google.script.run.<fn>(payload)`. Each one is defensive: it never throws to
 * the client, always returns a serializable object of the shape
 *   { ok: true, ... }  or  { ok: false, error: '...' }
 *
 * Keep argument lists to a single optional `payload` object so the client can
 * call them uniformly.
 */

/**
 * Resolve the active school id (uses default school when not provided).
 */
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

// Bulan disimpan sebagai "YYYY-M" (default: bulan berjalan).
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

/**
 * Called once when the UI loads. Initializes DB, seeds demo data on first run,
 * and returns the initial dashboard payload.
 */
function apiBootstrap() {
  try {
    Database.init();
    var schoolId = Database.ensureDefaultSchool();
    Database.seedDemoIfEmpty(schoolId);

    var schools = Database.readAll('Data_Sekolah').map(function (s) {
      return { schoolId: s.school_id, nama: s.nama_sekolah };
    });

    return {
      ok: true,
      schoolId: schoolId,
      schools: schools,
      stats: Database.getStats(schoolId),
      spreadsheetUrl: Database.getSpreadsheetUrl(),
      serverTime: new Date().toISOString()
    };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

/**
 * Dashboard statistics.
 */
function apiGetDashboard(payload) {
  try {
    var schoolId = _resolveSchoolId(payload);
    return { ok: true, schoolId: schoolId, stats: Database.getStats(schoolId) };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

/**
 * List transactions for the school (most recent first).
 */
function apiGetTransactions(payload) {
  try {
    var schoolId = _resolveSchoolId(payload);
    var rows = Database.getTransactionsBySchool(schoolId, '*').map(function (t) {
      return {
        id: t.id_transaksi,
        kode: t.kode_anggaran,
        nama: t.nama_kegiatan,
        jumlah: Number(t.jumlah_rupiah) || 0,
        timestamp: t.timestamp,
        status: String(t.status_verifikasi || 'pending'),
        bulan: t.bulan ? String(t.bulan) : '',
        jenjang: t.jenjang ? String(t.jenjang) : ''
      };
    });
    rows.reverse();
    return { ok: true, rows: rows };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

/**
 * Save multiple manually-entered rows.
 * payload = { schoolId, rows: [{ kodeAnggaran, namaKegiatan, jumlahRupiah }] }
 */
function apiSaveManualRows(payload) {
  try {
    payload = payload || {};
    var schoolId = _resolveSchoolId(payload);
    var rows = payload.rows || [];
    var bulan = _normalizeBulan(payload.bulan);
    var jenjang = _normalizeJenjang(payload.jenjang);
    var saved = 0;
    var skipped = 0;
    var failed = 0;

    rows.forEach(function (r) {
      var kode = (r.kodeAnggaran || '').toString().trim();
      var nama = (r.namaKegiatan || '').toString().trim();
      var jumlah = _parseRupiah(r.jumlahRupiah);

      // Skip fully-empty rows silently.
      if (!kode && !nama && !jumlah) return;

      // Require all three to be present for a valid row.
      if (!kode || !nama || jumlah <= 0) {
        skipped++;
        return;
      }

      var ok = Database.insert('Data_Transaksi', {
        id_transaksi: _genTrxId(),
        kode_anggaran: kode,
        nama_kegiatan: nama,
        jumlah_rupiah: jumlah,
        timestamp: new Date().toISOString(),
        status_verifikasi: 'pending',
        school_id: schoolId,
        bulan: bulan,
        jenjang: jenjang
      });
      if (ok) { saved++; } else { failed++; }
    });

    if (failed > 0 && saved === 0) {
      return { ok: false, error: 'Gagal menulis ke Spreadsheet (' + failed + ' baris). Cek otorisasi & deployment.' };
    }
    return { ok: true, saved: saved, skipped: skipped, failed: failed };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

/**
 * Parse + import pasted CSV / RKKAL text.
 * payload = { schoolId, csv }
 * Expected columns (header row optional): Kode Anggaran, Nama Kegiatan, Jumlah
 */
function apiUploadCSV(payload) {
  try {
    payload = payload || {};
    var schoolId = _resolveSchoolId(payload);
    var bulan = _normalizeBulan(payload.bulan);
    var jenjang = _normalizeJenjang(payload.jenjang);
    var csv = String(payload.csv || '').trim();
    if (!csv) return { ok: false, error: 'Data CSV kosong.' };

    var lines = csv.split(/\r?\n/);
    var processed = 0;
    var errors = 0;
    var startIndex = 0;

    // Detect + skip a header row.
    var firstCols = _splitCsvLine(lines[0]);
    var firstJoined = firstCols.join(' ').toLowerCase();
    if (firstJoined.indexOf('kode') !== -1 || firstJoined.indexOf('nama') !== -1 ||
        firstJoined.indexOf('jumlah') !== -1) {
      startIndex = 1;
    }

    for (var i = startIndex; i < lines.length; i++) {
      var line = lines[i];
      if (!line || !line.trim()) continue;

      var cols = _splitCsvLine(line);
      var kode = (cols[0] || '').trim();
      var nama = (cols[1] || '').trim();
      var jumlah = _parseRupiah(cols[2]);

      if (!kode || !nama || jumlah <= 0) {
        errors++;
        continue;
      }

      Database.insert('Data_Transaksi', {
        id_transaksi: _genTrxId(),
        kode_anggaran: kode,
        nama_kegiatan: nama,
        jumlah_rupiah: jumlah,
        timestamp: new Date().toISOString(),
        status_verifikasi: 'pending',
        school_id: schoolId,
        bulan: bulan,
        jenjang: jenjang
      });
      processed++;
    }

    return { ok: true, processed: processed, errors: errors };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

/**
 * Simple CSV line splitter that tolerates quoted fields.
 */
function _splitCsvLine(line) {
  var result = [];
  var cur = '';
  var inQuotes = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if ((ch === ',' || ch === ';' || ch === '\t') && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

/**
 * RAB bulanan aggregation.
 * payload = { schoolId, period: 'YYYY-M' | '*' }
 */
function apiGetRAB(payload) {
  try {
    payload = payload || {};
    var schoolId = _resolveSchoolId(payload);
    var period = payload.period || '*';
    var result = Database.getRABByPeriod(schoolId, period);
    return { ok: true, period: period, items: result.items, grandTotal: result.grandTotal };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

/**
 * Approve / reject a transaction.
 * payload = { id, action: 'approve' | 'reject' }
 */
function apiVerifyTransaction(payload) {
  try {
    payload = payload || {};
    if (!payload.id) return { ok: false, error: 'ID transaksi wajib diisi.' };
    var status = payload.action === 'reject' ? 'rejected' : 'verified';
    var updated = Database.updateTransactionStatus(payload.id, status);
    return updated
      ? { ok: true, status: status }
      : { ok: false, error: 'Transaksi tidak ditemukan.' };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

/**
 * Edit a transaction's editable fields.
 * payload = { id, kodeAnggaran, namaKegiatan, jumlahRupiah }
 */
function apiUpdateTransaction(payload) {
  try {
    payload = payload || {};
    if (!payload.id) return { ok: false, error: 'ID transaksi wajib diisi.' };

    var patch = {};
    if (payload.kodeAnggaran !== undefined) patch.kode_anggaran = String(payload.kodeAnggaran).trim();
    if (payload.namaKegiatan !== undefined) patch.nama_kegiatan = String(payload.namaKegiatan).trim();
    if (payload.jumlahRupiah !== undefined) patch.jumlah_rupiah = _parseRupiah(payload.jumlahRupiah);
    if (payload.bulan !== undefined) patch.bulan = _normalizeBulan(payload.bulan);
    if (payload.jenjang !== undefined) patch.jenjang = _normalizeJenjang(payload.jenjang);

    if (payload.kodeAnggaran !== undefined && !patch.kode_anggaran) {
      return { ok: false, error: 'Kode anggaran tidak boleh kosong.' };
    }
    if (payload.namaKegiatan !== undefined && !patch.nama_kegiatan) {
      return { ok: false, error: 'Nama kegiatan tidak boleh kosong.' };
    }

    var ok = Database.updateTransaction(payload.id, patch);
    return ok ? { ok: true } : { ok: false, error: 'Transaksi tidak ditemukan.' };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

/**
 * Delete a transaction.
 * payload = { id }
 */
function apiDeleteTransaction(payload) {
  try {
    payload = payload || {};
    if (!payload.id) return { ok: false, error: 'ID transaksi wajib diisi.' };
    var ok = Database.deleteTransaction(payload.id);
    return ok ? { ok: true } : { ok: false, error: 'Transaksi tidak ditemukan.' };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

/**
 * Get the school profile.
 */
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
        schoolId: found.school_id,
        namaSekolah: found.nama_sekolah,
        alamat: found.alamat_sekolah,
        kepalaSekolah: found.kepala_sekolah,
        bendahara: found.bendahara,
        planType: found.plan_type
      } : null
    };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

/**
 * Update the school profile.
 * payload = { schoolId, namaSekolah, alamat, kepalaSekolah, bendahara }
 */
function apiSaveSchool(payload) {
  try {
    payload = payload || {};
    var schoolId = _resolveSchoolId(payload);
    var sheet = Database.getSheet('Data_Sekolah');
    if (!sheet) return { ok: false, error: 'Sheet sekolah tidak tersedia.' };

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol = headers.indexOf('School_ID');
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][idCol] === schoolId) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) return { ok: false, error: 'Sekolah tidak ditemukan.' };

    function setVal(header, value) {
      var c = headers.indexOf(header);
      if (c !== -1 && value !== undefined) sheet.getRange(rowIndex, c + 1).setValue(value);
    }
    setVal('Nama_Sekolah', payload.namaSekolah);
    setVal('Alamat_Sekolah', payload.alamat);
    setVal('Kepala_Sekolah', payload.kepalaSekolah);
    setVal('Bendahara', payload.bendahara);

    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}


/**
 * Lightweight diagnostics for the web UI footer / debugging.
 */
function apiDiagnostics() {
  try {
    return {
      ok: true,
      spreadsheetUrl: Database.getSpreadsheetUrl(),
      transaksiRows: Database.countRows('Data_Transaksi'),
      sekolahRows: Database.countRows('Data_Sekolah'),
      serverTime: new Date().toISOString()
    };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

/**
 * SELF TEST — run this directly from the Apps Script editor (select
 * `selfTest` in the function dropdown and click Run). It does NOT require a
 * deployment, so it isolates "is my code/authorization OK?" from "is my web
 * app deployment stale?".
 *
 * It writes one test transaction, reads it back, and logs the spreadsheet URL.
 * Check View > Logs (or Executions) for the result, then open the URL to see
 * the row in the sheet.
 */
function selfTest() {
  var before = Database.countRows('Data_Transaksi');
  var schoolId = Database.ensureDefaultSchool();

  var ok = Database.insert('Data_Transaksi', {
    id_transaksi: _genTrxId(),
    kode_anggaran: 'TEST',
    nama_kegiatan: 'SELF TEST ' + new Date().toLocaleString('id-ID'),
    jumlah_rupiah: 12345,
    timestamp: new Date().toISOString(),
    status_verifikasi: 'pending',
    school_id: schoolId
  });

  var after = Database.countRows('Data_Transaksi');
  var url = Database.getSpreadsheetUrl();

  var result = {
    insertReturned: ok,
    rowsBefore: before,
    rowsAfter: after,
    rowAdded: (after === before + 1),
    spreadsheetUrl: url
  };

  Logger.log('=== SELF TEST RESULT ===');
  Logger.log(JSON.stringify(result, null, 2));
  Logger.log('Buka spreadsheet ini untuk verifikasi: ' + url);
  return result;
}
