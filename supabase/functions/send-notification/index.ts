const allowedOrigins = [
  'https://www.euteamoanaclara.top',
  'https://euteamoanaclara.top',
  'http://localhost:5173',
];

const targetUsers: Record<string, { tag: string; externalId: string }> = {
  pablo: {
    tag: 'pablo',
    externalId: '@griehl_',
  },
  '@griehl_': {
    tag: 'pablo',
    externalId: '@griehl_',
  },
  ana: {
    tag: 'ana',
    externalId: '@anakov_',
  },
  '@anakov_': {
    tag: 'ana',
    externalId: '@anakov_',
  },
};

type NotificationBody = {
  targetUser?: unknown;
  title?: unknown;
  message?: unknown;
  url?: unknown;
  data?: unknown;
};

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowOrigin = allowedOrigins.includes(origin) ? origin : '*';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
  };
}

function jsonResponse(body: unknown, status: number, headers: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers,
  });
}

function stringOrDefault(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return jsonResponse({ ok: true }, 200, corsHeaders);
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      { ok: false, error: 'Method not allowed' },
      405,
      corsHeaders,
    );
  }

  let parsedBody: unknown;

  try {
    parsedBody = await req.json();
  } catch {
    return jsonResponse(
      { ok: false, error: 'Invalid JSON body' },
      400,
      corsHeaders,
    );
  }

  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    return jsonResponse(
      { ok: false, error: 'JSON body must be an object' },
      400,
      corsHeaders,
    );
  }

  const body = parsedBody as NotificationBody;
  const rawTargetUser = typeof body.targetUser === 'string' ? body.targetUser.trim() : '';
  const normalizedTargetUser = rawTargetUser.toLowerCase();
  const target = targetUsers[normalizedTargetUser];

  if (!target) {
    return jsonResponse(
      {
        ok: false,
        error: 'Invalid or missing targetUser',
        allowedTargets: Object.keys(targetUsers),
      },
      400,
      corsHeaders,
    );
  }

  const appId = Deno.env.get('ONESIGNAL_APP_ID');
  const restApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');

  if (!appId || !restApiKey) {
    return jsonResponse(
      {
        ok: false,
        error: 'Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY',
      },
      500,
      corsHeaders,
    );
  }

  const title = stringOrDefault(body.title, 'Nova notificação ❤️');
  const message = stringOrDefault(body.message, 'Você recebeu uma nova atualização.');
  const url = stringOrDefault(body.url, 'https://www.euteamoanaclara.top');
  const data = body.data && typeof body.data === 'object' ? body.data : {};

  const payload = {
    app_id: appId,
    headings: {
      en: title,
      pt: title,
    },
    contents: {
      en: message,
      pt: message,
    },
    filters: [
      {
        field: 'tag',
        key: 'usuario',
        relation: '=',
        value: target.tag,
      },
    ],
    url,
    data,
  };

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${restApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      return jsonResponse(
        {
          ok: false,
          error: result,
        },
        response.status,
        corsHeaders,
      );
    }

    return jsonResponse(
      {
        ok: true,
        targetUser: normalizedTargetUser,
        targetTag: target.tag,
        targetExternalId: target.externalId,
        result,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: String(error),
      },
      500,
      corsHeaders,
    );
  }
});
