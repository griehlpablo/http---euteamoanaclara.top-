const DEFAULT_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwZLBQWBNaztWMrQwPieOI1oRcZb-QgjoskdykE9I1loAMQ5agTXrwD9jzjIT6d07iv/exec";

const ALLOWED_ORIGINS = new Set([
  "https://euteamoanaclara.top",
  "https://www.euteamoanaclara.top",
]);

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

const normalizeType = (value) => {
  const normalized = String(value || "").trim().toLocaleLowerCase("pt-BR");
  return normalized.includes("entrada") ||
    normalized.includes("receita") ||
    normalized === "income"
    ? "Entrada"
    : "Gasto";
};

const isValidEntry = (entry) => {
  if (!entry || typeof entry !== "object") return false;
  if (!String(entry.id || "").trim()) return false;
  if (!String(entry.description || "").trim()) return false;
  if (!String(entry.category || "").trim()) return false;
  if (!String(entry.person || "").trim()) return false;
  if (!String(entry.paymentMethod || "").trim()) return false;

  const type = normalizeType(entry.type);
  const account =
    type === "Entrada" ? entry.destinationAccount : entry.sourceAccount;
  if (!String(account || "").trim()) return false;

  const amount = Number(entry.amount);
  return Number.isFinite(amount) && amount > 0;
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": request.headers.get("origin") || "",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "Método não permitido." }, 405);
    }

    const origin = request.headers.get("origin");
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return json({ ok: false, error: "Origem não autorizada." }, 403);
    }

    const token = process.env.GOOGLE_APPS_SCRIPT_TOKEN;
    const endpoint =
      process.env.GOOGLE_APPS_SCRIPT_URL || DEFAULT_APPS_SCRIPT_URL;

    if (!token) {
      return json(
        {
          ok: false,
          error: "Sincronização ainda não configurada na Vercel.",
          code: "MISSING_SERVER_SECRET",
        },
        503,
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Corpo JSON inválido." }, 400);
    }

    const action = body?.action;
    const validAppend =
      action === "appendExpense" && isValidEntry(body?.expense);
    const validDelete =
      action === "deleteExpense" &&
      Boolean(String(body?.expenseId || "").trim());
    const validList = action === "listExpenses";

    if (!validAppend && !validDelete && !validList) {
      return json({ ok: false, error: "Lançamento ou ação inválida." }, 400);
    }

    const expenseId = String(body?.expenseId || "").trim();
    const legacyRowMatch = /^sheet-row-(\d+)$/.exec(expenseId);
    const normalizedExpense = validAppend
      ? {
          ...body.expense,
          type: normalizeType(body.expense.type),
        }
      : null;

    const upstreamPayload = {
      action,
      token,
      ...(validAppend
        ? { expense: normalizedExpense }
        : validDelete
          ? {
              expenseId,
              row: Number(body.row || legacyRowMatch?.[1]) || null,
            }
          : {}),
    };

    try {
      const upstream = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(upstreamPayload),
        redirect: "follow",
      });

      const text = await upstream.text();
      let result;
      try {
        result = text ? JSON.parse(text) : { ok: upstream.ok };
      } catch {
        return json(
          { ok: false, error: "O Apps Script respondeu em formato inválido." },
          502,
        );
      }

      if (!upstream.ok || !result.ok) {
        return json(
          {
            ok: false,
            error:
              result.error ||
              `Apps Script respondeu com status ${upstream.status}.`,
          },
          502,
        );
      }

      return json({
        ok: true,
        row: result.row,
        duplicate: Boolean(result.duplicate),
        deleted: Boolean(result.deleted),
        missing: Boolean(result.missing),
        entries: Array.isArray(result.entries) ? result.entries : [],
      });
    } catch (error) {
      return json(
        {
          ok: false,
          error: `Não foi possível alcançar o Apps Script: ${error instanceof Error ? error.message : String(error)}`,
        },
        502,
      );
    }
  },
};
