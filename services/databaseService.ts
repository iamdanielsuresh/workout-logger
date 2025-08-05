import { supabase, DatabaseWorkout, DatabaseManualPlan, DatabaseActiveSession } from '../lib/supabase';
import type { Workout, ManualPlan, ActiveWorkoutSession } from '../types';

export class DatabaseService {
  // Workouts
  static async getWorkouts(userId: string): Promise<Workout[]> {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;

      return data.map(this.mapDatabaseWorkoutToWorkout);
    } catch (error) {
      console.error('Error fetching workouts:', error);
      return [];
    }
  }

  static async addWorkout(userId: string, workout: Omit<Workout, 'id' | 'date'>): Promise<Workout | null> {
    try {
      const dbWorkout: Omit<DatabaseWorkout, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        exercise_name: workout.exerciseName,
        sets: workout.sets,
        date: new Date().toISOString(),
        duration: workout.duration,
        notes: workout.notes,
        muscle_groups: workout.muscleGroups,
        total_volume: workout.totalVolume
      };

      const { data, error } = await supabase
        .from('workouts')
        .insert([dbWorkout])
        .select()
        .single();

      if (error) throw error;

      return this.mapDatabaseWorkoutToWorkout(data);
    } catch (error) {
      console.error('Error adding workout:', error);
      return null;
    }
  }

  // Manual Plans
  static async getManualPlans(userId: string): Promise<ManualPlan[]> {
    try {
      const { data, error } = await supabase
        .from('manual_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(this.mapDatabasePlanToPlan);
    } catch (error) {
      console.error('Error fetching plans:', error);
      return [];
    }
  }

  static async addManualPlan(userId: string, plan: Omit<ManualPlan, 'id' | 'userId'>): Promise<ManualPlan | null> {
    try {
      const dbPlan: Omit<DatabaseManualPlan, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        plan_name: plan.planName,
        start_date: plan.startDate,
        end_date: plan.endDate,
        days: plan.days,
        rest_days: plan.restDays
      };

      const { data, error } = await supabase
        .from('manual_plans')
        .insert([dbPlan])
        .select()
        .single();

      if (error) throw error;

      return this.mapDatabasePlanToPlan(data);
    } catch (error) {
      console.error('Error adding plan:', error);
      return null;
    }
  }

  static async deleteManualPlan(userId: string, planId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('manual_plans')
        .delete()
        .eq('id', planId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting plan:', error);
      return false;
    }
  }

  // Active Sessions
  static async getActiveSession(userId: string): Promise<ActiveWorkoutSession | null> {
    try {
      const { data, error } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw error;
      }

      return this.mapDatabaseSessionToSession(data);
    } catch (error) {
      console.error('Error fetching active session:', error);
      return null;
    }
  }

  static async saveActiveSession(userId: string, session: ActiveWorkoutSession): Promise<boolean> {
    try {
      const dbSession: Omit<DatabaseActiveSession, 'created_at' | 'updated_at'> = {
        id: session.id,
        user_id: userId,
        plan_id: session.planId,
        day_of_week: session.dayOfWeek,
        start_time: session.startTime,
        exercises: session.exercises,
        is_paused: session.isPaused
      };

      const { error } = await supabase
        .from('active_sessions')
        .upsert([dbSession]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving active session:', error);
      return false;
    }
  }

  static async deleteActiveSession(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('active_sessions')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting active session:', error);
      return false;
    }
  }

  // Mapping functions
  private static mapDatabaseWorkoutToWorkout(dbWorkout: DatabaseWorkout): Workout {
    return {
      id: dbWorkout.id,
      exerciseName: dbWorkout.exercise_name,
      sets: dbWorkout.sets,
      date: dbWorkout.date,
      duration: dbWorkout.duration,
      notes: dbWorkout.notes,
      muscleGroups: dbWorkout.muscle_groups,
      totalVolume: dbWorkout.total_volume
    };
  }

  private static mapDatabasePlanToPlan(dbPlan: DatabaseManualPlan): ManualPlan {
    return {
      id: dbPlan.id,
      userId: dbPlan.user_id,
      planName: dbPlan.plan_name,
      startDate: dbPlan.start_date,
      endDate: dbPlan.end_date,
      days: dbPlan.days,
      restDays: dbPlan.rest_days
    };
  }

  private static mapDatabaseSessionToSession(dbSession: DatabaseActiveSession): ActiveWorkoutSession {
    return {
      id: dbSession.id,
      planId: dbSession.plan_id,
      dayOfWeek: dbSession.day_of_week,
      startTime: dbSession.start_time,
      exercises: dbSession.exercises,
      isPaused: dbSession.is_paused
    };
  }
}
