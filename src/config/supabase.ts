import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://isvtezpgzvgluhyftmxt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzdnRlenBnenZnbHVoeWZ0bXh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTc5ODUsImV4cCI6MjA4ODM3Mzk4NX0.7Dak3tqPg37tcRlyWqNjfFBj9pwv-EwRYY0rEbsnhNo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
