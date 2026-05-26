/**
 * Cloudflare Worker - Reverse Proxy for ERP Backend
 * Reduces webhook latency and hides sensitive endpoints
 */

// Configuration
const BACKEND_URL = 'https://script.google.com/macros/s/YOUR_GOOGLE_SCRIPT_ID/exec';
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // max requests per window

// Rate limiting state
const rateLimitState = new Map();

/**
 * Cloudflare Worker Handler
 */
export default {
  async fetch(request) {
    try {
      // Check rate limit
      if (!this.checkRateLimit(request)) {
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Rate limit exceeded'
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Parse incoming request
      const url = new URL(request.url);
      const params = url.searchParams;
      
      // Route to backend
      const response = await this.proxyToBackend(request, params);
      
      return response;
      
    } catch (error) {
      Logger.log('Cloudflare Worker Error: ' + error.message);
      
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Service unavailable',
        logId: 'CF_' + Date.now()
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
  
  /**
   * Check rate limit
   */
  checkRateLimit: function(request) {
    const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    const now = Date.now();
    
    if (!rateLimitState.has(ip)) {
      rateLimitState.set(ip, { count: 1, windowStart: now });
      return true;
    }
    
    const state = rateLimitState.get(ip);
    
    if (now - state.windowStart > RATE_LIMIT_WINDOW) {
      state.count = 1;
      state.windowStart = now;
      return true;
    }
    
    if (state.count < RATE_LIMIT_MAX) {
      state.count++;
      return true;
    }
    
    return false;
  },
  
  /**
   * Proxy request to Google Apps Script backend
   */
  proxyToBackend: async function(request, params) {
    // Build backend URL with parameters
    const backendUrl = new URL(BACKEND_URL);
    
    // Add all query parameters
    params.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });
    
    // Prepare fetch options
    const options = {
      method: request.method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: request.method === 'POST' ? await request.text() : undefined
    };
    
    // Fetch from backend
    const response = await fetch(backendUrl.toString(), options);
    
    // Clone response to modify headers
    const clonedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
    return clonedResponse;
  }
};

/**
 * Logger utility for Cloudflare Worker
 */
const Logger = {
  log: function(message) {
    console.log('[Cloudflare Worker] ' + message);
  },
  
  error: function(message) {
    console.error('[Cloudflare Worker ERROR] ' + message);
  }
};