const ALLOWED_ORIGINS = new Set([
  "https://euteamoanaclara.top",
  "https://www.euteamoanaclara.top",
]);

const phone = ["+55", "4497168417"].join("");
const apiKey = ["876", "2883"].join("");

const headersFor = (origin) => ({
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin":
    origin && ALLOWED_ORIGINS.has(origin) ? origin : "",
});

const json = (data, status, origin) =>
  new Response(JSON.stringify(data), {
    status,
    headers: headersFor(origin),
  });

export default {
  async fetch(request) {
    const origin = request.headers.get("origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...headersFor(origin),
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "Método não permitido." }, 405, origin);
    }

    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return json({ ok: false, error: "Origem não autorizada." }, 403, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Corpo JSON inválido." }, 400, origin);
    }

    if (String(body?.targetUser || "").toLowerCase() !== "pablo") {
      return json({ ok: false, error: "Destinatário inválido." }, 400, origin);
    }

    const title = String(body?.title || "Recado do site").trim();
    const message = String(body?.message || "").trim();
    const url = String(body?.url || "https://www.euteamoanaclara.top").trim();

    if (!message) {
      return json({ ok: false, error: "Mensagem vazia." }, 400, origin);
    }

    const endpoint = new URL("https://api.callmebot.com/whatsapp.php");
    endpoint.searchParams.set("phone", phone);
    endpoint.searchParams.set("text", `${title}\n\n${message}\n\n${url}`);
    endpoint.searchParams.set("apikey", apiKey);

    try {
      const upstream = await fetch(endpoint, { redirect: "follow" });
      const result = await upstream.text();

      if (!upstream.ok) {
        return json(
          {
            ok: false,
            error:
              result || `CallMeBot respondeu com status ${upstream.status}.`,
          },
          502,
          origin,
        );
      }

      return json({ ok: true, provider: "callmebot" }, 200, origin);
    } catch (error) {
      return json(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        },
        502,
        origin,
      );
    }
  },
};
