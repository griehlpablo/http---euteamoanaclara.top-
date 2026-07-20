import { isSupabaseConfigured, supabase } from '../supabase';

async function sendWhatsApp(payload) {
  try {
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { ok: false, error: data.error || `Erro HTTP ${response.status}` };
    }

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error };
  }
}

async function sendPush(payload) {
  if (!isSupabaseConfigured) return { ok: false, skipped: true };

  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: payload,
    });

    return error ? { ok: false, error } : { ok: true, data };
  } catch (error) {
    return { ok: false, error };
  }
}

export async function sendPartnerNotification({
  targetUser,
  title = 'Nova notificação ❤️',
  message = 'Você recebeu uma nova atualização.',
  url = 'https://www.euteamoanaclara.top',
  data = {},
}) {
  const payload = { targetUser, title, message, url, data };
  const [whatsApp, push] = await Promise.all([
    String(targetUser).toLowerCase() === 'pablo'
      ? sendWhatsApp(payload)
      : Promise.resolve({ ok: false, skipped: true }),
    sendPush(payload),
  ]);

  return {
    ok: Boolean(whatsApp.ok || push.ok),
    whatsApp,
    push,
  };
}
