/**
 * Sistem ERP Keuangan Sekolah Rakyat - Entry Point
 *
 * doGet  -> serves the interactive web UI (HTML) by default.
 *           If an `action` query param matches a JSON API action it returns
 *           JSON instead (used by the Cloudflare proxy / Telegram webhook).
 * doPost -> always treated as a JSON API call.
 *
 * The web UI talks to the backend through `google.script.run` (see api.gs),
 * NOT through these HTTP actions.
 *
 * @author Kiro AI Developer
 * @version 1.1.0
 */

// Actions that should return JSON (programmatic / webhook callers).
var JSON_ACTIONS = [
  'upload_rkkal', 'input_data', 'export_excel', 'verify_trans',
  'edit_data', 'check_spam', 'process_queue', 'webhook', 'ping'
];

function doGet(e) {
  e = e || {};
  var params = e.parameter || {};
  var action = params.action;

  if (action && JSON_ACTIONS.indexOf(action) !== -1) {
    return handleRequest(e);
  }

  // Default: render the single-page web application.
  return renderApp();
}

function doPost(e) {
  return handleRequest(e);
}

/**
 * Render the HTML single-page app.
 *
 * When pushed with clasp the file `src/index.html` becomes the Apps Script
 * HTML file named `src/index`. If files were copied manually into the editor
 * it may simply be named `index`, so we try both.
 */
function renderApp() {
  var candidates = ['src/index', 'index', 'Index'];
  for (var i = 0; i < candidates.length; i++) {
    try {
      return HtmlService.createTemplateFromFile(candidates[i])
        .evaluate()
        .setTitle('ERP Keuangan Sekolah Rakyat')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } catch (err) {
      // try next candidate
    }
  }
  return HtmlService.createHtmlOutput(
    '<h2>UI belum ditemukan</h2><p>File <code>src/index.html</code> tidak ada di project. ' +
    'Pastikan file ter-push ke Apps Script.</p>'
  );
}

/**
 * Allow HTML templates to include other files (partials) if needed.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Single entry point for JSON API / webhook requests.
 */
function handleRequest(e) {
  try {
    e = e || {};
    var params = e.parameter || {};

    // Merge JSON POST body into params when present.
    if (e.postData && e.postData.contents) {
      try {
        var body = JSON.parse(e.postData.contents);
        for (var k in body) {
          if (Object.prototype.hasOwnProperty.call(body, k)) params[k] = body[k];
        }
      } catch (parseErr) {
        // not JSON -> ignore, keep query params
      }
    }

    var action = params.action || 'home';

    switch (action) {
      case 'ping':
        return Response.json({ status: 'success', message: 'pong', time: new Date().toISOString() });

      case 'upload_rkkal':
        return Controller.RKKAL.Upload.process(params);

      case 'input_data':
        return Controller.Input.process(params);

      case 'export_excel':
        return Controller.Export.process(params);

      case 'verify_trans':
        return Controller.Validation.verify(params);

      case 'edit_data':
        return Controller.Correction.inlineEdit(params);

      case 'check_spam':
        return Response.json(Queue.check(params));

      case 'process_queue':
        return Response.json(Queue.process(params));

      case 'webhook':
        // Telegram / external webhook hook point (no-op for now).
        return Response.json({ status: 'success', message: 'webhook received' });

      default:
        return Response.json({ status: 'success', message: 'Home - Sistem ERP Sekolah Rakyat' });
    }
  } catch (error) {
    Logger.log('ERROR: ' + error.toString() + '\n' + (error.stack || ''));
    return Response.json({
      status: 'error',
      message: 'Sistem error. Silakan coba lagi.',
      logId: (error.name || 'ERR') + '_' + Date.now()
    });
  }
}
