export interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[];
  equipment: string[];
  category: 'compound' | 'isolation' | 'cardio';
  instructions?: string;
  substitutes?: string[]; // IDs of substitute exercises
}

export const MUSCLE_GROUPS = [
  'Chest',
  'Shoulders',
  'Triceps',
  'Back',
  'Biceps',
  'Legs',
  'Quadriceps',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
  'Abs',
  'Forearms'
] as const;

export const EQUIPMENT = [
  'Barbell',
  'Dumbbell',
  'Machine',
  'Cable',
  'Bodyweight',
  'Kettlebell',
  'Resistance Band',
  'Medicine Ball',
  'TRX'
] as const;

export const EXERCISE_DATABASE: Exercise[] = [
  // Chest
  {
    id: 'bench-press',
    name: 'Bench Press',
    muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
    equipment: ['Barbell'],
    category: 'compound',
    instructions: 'Lie on bench, grip bar slightly wider than shoulders, lower to chest, press up',
    substitutes: ['dumbbell-press', 'incline-bench-press', 'push-ups']
  },
  {
    id: 'incline-bench-press',
    name: 'Incline Bench Press',
    muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
    equipment: ['Barbell'],
    category: 'compound',
    substitutes: ['incline-dumbbell-press', 'bench-press']
  },
  {
    id: 'dumbbell-press',
    name: 'Dumbbell Press',
    muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
    equipment: ['Dumbbell'],
    category: 'compound',
    substitutes: ['bench-press', 'push-ups']
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
    equipment: ['Dumbbell'],
    category: 'compound',
    substitutes: ['incline-bench-press', 'dumbbell-press']
  },
  {
    id: 'push-ups',
    name: 'Push-ups',
    muscleGroups: ['Chest', 'Shoulders', 'Triceps', 'Core'],
    equipment: ['Bodyweight'],
    category: 'compound',
    substitutes: ['bench-press', 'dumbbell-press']
  },
  {
    id: 'dumbbell-flyes',
    name: 'Dumbbell Flyes',
    muscleGroups: ['Chest'],
    equipment: ['Dumbbell'],
    category: 'isolation',
    substitutes: ['cable-crossover', 'pec-deck']
  },
  {
    id: 'cable-crossover',
    name: 'Cable Crossover',
    muscleGroups: ['Chest'],
    equipment: ['Cable'],
    category: 'isolation',
    substitutes: ['dumbbell-flyes', 'pec-deck']
  },
  {
    id: 'pec-deck',
    name: 'Pec Deck',
    muscleGroups: ['Chest'],
    equipment: ['Machine'],
    category: 'isolation',
    substitutes: ['dumbbell-flyes', 'cable-crossover']
  },

  // Back
  {
    id: 'deadlift',
    name: 'Deadlift',
    muscleGroups: ['Back', 'Legs', 'Glutes', 'Core'],
    equipment: ['Barbell'],
    category: 'compound',
    substitutes: ['romanian-deadlift', 'sumo-deadlift']
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    muscleGroups: ['Hamstrings', 'Glutes', 'Back'],
    equipment: ['Barbell'],
    category: 'compound',
    substitutes: ['deadlift', 'stiff-leg-deadlift']
  },
  {
    id: 'pull-ups',
    name: 'Pull-ups',
    muscleGroups: ['Back', 'Biceps'],
    equipment: ['Bodyweight'],
    category: 'compound',
    substitutes: ['lat-pulldown', 'chin-ups']
  },
  {
    id: 'chin-ups',
    name: 'Chin-ups',
    muscleGroups: ['Back', 'Biceps'],
    equipment: ['Bodyweight'],
    category: 'compound',
    substitutes: ['pull-ups', 'lat-pulldown']
  },
  {
    id: 'bent-over-row',
    name: 'Bent Over Row',
    muscleGroups: ['Back', 'Biceps'],
    equipment: ['Barbell'],
    category: 'compound',
    substitutes: ['dumbbell-row', 'seated-cable-row', 't-bar-row']
  },
  {
    id: 'dumbbell-row',
    name: 'Dumbbell Row',
    muscleGroups: ['Back', 'Biceps'],
    equipment: ['Dumbbell'],
    category: 'compound',
    substitutes: ['bent-over-row', 'seated-cable-row']
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    muscleGroups: ['Back', 'Biceps'],
    equipment: ['Machine'],
    category: 'compound',
    substitutes: ['pull-ups', 'chin-ups']
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    muscleGroups: ['Back', 'Biceps'],
    equipment: ['Cable'],
    category: 'compound',
    substitutes: ['bent-over-row', 'dumbbell-row']
  },
  {
    id: 't-bar-row',
    name: 'T-Bar Row',
    muscleGroups: ['Back', 'Biceps'],
    equipment: ['Barbell'],
    category: 'compound',
    substitutes: ['bent-over-row', 'dumbbell-row']
  },

  // Legs
  {
    id: 'squat',
    name: 'Squat',
    muscleGroups: ['Quadriceps', 'Glutes', 'Core'],
    equipment: ['Barbell'],
    category: 'compound',
    substitutes: ['front-squat', 'goblet-squat', 'leg-press']
  },
  {
    id: 'front-squat',
    name: 'Front Squat',
    muscleGroups: ['Quadriceps', 'Core'],
    equipment: ['Barbell'],
    category: 'compound',
    substitutes: ['squat', 'goblet-squat']
  },
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    muscleGroups: ['Quadriceps', 'Glutes'],
    equipment: ['Dumbbell'],
    category: 'compound',
    substitutes: ['squat', 'front-squat']
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    muscleGroups: ['Quadriceps', 'Glutes'],
    equipment: ['Dumbbell'],
    category: 'compound',
    substitutes: ['lunges', 'step-ups']
  },
  {
    id: 'lunges',
    name: 'Lunges',
    muscleGroups: ['Quadriceps', 'Glutes'],
    equipment: ['Dumbbell', 'Bodyweight'],
    category: 'compound',
    substitutes: ['bulgarian-split-squat', 'step-ups']
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    muscleGroups: ['Quadriceps', 'Glutes'],
    equipment: ['Machine'],
    category: 'compound',
    substitutes: ['squat', 'hack-squat']
  },
  {
    id: 'leg-curl',
    name: 'Leg Curl',
    muscleGroups: ['Hamstrings'],
    equipment: ['Machine'],
    category: 'isolation',
    substitutes: ['romanian-deadlift', 'nordic-curls']
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    muscleGroups: ['Quadriceps'],
    equipment: ['Machine'],
    category: 'isolation',
    substitutes: ['squat', 'front-squat']
  },
  {
    id: 'calf-raise',
    name: 'Calf Raise',
    muscleGroups: ['Calves'],
    equipment: ['Machine', 'Dumbbell'],
    category: 'isolation',
    substitutes: ['standing-calf-raise', 'seated-calf-raise']
  },

  // Shoulders
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    muscleGroups: ['Shoulders', 'Triceps', 'Core'],
    equipment: ['Barbell'],
    category: 'compound',
    substitutes: ['dumbbell-shoulder-press', 'seated-press']
  },
  {
    id: 'dumbbell-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    muscleGroups: ['Shoulders', 'Triceps'],
    equipment: ['Dumbbell'],
    category: 'compound',
    substitutes: ['overhead-press', 'seated-press']
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    muscleGroups: ['Shoulders'],
    equipment: ['Dumbbell'],
    category: 'isolation',
    substitutes: ['cable-lateral-raise', 'machine-lateral-raise']
  },
  {
    id: 'rear-delt-fly',
    name: 'Rear Delt Fly',
    muscleGroups: ['Shoulders'],
    equipment: ['Dumbbell'],
    category: 'isolation',
    substitutes: ['reverse-fly-machine', 'cable-reverse-fly']
  },

  // Arms
  {
    id: 'bicep-curl',
    name: 'Bicep Curl',
    muscleGroups: ['Biceps'],
    equipment: ['Dumbbell'],
    category: 'isolation',
    substitutes: ['barbell-curl', 'cable-curl', 'hammer-curl']
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    muscleGroups: ['Biceps', 'Forearms'],
    equipment: ['Dumbbell'],
    category: 'isolation',
    substitutes: ['bicep-curl', 'cable-hammer-curl']
  },
  {
    id: 'tricep-dips',
    name: 'Tricep Dips',
    muscleGroups: ['Triceps'],
    equipment: ['Bodyweight'],
    category: 'compound',
    substitutes: ['tricep-extension', 'close-grip-bench-press']
  },
  {
    id: 'tricep-extension',
    name: 'Tricep Extension',
    muscleGroups: ['Triceps'],
    equipment: ['Dumbbell'],
    category: 'isolation',
    substitutes: ['tricep-dips', 'cable-tricep-extension']
  },

  // Core
  {
    id: 'plank',
    name: 'Plank',
    muscleGroups: ['Core', 'Abs'],
    equipment: ['Bodyweight'],
    category: 'isolation',
    substitutes: ['side-plank', 'dead-bug']
  },
  {
    id: 'crunches',
    name: 'Crunches',
    muscleGroups: ['Abs'],
    equipment: ['Bodyweight'],
    category: 'isolation',
    substitutes: ['sit-ups', 'leg-raises']
  },
  {
    id: 'russian-twists',
    name: 'Russian Twists',
    muscleGroups: ['Core', 'Abs'],
    equipment: ['Bodyweight'],
    category: 'isolation',
    substitutes: ['bicycle-crunches', 'wood-chops']
  }
];

