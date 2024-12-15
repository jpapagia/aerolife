import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

let supabase = null;

async function loadConfig() {
    try {
        const response = await fetch('/config.json'); // Load local config.json
        if (!response.ok) throw new Error('Failed to load config.json');
        return await response.json();
    } catch (error) {
        console.warn('Using environment variables as fallback.');
        return {
            SUPABASE_PROJECT_URL: process.env.SUPABASE_PROJECT_URL,
            SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
        };
    }
}

export async function initSupabase() {
    if (!supabase) {
        const config = await loadConfig();
        const SUPABASE_PROJECT_URL = config.SUPABASE_PROJECT_URL;
        const SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY;

        if (!SUPABASE_PROJECT_URL || !SUPABASE_ANON_KEY) {
            throw new Error('Supabase keys are missing.');
        }

        supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY);
    }
    return supabase;
}
