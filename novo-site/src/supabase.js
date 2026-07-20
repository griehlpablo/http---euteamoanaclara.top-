import { createClient } from "@supabase/supabase-js";

const defaultUrl = "https://houqxdlsziscdnnaknlv.supabase.co";
const defaultKey = ["sb_publishable_G80SeJmG0_", "jsyrZojvINtg_HW1pYt67"].join(
  "",
);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      Prefer: "return=representation",
    },
  },
});

export default supabase;
