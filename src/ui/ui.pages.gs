/**
 * ============================================================
 * UI PAGES — Semua halaman HTML dalam satu function
 * ============================================================
 */
function _getAllPages(schoolId) {
  const y = new Date().getFullYear();
  const months = ['Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'];
  const mOpts = months.map(m=>'<option>'+m+'</option>').join('');
  const yOpts = [y+1,y,y-1].map(yr=>'<option '+(yr===y?'selected':'')+'>'+yr+'</option>').join('');
  return `
<!-- ░░░ PAGE: DASHBOARD ░░░ -->
<div class="page active" id="page-dashboard">
  <div class="page-header">
    <h1>📊 Dashboard</h1>
    <p>Ringkasan keuangan dan aktivitas terkini sekolah Anda</p>
  </div>
  <div class="stats-grid">
    <div class="stat-card blue">
      <div class="stat-icon">🧾</div>
      <div class="stat-info">
        <div class="stat-label">Total Transaksi</div>
        <div class="stat-value" id="stat-total">—</div>
        <div class="stat-sub">Seluruh periode</div>
      </div>
    </div>
    <div class="stat-card green">
      <div class="stat-icon">💰</div>
      <div class="stat-info">
        <div class="stat-label">Total Pengeluaran</div>
        <div class="stat-value" id="stat-amount" style="font-size:1.1rem">—</div>
        <div class="stat-sub">Tahun ${y}</div>
      </div>
    </div>
    <div class="stat-card orange">
      <div class="stat-icon">⏳</div>
      <div class="stat-info">
        <div class="stat-label">Menunggu Verifikasi</div>
        <div class="stat-value" id="stat-pending">—</div>
        <div class="stat-sub">Perlu tindakan</div>
      </div>
    </div>
    <div class="stat-card teal">
      <div class="stat-icon">✅</div>
      <div class="stat-info">
        <div class="stat-label">Terverifikasi</div>
        <div class="stat-value" id="stat-verified">—</div>
        <div class="stat-sub">Sudah disetujui</div>
      </div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 380px;gap:20px">
    <div class="card">
      <div class="card-title"><span>📈</span> Pengeluaran per Bulan (${y})</div>
      <div class="chart-container"><div class="chart-bars" id="barChart"></div></div>
    </div>
    <div class="card">
      <div class="card-title"><span>📁</span> Realisasi Anggaran</div>
      <div id="rkkalSummary"><div class="skeleton" style="height:120px"></div></div>
      <div style="margin-top:16px;display:flex;gap:8px">
        <button class="btn btn-outline btn-sm" onclick="showPage('realisasi')">Detail →</button>
        <button class="btn btn-secondary btn-sm" onclick="showPage('export')">Export</button>
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:20px">
    <div class="card-title"><span>⚡</span> Aksi Cepat</div>
    <div class="action-grid">
      <div class="action-btn primary" onclick="showPage('input')">
        <span class="ab-icon">📝</span><span class="ab-label">Input Data SPJ</span>
      </div>
      <div class="action-btn green" onclick="doExport('spj')">
        <span class="ab-icon">📊</span><span class="ab-label">Export SPJ Excel</span>
      </div>
      <div class="action-btn orange" onclick="doExport('realisasi')">
        <span class="ab-icon">📈</span><span class="ab-label">Export Realisasi</span>
      </div>
      <div class="action-btn teal" onclick="showPage('rkkal')">
        <span class="ab-icon">📁</span><span class="ab-label">Upload RKKAL</span>
      </div>
      <div class="action-btn purple" onclick="showPage('data')">
        <span class="ab-icon">🔍</span><span class="ab-label">Lihat Transaksi</span>
      </div>
      <div class="action-btn" onclick="diagnose()">
        <span class="ab-icon">🔧</span><span class="ab-label">Diagnosa Sistem</span>
      </div>
    </div>
  </div>
</div>

<!-- ░░░ PAGE: INPUT DATA SPJ ░░░ -->
<div class="page" id="page-input">
  <div class="page-header">
    <h1>📝 Input Data SPJ</h1>
    <p>Catat pengeluaran baru — terbilang muncul otomatis</p>
  </div>
  <div style="max-width:760px">
    <div class="card">
      <div class="card-title"><span>📋</span> Form Input Transaksi SPJ</div>
      <div class="alert alert-success" id="spjSuccess" style="display:none"></div>
      <div class="alert alert-error"   id="spjError"   style="display:none"></div>
      <form id="spjForm" onsubmit="submitSPJ(event)">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Nama Toko / Vendor <span class="req">*</span></label>
            <input class="form-control" name="namaToko" placeholder="Toko ATK Maju, CV Berkah, dll" required>
          </div>
          <div class="form-group">
            <label class="form-label">Kode & Uraian MAK <span class="req">*</span></label>
            <input class="form-control" name="kodeAnggaran" placeholder="521111 - Belanja ATK" required>
          </div>
          <div class="form-group full">
            <label class="form-label">Uraian Pembayaran <span class="req">*</span></label>
            <textarea class="form-control" name="uraianPembayaran" rows="2" placeholder="Pembelian kertas HVS A4 rim 10 buah..." required></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Tahun Anggaran <span class="req">*</span></label>
            <select class="form-control" name="tahunAnggaran">${yOpts}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Bulan Pelaksanaan <span class="req">*</span></label>
            <select class="form-control" name="bulanPelaksanaan">${mOpts}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Kuantitas</label>
            <input class="form-control" name="kuantitas" type="number" value="1" min="1" oninput="calcJumlah()">
          </div>
          <div class="form-group">
            <label class="form-label">Harga Satuan (Rp)</label>
            <input class="form-control" id="hargaSatuan" name="hargaSatuan" type="number" min="0" placeholder="0" oninput="calcJumlah()">
          </div>
          <div class="form-group full">
            <label class="form-label">Jumlah Total (Rp) <span class="req">*</span></label>
            <input class="form-control" id="jumlahInput" name="jumlahRupiah" type="number" min="1" placeholder="0" required oninput="updateTerbilang(this.value)">
            <div class="terbilang-box" id="terbilangBox">Terbilang akan muncul otomatis...</div>
          </div>
          <div class="form-group full">
            <label class="form-label">Catatan (opsional)</label>
            <input class="form-control" name="catatan" placeholder="Catatan tambahan...">
          </div>
        </div>
        <div style="margin-top:20px;display:flex;gap:12px">
          <button type="submit" class="btn btn-primary btn-lg" style="flex:1">💾 Simpan Data SPJ</button>
          <button type="reset" class="btn btn-secondary btn-lg" onclick="updateTerbilang(0)">↺ Reset</button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- ░░░ PAGE: LIHAT TRANSAKSI ░░░ -->
<div class="page" id="page-data">
  <div class="page-header">
    <h1>🗂️ Lihat Transaksi</h1>
    <p>Semua data SPJ yang sudah diinput</p>
  </div>
  <div class="card">
    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
      <div class="card-title" style="margin:0;border:none;padding:0">Daftar Transaksi</div>
      <div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">
        <input id="searchInput" class="form-control" placeholder="🔍 Cari..." style="width:200px" oninput="searchTrx()">
        <button class="btn btn-primary btn-sm" onclick="loadTransactions()">🔄 Refresh</button>
        <button class="btn btn-success btn-sm" onclick="showPage('input')">+ Input Baru</button>
      </div>
    </div>
    <div class="table-wrapper">
      <table>
        <thead><tr>
          <th>No</th><th>Nama Toko</th><th>Kode MAK</th><th>Uraian Pembayaran</th>
          <th>Bulan</th><th>Jumlah</th><th>Status</th><th>Aksi</th>
        </tr></thead>
        <tbody id="trxBody">
          <tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text3)">Klik "Refresh" untuk memuat data</td></tr>
        </tbody>
      </table>
    </div>
    <div id="pagination" style="display:flex;gap:6px;margin-top:14px;flex-wrap:wrap"></div>
  </div>
</div>

<!-- ░░░ PAGE: UPLOAD RKKAL ░░░ -->
<div class="page" id="page-rkkal">
  <div class="page-header">
    <h1>📁 Upload RKKAL</h1>
    <p>Import file Rencana Kerja & Anggaran format CSV</p>
  </div>
  <div style="max-width:640px">
    <div class="card">
      <div class="card-title"><span>📤</span> Upload File RKKAL</div>
      <form onsubmit="uploadRKKAL(event)">
        <div class="form-grid" style="margin-bottom:16px">
          <div class="form-group">
            <label class="form-label">School ID <span class="req">*</span></label>
            <input class="form-control" id="rkkalSchoolId" placeholder="SCH-..." value="${schoolId||''}">
          </div>
          <div class="form-group">
            <label class="form-label">Tahun Anggaran</label>
            <select class="form-control" id="rkkalTahun">${yOpts}</select>
          </div>
        </div>
        <div class="upload-zone" id="uploadZone">
          <input type="file" id="rkkalFile" accept=".csv,.CSV">
          <div class="uz-icon">📂</div>
          <p><strong>Klik atau seret file CSV RKKAL ke sini</strong></p>
          <p style="margin-top:6px;font-size:.8rem">Format: CSV sesuai template RKKAL 2026</p>
        </div>
        <div id="uploadFileInfo" style="display:none;align-items:center;gap:10px;padding:10px 14px;background:var(--surface2);border-radius:var(--radius-sm);margin-top:10px">
          <span>📄</span>
          <span id="uploadFileName" style="font-size:.85rem;font-weight:600;color:var(--text)"></span>
        </div>
        <div id="uploadResult" style="margin-top:14px"></div>
        <div style="margin-top:16px;display:flex;gap:10px">
          <button type="submit" class="btn btn-primary btn-block">📤 Upload & Import RKKAL</button>
        </div>
      </form>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="card-title"><span>ℹ️</span> Panduan Format CSV</div>
      <div style="font-size:.83rem;color:var(--text2);line-height:1.8">
        <p>File CSV harus memiliki kolom dalam urutan berikut:</p>
        <div class="table-wrapper" style="margin-top:10px">
          <table>
            <thead><tr><th>Kolom</th><th>Contoh Isian</th></tr></thead>
            <tbody>
              <tr><td>KODE</td><td>521111</td></tr>
              <tr><td>PROGRAM/KEGIATAN</td><td>Belanja Keperluan Perkantoran</td></tr>
              <tr><td>VOLUME</td><td>12</td></tr>
              <tr><td>PKT/SATUAN</td><td>PKT</td></tr>
              <tr><td>HARGA SATUAN</td><td>12000000</td></tr>
              <tr><td>JUMLAH BIAYA</td><td>43200000000</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ░░░ PAGE: REALISASI ANGGARAN ░░░ -->
<div class="page" id="page-realisasi">
  <div class="page-header">
    <h1>📈 Realisasi Anggaran</h1>
    <p>Pantau penyerapan anggaran per kode MAK</p>
  </div>
  <div class="card">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <div class="card-title" style="margin:0;border:none;padding:0">Realisasi per Kode Anggaran</div>
      <div style="margin-left:auto;display:flex;gap:8px">
        <button class="btn btn-secondary btn-sm" onclick="loadRealisasi()">🔄 Refresh</button>
        <button class="btn btn-success btn-sm" onclick="doExport('realisasi')">⬇️ Export Excel</button>
      </div>
    </div>
    <div class="table-wrapper">
      <table>
        <thead><tr>
          <th>Kode</th><th>Uraian</th><th class="td-right">Pagu</th>
          <th class="td-right">Realisasi</th><th class="td-right">Sisa</th><th>Serapan</th>
        </tr></thead>
        <tbody id="rkkalBody">
          <tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text3)">Klik "Refresh" untuk memuat</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- ░░░ PAGE: EXPORT LAPORAN ░░░ -->
<div class="page" id="page-export">
  <div class="page-header">
    <h1>📤 Export Laporan</h1>
    <p>Download laporan SPJ dan realisasi anggaran ke Excel</p>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:900px">
    <div class="card">
      <div class="card-title"><span>📊</span> Export SPJ</div>
      <p style="font-size:.85rem;color:var(--text2);margin-bottom:16px">Rekap Surat Pertanggungjawaban sesuai format resmi — NO, NAMA TOKO, URAIAN MAK, URAIAN PEMBAYARAN, TAHUN, BULAN, JUMLAH, TERBILANG</p>
      <div class="form-group" style="margin-bottom:14px">
        <label class="form-label">Periode (Tahun-Bulan, atau * untuk semua)</label>
        <input class="form-control" id="exportPeriod" placeholder="2026-01 atau *" value="*">
      </div>
      <button class="btn btn-primary btn-block" onclick="doExport('spj')">📊 Buat Laporan SPJ</button>
    </div>
    <div class="card">
      <div class="card-title"><span>📈</span> Export Realisasi</div>
      <p style="font-size:.85rem;color:var(--text2);margin-bottom:16px">Rekap realisasi anggaran per kode MAK lengkap dengan kolom Jan-Des, total realisasi, sisa, dan persen penyerapan.</p>
      <div class="form-group" style="margin-bottom:14px">
        <label class="form-label">Tahun Anggaran</label>
        <select class="form-control" id="exportTahun">${yOpts}</select>
      </div>
      <button class="btn btn-success btn-block" onclick="doExport('realisasi')">📈 Buat Laporan Realisasi</button>
    </div>
  </div>
  <div id="exportResult" style="margin-top:20px;max-width:900px"></div>
</div>

<!-- ░░░ PAGE: DAFTAR SEKOLAH ░░░ -->
<div class="page" id="page-sekolah">
  <div class="page-header">
    <h1>🏛️ Daftar Sekolah</h1>
    <p>Daftarkan sekolah baru untuk mendapatkan School ID</p>
  </div>
  <div style="max-width:640px">
    <div class="card">
      <div class="card-title"><span>📋</span> Form Pendaftaran Sekolah</div>
      <div id="regResult" style="margin-bottom:12px"></div>
      <form onsubmit="registerSchool(event)">
        <div class="form-grid">
          <div class="form-group full">
            <label class="form-label">Nama Sekolah <span class="req">*</span></label>
            <input class="form-control" name="namaSekolah" placeholder="SDN 01 Jakarta Pusat" required>
          </div>
          <div class="form-group">
            <label class="form-label">Kode Sekolah</label>
            <input class="form-control" name="kodeSekolah" placeholder="SDN01JKT">
          </div>
          <div class="form-group">
            <label class="form-label">Email Bendahara <span class="req">*</span></label>
            <input class="form-control" name="email" type="email" placeholder="bendahara@sekolah.sch.id" required>
          </div>
          <div class="form-group">
            <label class="form-label">Nama Kepala Sekolah</label>
            <input class="form-control" name="kepalaSekolah" placeholder="Nama lengkap">
          </div>
          <div class="form-group">
            <label class="form-label">Nama Bendahara</label>
            <input class="form-control" name="bendahara" placeholder="Nama lengkap">
          </div>
          <div class="form-group">
            <label class="form-label">Kota/Kabupaten</label>
            <input class="form-control" name="kota" placeholder="Jakarta Pusat">
          </div>
          <div class="form-group">
            <label class="form-label">Provinsi</label>
            <input class="form-control" name="provinsi" placeholder="DKI Jakarta">
          </div>
          <div class="form-group">
            <label class="form-label">Telegram Chat ID</label>
            <input class="form-control" name="telegramChatId" placeholder="-100123456789">
            <span class="form-hint">Untuk notifikasi otomatis ke Telegram</span>
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-lg btn-block" style="margin-top:20px">🏛️ Daftarkan Sekolah</button>
      </form>
    </div>
  </div>
</div>

<!-- ░░░ PAGE: PENGATURAN ░░░ -->
<div class="page" id="page-pengaturan">
  <div class="page-header">
    <h1>⚙️ Pengaturan</h1>
    <p>Konfigurasi sistem dan informasi koneksi</p>
  </div>
  <div style="max-width:640px;display:flex;flex-direction:column;gap:16px">
    <div class="card">
      <div class="card-title"><span>🔑</span> School ID Aktif</div>
      <p style="font-size:.85rem;color:var(--text2);margin-bottom:14px">Masukkan School ID untuk menghubungkan sistem dengan data sekolah Anda.</p>
      <div style="display:flex;gap:10px">
        <input class="form-control" id="settingSchoolId" placeholder="Contoh: SCH-1739812345678" value="${schoolId||''}">
        <button class="btn btn-primary" onclick="saveSchoolId()">Simpan</button>
      </div>
    </div>
    <div class="card">
      <div class="card-title"><span>🔧</span> Diagnostik Sistem</div>
      <p style="font-size:.85rem;color:var(--text2);margin-bottom:14px">Periksa status database dan semua komponen sistem.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-outline" onclick="diagnose()">🔍 Diagnosa Database</button>
        <button class="btn btn-secondary" onclick="api('init_db').then(r=>toast(r.success?'success':'error','Init DB',r.message||''))">⚙️ Init Database</button>
      </div>
    </div>
    <div class="card">
      <div class="card-title"><span>📦</span> Informasi Sistem</div>
      <div style="display:flex;flex-direction:column;gap:8px;font-size:.85rem">
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text2)">Versi</span><span style="font-weight:700">4.0.0</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text2)">Platform</span><span>Google Apps Script</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text2)">Database</span><span>Google Sheets</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text2)">Fase</span><span>1 · 2 · 3 · 4 ✅</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0"><span style="color:var(--text2)">Self-Healing</span><span style="color:var(--success);font-weight:700">Aktif ✅</span></div>
      </div>
    </div>
  </div>
</div>
`;
}
