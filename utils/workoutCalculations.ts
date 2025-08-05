import type { Workout, ExerciseSet } from '../types';

/**
 * Calculate one-rep max using Epley formula: 1RM = weight × (1 + reps/30)
 */
export const calculateOneRepMax = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 100) / 100;
};

/**
 * Calculate estimated reps for a given percentage of 1RM
 */
export const calculateRepsForPercentage = (oneRM: number, percentage: number): number => {
  const weight = oneRM * (percentage / 100);
  // Using reverse Epley formula: reps = 30 × (weight/1RM - 1)
  return Math.round(30 * (weight / oneRM - 1));
};

/**
 * Calculate total volume for a workout (sets × reps × weight)
 */
export const calculateWorkoutVolume = (sets: ExerciseSet[]): number => {
  return sets.reduce((total, set) => {
    if (!set.isWarmup) { // Don't count warmup sets in volume
      return total + (set.reps * set.weight);
    }
    return total;
  }, 0);
};

/**
 * Calculate total volume for all workouts of a specific exercise
 */
export const calculateTotalVolumeByExercise = (workouts: Workout[], exerciseName: string): number => {
  return workouts
    .filter(w => w.exerciseName.toLowerCase() === exerciseName.toLowerCase())
    .reduce((total, workout) => total + calculateWorkoutVolume(workout.sets), 0);
};

/**
 * Get the maximum weight lifted for a specific exercise
 */
export const getMaxWeightForExercise = (workouts: Workout[], exerciseName: string): number => {
  const exerciseWorkouts = workouts.filter(w => 
    w.exerciseName.toLowerCase() === exerciseName.toLowerCase()
  );
  
  if (exerciseWorkouts.length === 0) return 0;
  
  let maxWeight = 0;
  exerciseWorkouts.forEach(workout => {
    workout.sets.forEach(set => {
      if (!set.isWarmup && set.weight > maxWeight) {
        maxWeight = set.weight;
      }
    });
  });
  
  return maxWeight;
};

/**
 * Get the estimated 1RM for a specific exercise based on all workouts
 */
export const getEstimated1RM = (workouts: Workout[], exerciseName: string): number => {
  const exerciseWorkouts = workouts.filter(w => 
    w.exerciseName.toLowerCase() === exerciseName.toLowerCase()
  );
  
  if (exerciseWorkouts.length === 0) return 0;
  
  let best1RM = 0;
  exerciseWorkouts.forEach(workout => {
    workout.sets.forEach(set => {
      if (!set.isWarmup) {
        const estimated1RM = calculateOneRepMax(set.weight, set.reps);
        if (estimated1RM > best1RM) {
          best1RM = estimated1RM;
        }
      }
    });
  });
  
  return Math.round(best1RM * 100) / 100;
};

/**
 * Track muscle group recovery and suggest training frequency
 */
export const getMuscleGroupRecovery = (workouts: Workout[], muscleGroup: string) => {
  const relevantWorkouts = workouts
    .filter(w => w.muscleGroups?.includes(muscleGroup))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (relevantWorkouts.length === 0) {
    return {
      status: 'ready',
      lastTrained: null,
      daysSinceLastTraining: 0,
      recommendation: 'Ready to train',
      optimalFrequency: '2-3x per week'
    };
  }
  
  const lastWorkout = relevantWorkouts[0];
  const daysSince = Math.floor((Date.now() - new Date(lastWorkout.date).getTime()) / (24 * 60 * 60 * 1000));
  
  // Calculate average training frequency
  const workoutDates = relevantWorkouts.slice(0, 8).map(w => new Date(w.date));
  let totalDaysBetween = 0;
  let intervals = 0;
  
  for (let i = 0; i < workoutDates.length - 1; i++) {
    const daysBetween = Math.floor((workoutDates[i].getTime() - workoutDates[i + 1].getTime()) / (24 * 60 * 60 * 1000));
    totalDaysBetween += daysBetween;
    intervals++;
  }
  
  const avgDaysBetween = intervals > 0 ? totalDaysBetween / intervals : 7;
  
  // Determine recovery status
  let status: 'ready' | 'recovering' | 'overdue';
  let recommendation: string;
  let optimalFrequency: string;
  
  if (daysSince <= 1) {
    status = 'recovering';
    recommendation = 'Recently trained. Allow 24-48h recovery';
    optimalFrequency = 'Rest or train other muscle groups';
  } else if (daysSince <= 2) {
    status = 'recovering';
    recommendation = 'In recovery window. Can train lightly if feeling good';
    optimalFrequency = 'Light training acceptable';
  } else if (daysSince <= 4) {
    status = 'ready';
    recommendation = 'Fully recovered. Optimal training window';
    optimalFrequency = 'Prime time for training';
  } else {
    status = 'overdue';
    recommendation = 'Consider training soon to maintain gains';
    optimalFrequency = 'Training recommended';
  }
  
  return {
    status,
    lastTrained: lastWorkout.date,
    daysSinceLastTraining: daysSince,
    recommendation,
    optimalFrequency,
    averageDaysBetween: Math.round(avgDaysBetween * 10) / 10
  };
};

