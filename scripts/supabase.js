import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

let supabase; // Global Supabase client

// Load Supabase configuration dynamically
async function loadConfig() {
    try {
        // Check if process.env exists for Vercel-like environments
        if (typeof process !== 'undefined' && process.env) {
            const SUPABASE_PROJECT_URL = process.env.SUPABASE_PROJECT_URL || process.env.VITE_SUPABASE_PROJECT_URL;
            const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

            if (SUPABASE_PROJECT_URL && SUPABASE_ANON_KEY) {
                console.log("Using environment variables for Supabase.");
                return { SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY };
            }
        }

        // Fallback to config.json for local development
        console.log("Environment variables not found. Falling back to config.json.");
        const response = await fetch('/config.json');
        if (!response.ok) throw new Error('Failed to load config.json');
        const config = await response.json();

        if (config.SUPABASE_PROJECT_URL && config.SUPABASE_ANON_KEY) {
            return {
                SUPABASE_PROJECT_URL: config.SUPABASE_PROJECT_URL,
                SUPABASE_ANON_KEY: config.SUPABASE_ANON_KEY,
            };
        } else {
            throw new Error('Supabase keys missing in config.json');
        }
    } catch (error) {
        console.error('Error loading Supabase configuration:', error.message);
        return null;
    }
}

// Initialize Supabase client
export async function initSupabase() {
    if (!supabase) {
        const config = await loadConfig();
        if (!config || !config.SUPABASE_PROJECT_URL || !config.SUPABASE_ANON_KEY) {
            console.error('Supabase configuration is missing. Cannot initialize Supabase.');
            return null;
        }

        supabase = createClient(config.SUPABASE_PROJECT_URL, config.SUPABASE_ANON_KEY);
        console.log('Supabase client initialized successfully.');
    }
    return supabase;
}
