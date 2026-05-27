/**
 * ============================================================
 * CLOUDFLARE WORKER - API Gateway & CORS Proxy
 * Fase 3: Proxy untuk Google Apps Script Web App
 * ============================================================
 *
 * SETUP:
 * 1. Deploy worker ini di Cloudflare Workers
 * 2. Set env variable: GAS_URL = URL Web App Google Apps Script Anda
 * 3. (Opsional) Set: API_SECRET = token rahasia untuk auth
 *
 * FITUR:
 * - CORS headers otomatis
 * - Rate limiting per IP (100 req/menit)
 * - Request logging
 * - Error handling & retry
 * - Cache GET requests 30 detik
 */

const WORKER_CONFIG = {
  RATE_LIMIT       : 100,        // max requests per minute per IP
  RATE_WINDOW_MS   : 60 * 1000,  // 1 menit
  CACHE_TTL_SECONDS: 30,         // cache GET 30 detik
  MAX_BODY_SIZE    : 1024 * 512, // 512 KB max body
  VERSION          : '3.0.0'
};

// ── In-memory rate limit store (per worker instance) ─────────
const rateLimitMap = new Map();

// ── Main Handler ─────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const GAS_URL    = env.GAS_URL    || '';
    const API_SECRET = env.API_SECRET || '';

    // Pre-flight CORS
    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204);
    }

    try {
      // ── Rate Limiting ────────────────────────────────
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
      const rlResult = checkRateLimit(clientIP);
      if (!rlResult.allowed) {
        return corsResponse(JSON.stringify({
          status : 'error',
          message: 'Terlalu banyak request. Coba lagi dalam 1 menit.',
          retry_after: rlResult.retryAfter
        }), 429);
      }

      // ── Body size guard ──────────────────────────────
      const contentLength = parseInt(request.headers.get('content-length') || '0');
      if (contentLength > WORKER_CONFIG.MAX_BODY_SIZE) {
        return corsResponse(JSON.stringify({
          status:'error', message:'Request terlalu besar (max 512 KB)'
        }), 413);
      }

      // ── Optional API secret auth ─────────────────────
      if (API_SECRET) {
        const authHeader = request.headers.get('X-API-Secret') || '';
        if (authHeader !== API_SECRET) {
          return corsResponse(JSON.stringify({
            status:'error', message:'Unauthorized'
          }), 401);
        }
      }

      // ── Build target URL ─────────────────────────────
      const url        = new URL(request.url);
      const targetUrl  = GAS_URL + url.search;

      // ── Cache for GET ────────────────────────────────
      if (request.method === 'GET') {
        const cache     = caches.default;
        const cacheKey  = new Request(targetUrl, request);
        const cached    = await cache.match(cacheKey);
        if (cached) {
          const cachedClone = new Response(cached.body, cached);
          cachedClone.headers.set('X-Cache', 'HIT');
          addCORSHeaders(cachedClone.headers);
          return cachedClone;
        }

        const gasResp = await forwardToGAS(targetUrl, request, 'GET');
        const toCache = gasResp.clone();
        ctx.waitUntil(
          cache.put(cacheKey, new Response(toCache.body, {
            status: toCache.status,
            headers: { 'Cache-Control': `public, max-age=${WORKER_CONFIG.CACHE_TTL_SECONDS}`, 'Content-Type': toCache.headers.get('Content-Type')||'application/json' }
          }))
        );
        return gasResp;
      }

      // ── POST / PUT ───────────────────────────────────
      return await forwardToGAS(targetUrl, request, request.method);

    } catch(err) {
      console.error('Worker error:', err.message);
      return corsResponse(JSON.stringify({
        status : 'error',
        message: 'Gateway error: '+err.message,
        version: WORKER_CONFIG.VERSION
      }), 502);
    }
  }
};

// ── Forward request to Google Apps Script ────────────────────
async function forwardToGAS(targetUrl, originalRequest, method) {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  let body = null;
  if (method !== 'GET' && method !== 'HEAD') {
    try { body = await originalRequest.text(); } catch(e) { body = null; }
  }

  const fetchOptions = {
    method  : method,
    headers : headers,
    redirect: 'follow'
  };
  if (body) fetchOptions.body = body;

  // Retry 2x on 5xx
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch(targetUrl, fetchOptions);
      if (resp.ok || resp.status < 500) {
        const text = await resp.text();
        return corsResponse(text, resp.status, resp.headers.get('Content-Type') || 'application/json');
      }
      lastErr = new Error('GAS responded '+resp.status);
    } catch(e) {
      lastErr = e;
      if (attempt < 2) await sleep(500 * (attempt+1));
    }
  }
  throw lastErr;
}

// ── Rate limit helper ────────────────────────────────────────
function checkRateLimit(ip) {
  const now     = Date.now();
  const entry   = rateLimitMap.get(ip);

  if (!entry || (now - entry.windowStart) > WORKER_CONFIG.RATE_WINDOW_MS) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return { allowed:true };
  }

  if (entry.count >= WORKER_CONFIG.RATE_LIMIT) {
    const retryAfter = Math.ceil((entry.windowStart + WORKER_CONFIG.RATE_WINDOW_MS - now) / 1000);
    return { allowed:false, retryAfter };
  }

  entry.count++;
  return { allowed:true };
}

// ── Response helpers ──────────────────────────────────────────
function corsResponse(body, status, contentType) {
  const resp = new Response(body, {
    status : status || 200,
    headers: {
      'Content-Type'                : contentType || 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin' : '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Secret',
      'X-Worker-Version'            : WORKER_CONFIG.VERSION
    }
  });
  return resp;
}

function addCORSHeaders(headers) {
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
