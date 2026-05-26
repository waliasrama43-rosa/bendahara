/**
 * Anti-Spam Queueing System
 * Prevents duplicate execution with throttling
 */

const Queue = {
  /**
   * Check and queue request
   */
  check: function(params) {
    try {
      const userId = params.userId || 'anonymous';
      const action = params.action;
      const timestamp = Date.now();
      
      // Check for duplicate within 5 seconds
      const cache = CacheService.getUserCache();
      const cacheKey = 'spam_' + userId + '_' + action;
      const cached = cache.get(cacheKey);
      
      if (cached) {
        Logger.log('SPAM DETECTED: ' + userId + ' - ' + action);
        return {
          status: 'spam',
          message: 'Tindakan terlalu cepat. Silakan tunggu.',
          retryAfter: 5000
        };
      }
      
      // Add to cache with 5 second TTL
      cache.put(cacheKey, timestamp, 5);
      
      return {
        status: 'allowed',
        message: 'Request diterima',
        queueId: 'Q-' + timestamp
      };
      
    } catch (error) {
      Logger.log('Queue check error: ' + error.message);
      return {
        status: 'error',
        message: 'System error',
        logId: 'QUEUE_' + Date.now()
      };
    }
  },
  
  /**
   * Process queue items
   */
  process: function(params) {
    try {
      const queueId = params.queueId;
      const action = params.action;
      
      // Process the queued action
      const result = this.executeAction(action, params);
      
      return result;
      
    } catch (error) {
      Logger.log('Queue process error: ' + error.message);
      return {
        status: 'error',
        message: 'Failed to process queue',
        logId: 'QUEUE_PROC_' + Date.now()
      };
    }
  },
  
  /**
   * Execute queued action
   */
  executeAction: function(action, params) {
    // Route to appropriate handler
    switch (action) {
      case 'input_data':
        return Controller.Input.process(params);
      case 'export_excel':
        return Controller.Export.process(params);
      case 'verify_trans':
        return Controller.Validation.verify(params);
      default:
        return { status: 'error', message: 'Unknown action' };
    }
  },
  
  /**
   * Clear spam cache
   */
  clear: function(userId, action) {
    const cache = CacheService.getUserCache();
    const cacheKey = 'spam_' + userId + '_' + action;
    cache.remove(cacheKey);
  }
};