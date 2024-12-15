import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    const { city } = req.query;

    try {
        const { data, error } = await supabase
            .from('cache')
            .select('*')
            .eq('city', city)
            .order('timestamp', { ascending: false })
            .limit(1);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (data.length === 0) {
            return res.status(404).json({ message: 'No data found for the specified city.' });
        }

        res.status(200).json(data[0]);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
}
