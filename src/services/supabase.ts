/**
 * Supabase Client Configuration
 * 
 * IMPORTANT: Add your Supabase credentials to .env file:
 * SUPABASE_URL=your_supabase_url
 * SUPABASE_ANON_KEY=your_supabase_anon_key
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// const SUPABASE_URL = 'https://bsjonvqbzzflfguyiktd.supabase.co';
// const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzam9udnFienpmbGZndXlpa3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MTIyODEsImV4cCI6MjA3ODQ4ODI4MX0.yAH64o9XiekAzUnLENvaxl8GtjVspy4ny4XNDykVPuM';

// Validate that environment variables are set
const hasValidCredentials = !!(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

if (!hasValidCredentials) {
  console.error('⚠️  Missing Supabase credentials! Please add them to your .env file:');
  console.error('SUPABASE_URL=your_supabase_url');
  console.error('SUPABASE_ANON_KEY=your_supabase_anon_key');
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);