/**
 * ============================================================
 * MAIN.GS - Single Entry Point ERP Keuangan Sekolah Rakyat
 * Fase 2-4: Router terpadu semua aksi + trigger scheduler
 * ============================================================
 *
 * FILE LOAD ORDER (sesuai urutan di Apps Script):
 *   src/database/schema.gs
 *   src/database/database.gs
 *   src/modules/module.queue.gs
 *   src/modules/module.selfhealing.gs
 *   src/modules/module.telegram.gs
 *   src/modules/module.dashboard.gs
 *   src/controllers/controller.rkkal.gs     ← defines Controller
 *   src/controllers/controller.input.gs
 *   src/controllers/controller.export.gs
 *   src/controllers/controller.validation.gs
 *   src/controllers/controller.correction.gs
 *   src/main.gs
 */

// ── Response Helper ─────────────────────────────────────────
const Response = {
  json: function(obj) {
    return ContentService
      .createTextOutput(JSON.stringify(obj))
      .setMimeType(ContentService.MimeType.JSON);
  },
  html: function(htmlStr) {
    return HtmlService.createHtmlOutput(htmlStr);
  }
};

// ── HTTP Entry Points ────────────────────────────────────────
function doGet(e)  { return _route(e); }
function doPost(e) { return _route(e); }

// ── Router ───────────────────────────────────────────────────
function _route(e) {
  try {
    // Self-heal on every request (lightweight check)
    SelfHealing.checkAndHeal();

    const params   = e.parameter || {};
    const postBody = _parseBody(e);
    const p        = Object.assign({}, params, postBody); // merge GET + POST params
    const action   = p.action || 'dashboard';

    // Telegram webhook – no action param needed
    if (p.telegram_update) {
      const update = JSON.parse(p.telegram_update);
      TelegramBot.handleWebhook(update);
      return Response.json({ ok:true });
    }

    switch(action) {
      // ── Frontend HTML ───────────────────────────────
      case 'dashboard':      return _serveDashboardHTML(p);
      case 'input_form':     return _serveInputFormHTML(p);

      // ── Data Operations ─────────────────────────────
      case 'upload_rkkal':   return Controller.RKKAL.Upload.process(p);
      case 'input_data':     return Controller.Input.process(p);
      case 'export_excel':   return Controller.Export.process(p);
      case 'export_spj':     return Controller.Export.process(Object.assign(p,{format:'spj'}));
      case 'export_realisasi':return Controller.Export.process(Object.assign(p,{format:'realisasi'}));

      // ── Validation ──────────────────────────────────
      case 'verify_trans':   return Controller.Validation.verify(p);

      // ── Correction / School ─────────────────────────
      case 'edit_data':      return Controller.Correction.inlineEdit(p);
      case 'register_school':return Controller.School.register(p);
      case 'school_profile': return Response.json(Controller.School.getProfile(p.schoolId));

      // ── Queue ────────────────────────────────────────
      case 'check_spam':     return Response.json(Queue.check(p));
      case 'process_queue':  return Queue.process(p);

      // ── Dashboard & Analytics ────────────────────────
      case 'get_dashboard':  return Response.json(Dashboard.getData(p.schoolId, p.tahun));
      case 'admin_summary':  return Response.json(Dashboard.getAdminSummary());
      case 'school_stats':   return Response.json(Controller.School.getStats(p.schoolId));

      // ── Data View ────────────────────────────────────
      case 'get_data':       return Response.json(_handleGetData(p));
      case 'get_schools':    return Response.json({ success:true, data:Database.getAll(DB_CONFIG.SHEETS.SCHOOLS) });
      case 'get_rkkal':      return Response.json({ success:true, data:Controller.RKKAL.getTemplate(p.schoolId, p.tahun) });

      // ── System ──────────────────────────────────────
      case 'check_db':
      case 'health_check':   return Response.json(_healthCheck());
      case 'diagnose':       return Response.json(SelfHealing.diagnose());
      case 'init_db':        return Response.json({ success:!!initDatabase(), message:'Database initialized' });

      // ── Telegram Webhook ────────────────────────────
      case 'webhook':        return _handleTelegramWebhook(p);

      default:
        return _serveDashboardHTML(p);
    }

  } catch(err) {
    Logger.log('MAIN._route ERROR: '+err.message+'\n'+err.stack);
    return Response.json({
      status : 'error',
      message: 'Sistem error. Coba beberapa saat lagi.',
      logId  : 'ERR_'+Date.now()
    });
  }
}

// ── Parse POST body ──────────────────────────────────────────
function _parseBody(e) {
  try {
    if (e && e.postData && e.postData.contents) {
      return JSON.parse(e.postData.contents);
    }
  } catch(err) {}
  return {};
}

