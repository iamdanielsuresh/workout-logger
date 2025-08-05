import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database table types for TypeScript
export interface DatabaseWorkout {
  id: string;
  user_id: string;
  exercise_name: string;
  sets: any; // JSON
  date: string;
  duration?: number;
  notes?: string;
  muscle_groups?: string[];
  total_volume?: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseManualPlan {
  id: string;
  user_id: string;
  plan_name: string;
  start_date: string;
  end_date: string;
  days: any; // JSON
  rest_days: number[];
  created_at: string;
  updated_at: string;
}

export interface DatabaseActiveSession {
  id: string;
  user_id: string;
  plan_id: string;
  day_of_week: number;
  start_time: string;
  exercises: any; // JSON
  is_paused?: boolean;
  created_at: string;
  updated_at: string;
}
