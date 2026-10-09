const ALLOWED_ORIGINS = [
  "https://expense-tracker-65y.pages.dev"
];

function json(data, status = 200, origin = "") {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Setup-Secret"
    }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGINS[0],
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, X-Setup-Secret"
        }
      });
    }

    try {
      if (url.pathname === "/" && request.method === "GET") {
        return json({
          name: "Expense Tracker API",
          status: "ok"
        }, 200, origin);
      }

      if (url.pathname === "/api/health" &&
          request.method === "GET") {
        const result = await env.DB
          .prepare("SELECT COUNT(*) AS count FROM users")
          .first();

        return json({
          status: "ok",
          initialized: result.count > 0
        }, 200, origin);
      }

      return json({
        error: "Endpoint not implemented yet."
      }, 404, origin);

    } catch (error) {
      console.error(error);

      return json({
        error: "Internal server error."
      }, 500, origin);
    }
  }
};