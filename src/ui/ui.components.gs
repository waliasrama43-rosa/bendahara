/**
 * ============================================================
 * UI COMPONENTS — Shell, Sidebar, Topbar, Toast, Modal
 * ============================================================
 */

function _getShellOpen(schoolId, pageTitle) {
  const y = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<meta name="theme-color" content="#1565c0">
<title>${pageTitle||'ERP Keuangan'} — Sekolah Rakyat</title>
${_getGlobalCSS()}
</head>
<body>
<div id="app" class="app-shell">

<!-- ░░ SIDEBAR ░░ -->
<aside class="sidebar" id="sidebar">
  <div class="sidebar-header">
    <div class="sidebar-logo">
      <span class="logo-icon">🏫</span>
      <div class="logo-text">
        <h2>ERP Keuangan</h2>
        <p>Sekolah Rakyat v4.0</p>
      </div>
    </div>
  </div>
  <nav class="sidebar-nav">
    <div class="nav-section-title">Menu Utama</div>
    <div class="nav-item active" onclick="showPage('dashboard')" id="nav-dashboard">
      <span class="nav-icon">📊</span> Dashboard
    </div>
    <div class="nav-item" onclick="showPage('input')" id="nav-input">
      <span class="nav-icon">📝</span> Input Data SPJ
    </div>
    <div class="nav-item" onclick="showPage('data')" id="nav-data">
      <span class="nav-icon">🗂️</span> Lihat Transaksi
    </div>
    <div class="nav-section-title" style="margin-top:8px">Anggaran</div>
    <div class="nav-item" onclick="showPage('rkkal')" id="nav-rkkal">
      <span class="nav-icon">📁</span> Upload RKKAL
    </div>
    <div class="nav-item" onclick="showPage('realisasi')" id="nav-realisasi">
      <span class="nav-icon">📈</span> Realisasi
    </div>
    <div class="nav-section-title" style="margin-top:8px">Laporan</div>
    <div class="nav-item" onclick="showPage('export')" id="nav-export">
      <span class="nav-icon">📤</span> Export Laporan
    </div>
    <div class="nav-section-title" style="margin-top:8px">Sistem</div>
    <div class="nav-item" onclick="showPage('sekolah')" id="nav-sekolah">
      <span class="nav-icon">🏛️</span> Daftar Sekolah
    </div>
    <div class="nav-item" onclick="showPage('pengaturan')" id="nav-pengaturan">
      <span class="nav-icon">⚙️</span> Pengaturan
    </div>
  </nav>
  <div class="sidebar-footer">
    <div class="user-info">
      <div class="user-avatar">👤</div>
      <div>
        <div class="user-name">Bendahara</div>
        <div class="user-role">${schoolId||'Belum login'}</div>
      </div>
    </div>
  </div>
</aside>

<!-- ░░ SIDEBAR OVERLAY (mobile) ░░ -->
<div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>

<!-- ░░ TOPBAR ░░ -->
<header class="topbar">
  <button class="topbar-toggle" onclick="toggleSidebar()">☰</button>
  <span class="topbar-title" id="topbarTitle">${pageTitle||'Dashboard'}</span>
  <div class="topbar-right">
    <span class="topbar-school" id="topbarSchool">${schoolId?'🏫 '+schoolId:'Belum Terhubung'}</span>
    <button class="topbar-btn" onclick="showPage('export')">📤 Export</button>
    <button class="topbar-btn btn-primary" style="background:var(--primary);color:#fff;border-color:var(--primary)" onclick="showPage('input')">+ Input SPJ</button>
  </div>
</header>

<!-- ░░ MAIN CONTENT ░░ -->
<main class="main-content" id="mainContent">`;
}

function _getShellClose(schoolId) {
  return `</main><!-- /main-content -->
</div><!-- /app-shell -->

<!-- ░░ LOADING OVERLAY ░░ -->
<div class="loading-overlay" id="loadingOverlay">
  <div class="spinner" style="width:40px;height:40px;border-width:4px"></div>
  <div class="loading-text" id="loadingText">Memproses...</div>
</div>

<!-- ░░ TOAST CONTAINER ░░ -->
<div class="toast-container" id="toastContainer"></div>

<!-- ░░ MODAL CONTAINER ░░ -->
<div class="modal-overlay" id="modalOverlay">
  <div class="modal" id="modal">
    <div class="modal-header">
      <h3 id="modalTitle">Judul Modal</h3>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body" id="modalBody"></div>
    <div class="modal-footer" id="modalFooter"></div>
  </div>
</div>

${_getAppJS(schoolId)}
</body></html>`;
}
