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

// ── Full SPA HTML ──────────────────────────────────────────────
function _serveDashboardHTML(params) {
  const schoolId = params.schoolId || '';
  const html = _getShellOpen(schoolId, 'Dashboard')
    + _getAllPages(schoolId)
    + _getShellClose(schoolId);
  return HtmlService.createHtmlOutput(html)
    .setTitle('ERP Keuangan Sekolah Rakyat')
    .addMetaTag('viewport','width=device-width,initial-scale=1,maximum-scale=1');
}

// ── Input Form → redirect ke SPA dashboard ───────────────────
function _serveInputFormHTML(params) {
  // SPA handles input form as a page inside the shell
  return _serveDashboardHTML(params);
}

// ── [REMOVED] Legacy HTML ────────────────────────────────────

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