/**
 * Get overall recovery status for all trained muscle groups
 */
export const getOverallRecoveryStatus = (workouts: Workout[]) => {
  const trainedMuscleGroups = [...new Set(
    workouts.flatMap(w => w.muscleGroups || [])
  )];
  
  const recoveryMap = trainedMuscleGroups.map(mg => ({
    muscleGroup: mg,
    ...getMuscleGroupRecovery(workouts, mg)
  }));
  
  const readyCount = recoveryMap.filter(r => r.status === 'ready').length;
  const recoveringCount = recoveryMap.filter(r => r.status === 'recovering').length;
  const overdueCount = recoveryMap.filter(r => r.status === 'overdue').length;
  
  return {
    muscleGroups: recoveryMap,
    summary: {
      ready: readyCount,
      recovering: recoveringCount,
      overdue: overdueCount,
      total: trainedMuscleGroups.length
    }
  };
};

/**
 * Calculate weekly volume trend
 */
export const getWeeklyVolumeTrend = (workouts: Workout[], exerciseName: string, weeks: number = 4): number[] => {
  const now = new Date();
  const weeklyVolumes: number[] = [];
  
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekWorkouts = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      return workoutDate >= weekStart && 
             workoutDate <= weekEnd && 
             w.exerciseName.toLowerCase() === exerciseName.toLowerCase();
    });
    
    const weeklyVolume = weekWorkouts.reduce((total, workout) => 
      total + calculateWorkoutVolume(workout.sets), 0
    );
    
    weeklyVolumes.push(weeklyVolume);
  }
  
  return weeklyVolumes;
};

/**
 * Get personal records for an exercise
 */
export const getPersonalRecords = (workouts: Workout[], exerciseName: string) => {
  const exerciseWorkouts = workouts.filter(w => 
    w.exerciseName.toLowerCase() === exerciseName.toLowerCase()
  );
  
  if (exerciseWorkouts.length === 0) {
    return {
      maxWeight: 0,
      maxReps: 0,
      maxVolume: 0,
      estimated1RM: 0,
      bestSet: null
    };
  }
  
  let maxWeight = 0;
  let maxReps = 0;
  let maxVolume = 0;
  let estimated1RM = 0;
  let bestSet: (ExerciseSet & { date: string }) | null = null;
  
  exerciseWorkouts.forEach(workout => {
    const workoutVolume = calculateWorkoutVolume(workout.sets);
    if (workoutVolume > maxVolume) {
      maxVolume = workoutVolume;
    }
    
    workout.sets.forEach(set => {
      if (!set.isWarmup) {
        if (set.weight > maxWeight) {
          maxWeight = set.weight;
          bestSet = { ...set, date: workout.date };
        }
        if (set.reps > maxReps) {
          maxReps = set.reps;
        }
        
        const setEstimated1RM = calculateOneRepMax(set.weight, set.reps);
        if (setEstimated1RM > estimated1RM) {
          estimated1RM = setEstimated1RM;
        }
      }
    });
  });
  
  return {
    maxWeight: Math.round(maxWeight * 100) / 100,
    maxReps,
    maxVolume: Math.round(maxVolume * 100) / 100,
    estimated1RM: Math.round(estimated1RM * 100) / 100,
    bestSet
  };
};

/**
 * Suggest next workout weights based on progression with detailed analysis
 */
