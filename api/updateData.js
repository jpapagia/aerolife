//From updateCache() in core.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { city, latitude, longitude, dataType, data } = req.body;

    try {
        const { error } = await supabase
            .from('cache')
            .upsert({
                city,
                latitude,
                longitude,
                [`${dataType}_data`]: data,
                timestamp: new Date().toISOString(),
            }, { onConflict: 'city' });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json({ message: 'Data updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
}
