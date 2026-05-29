/**
 * ============================================================
 * STYLE.CSS.GS — Global CSS untuk seluruh UI ERP Sekolah Rakyat
 * Responsive: Desktop (1200px+) | Tablet (768px) | Mobile (480px)
 * ============================================================
 */
function _getGlobalCSS() {
  return `
<style>
/* ── Reset & Base ─────────────────────────────────────────── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --primary:#1565c0;--primary-dark:#0d47a1;--primary-light:#e3f2fd;
  --secondary:#00897b;--accent:#f57c00;--danger:#c62828;
  --success:#2e7d32;--warning:#f9a825;--info:#0277bd;
  --bg:#f4f6fb;--surface:#ffffff;--surface2:#f8faff;
  --border:#e0e7ef;--text:#1a2340;--text2:#5a6a85;--text3:#8fa3be;
  --shadow:0 2px 12px rgba(21,101,192,.10);
  --shadow-lg:0 8px 32px rgba(21,101,192,.18);
  --radius:14px;--radius-sm:8px;--radius-xs:6px;
  --font:'Inter','Segoe UI',system-ui,sans-serif;
  --sidebar-w:260px;--topbar-h:64px;
  --transition:.2s cubic-bezier(.4,0,.2,1);
}
html{font-size:15px;-webkit-font-smoothing:antialiased}
body{font-family:var(--font);background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden}
a{color:inherit;text-decoration:none}
button{cursor:pointer;font-family:inherit}
input,select,textarea{font-family:inherit}
img{max-width:100%;display:block}

/* ── Scrollbar ────────────────────────────────────────────── */
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:var(--border)}
::-webkit-scrollbar-thumb{background:var(--primary-light);border-radius:99px}
::-webkit-scrollbar-thumb:hover{background:var(--primary)}

/* ── Layout Shell ─────────────────────────────────────────── */
.app-shell{display:flex;min-height:100vh}
.sidebar{position:fixed;top:0;left:0;width:var(--sidebar-w);height:100vh;
  background:linear-gradient(180deg,var(--primary-dark) 0%,#1a237e 100%);
  display:flex;flex-direction:column;z-index:200;transition:transform var(--transition);
  box-shadow:4px 0 24px rgba(0,0,0,.18)}
.sidebar-header{padding:22px 20px 16px;border-bottom:1px solid rgba(255,255,255,.12)}
.sidebar-logo{display:flex;align-items:center;gap:12px}
.sidebar-logo .logo-icon{font-size:2rem;line-height:1}
.sidebar-logo .logo-text{color:#fff}
.sidebar-logo .logo-text h2{font-size:1rem;font-weight:700;letter-spacing:.2px}
.sidebar-logo .logo-text p{font-size:.72rem;color:rgba(255,255,255,.6);margin-top:2px}
.sidebar-nav{flex:1;overflow-y:auto;padding:12px 0}
.nav-section-title{padding:10px 20px 4px;font-size:.68rem;color:rgba(255,255,255,.4);
  text-transform:uppercase;letter-spacing:1.2px;font-weight:600}
.nav-item{display:flex;align-items:center;gap:12px;padding:11px 20px;color:rgba(255,255,255,.75);
  font-size:.88rem;font-weight:500;border-radius:0;transition:all var(--transition);
  cursor:pointer;border-left:3px solid transparent;margin:1px 0}
.nav-item:hover{background:rgba(255,255,255,.08);color:#fff;border-left-color:rgba(255,255,255,.3)}
.nav-item.active{background:rgba(255,255,255,.15);color:#fff;border-left-color:#64b5f6}
.nav-item .nav-icon{font-size:1.1rem;width:22px;text-align:center;flex-shrink:0}
.nav-item .nav-badge{margin-left:auto;background:#f57c00;color:#fff;font-size:.68rem;
  font-weight:700;padding:2px 7px;border-radius:99px}
.sidebar-footer{padding:16px 20px;border-top:1px solid rgba(255,255,255,.12)}
.sidebar-footer .user-info{display:flex;align-items:center;gap:10px}
.user-avatar{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.2);
  display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0}
.user-name{color:#fff;font-size:.82rem;font-weight:600}
.user-role{color:rgba(255,255,255,.55);font-size:.72rem}

/* ── Topbar ───────────────────────────────────────────────── */
.topbar{position:fixed;top:0;left:var(--sidebar-w);right:0;height:var(--topbar-h);
  background:var(--surface);border-bottom:1px solid var(--border);
  display:flex;align-items:center;padding:0 24px;gap:16px;z-index:100;
  box-shadow:0 2px 8px rgba(0,0,0,.06)}
.topbar-toggle{display:none;background:none;border:none;font-size:1.4rem;
  color:var(--text2);padding:6px;border-radius:var(--radius-xs)}
.topbar-title{font-size:1.05rem;font-weight:700;color:var(--text)}
.topbar-right{margin-left:auto;display:flex;align-items:center;gap:12px}
.topbar-btn{background:none;border:1.5px solid var(--border);color:var(--text2);
  padding:7px 14px;border-radius:var(--radius-sm);font-size:.82rem;font-weight:600;
  display:flex;align-items:center;gap:6px;transition:all var(--transition)}
.topbar-btn:hover{border-color:var(--primary);color:var(--primary);background:var(--primary-light)}
.topbar-school{font-size:.8rem;color:var(--text2);background:var(--surface2);
  padding:6px 12px;border-radius:var(--radius-sm);border:1px solid var(--border)}

/* ── Main Content ─────────────────────────────────────────── */
.main-content{margin-left:var(--sidebar-w);margin-top:var(--topbar-h);
  padding:28px;min-height:calc(100vh - var(--topbar-h));transition:margin var(--transition)}
.page{display:none}.page.active{display:block}
.page-header{margin-bottom:24px}
.page-header h1{font-size:1.5rem;font-weight:800;color:var(--text)}
.page-header p{color:var(--text2);font-size:.9rem;margin-top:4px}

/* ── Cards ────────────────────────────────────────────────── */
.card{background:var(--surface);border-radius:var(--radius);padding:24px;
  box-shadow:var(--shadow);border:1px solid var(--border)}
.card-title{font-size:.95rem;font-weight:700;color:var(--text);margin-bottom:16px;
  padding-bottom:12px;border-bottom:2px solid var(--bg);
  display:flex;align-items:center;gap:8px}
.card-title span{font-size:1.1rem}

/* ── Stat Cards ───────────────────────────────────────────── */
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
.stat-card{background:var(--surface);border-radius:var(--radius);padding:20px;
  border:1px solid var(--border);box-shadow:var(--shadow);
  display:flex;align-items:flex-start;gap:16px;position:relative;overflow:hidden}
.stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}
.stat-card.blue::before{background:linear-gradient(90deg,var(--primary),var(--info))}
.stat-card.green::before{background:linear-gradient(90deg,var(--success),#43a047)}
.stat-card.orange::before{background:linear-gradient(90deg,var(--accent),#ffd54f)}
.stat-card.red::before{background:linear-gradient(90deg,var(--danger),#ef5350)}
.stat-card.teal::before{background:linear-gradient(90deg,var(--secondary),#26a69a)}
.stat-icon{width:48px;height:48px;border-radius:var(--radius-sm);display:flex;
  align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0}
.stat-card.blue .stat-icon{background:var(--primary-light);color:var(--primary)}
.stat-card.green .stat-icon{background:#e8f5e9;color:var(--success)}
.stat-card.orange .stat-icon{background:#fff3e0;color:var(--accent)}
.stat-card.red .stat-icon{background:#ffebee;color:var(--danger)}
.stat-card.teal .stat-icon{background:#e0f2f1;color:var(--secondary)}
.stat-info{flex:1;min-width:0}
.stat-label{font-size:.75rem;color:var(--text3);text-transform:uppercase;
  letter-spacing:.6px;font-weight:600;margin-bottom:4px}
.stat-value{font-size:1.55rem;font-weight:800;color:var(--text);line-height:1.1}
.stat-sub{font-size:.75rem;color:var(--text2);margin-top:4px}
.stat-trend{font-size:.72rem;font-weight:600;padding:2px 7px;border-radius:99px;margin-top:6px;display:inline-block}
.stat-trend.up{background:#e8f5e9;color:var(--success)}
.stat-trend.down{background:#ffebee;color:var(--danger)}

/* ── Action Grid ──────────────────────────────────────────── */
.action-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}
.action-btn{background:var(--surface2);border:2px solid var(--border);border-radius:var(--radius);
  padding:20px 12px;text-align:center;cursor:pointer;transition:all var(--transition);
  display:flex;flex-direction:column;align-items:center;gap:10px}
.action-btn:hover{border-color:var(--primary);background:var(--primary-light);
  transform:translateY(-3px);box-shadow:var(--shadow-lg)}
.action-btn:active{transform:translateY(0)}
.action-btn .ab-icon{font-size:1.8rem;line-height:1}
.action-btn .ab-label{font-size:.8rem;font-weight:700;color:var(--text);line-height:1.3}
.action-btn.primary{background:linear-gradient(135deg,var(--primary),#1976d2);border-color:transparent}
.action-btn.primary .ab-label,.action-btn.primary .ab-icon{color:#fff}
.action-btn.primary:hover{background:linear-gradient(135deg,var(--primary-dark),var(--primary));
  border-color:transparent;transform:translateY(-3px)}
.action-btn.green{background:linear-gradient(135deg,var(--success),#388e3c);border-color:transparent}
.action-btn.green .ab-label,.action-btn.green .ab-icon{color:#fff}
.action-btn.orange{background:linear-gradient(135deg,var(--accent),#ef6c00);border-color:transparent}
.action-btn.orange .ab-label,.action-btn.orange .ab-icon{color:#fff}
.action-btn.teal{background:linear-gradient(135deg,var(--secondary),#00796b);border-color:transparent}
.action-btn.teal .ab-label,.action-btn.teal .ab-icon{color:#fff}
.action-btn.purple{background:linear-gradient(135deg,#6a1b9a,#8e24aa);border-color:transparent}
.action-btn.purple .ab-label,.action-btn.purple .ab-icon{color:#fff}

/* ── Forms ────────────────────────────────────────────────── */
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.form-group{display:flex;flex-direction:column;gap:6px}
.form-group.full{grid-column:1/-1}
.form-label{font-size:.82rem;font-weight:700;color:var(--text2)}
.form-label .req{color:var(--danger)}
.form-control{padding:11px 14px;border:1.5px solid var(--border);border-radius:var(--radius-sm);
  font-size:.9rem;color:var(--text);background:var(--surface);outline:none;
  transition:border-color var(--transition),box-shadow var(--transition);width:100%}
.form-control:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(21,101,192,.1)}
.form-control.error{border-color:var(--danger);box-shadow:0 0 0 3px rgba(198,40,40,.1)}
.form-hint{font-size:.75rem;color:var(--text3)}
.terbilang-box{background:var(--primary-light);border:1.5px solid #90caf9;
  border-radius:var(--radius-sm);padding:10px 14px;font-size:.82rem;
  color:var(--primary-dark);font-style:italic;font-weight:600;min-height:38px}

/* ── Buttons ──────────────────────────────────────────────── */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
  padding:10px 20px;border-radius:var(--radius-sm);font-size:.88rem;font-weight:700;
  border:none;cursor:pointer;transition:all var(--transition);white-space:nowrap}
.btn:disabled{opacity:.6;cursor:not-allowed}
.btn-primary{background:var(--primary);color:#fff}
.btn-primary:hover:not(:disabled){background:var(--primary-dark);box-shadow:0 4px 16px rgba(21,101,192,.35)}
.btn-success{background:var(--success);color:#fff}
.btn-success:hover:not(:disabled){background:#1b5e20;box-shadow:0 4px 16px rgba(46,125,50,.35)}
.btn-danger{background:var(--danger);color:#fff}
.btn-danger:hover:not(:disabled){background:#b71c1c}
.btn-outline{background:transparent;color:var(--primary);border:2px solid var(--primary)}
.btn-outline:hover:not(:disabled){background:var(--primary-light)}
.btn-secondary{background:var(--surface2);color:var(--text2);border:1.5px solid var(--border)}
.btn-secondary:hover:not(:disabled){background:var(--border);color:var(--text)}
.btn-lg{padding:13px 28px;font-size:.95rem}
.btn-sm{padding:6px 14px;font-size:.78rem}
.btn-block{width:100%}
.btn-icon{width:36px;height:36px;padding:0;border-radius:var(--radius-xs)}

/* ── Table ────────────────────────────────────────────────── */
.table-wrapper{overflow-x:auto;border-radius:var(--radius-sm);border:1px solid var(--border)}
table{width:100%;border-collapse:collapse;font-size:.84rem}
thead tr{background:var(--primary);color:#fff}
thead th{padding:13px 14px;text-align:left;font-weight:700;font-size:.78rem;
  letter-spacing:.4px;text-transform:uppercase;white-space:nowrap}
tbody tr{border-bottom:1px solid var(--border);transition:background var(--transition)}
tbody tr:hover{background:var(--primary-light)}
tbody tr:last-child{border-bottom:none}
tbody td{padding:12px 14px;color:var(--text);vertical-align:middle}
.td-right{text-align:right}
.td-center{text-align:center}

/* ── Badges ───────────────────────────────────────────────── */
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;
  border-radius:99px;font-size:.72rem;font-weight:700}
.badge-pending{background:#fff3e0;color:#e65100}
.badge-verified{background:#e8f5e9;color:var(--success)}
.badge-rejected{background:#ffebee;color:var(--danger)}
.badge-imported{background:#e3f2fd;color:var(--primary)}
.badge-info{background:var(--primary-light);color:var(--primary)}

/* ── Alerts ───────────────────────────────────────────────── */
.alert{padding:14px 16px;border-radius:var(--radius-sm);font-size:.88rem;
  display:flex;align-items:flex-start;gap:10px;margin-bottom:16px}
.alert-success{background:#e8f5e9;color:#1b5e20;border-left:4px solid var(--success)}
.alert-error{background:#ffebee;color:#b71c1c;border-left:4px solid var(--danger)}
.alert-warning{background:#fffde7;color:#e65100;border-left:4px solid var(--warning)}
.alert-info{background:var(--primary-light);color:var(--primary-dark);border-left:4px solid var(--primary)}
.alert .alert-icon{font-size:1.1rem;flex-shrink:0;margin-top:1px}
.alert-close{margin-left:auto;background:none;border:none;font-size:1rem;
  cursor:pointer;color:inherit;opacity:.6;padding:0 4px}
.alert-close:hover{opacity:1}

/* ── Progress Bar ─────────────────────────────────────────── */
.progress-bar{height:8px;background:var(--border);border-radius:99px;overflow:hidden}
.progress-fill{height:100%;border-radius:99px;transition:width .6s ease;
  background:linear-gradient(90deg,var(--primary),var(--secondary))}
.progress-fill.warn{background:linear-gradient(90deg,var(--warning),var(--accent))}
.progress-fill.danger{background:linear-gradient(90deg,var(--danger),#ef5350)}

/* ── Tabs ─────────────────────────────────────────────────── */
.tabs{display:flex;border-bottom:2px solid var(--border);margin-bottom:20px;gap:4px}
.tab-btn{padding:10px 18px;background:none;border:none;font-size:.88rem;font-weight:600;
  color:var(--text2);cursor:pointer;border-bottom:2px solid transparent;
  margin-bottom:-2px;transition:all var(--transition);border-radius:var(--radius-sm) var(--radius-sm) 0 0}
.tab-btn:hover{color:var(--primary);background:var(--primary-light)}
.tab-btn.active{color:var(--primary);border-bottom-color:var(--primary);background:var(--primary-light)}
.tab-content{display:none}.tab-content.active{display:block}

/* ── Modal ────────────────────────────────────────────────── */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:900;
  display:none;align-items:center;justify-content:center;padding:20px}
.modal-overlay.open{display:flex}
.modal{background:var(--surface);border-radius:var(--radius);max-width:560px;width:100%;
  max-height:90vh;overflow-y:auto;box-shadow:var(--shadow-lg);animation:modalIn .2s ease}
@keyframes modalIn{from{opacity:0;transform:scale(.95) translateY(-10px)}to{opacity:1;transform:none}}
.modal-header{padding:20px 24px;border-bottom:1px solid var(--border);
  display:flex;align-items:center;gap:12px}
.modal-header h3{font-size:1.05rem;font-weight:700;color:var(--text);flex:1}
.modal-close{background:none;border:none;font-size:1.3rem;color:var(--text2);
  cursor:pointer;padding:4px;border-radius:var(--radius-xs);transition:color var(--transition)}
.modal-close:hover{color:var(--danger)}
.modal-body{padding:24px}
.modal-footer{padding:16px 24px;border-top:1px solid var(--border);
  display:flex;gap:10px;justify-content:flex-end}

/* ── File Upload ──────────────────────────────────────────── */
.upload-zone{border:2.5px dashed var(--border);border-radius:var(--radius);
  padding:40px 20px;text-align:center;cursor:pointer;transition:all var(--transition);
  background:var(--surface2)}
.upload-zone:hover,.upload-zone.drag-over{border-color:var(--primary);background:var(--primary-light)}
.upload-zone .uz-icon{font-size:2.5rem;margin-bottom:12px}
.upload-zone p{color:var(--text2);font-size:.88rem}
.upload-zone strong{color:var(--primary)}
.upload-zone input[type=file]{display:none}

/* ── Loading States ───────────────────────────────────────── */
.skeleton{background:linear-gradient(90deg,var(--border) 25%,#e8ecf3 50%,var(--border) 75%);
  background-size:200% 100%;animation:skeleton 1.4s infinite;border-radius:var(--radius-xs)}
@keyframes skeleton{0%{background-position:200%}100%{background-position:-200%}}
.spinner{width:24px;height:24px;border:3px solid var(--border);
  border-top-color:var(--primary);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}
.loading-overlay{position:fixed;inset:0;background:rgba(255,255,255,.85);z-index:999;
  display:none;align-items:center;justify-content:center;flex-direction:column;gap:16px}
.loading-overlay.show{display:flex}
.loading-text{font-weight:600;color:var(--text2)}

/* ── Toast Notification ───────────────────────────────────── */
.toast-container{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;
  flex-direction:column;gap:8px;max-width:360px}
.toast{background:var(--surface);border-radius:var(--radius-sm);padding:14px 16px;
  box-shadow:var(--shadow-lg);border-left:4px solid var(--primary);
  display:flex;align-items:flex-start;gap:10px;font-size:.85rem;
  animation:toastIn .3s ease;min-width:280px}
.toast.success{border-left-color:var(--success)}
.toast.error{border-left-color:var(--danger)}
.toast.warning{border-left-color:var(--warning)}
@keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
.toast-icon{font-size:1rem;flex-shrink:0;margin-top:1px}
.toast-msg{flex:1;color:var(--text)}
.toast-title{font-weight:700;margin-bottom:2px}
.toast-body{font-size:.8rem;color:var(--text2)}
.toast-close{background:none;border:none;font-size:.9rem;cursor:pointer;
  color:var(--text3);padding:0;margin-left:4px}

/* ── Chart Placeholder ────────────────────────────────────── */
.chart-container{position:relative;height:240px;background:var(--surface2);
  border-radius:var(--radius-sm);display:flex;align-items:center;
  justify-content:center;overflow:hidden}
.chart-bars{display:flex;align-items:flex-end;gap:8px;height:180px;padding:0 16px;width:100%;justify-content:center}
.chart-bar-wrap{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;max-width:36px}
.chart-bar{width:100%;border-radius:4px 4px 0 0;background:linear-gradient(180deg,var(--primary),#1976d2);
  transition:height .6s cubic-bezier(.4,0,.2,1);min-height:4px;position:relative}
.chart-bar:hover::after{content:attr(data-val);position:absolute;top:-24px;left:50%;
  transform:translateX(-50%);background:var(--text);color:#fff;padding:2px 6px;
  border-radius:4px;font-size:.68rem;white-space:nowrap;pointer-events:none}
.chart-month{font-size:.62rem;color:var(--text3);font-weight:600;text-transform:uppercase}

/* ── RKKAL Progress Table ─────────────────────────────────── */
.rkkal-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;
  padding:12px 0;border-bottom:1px solid var(--border)}
.rkkal-row:last-child{border-bottom:none}
.rkkal-kode{font-size:.78rem;font-weight:700;color:var(--primary)}
.rkkal-uraian{font-size:.82rem;color:var(--text);font-weight:500}
.rkkal-pagu{font-size:.75rem;color:var(--text2);text-align:right}
.rkkal-persen{font-size:.82rem;font-weight:800;text-align:right;margin-top:2px}

/* ── Sidebar Overlay (mobile) ─────────────────────────────── */
.sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:199}

/* ── Responsive: Tablet (≤1024px) ────────────────────────── */
@media(max-width:1024px){
  :root{--sidebar-w:220px}
  .stats-grid{grid-template-columns:repeat(2,1fr)}
  .form-grid{grid-template-columns:1fr}
  .form-group.full{grid-column:auto}
}

/* ── Responsive: Mobile (≤768px) ─────────────────────────── */
@media(max-width:768px){
  :root{--topbar-h:56px}
  .sidebar{transform:translateX(-100%);width:280px}
  .sidebar.open{transform:translateX(0)}
  .sidebar-overlay.show{display:block}
  .topbar{left:0;padding:0 16px}
  .topbar-toggle{display:flex}
  .main-content{margin-left:0;padding:16px}
  .stats-grid{grid-template-columns:1fr 1fr;gap:12px}
  .stat-card{padding:14px;gap:12px}
  .stat-value{font-size:1.25rem}
  .action-grid{grid-template-columns:repeat(2,1fr);gap:10px}
  .action-btn{padding:14px 10px}
  .table-wrapper{font-size:.8rem}
  thead th{padding:10px 10px}
  tbody td{padding:10px 10px}
  .toast-container{bottom:16px;right:16px;left:16px;max-width:none}
  .card{padding:16px}
  .modal{max-height:95vh}
  .modal-body{padding:16px}
  .tabs{overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch}
  .tab-btn{white-space:nowrap;flex-shrink:0}
}

/* ── Responsive: Small Mobile (≤480px) ───────────────────── */
@media(max-width:480px){
  .stats-grid{grid-template-columns:1fr}
  .form-grid{grid-template-columns:1fr}
  .action-grid{grid-template-columns:repeat(2,1fr)}
  .topbar-school{display:none}
  .page-header h1{font-size:1.2rem}
}
</style>`;
}
