import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

let supabase; // Global Supabase client

async function loadConfig() {
    const response = await fetch('config.json');
    if (!response.ok) throw new Error('Failed to load config.json');
    return await response.json();
}

export async function initSupabase() {
    if (!supabase) {
        const config = await loadConfig();
        const SUPABASE_PROJECT_URL = config.SUPABASE_PROJECT_URL;
        const SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY;
        supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY);
    }
    return supabase;
}
