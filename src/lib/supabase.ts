import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Ensure production connection even if Vercel build environment variable is unset or dummy
export const SUPABASE_URL = (!rawUrl || rawUrl.includes('abcdefghijklmnopqr'))
  ? 'https://iimanfsvfyxvbyacspyc.supabase.co'
  : rawUrl;

export const SUPABASE_ANON_KEY = (!rawAnon || rawAnon.includes('dummy'))
  ? 'sb_publishable_5IK8dUKTJOt7xw7BRecvMA_aLGZWMBv'
  : rawAnon;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabase;
