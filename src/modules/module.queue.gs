/**
 * ============================================================
 * MODULE QUEUE - Anti-Spam & Rate Limiting
 * Fase 2: CacheService-based throttling, 5 detik per aksi
 * ============================================================
 */

const Queue = {

  check: function(params) {
    try {
      const userId  = params.userId || 'anonymous';
      const action  = params.action || 'default';
      const key     = 'spam_'+userId+'_'+action;
      const cache   = CacheService.getScriptCache();
      const cached  = cache.get(key);

      if (cached) {
        return { status:'spam', message:'Terlalu cepat. Tunggu 5 detik.', retryAfter:5000 };
      }

      cache.put(key, Date.now().toString(), 5); // 5 detik TTL
      return { status:'allowed', queueId:'Q-'+Date.now() };

    } catch(e) {
      Logger.log('Queue.check ERROR: '+e.message);
      return { status:'allowed', queueId:'Q-fallback' }; // fail-open
    }
  },

  process: function(params) {
    try {
      switch(params.action) {
        case 'input_data'  : return Controller.Input.process(params);
        case 'export_excel': return Controller.Export.process(params);
        case 'verify_trans': return Controller.Validation.verify(params);
        default: return Response.json({ status:'error', message:'Unknown queued action' });
      }
    } catch(e) {
      Logger.log('Queue.process ERROR: '+e.message);
      return Response.json({ status:'error', message:'Queue process error' });
    }
  },

  clear: function(userId, action) {
    try {
      CacheService.getScriptCache().remove('spam_'+userId+'_'+action);
    } catch(e) {}
  }
};
