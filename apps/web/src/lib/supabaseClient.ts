import { createClient } from '@supabase/supabase-js';

// Hardcoded for Vercel deployment as requested by user
const supabaseUrl = "https://dqdplijyftnfadufzsed.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZHBsaWp5ZnRuZmFkdWZ6c2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTkxOTksImV4cCI6MjA4NzA3NTE5OX0.xOIVKTEKQRcCaQKCWJTAUOxyikCvSD8HxNJBdElcVv8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
