import { createClient } from '@supabase/supabase-js';

// URL e Publishable Key públicas do projeto MyMita no Supabase (segurança garantida via RLS no Postgres)
const DEFAULT_SUPABASE_URL = 'https://bppbyymrgzlrdzsqltma.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_g9ruJLtA1z7-iNmDmJdmHQ_k_qyuoAb';

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || DEFAULT_SUPABASE_URL;

const supabaseKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
  DEFAULT_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
