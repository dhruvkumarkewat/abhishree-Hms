import { createClient } from '@supabase/supabase-js';
import { triggerRestore } from './db-wake.js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseUrl = (!rawUrl || rawUrl.includes('abcdefghijklmnopqr'))
  ? 'https://iimanfsvfyxvbyacspyc.supabase.co'
  : rawUrl;

const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseKey = (!rawKey || rawKey.includes('dummy'))
  ? 'sb_publishable_5IK8dUKTJOt7xw7BRecvMA_aLGZWMBv'
  : rawKey;

const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    global: {
      fetch: async (url, options) => {
        const res = await fetch(url, options);
        if (!res.ok && res.status >= 500) triggerRestore();
        return res;
      },
    },
  }
);

export default supabase;
