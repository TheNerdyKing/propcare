import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dqdplijyftnfadufzsed.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.', 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZHBsaWp5ZnRuZmFkdWZ6c2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTkxOTksImV4cCI6MjA4NzA3NTE5OX0.', 'xOIVKTEKQRcCaQKCWJTAUOxyikCvSD8HxNJBdElcVv8'].join('');

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing from environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
