/**
 * ============================================================
 * UI.JS.GS — Frontend JavaScript untuk seluruh aplikasi
 * ============================================================
 */
function _getAppJS(schoolId) {
return `<script>
// ── State ──────────────────────────────────────────────────
const APP = {
  schoolId: '${schoolId||''}',
  baseUrl: window.location.href.split('?')[0],
  currentPage: 'dashboard',
  data: { transactions:[], stats:{}, rkkal:[] }
};

// ── Navigation ─────────────────────────────────────────────
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pg = document.getElementById('page-'+page);
  const nv = document.getElementById('nav-'+page);
  if (pg) pg.classList.add('active');
  if (nv) nv.classList.add('active');
  APP.currentPage = page;
  const titles = {
    dashboard:'Dashboard',input:'Input Data SPJ',data:'Lihat Transaksi',
    rkkal:'Upload RKKAL',realisasi:'Realisasi Anggaran',
    export:'Export Laporan',sekolah:'Daftar Sekolah',pengaturan:'Pengaturan'
  };
  document.getElementById('topbarTitle').textContent = titles[page]||page;
  closeSidebar();
  if (page==='dashboard') loadDashboard();
  if (page==='data') loadTransactions();
  if (page==='realisasi') loadRealisasi();
}

// ── Sidebar ────────────────────────────────────────────────
function toggleSidebar() {
  const s=document.getElementById('sidebar'), o=document.getElementById('sidebarOverlay');
  s.classList.toggle('open'); o.classList.toggle('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
}

// ── Loading ────────────────────────────────────────────────
function showLoading(msg) {
  document.getElementById('loadingText').textContent=msg||'Memproses...';
  document.getElementById('loadingOverlay').classList.add('show');
}
function hideLoading() { document.getElementById('loadingOverlay').classList.remove('show'); }

// ── Toast ──────────────────────────────────────────────────
function toast(type, title, body, dur) {
  const icons={success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'};
  const el=document.createElement('div');
  el.className='toast '+type;
  el.innerHTML='<span class="toast-icon">'+icons[type]+'</span>'
    +'<div class="toast-msg"><div class="toast-title">'+title+'</div>'
    +(body?'<div class="toast-body">'+body+'</div>':'')+'</div>'
    +'<button class="toast-close" onclick="this.parentElement.remove()">✕</button>';
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(()=>el.remove(), dur||4000);
}

// ── Modal ──────────────────────────────────────────────────
function openModal(title, bodyHTML, footerHTML) {
  document.getElementById('modalTitle').textContent=title;
  document.getElementById('modalBody').innerHTML=bodyHTML;
  document.getElementById('modalFooter').innerHTML=footerHTML||'';
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
document.getElementById('modalOverlay').addEventListener('click', function(e){
  if(e.target===this) closeModal();
});

// ── API Call ───────────────────────────────────────────────
async function api(action, params, method) {
  try {
    const p = Object.assign({action}, params||{});
    if(APP.schoolId) p.schoolId=APP.schoolId;
    if(method==='POST') {
      const r = await fetch(APP.baseUrl, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});
      return await r.json();
    }
    const r = await fetch(APP.baseUrl+'?'+new URLSearchParams(p));
    return await r.json();
  } catch(e) { return {success:false, error:e.message}; }
}

// ── Terbilang ──────────────────────────────────────────────
function numberToWords(n) {
  if(!n||n==0) return 'Nol Rupiah';
  n=Math.floor(Math.abs(n));
  const s=['','Satu','Dua','Tiga','Empat','Lima','Enam','Tujuh','Delapan','Sembilan'];
  const b=['Sepuluh','Sebelas','Dua Belas','Tiga Belas','Empat Belas','Lima Belas',
    'Enam Belas','Tujuh Belas','Delapan Belas','Sembilan Belas'];
  const p=['','','Dua Puluh','Tiga Puluh','Empat Puluh','Lima Puluh',
    'Enam Puluh','Tujuh Puluh','Delapan Puluh','Sembilan Puluh'];
  function b1000(x){let w='';if(x>=100){w+=(x>=200?s[Math.floor(x/100)]+' ':'')+'Seratus ';x%=100;}
    if(x>=20){w+=p[Math.floor(x/10)]+' ';x%=10;if(x>0)w+=s[x]+' ';}
    else if(x>=10){w+=b[x-10]+' ';}else if(x>0){w+=s[x]+' ';}return w;}
  let w='';
  if(n>=1000000000){w+=b1000(Math.floor(n/1000000000))+'Miliar ';n%=1000000000;}
  if(n>=1000000){w+=b1000(Math.floor(n/1000000))+'Juta ';n%=1000000;}
  if(n>=1000){const r=Math.floor(n/1000);w+=(r===1?'Seribu ':b1000(r)+'Ribu ');n%=1000;}
  w+=b1000(n);
  return w.trim()+' Rupiah';
}
function formatRp(n) { return 'Rp '+(parseFloat(n)||0).toLocaleString('id-ID'); }
function formatDate(s) {
  if(!s) return '-';
  try{return new Date(s).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});}catch(e){return s;}
}

// ── Dashboard ──────────────────────────────────────────────
async function loadDashboard() {
  showLoading('Memuat dashboard...');
  try {
    const r = await api('get_dashboard');
    if(r.success && r.data) {
      const d = r.data.summary||{};
      setEl('stat-total', d.total_transaksi||0);
      setEl('stat-amount', d.formatted_total||'Rp 0');
      setEl('stat-pending', d.pending_count||0);
      setEl('stat-verified', d.verified_count||0);
      setEl('stat-rejected', d.rejected_count||0);
      if(r.data.rkkal_summary) renderRKKALSummary(r.data.rkkal_summary);
      if(r.data.bulan_chart)   renderBarChart(r.data.bulan_chart);
    }
  } catch(e) { console.error(e); }
  hideLoading();
}

function setEl(id, val) { const el=document.getElementById(id); if(el) el.textContent=val; }

function renderBarChart(bulanData) {
  const months=['Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'];
  const short=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const vals = months.map(m => bulanData[m]?bulanData[m].total:0);
  const maxVal = Math.max(...vals) || 1;
  const container = document.getElementById('barChart');
  if(!container) return;
  container.innerHTML = vals.map((v,i) => {
    const h = Math.round((v/maxVal)*100);
    return '<div class="chart-bar-wrap">'
      +'<div class="chart-bar" style="height:'+h+'%" data-val="'+formatRp(v)+'"></div>'
      +'<span class="chart-month">'+short[i]+'</span></div>';
  }).join('');
}

function renderRKKALSummary(rkkal) {
  const el = document.getElementById('rkkalSummary');
  if(!el) return;
  const p = rkkal.persen_serap||0;
  const cls = p>=90?'danger':p>=75?'warn':'';
  el.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">'
    +'<div><div class="stat-label">Pagu Anggaran</div><div style="font-weight:800;color:var(--primary)">'+(rkkal.formatted_pagu||'Rp 0')+'</div></div>'
    +'<div><div class="stat-label">Total Realisasi</div><div style="font-weight:800;color:var(--success)">'+(rkkal.formatted_real||'Rp 0')+'</div></div>'
    +'</div>'
    +'<div class="stat-label" style="margin-bottom:6px">Penyerapan Anggaran ('+p+'%)</div>'
    +'<div class="progress-bar"><div class="progress-fill '+cls+'" style="width:'+Math.min(p,100)+'%"></div></div>';
}

// ── Transactions Table ─────────────────────────────────────
async function loadTransactions(page, search) {
  const tbody = document.getElementById('trxBody');
  if(!tbody) return;
  tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text3)"><div class="spinner" style="margin:0 auto 10px"></div>Memuat data...</td></tr>';
  const r = await api('get_data', {sheet:'Data_Transaksi', page:page||1, limit:25, search:search||''});
  if(!r.success || !r.data) {
    tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text3)">Tidak ada data</td></tr>';
    return;
  }
  APP.data.transactions = r.data.records||r.data||[];
  const rows = APP.data.transactions;
  if(!rows.length) {
    tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text3)">Belum ada transaksi</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map((t,i) => {
    const status = (t['Status_Verifikasi']||t.status_verifikasi||'pending').toLowerCase();
    const badgeCls = status==='verified'||status==='terverifikasi'?'badge-verified'
      : status==='rejected'||status==='ditolak'?'badge-rejected':'badge-pending';
    const jumlah = parseFloat(t['Jumlah_Rupiah']||t.jumlah_rupiah||0);
    return '<tr>'
      +'<td class="td-center">'+(i+1)+'</td>'
      +'<td>'+escHtml(t['Nama_Toko']||t.nama_toko||'-')+'</td>'
      +'<td><span style="font-size:.75rem;background:var(--primary-light);color:var(--primary);padding:2px 7px;border-radius:4px">'+escHtml((t['Kode_Anggaran']||t.kode_anggaran||'').substring(0,10))+'</span></td>'
      +'<td style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="'+escHtml(t['Uraian_Pembayaran']||'')+'">'+escHtml((t['Uraian_Pembayaran']||t.uraian_pembayaran||'-').substring(0,40))+'</td>'
      +'<td>'+escHtml(t['Bulan_Pelaksanaan']||t.bulan_pelaksanaan||'-')+'</td>'
      +'<td class="td-right" style="font-weight:700;color:var(--primary)">'+formatRp(jumlah)+'</td>'
      +'<td class="td-center"><span class="badge '+badgeCls+'">'+status+'</span></td>'
      +'<td class="td-center"><button class="btn btn-sm btn-outline" onclick="verifyTrx(\''+escHtml(t['ID_Transaksi']||t.id_transaksi||'')+'\')" title="Verifikasi">✅</button></td>'
      +'</tr>';
  }).join('');
  const pg = r.data.pagination||r.pagination||{};
  const pgEl = document.getElementById('pagination');
  if(pgEl && pg.pages > 1) {
    pgEl.innerHTML = Array.from({length:pg.pages},(_, i) =>
      '<button class="btn btn-sm '+(i+1===pg.page?'btn-primary':'btn-secondary')+'" onclick="loadTransactions('+(i+1)+')">'+' '+(i+1)+' </button>'
    ).join('');
  }
}

async function verifyTrx(id) {
  if(!id) return;
  const r = await api('verify_trans', {transactionId:id, action:'approve'});
  if(r.status==='success') { toast('success','Berhasil','Transaksi diverifikasi'); loadTransactions(); }
  else toast('error','Gagal', r.message||'Terjadi kesalahan');
}

function searchTrx() {
  const val = document.getElementById('searchInput')&&document.getElementById('searchInput').value;
  loadTransactions(1, val);
}

// ── Input SPJ Form ─────────────────────────────────────────
function updateTerbilang(val) {
  const el = document.getElementById('terbilangBox');
  if(el) el.textContent = val&&parseFloat(val) ? numberToWords(parseFloat(val)) : 'Terbilang akan muncul otomatis...';
}
function calcJumlah() {
  const qty = parseFloat(document.querySelector('[name=kuantitas]')&&document.querySelector('[name=kuantitas]').value)||1;
  const harga = parseFloat(document.getElementById('hargaSatuan')&&document.getElementById('hargaSatuan').value)||0;
  const total = qty*harga;
  const el = document.getElementById('jumlahInput');
  if(el && total > 0) { el.value = total; updateTerbilang(total); }
}

async function submitSPJ(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('[type=submit]');
  const errEl = document.getElementById('spjError');
  const okEl  = document.getElementById('spjSuccess');
  errEl.style.display='none'; okEl.style.display='none';
  btn.disabled=true; btn.innerHTML='<div class="spinner"></div> Menyimpan...';
  const fd = new FormData(form);
  const data = {};
  fd.forEach((v,k)=>data[k]=v);
  data.action='input_data';
  if(APP.schoolId) data.schoolId=APP.schoolId;
  try {
    const qs = new URLSearchParams(data).toString();
    const r = await fetch(APP.baseUrl+'?'+qs);
    const json = await r.json();
    if(json.status==='success') {
      okEl.innerHTML='<span class="alert-icon">✅</span><div><strong>Berhasil!</strong> '+json.message+'<br><small>ID: '+(json.data&&json.data.id_transaksi||'')+'</small></div>';
      okEl.style.display='flex';
      form.reset();
      updateTerbilang(0);
      toast('success','Data Tersimpan','Transaksi SPJ berhasil disimpan');
    } else {
      errEl.innerHTML='<span class="alert-icon">❌</span><div><strong>Gagal:</strong> '+(json.message||'Terjadi kesalahan')+(json.errors?'<br><small>'+json.errors.join(', ')+'</small>':'')+'</div>';
      errEl.style.display='flex';
    }
  } catch(err) {
    errEl.innerHTML='<span class="alert-icon">❌</span><div>Koneksi error: '+err.message+'</div>';
    errEl.style.display='flex';
  }
  btn.disabled=false; btn.innerHTML='💾 Simpan Data SPJ';
}

// ── Upload RKKAL ───────────────────────────────────────────
function initUploadZone() {
  const zone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('rkkalFile');
  if(!zone||!fileInput) return;
  zone.addEventListener('click', ()=>fileInput.click());
  zone.addEventListener('dragover', e=>{e.preventDefault();zone.classList.add('drag-over');});
  zone.addEventListener('dragleave', ()=>zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e=>{
    e.preventDefault(); zone.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if(f) { fileInput.files = e.dataTransfer.files; handleFileSelect(f); }
  });
  fileInput.addEventListener('change', ()=>{ if(fileInput.files[0]) handleFileSelect(fileInput.files[0]); });
}

function handleFileSelect(file) {
  document.getElementById('uploadFileName').textContent = file.name + ' ('+Math.round(file.size/1024)+' KB)';
  document.getElementById('uploadFileInfo').style.display = 'flex';
}

async function uploadRKKAL(e) {
  e.preventDefault();
  const fileInput = document.getElementById('rkkalFile');
  const schoolId = document.getElementById('rkkalSchoolId')&&document.getElementById('rkkalSchoolId').value||APP.schoolId;
  const tahun = document.getElementById('rkkalTahun')&&document.getElementById('rkkalTahun').value||2026;
  if(!fileInput||!fileInput.files[0]) { toast('warning','File Kosong','Pilih file CSV terlebih dahulu'); return; }
  showLoading('Mengupload RKKAL...');
  try {
    const text = await fileInput.files[0].text();
    const r = await api('upload_rkkal', {csvData:text, schoolId, tahunAnggaran:tahun}, 'POST');
    if(r.status==='success') {
      const d = r.data||{};
      document.getElementById('uploadResult').innerHTML = '<div class="alert alert-success"><span class="alert-icon">✅</span><div><strong>Upload Berhasil!</strong><br>'+d.rows_inserted+' baris diimpor dari '+d.total_rows+' total baris'+
        (d.rows_invalid>0?'<br><small style="color:var(--warning)">'+d.rows_invalid+' baris dilewati</small>':'')+'</div></div>';
      toast('success','Upload Berhasil', d.rows_inserted+' baris RKKAL diimpor');
    } else {
      document.getElementById('uploadResult').innerHTML = '<div class="alert alert-error"><span class="alert-icon">❌</span><div>'+r.message+'</div></div>';
    }
  } catch(err) { toast('error','Error',err.message); }
  hideLoading();
}

// ── Export ─────────────────────────────────────────────────
async function doExport(format) {
  showLoading('Membuat laporan '+format.toUpperCase()+'...');
  const period = document.getElementById('exportPeriod')&&document.getElementById('exportPeriod').value||'*';
  const tahun = document.getElementById('exportTahun')&&document.getElementById('exportTahun').value||new Date().getFullYear();
  try {
    const r = await api('export_'+format, {period, tahun, schoolId:APP.schoolId});
    if(r.status==='success' && r.data) {
      const d = r.data;
      document.getElementById('exportResult').innerHTML =
        '<div class="alert alert-success"><span class="alert-icon">✅</span><div>'
        +'<strong>Laporan berhasil dibuat!</strong><br>'+d.row_count+' data<br>'
        +(d.total_jumlah?'<small>Total: Rp '+parseFloat(d.total_jumlah).toLocaleString(\'id-ID\')+'</small><br>':'')
        +'<div style="display:flex;gap:8px;margin-top:10px">'
        +'<a href="'+d.file_url+'" target="_blank" class="btn btn-primary btn-sm">🔗 Buka</a>'
        +'<a href="'+d.download_url+'" target="_blank" class="btn btn-success btn-sm">⬇️ Download Excel</a>'
        +'</div></div></div>';
      toast('success','Laporan Siap','Klik tombol untuk membuka atau download');
    } else {
      document.getElementById('exportResult').innerHTML =
        '<div class="alert alert-warning"><span class="alert-icon">⚠️</span><div>'+(r.message||r.error||'Gagal membuat laporan')+'</div></div>';
    }
  } catch(err) { toast('error','Error',err.message); }
  hideLoading();
}

// ── Realisasi ──────────────────────────────────────────────
async function loadRealisasi() {
  const tbody = document.getElementById('rkkalBody');
  if(!tbody) return;
  tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text3)">Memuat data RKKAL...</td></tr>';
  const tahun = new Date().getFullYear();
  const r = await api('get_rkkal', {tahun, schoolId:APP.schoolId});
  const data = r.success&&r.data ? (Array.isArray(r.data)?r.data:[]) : [];
  if(!data.length) {
    tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text3)">Belum ada data RKKAL. Upload RKKAL terlebih dahulu.</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(r => {
    const pagu = parseFloat(r['Pagu_Anggaran']||0);
    const real = parseFloat(r['Total_Realisasi']||0);
    const pct  = pagu > 0 ? Math.round(real/pagu*100) : 0;
    const cls  = pct>=90?'danger':pct>=75?'warn':'';
    return '<tr>'
      +'<td><span style="font-size:.75rem;background:var(--primary-light);color:var(--primary);padding:2px 7px;border-radius:4px">'+escHtml(r['Kode_Akun']||'')+'</span></td>'
      +'<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escHtml(r['Uraian']||'-')+'</td>'
      +'<td class="td-right" style="font-weight:700">'+formatRp(pagu)+'</td>'
      +'<td class="td-right" style="color:var(--success);font-weight:700">'+formatRp(real)+'</td>'
      +'<td class="td-right" style="color:var(--danger)">'+formatRp(pagu-real)+'</td>'
      +'<td style="min-width:120px"><div class="progress-bar"><div class="progress-fill '+cls+'" style="width:'+Math.min(pct,100)+'%"></div></div>'
      +'<small style="font-size:.7rem;color:var(--text2)">'+pct+'%</small></td>'
      +'</tr>';
  }).join('');
}

// ── School Registration ────────────────────────────────────
async function registerSchool(e) {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const data = {};
  fd.forEach((v,k)=>data[k]=v);
  showLoading('Mendaftarkan sekolah...');
  try {
    const r = await api('register_school', data, 'POST');
    if(r.status==='success') {
      const sid = r.data&&r.data.school_id||'';
      document.getElementById('regResult').innerHTML =
        '<div class="alert alert-success"><span class="alert-icon">🎉</span><div>'
        +'<strong>Sekolah Berhasil Didaftarkan!</strong><br>'
        +'School ID: <strong style="font-size:1rem;color:var(--primary)">'+sid+'</strong><br>'
        +'<small>Simpan School ID ini untuk login dan penggunaan sistem</small></div></div>';
      APP.schoolId = sid;
      document.getElementById('topbarSchool').textContent = '🏫 '+sid;
      document.getElementById('sidebar').querySelector('.user-role').textContent = sid;
      toast('success','Terdaftar!', 'School ID: '+sid);
      form.reset();
    } else {
      document.getElementById('regResult').innerHTML =
        '<div class="alert alert-error"><span class="alert-icon">❌</span><div>'+r.message+'</div></div>';
    }
  } catch(err) { toast('error','Error',err.message); }
  hideLoading();
}

// ── Pengaturan ─────────────────────────────────────────────
function saveSchoolId() {
  const val = document.getElementById('settingSchoolId')&&document.getElementById('settingSchoolId').value.trim();
  if(!val) { toast('warning','Kosong','Masukkan School ID terlebih dahulu'); return; }
  APP.schoolId = val;
  document.getElementById('topbarSchool').textContent = '🏫 '+val;
  document.getElementById('sidebar').querySelector('.user-role').textContent = val;
  toast('success','Tersimpan','School ID berhasil disimpan');
}

async function diagnose() {
  showLoading('Memeriksa sistem...');
  const r = await api('diagnose');
  hideLoading();
  if(!r.ok && !r.success) { toast('error','Error',r.error||'Gagal diagnosa'); return; }
  const sheets = r.sheets||{};
  const lines = Object.entries(sheets).map(([name,info]) =>
    '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">'
    +'<span>'+name+'</span>'
    +'<span style="display:flex;gap:8px">'
    +(info.exists?'<span class="badge badge-verified">✅ Ada</span>':'<span class="badge badge-rejected">❌ Hilang</span>')
    +'<span class="badge badge-info">'+info.rows+' baris</span>'
    +'</span></div>'
  ).join('');
  openModal('🔧 Diagnosa Sistem', '<div style="font-size:.85rem">'+lines+'</div>'
    +'<div class="alert alert-info" style="margin-top:12px"><span>ℹ️</span><div>Self-Healing aktif — sheet yang hilang akan dibuat otomatis</div></div>',
    '<button class="btn btn-primary" onclick="closeModal()">Tutup</button>');
}

// ── Helpers ────────────────────────────────────────────────
function escHtml(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Init ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', function(){
  loadDashboard();
  initUploadZone();
});
</script>`;
}