// Exercise substitution functions
export const getExerciseSubstitutes = (exerciseId: string): Exercise[] => {
  const exercise = EXERCISE_DATABASE.find(ex => ex.id === exerciseId);
  if (!exercise || !exercise.substitutes) return [];
  
  return exercise.substitutes
    .map(subId => EXERCISE_DATABASE.find(ex => ex.id === subId))
    .filter((ex): ex is Exercise => ex !== undefined);
};

export const findSubstitutesByEquipment = (exerciseId: string, availableEquipment: string[]): Exercise[] => {
  const substitutes = getExerciseSubstitutes(exerciseId);
  return substitutes.filter(exercise => 
    exercise.equipment.some(eq => availableEquipment.includes(eq))
  );
};

export const findSubstitutesByMuscleGroup = (exerciseId: string, targetMuscleGroups?: string[]): Exercise[] => {
  const originalExercise = EXERCISE_DATABASE.find(ex => ex.id === exerciseId);
  if (!originalExercise) return [];
  
  const muscleGroups = targetMuscleGroups || originalExercise.muscleGroups;
  const substitutes = getExerciseSubstitutes(exerciseId);
  
  return substitutes.filter(exercise => 
    exercise.muscleGroups.some(mg => muscleGroups.includes(mg))
  );
};

