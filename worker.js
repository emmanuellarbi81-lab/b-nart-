/**
 * B-NART Medical Lab — Cloudflare Worker
 * Handles GET /api/db  → read full DB from KV
 * Handles POST /api/db → write full DB to KV
 * Binding name: DB_STORE  (set this in wrangler.toml / Cloudflare dashboard)
 */

const KV_KEY = 'bnart_db';

// ── CORS headers — allow your Pages domain ──────────────────────────────────
function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── Pre-flight OPTIONS ─────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    // ── Route: /api/db ─────────────────────────────────────────────────────
    if (url.pathname === '/api/db') {

      // GET — load database
      if (request.method === 'GET') {
        const data = await env.DB_STORE.get(KV_KEY);
        if (!data) {
          // First run — return empty shell so the app can initialise
          return new Response(JSON.stringify(null), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
          });
        }
        return new Response(data, {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
        });
      }

      // POST — save database
      if (request.method === 'POST') {
        let body;
        try {
          body = await request.text();
          // Validate it is parseable JSON before storing
          JSON.parse(body);
        } catch {
          return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
          });
        }

        await env.DB_STORE.put(KV_KEY, body);
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
        });
      }

      return new Response('Method not allowed', { status: 405, headers: corsHeaders(request) });
    }

    // ── 404 for anything else ──────────────────────────────────────────────
    return new Response('Not found', { status: 404, headers: corsHeaders(request) });
  },
};
