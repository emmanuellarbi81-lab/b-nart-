const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // GET /sync — pull all data
      if (request.method === "GET" && path === "/sync") {
        const data = await env.LMS_DATA.get("lms_backup");
        return new Response(data || "{}", { headers: CORS_HEADERS });
      }

      // POST /sync — push/save data
      if (request.method === "POST" && path === "/sync") {
        const body = await request.text();
        await env.LMS_DATA.put("lms_backup", body);
        return new Response(JSON.stringify({ success: true }), {
          headers: CORS_HEADERS,
        });
      }

      // GET /health — connection test
      if (path === "/health") {
        return new Response(JSON.stringify({ status: "ok", timestamp: Date.now() }), {
          headers: CORS_HEADERS,
        });
      }

      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: CORS_HEADERS,
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }
  },
};
