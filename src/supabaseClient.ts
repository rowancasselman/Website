import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bpztegzclzpsvajkqaai.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwenRlZ3pjbHpwc3ZhamtxYWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MjA0NzksImV4cCI6MjA2ODI5NjQ3OX0.M8MZWBggd_pPC0UUj6YrIxy_1VNQlA3yHVHYO5un3hQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);