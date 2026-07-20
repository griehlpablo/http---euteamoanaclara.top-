import { createClient } from '@supabase/supabase-js';

const configuredUrl = import.meta.env.VITE_SUPABASE_URL;
const configuredKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(configuredUrl && configuredKey);

const supabaseUrl = configuredUrl || 'https://houqxdlsziscdnnaknlv.supabase.co';
const supabaseKey = configuredKey || 'supabase-anon-key-not-configured';

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY ausentes. O site continuará abrindo, mas os recursos sincronizados ficarão indisponíveis até o próximo build configurado.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      Prefer: 'return=representation',
    },
  },
});

export default supabase;
