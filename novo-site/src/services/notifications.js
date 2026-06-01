import { supabase } from '../supabase';

export async function sendPartnerNotification({
  targetUser,
  title = 'Nova notificação ❤️',
  message = 'Você recebeu uma nova atualização.',
  url = 'https://www.euteamoanaclara.top',
  data = {},
}) {
  try {
    const { data: response, error } = await supabase.functions.invoke('send-notification', {
      body: {
        targetUser,
        title,
        message,
        url,
        data,
      },
    });

    if (error) {
      console.warn('Falha ao enviar notificação pela Edge Function:', error);
      return { ok: false, error };
    }

    return { ok: true, data: response };
  } catch (error) {
    console.warn('Erro inesperado ao enviar notificação:', error);
    return { ok: false, error };
  }
}
