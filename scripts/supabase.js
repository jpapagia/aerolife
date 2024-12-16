import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

let supabase = null;

async function loadConfig() {
    try {
        if (typeof process !== 'undefined' && process.env.VITE_SUPABASE_PROJECT_URL) {
            console.log('Environment Variables:', {
                SUPABASE_PROJECT_URL: process.env.VITE_SUPABASE_PROJECT_URL,
                SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
                OPENWEATHER_API_KEY: process.env.VITE_OPENWEATHER_API_KEY,
            });
            return {
                SUPABASE_PROJECT_URL: process.env.VITE_SUPABASE_PROJECT_URL,
                SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
                OPENWEATHER_API_KEY: process.env.VITE_OPENWEATHER_API_KEY,
            };
        } else {
            const response = await fetch('/config.json');
            if (!response.ok) throw new Error('Failed to load config.json');
            return await response.json();
        }
    } catch (error) {
        console.error('Error loading configuration:', error);
        return null;
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
