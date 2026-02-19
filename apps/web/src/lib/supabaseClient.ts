import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Fallback to a dummy client if variables are missing to prevent 500 crash
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null as any;

if (!supabase) {
    console.error('SUPABASE_URL or SUPABASE_ANON_KEY is missing! UI may fail to render.');
}