export const suggestAlternativeExercises = (
  exerciseId: string, 
  filters: {
    equipment?: string[];
    muscleGroups?: string[];
    category?: 'compound' | 'isolation';
  } = {}
): Exercise[] => {
  let alternatives = getExerciseSubstitutes(exerciseId);
  
  if (filters.equipment) {
    alternatives = alternatives.filter(exercise => 
      exercise.equipment.some(eq => filters.equipment!.includes(eq))
    );
  }
  
  if (filters.muscleGroups) {
    alternatives = alternatives.filter(exercise => 
      exercise.muscleGroups.some(mg => filters.muscleGroups!.includes(mg))
    );
  }
  
  if (filters.category) {
    alternatives = alternatives.filter(exercise => exercise.category === filters.category);
  }
  
  return alternatives;
};

export const getExerciseById = (id: string): Exercise | undefined => {
  return EXERCISE_DATABASE.find(exercise => exercise.id === id);
};

export const getExerciseByName = (name: string): Exercise | undefined => {
  return EXERCISE_DATABASE.find(exercise => 
    exercise.name.toLowerCase() === name.toLowerCase()
  );
};

export const getExercisesByMuscleGroup = (muscleGroup: string): Exercise[] => {
  return EXERCISE_DATABASE.filter(exercise => 
    exercise.muscleGroups.includes(muscleGroup)
  );
};

export const searchExercises = (query: string): Exercise[] => {
  const lowercaseQuery = query.toLowerCase();
  return EXERCISE_DATABASE.filter(exercise =>
    exercise.name.toLowerCase().includes(lowercaseQuery) ||
    exercise.muscleGroups.some(mg => mg.toLowerCase().includes(lowercaseQuery))
  );
};
