import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("ERRO: Credenciais do Supabase não encontradas. Verifique as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
}

const fetchWithTimeout: typeof fetch = (url, init) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    return fetch(url, { ...init, signal: controller.signal })
        .finally(() => clearTimeout(timeout));
};

const options = {
    global: { fetch: fetchWithTimeout }
};

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    options
);

/**
 * Client without a user session: always talks to Supabase as the public anon
 * role. Used as a fallback for actions the signed-in role is not allowed to do
 * (for example when the session expired or a policy only grants the anon role).
 */
export const supabaseAnon = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
        ...options,
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    }
);