// ── Health check ─────────────────────────────────────────────
function _healthCheck() {
  const diag = SelfHealing.diagnose();
  return {
    status   : diag.ok ? 'healthy' : 'degraded',
    version  : '4.0.0',
    database : diag.ok ? 'connected' : 'error',
    sheets   : diag.sheets || {},
    timestamp: new Date().toISOString()
  };
}

// ── Get data with pagination & search ────────────────────────
function _handleGetData(params) {
  try {
    const sheetName = params.sheet || DB_CONFIG.SHEETS.TRANSACTIONS;
    const page      = parseInt(params.page) || 1;
    const limit     = Math.min(parseInt(params.limit) || 50, 200);
    const search    = (params.search || '').toLowerCase();
    const schoolId  = params.schoolId || '';

    let data = Database.getAll(sheetName);

    if (schoolId) data = data.filter(r => r['School_ID'] === schoolId);
    if (search)   data = data.filter(r =>
      Object.values(r).some(v => (v||'').toString().toLowerCase().includes(search))
    );

    const total = data.length;
    const start = (page-1)*limit;
    const paged = data.slice(start, start+limit);

    return {
      success: true,
      data   : paged,
      pagination: { page, limit, total, pages: Math.ceil(total/limit) }
    };
  } catch(e) {
    return { success:false, error: e.message };
  }
}

// ── Telegram webhook handler ──────────────────────────────────
function _handleTelegramWebhook(params) {
  try {
    const body = params._rawBody || params;
    TelegramBot.handleWebhook(body);
    return Response.json({ ok:true });
  } catch(e) {
    return Response.json({ ok:false, error:e.message });
  }
}

