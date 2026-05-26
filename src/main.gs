/**
 * Sistem ERP Keuangan Sekolah Rakyat - Entry Point
 * Single Entry Point Architecture
 * 
 * @author Kiro AI Developer
 * @version 1.0.0
 */

// Master Module Controller
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

/**
 * Single entry point - route all requests
 */
function handleRequest(e) {
  try {
    const params = e.parameter;
    const action = params.action || 'home';
    
    // Route to appropriate controller
    switch (action) {
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
        return Controller.Queue.check(params);
      
      case 'process_queue':
        return Controller.Queue.process(params);
      
      case 'webhook':
        return Controller.Webhook.handle(params);
      
      default:
        return Response.json({ status: 'success', message: 'Home - Sistem ERP Sekolah Rakyat' });
    }
    
  } catch (error) {
    // Comprehensive error catching - log to system log, not response
    Logger.log('ERROR: ' + error.toString() + '\n' + error.stack);
    return Response.json({ 
      status: 'error', 
      message: 'Sistem error. Silakan coba lagi.', 
      logId: error.name + '_' + Date.now() 
    });
  }
}