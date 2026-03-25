import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pmyjzfxqjhgoahgtspoa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBteWp6Znhxamhnb2FoZ3RzcG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0Mjk2MjksImV4cCI6MjA5MDAwNTYyOX0.WjeDISMpzpaK9agwpYUP7w9gDDzEFa-dXpJ1LhE6xV0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});