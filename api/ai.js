const MODEL_ID = "gemini-3.1-flash-lite";
const ALLOWED_ORIGINS = new Set([
  "https://euteamoanaclara.top",
  "https://www.euteamoanaclara.top",
]);

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;
const MAX_BODY_CHARS = 8_000_000;
const MAX_SYSTEM_CHARS = 8_000;
const MAX_TEXT_CHARS = 20_000;
const MAX_MESSAGES = 30;
const requestsByClient = new Map();

const json = (data, status = 200, origin = "") =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(origin && ALLOWED_ORIGINS.has(origin)
        ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" }
        : {}),
    },
  });

const getClientId = (request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  request.headers.get("x-real-ip") ||
  "unknown";

const checkRateLimit = (request) => {
  const now = Date.now();
  const clientId = getClientId(request);
  const recent = (requestsByClient.get(clientId) || []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) return false;
  recent.push(now);
  requestsByClient.set(clientId, recent);
  return true;
};

const sanitizeParts = (parts) => {
  if (!Array.isArray(parts)) return [];
  return parts.slice(0, 4).flatMap((part) => {
    if (part && typeof part.text === "string") {
      return [{ text: part.text.slice(0, MAX_TEXT_CHARS) }];
    }
    const inlineData = part?.inlineData;
    if (
      inlineData &&
      typeof inlineData.data === "string" &&
      inlineData.data.length <= 7_500_000 &&
      /^image\/(png|jpeg|jpg|webp|heic|heif)$/i.test(
        String(inlineData.mimeType || ""),
      )
    ) {
      return [
        {
          inlineData: {
            data: inlineData.data,
            mimeType: inlineData.mimeType,
          },
        },
      ];
    }
    return [];
  });
};

const sanitizeContents = (contents) => {
  if (!Array.isArray(contents)) return [];
  return contents
    .slice(-MAX_MESSAGES)
    .map((message) => ({
      role: message?.role === "model" ? "model" : "user",
      parts: sanitizeParts(message?.parts),
    }))
    .filter((message) => message.parts.length);
};

export default {
  async fetch(request) {
    const origin = request.headers.get("origin") || "";

    if (request.method === "OPTIONS") {
      if (origin && !ALLOWED_ORIGINS.has(origin)) {
        return json({ ok: false, error: "Origem não autorizada." }, 403);
      }
      return new Response(null, {
        status: 204,
        headers: {
          ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
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
      return json({ ok: false, error: "Origem não autorizada." }, 403);
    }
    if (!checkRateLimit(request)) {
      return json(
        {
          ok: false,
          error: "Muitas perguntas em pouco tempo. Aguarde alguns minutos.",
        },
        429,
        origin,
      );
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return json(
        {
          ok: false,
          error:
            "A IA ainda não foi configurada no servidor. Adicione GEMINI_API_KEY nas variáveis da Vercel.",
          code: "MISSING_GEMINI_KEY",
        },
        503,
        origin,
      );
    }

    let rawBody;
    try {
      rawBody = await request.text();
    } catch {
      return json({ ok: false, error: "Não foi possível ler a solicitação." }, 400, origin);
    }
    if (!rawBody || rawBody.length > MAX_BODY_CHARS) {
      return json({ ok: false, error: "Solicitação vazia ou muito grande." }, 413, origin);
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return json({ ok: false, error: "Corpo JSON inválido." }, 400, origin);
    }

    const systemInstruction = String(body?.systemInstruction || "")
      .trim()
      .slice(0, MAX_SYSTEM_CHARS);
    const contents = sanitizeContents(body?.contents);
    if (!systemInstruction || !contents.length) {
      return json(
        { ok: false, error: "Instrução ou conversa inválida." },
        400,
        origin,
      );
    }

    try {
      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: {
              temperature: 0.25,
              maxOutputTokens: 1600,
            },
          }),
        },
      );

      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        const upstreamMessage =
          data?.error?.message || `Gemini respondeu com status ${upstream.status}.`;
        return json(
          { ok: false, error: upstreamMessage },
          upstream.status >= 500 ? 502 : 400,
          origin,
        );
      }

      const text = data?.candidates?.[0]?.content?.parts
        ?.map((part) => part?.text || "")
        .join("")
        .trim();
      if (!text) {
        return json(
          { ok: false, error: "A IA respondeu sem conteúdo." },
          502,
          origin,
        );
      }

      return json({ ok: true, text, modelUsed: MODEL_ID }, 200, origin);
    } catch (error) {
      return json(
        {
          ok: false,
          error: `Não foi possível acessar a IA: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
        502,
        origin,
      );
    }
  },
};
