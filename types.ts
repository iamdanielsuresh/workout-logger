
export interface ExerciseSet {
  reps: number;
  weight: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  restTime?: number; // rest time in seconds
  isWarmup?: boolean; // mark warmup sets
  notes?: string; // set-specific notes
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[];
  equipment: string[];
  category: 'compound' | 'isolation' | 'cardio';
  instructions?: string;
}

export interface Workout {
  id: string;
  exerciseName: string;
  sets: ExerciseSet[];
  date: string;
  duration?: number; // workout duration in minutes
  notes?: string; // workout notes
  muscleGroups?: string[]; // targeted muscle groups
  totalVolume?: number; // calculated total volume
}

export interface GeneratedExercise {
  name: string;
  sets: string;
  reps: string;
}

export interface GeneratedDay {
  day: string;
  exercises: GeneratedExercise[];
}

export interface GeneratedPlan {
  planName: string;
  days: GeneratedDay[];
}

// Active Workout Session Management
export interface ActiveWorkoutSession {
  id: string;
  planId: string;
  dayOfWeek: number;
  startTime: string;
  exercises: ActiveExerciseEntry[];
  isPaused?: boolean;
}

export interface ActiveExerciseEntry {
  exerciseName: string;
  targetSets?: string;
  targetReps?: string;
  sets: Partial<ExerciseSet>[];
  notes: string;
  completed: boolean;
}

// New types for Auth and Manual Plans
export interface UserDetails {
    height?: number; // in cm
    weight?: number; // in kg
    fatPercentage?: number;
    bmi?: number;
}

export interface User {
    username: string;
    details?: UserDetails;
}

export interface ManualPlanDay {
    dayOfWeek: number; // 0 for Sunday, 1 for Monday, etc.
    focus: string;
    exercises: GeneratedExercise[];
}

export interface ManualPlan {
    id: string;
    userId: string;
    planName: string;
    startDate: string;
    endDate: string;
    days: ManualPlanDay[];
    restDays: number[]; // 0 for Sunday, 1 for Monday, etc.
}

export interface RecoveryStatus {
  muscleGroup: string;
  lastWorked: Date;
  hoursRecovered: number;
  recoveryScore: number; // 0-100
  status: 'fully-recovered' | 'partially-recovered' | 'needs-rest';
  nextOptimalTraining: Date;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  exercises: TemplateExercise[];
  estimatedDuration: number; // minutes
  targetMuscleGroups: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
  isFavorite?: boolean;
  tags?: string[];
}

export interface TemplateExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: string; // e.g., "8-12", "5", "AMRAP"
  targetWeight?: number;
  restTime?: number; // seconds
  notes?: string;
  isSuperset?: boolean;
  supersetWith?: string; // exercise ID
}