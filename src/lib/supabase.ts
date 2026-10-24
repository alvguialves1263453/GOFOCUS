import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("ERRO: Credenciais do Supabase não encontradas. Verifique as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
        global: {
            fetch: (url, init) => {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 15000);
                return fetch(url, { ...init, signal: controller.signal })
                    .finally(() => clearTimeout(timeout));
            }
        }
    }
);