export const suggestNextWeight = (workouts: Workout[], exerciseName: string): number => {
  const exerciseWorkouts = workouts
    .filter(w => w.exerciseName.toLowerCase() === exerciseName.toLowerCase())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (exerciseWorkouts.length === 0) return 0;
  
  const lastWorkout = exerciseWorkouts[0];
  const workingSets = lastWorkout.sets.filter(set => !set.isWarmup);
  
  if (workingSets.length === 0) return 0;
  
  // If all sets were completed successfully (assuming 8+ reps means good form)
  const avgReps = workingSets.reduce((sum, set) => sum + set.reps, 0) / workingSets.length;
  const avgWeight = workingSets.reduce((sum, set) => sum + set.weight, 0) / workingSets.length;
  
  // Progressive overload: if average reps >= 8, suggest weight increase
  if (avgReps >= 8) {
    return Math.round((avgWeight * 1.025) * 4) / 4; // 2.5% increase, rounded to nearest 0.25kg
  }
  
  return avgWeight; // Maintain current weight if struggling with reps
};

/**
 * Get detailed progressive overload recommendations
 */
export const getProgressiveOverloadSuggestions = (workouts: Workout[], exerciseName: string) => {
  const exerciseWorkouts = workouts
    .filter(w => w.exerciseName.toLowerCase() === exerciseName.toLowerCase())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5); // Last 5 workouts
  
  if (exerciseWorkouts.length === 0) {
    return {
      suggestion: 'No data available',
      reasoning: 'Log some workouts to get progression suggestions',
      nextWeight: 0,
      confidence: 0
    };
  }
  
  const lastWorkout = exerciseWorkouts[0];
  const workingSets = lastWorkout.sets.filter(set => !set.isWarmup);
  
  if (workingSets.length === 0) {
    return {
      suggestion: 'Add working sets',
      reasoning: 'Mark some sets as working sets (not warmup) to get suggestions',
      nextWeight: 0,
      confidence: 0
    };
  }
  
  const avgReps = workingSets.reduce((sum, set) => sum + set.reps, 0) / workingSets.length;
  const avgWeight = workingSets.reduce((sum, set) => sum + set.weight, 0) / workingSets.length;
  const maxWeight = Math.max(...workingSets.map(s => s.weight));
  
  // Analyze performance trend
  let trend = 'stable';
  let confidence = 50;
  
  if (exerciseWorkouts.length >= 2) {
    const currentMax = Math.max(...exerciseWorkouts[0].sets.filter(s => !s.isWarmup).map(s => s.weight));
    const previousMax = Math.max(...exerciseWorkouts[1].sets.filter(s => !s.isWarmup).map(s => s.weight));
    
    if (currentMax > previousMax) {
      trend = 'improving';
      confidence = 75;
    } else if (currentMax < previousMax) {
      trend = 'declining';
      confidence = 60;
    }
  }
  
  // Generate suggestions based on performance
  if (avgReps >= 10) {
    return {
      suggestion: 'Increase weight',
      reasoning: `Strong performance (${avgReps.toFixed(1)} avg reps). Ready for weight increase.`,
      nextWeight: Math.round((maxWeight * 1.05) * 4) / 4, // 5% increase
      confidence: Math.min(90, confidence + 20)
    };
  } else if (avgReps >= 8) {
    return {
      suggestion: 'Small weight increase',
      reasoning: `Good performance (${avgReps.toFixed(1)} avg reps). Small increase recommended.`,
      nextWeight: Math.round((maxWeight * 1.025) * 4) / 4, // 2.5% increase
      confidence: Math.min(80, confidence + 10)
    };
  } else if (avgReps >= 6) {
    return {
      suggestion: 'Maintain weight',
      reasoning: `Moderate performance (${avgReps.toFixed(1)} avg reps). Focus on form and consistency.`,
      nextWeight: maxWeight,
      confidence: confidence
    };
  } else {
    return {
      suggestion: 'Reduce weight or check form',
      reasoning: `Low reps (${avgReps.toFixed(1)} avg). Consider deloading or form check.`,
      nextWeight: Math.round((maxWeight * 0.9) * 4) / 4, // 10% decrease
      confidence: Math.min(70, confidence + 5)
    };
  }
};
