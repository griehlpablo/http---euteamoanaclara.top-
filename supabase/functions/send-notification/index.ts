const allowedOrigins = [
  'https://www.euteamoanaclara.top',
  'https://euteamoanaclara.top',
  'http://localhost:5173',
];

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

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { targetUser, title, message, url, data } = body;

    const appId = Deno.env.get('ONESIGNAL_APP_ID');
    const restApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!appId || !restApiKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY',
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }

    const payload = {
      app_id: appId,
      headings: {
        en: title || 'Nova notificação ❤️',
        pt: title || 'Nova notificação ❤️',
      },
      contents: {
        en: message || 'Você recebeu uma nova atualização.',
        pt: message || 'Você recebeu uma nova atualização.',
      },
      filters: targetUser
        ? [{ field: 'tag', key: 'usuario', relation: '=', value: targetUser }]
        : undefined,
      url: url || 'https://www.euteamoanaclara.top',
      data: data || {},
    };

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
      return new Response(
        JSON.stringify({
          ok: false,
          error: result,
        }),
        {
          status: response.status,
          headers: corsHeaders,
        },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        result,
      }),
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: String(error),
      }),
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
});