// ── Dashboard HTML ────────────────────────────────────────────
function _serveDashboardHTML(params) {
  const schoolId = params.schoolId || '';
  const dashData = Dashboard.getData(schoolId, params.tahun);
  const d = (dashData.data && dashData.data.summary) ? dashData.data.summary : {};

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ERP Keuangan Sekolah Rakyat</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#f0f2f5;color:#333}
.navbar{background:linear-gradient(135deg,#1a237e,#283593);color:#fff;padding:14px 24px;display:flex;align-items:center;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,.3)}
.navbar h1{font-size:1.2rem;font-weight:700}
.nav-links{margin-left:auto;display:flex;gap:8px}
.nav-links a{color:#fff;text-decoration:none;padding:6px 14px;border-radius:20px;background:rgba(255,255,255,.15);font-size:.85rem;transition:.2s}
.nav-links a:hover{background:rgba(255,255,255,.3)}
.container{max-width:1200px;margin:0 auto;padding:24px}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px}
.stat-card{background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.07);border-left:4px solid #1a237e}
.stat-card.green{border-left-color:#2e7d32}.stat-card.orange{border-left-color:#e65100}.stat-card.red{border-left-color:#c62828}
.stat-label{font-size:.78rem;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.stat-value{font-size:1.6rem;font-weight:700;color:#1a237e}
.stat-card.green .stat-value{color:#2e7d32}.stat-card.orange .stat-value{color:#e65100}.stat-card.red .stat-value{color:#c62828}
.card{background:#fff;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,.07);margin-bottom:20px}
.card h2{font-size:1rem;color:#555;margin-bottom:16px;border-bottom:2px solid #f0f2f5;padding-bottom:10px}
.btn{display:inline-block;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:.9rem;cursor:pointer;border:none;transition:.2s}
.btn-primary{background:#1a237e;color:#fff}.btn-primary:hover{background:#283593}
.btn-success{background:#2e7d32;color:#fff}.btn-success:hover{background:#388e3c}
.btn-warning{background:#e65100;color:#fff}.btn-warning:hover{background:#f4511e}
.btn-info{background:#0277bd;color:#fff}.btn-info:hover{background:#0288d1}
.action-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
.action-card{background:linear-gradient(135deg,#1a237e,#3949ab);color:#fff;border-radius:12px;padding:20px;text-align:center;cursor:pointer;text-decoration:none;transition:.2s;display:block}
.action-card:hover{transform:translateY(-3px);box-shadow:0 6px 20px rgba(26,35,126,.4)}
.action-card.green{background:linear-gradient(135deg,#2e7d32,#43a047)}
.action-card.orange{background:linear-gradient(135deg,#e65100,#fb8c00)}
.action-card.purple{background:linear-gradient(135deg,#6a1b9a,#8e24aa)}
.action-card.teal{background:linear-gradient(135deg,#00695c,#00897b)}
.action-icon{font-size:2rem;margin-bottom:8px}
.action-label{font-size:.85rem;font-weight:600}
.status-badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:.75rem;font-weight:600}
.badge-pending{background:#fff3e0;color:#e65100}
.badge-verified{background:#e8f5e9;color:#2e7d32}
.badge-rejected{background:#ffebee;color:#c62828}
footer{text-align:center;padding:20px;color:#aaa;font-size:.8rem}
.system-info{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.system-info span{background:#e8eaf6;color:#3949ab;padding:3px 10px;border-radius:12px;font-size:.75rem}
</style>
</head>
<body>
<div class="navbar">
  <span style="font-size:1.5rem">🏫</span>
  <h1>ERP Keuangan Sekolah Rakyat</h1>
  <div class="nav-links">
    <a href="?action=dashboard">Dashboard</a>
    <a href="?action=input_form">Input Data</a>
    <a href="?action=get_data">Lihat Data</a>
    <a href="?action=health_check">Status</a>
  </div>
</div>

<div class="container">

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Total Transaksi</div>
      <div class="stat-value">${d.total_transaksi || 0}</div>
    </div>
    <div class="stat-card green">
      <div class="stat-label">Total Pengeluaran</div>
      <div class="stat-value" style="font-size:1.1rem">${d.formatted_total || 'Rp 0'}</div>
    </div>
    <div class="stat-card orange">
      <div class="stat-label">Menunggu Verifikasi</div>
      <div class="stat-value">${d.pending_count || 0}</div>
    </div>
    <div class="stat-card green">
      <div class="stat-label">Terverifikasi</div>
      <div class="stat-value">${d.verified_count || 0}</div>
    </div>
    <div class="stat-card red">
      <div class="stat-label">Ditolak</div>
      <div class="stat-value">${d.rejected_count || 0}</div>
    </div>
  </div>

  <div class="card">
    <h2>⚡ Aksi Cepat</h2>
    <div class="action-grid">
      <a class="action-card" href="?action=input_form">
        <div class="action-icon">📝</div>
        <div class="action-label">Input Data SPJ</div>
      </a>
      <a class="action-card orange" href="?action=export_spj&schoolId=${schoolId}&period=${new Date().getFullYear()}">
        <div class="action-icon">📊</div>
        <div class="action-label">Export SPJ Excel</div>
      </a>
      <a class="action-card green" href="?action=export_realisasi&schoolId=${schoolId}&tahun=${new Date().getFullYear()}">
        <div class="action-icon">📈</div>
        <div class="action-label">Export Realisasi</div>
      </a>
      <a class="action-card purple" href="?action=get_data&sheet=Data_Transaksi">
        <div class="action-icon">🔍</div>
        <div class="action-label">Lihat Transaksi</div>
      </a>
      <a class="action-card teal" href="?action=diagnose">
        <div class="action-icon">🔧</div>
        <div class="action-label">Diagnosa Sistem</div>
      </a>
      <a class="action-card" style="background:linear-gradient(135deg,#880e4f,#c2185b)" href="?action=get_dashboard&schoolId=${schoolId}">
        <div class="action-icon">📉</div>
        <div class="action-label">Data Analytics</div>
      </a>
    </div>
  </div>

  <div class="card">
    <h2>ℹ️ Informasi Sistem</h2>
    <div class="system-info">
      <span>✅ Fase 1: Self-Healing DB</span>
      <span>✅ Fase 2: Input & Upload RKKAL</span>
      <span>✅ Fase 2: Export Excel/SPJ</span>
      <span>✅ Fase 3: Telegram Bot</span>
      <span>✅ Fase 3: Multi-Tenancy</span>
      <span>✅ Fase 4: Dashboard Analytics</span>
      <span>✅ Fase 4: Budget Alerts</span>
      <span>✅ Cloudflare Worker Gateway</span>
    </div>
  </div>

</div>
<footer>© ${new Date().getFullYear()} Sistem ERP Keuangan Sekolah Rakyat v4.0.0 | Dibangun dengan Google Apps Script</footer>
</body>
</html>`;

  return HtmlService.createHtmlOutput(html)
    .setTitle('ERP Keuangan Sekolah Rakyat')
    .addMetaTag('viewport','width=device-width,initial-scale=1');
}

// ── Input Form HTML ───────────────────────────────────────────
function _serveInputFormHTML(params) {
  const months = ['Januari','Februari','Maret','April','Mei','Juni',
                  'Juli','Agustus','September','Oktober','November','Desember'];
  const currentYear = new Date().getFullYear();
  const monthOptions = months.map(m=>`<option>${m}</option>`).join('');
  const yearOptions  = [currentYear+1,currentYear,currentYear-1].map(y=>`<option ${y===currentYear?'selected':''}>${y}</option>`).join('');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Input Data SPJ - ERP Sekolah Rakyat</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#f0f2f5;color:#333}
.navbar{background:linear-gradient(135deg,#1a237e,#283593);color:#fff;padding:14px 24px;display:flex;align-items:center;gap:12px}
.navbar h1{font-size:1.1rem}
.container{max-width:700px;margin:30px auto;padding:0 16px}
.card{background:#fff;border-radius:14px;padding:30px;box-shadow:0 4px 16px rgba(0,0,0,.1)}
.card h2{font-size:1.2rem;color:#1a237e;margin-bottom:24px;border-bottom:2px solid #e8eaf6;padding-bottom:12px}
.form-group{margin-bottom:18px}
label{display:block;font-weight:600;font-size:.88rem;color:#555;margin-bottom:6px}
input,select,textarea{width:100%;padding:11px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:.95rem;outline:none;transition:.2s}
input:focus,select:focus,textarea:focus{border-color:#1a237e;box-shadow:0 0 0 3px rgba(26,35,126,.1)}
.row-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.btn{width:100%;padding:13px;border-radius:10px;border:none;font-size:1rem;font-weight:700;cursor:pointer;transition:.2s}
.btn-submit{background:linear-gradient(135deg,#1a237e,#3949ab);color:#fff}
.btn-submit:hover{opacity:.9;transform:translateY(-1px)}
.alert{padding:14px;border-radius:8px;margin-bottom:16px;display:none;font-size:.9rem}
.alert-success{background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7}
.alert-error{background:#ffebee;color:#c62828;border:1px solid #ef9a9a}
.terbilang-preview{background:#e8eaf6;padding:10px 14px;border-radius:8px;font-size:.85rem;color:#3949ab;margin-top:8px;min-height:36px}
.back-link{display:inline-block;margin-bottom:16px;color:#1a237e;text-decoration:none;font-size:.9rem}
</style>
</head>
<body>
<div class="navbar">
  <span style="font-size:1.4rem">📝</span>
  <h1>Input Data SPJ - ERP Keuangan Sekolah Rakyat</h1>
</div>
<div class="container">
  <a class="back-link" href="?action=dashboard">← Kembali ke Dashboard</a>

  <div class="card">
    <h2>📋 Form Input Data SPJ</h2>
    <div class="alert alert-success" id="alert-success"></div>
    <div class="alert alert-error"   id="alert-error"></div>

    <form id="spjForm">
      <div class="row-2">
        <div class="form-group">
          <label>School ID</label>
          <input name="schoolId" placeholder="Contoh: SCH-12345" value="${params.schoolId||''}">
        </div>
        <div class="form-group">
          <label>Nama Toko / Vendor *</label>
          <input name="namaToko" placeholder="Nama toko/vendor" required>
        </div>
      </div>

      <div class="form-group">
        <label>Uraian MAK (Kode + Nama Anggaran) *</label>
        <input name="kodeAnggaran" placeholder="521111 - Belanja Keperluan Perkantoran" required>
      </div>

      <div class="form-group">
        <label>Uraian Pembayaran *</label>
        <textarea name="uraianPembayaran" rows="2" placeholder="Deskripsi detail pembayaran..." required></textarea>
      </div>

      <div class="row-2">
        <div class="form-group">
          <label>Tahun Anggaran *</label>
          <select name="tahunAnggaran">${yearOptions}</select>
        </div>
        <div class="form-group">
          <label>Bulan Pelaksanaan *</label>
          <select name="bulanPelaksanaan">${monthOptions}</select>
        </div>
      </div>

      <div class="row-2">
        <div class="form-group">
          <label>Kuantitas</label>
          <input name="kuantitas" type="number" placeholder="1" value="1" min="1">
        </div>
        <div class="form-group">
          <label>Harga Satuan (Rp)</label>
          <input name="hargaSatuan" type="number" placeholder="0" min="0" id="hargaSatuan" oninput="updateJumlah()">
        </div>
      </div>

      <div class="form-group">
        <label>Jumlah Total (Rp) *</label>
        <input name="jumlahRupiah" type="number" placeholder="0" id="jumlahInput" required oninput="updateTerbilang(this.value)">
        <div class="terbilang-preview" id="terbilangPreview">Terbilang akan muncul di sini...</div>
      </div>

      <div class="form-group">
        <label>Catatan (opsional)</label>
        <input name="catatan" placeholder="Catatan tambahan...">
      </div>

      <button type="submit" class="btn btn-submit">💾 Simpan Data SPJ</button>
    </form>
  </div>
</div>

<script>
const SCRIPT_URL = window.location.href.split('?')[0];

function numberToWords(n){
  if(!n||n==0)return'Nol Rupiah';
  n=Math.floor(Math.abs(n));
  const s=['','Satu','Dua','Tiga','Empat','Lima','Enam','Tujuh','Delapan','Sembilan'];
  const b=['Sepuluh','Sebelas','Dua Belas','Tiga Belas','Empat Belas','Lima Belas','Enam Belas','Tujuh Belas','Delapan Belas','Sembilan Belas'];
  const p=['','','Dua Puluh','Tiga Puluh','Empat Puluh','Lima Puluh','Enam Puluh','Tujuh Puluh','Delapan Puluh','Sembilan Puluh'];
  function b1000(x){let w='';if(x>=100){w+=(x>=200?s[Math.floor(x/100)]+' ':'')+'Seratus ';x%=100;}if(x>=20){w+=p[Math.floor(x/10)]+' ';x%=10;if(x>0)w+=s[x]+' ';}else if(x>=10){w+=b[x-10]+' ';}else if(x>0){w+=s[x]+' ';}return w;}
  let w='';
  if(n>=1000000000){w+=b1000(Math.floor(n/1000000000))+'Miliar ';n%=1000000000;}
  if(n>=1000000){w+=b1000(Math.floor(n/1000000))+'Juta ';n%=1000000;}
  if(n>=1000){const r=Math.floor(n/1000);w+=(r===1?'Seribu ':b1000(r)+'Ribu ');n%=1000;}
  w+=b1000(n);
  return w.trim()+' Rupiah';
}

function updateTerbilang(val){
  document.getElementById('terbilangPreview').textContent = val ? numberToWords(parseFloat(val)) : 'Terbilang akan muncul di sini...';
}

function updateJumlah(){
  const qty  = parseFloat(document.querySelector('[name="kuantitas"]').value)||1;
  const harga= parseFloat(document.getElementById('hargaSatuan').value)||0;
  const total= qty*harga;
  document.getElementById('jumlahInput').value = total||'';
  updateTerbilang(total);
}

document.getElementById('spjForm').addEventListener('submit', async function(e){
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.textContent='⏳ Menyimpan...'; btn.disabled=true;
  const fd = new FormData(e.target);
  const data = {};
  fd.forEach((v,k)=>data[k]=v);
  data.action='input_data';
  const qs = new URLSearchParams(data).toString();
  try{
    const resp = await fetch(SCRIPT_URL+'?'+qs);
    const json = await resp.json();
    if(json.status==='success'){
      document.getElementById('alert-success').style.display='block';
      document.getElementById('alert-success').textContent='✅ '+json.message+' | ID: '+(json.data&&json.data.id_transaksi||'');
      document.getElementById('alert-error').style.display='none';
      e.target.reset();
      document.getElementById('terbilangPreview').textContent='Terbilang akan muncul di sini...';
    } else {
      document.getElementById('alert-error').style.display='block';
      document.getElementById('alert-error').textContent='❌ '+(json.message||'Gagal menyimpan data')+(json.errors?': '+json.errors.join(', '):'');
      document.getElementById('alert-success').style.display='none';
    }
  }catch(err){
    document.getElementById('alert-error').style.display='block';
    document.getElementById('alert-error').textContent='❌ Koneksi error: '+err.message;
  }
  btn.textContent='💾 Simpan Data SPJ'; btn.disabled=false;
});
</script>
</body>
</html>`;

  return HtmlService.createHtmlOutput(html)
    .setTitle('Input Data SPJ')
    .addMetaTag('viewport','width=device-width,initial-scale=1');
}

// ── Time-based Triggers (set via Apps Script trigger panel) ───

/** Jalankan setiap hari pukul 07:00 */
function dailyMorningJobs() {
  try {
    SelfHealing.checkAndHeal();
    Dashboard.checkBudgetAlerts();
    Logger.log('Daily morning jobs selesai');
  } catch(e) { Logger.log('dailyMorningJobs ERROR: '+e.message); }
}

/** Jalankan setiap tanggal 1 bulan baru */
function monthlyReportTrigger() {
  try {
    TelegramBot.triggerMonthlyReports();
    Logger.log('Monthly reports terkirim');
  } catch(e) { Logger.log('monthlyReportTrigger ERROR: '+e.message); }
}

/** Jalankan saat spreadsheet dibuka */
function onOpen() {
  try {
    SelfHealing.checkAndHeal();
    Logger.log('onOpen: self-healing selesai');
  } catch(e) {}
}
