import { WorkoutTemplate, TemplateExercise, Workout } from '../types';
import { getExerciseById } from '../data/exerciseDatabase';

const TEMPLATES_KEY = 'workout-templates';

export const templateService = {
  // Get all templates
  getTemplates: (): WorkoutTemplate[] => {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    if (!stored) return [];
    
    return JSON.parse(stored).map((template: any) => ({
      ...template,
      createdAt: new Date(template.createdAt),
      lastUsed: template.lastUsed ? new Date(template.lastUsed) : undefined
    }));
  },

  // Save template
  saveTemplate: (template: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'useCount'>): WorkoutTemplate => {
    const templates = templateService.getTemplates();
    const newTemplate: WorkoutTemplate = {
      ...template,
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      useCount: 0
    };

    templates.push(newTemplate);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    return newTemplate;
  },

  // Update template
  updateTemplate: (id: string, updates: Partial<WorkoutTemplate>): WorkoutTemplate | null => {
    const templates = templateService.getTemplates();
    const index = templates.findIndex(t => t.id === id);
    
    if (index === -1) return null;
    
    templates[index] = { ...templates[index], ...updates };
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    return templates[index];
  },

  // Delete template
  deleteTemplate: (id: string): boolean => {
    const templates = templateService.getTemplates();
    const filtered = templates.filter(t => t.id !== id);
    
    if (filtered.length === templates.length) return false;
    
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
    return true;
  },

  // Create template from workout
  createTemplateFromWorkout: (
    workouts: Workout[], 
    templateName: string, 
    description?: string
  ): WorkoutTemplate => {
    // Group exercises and calculate averages
    const exerciseMap = new Map<string, {
      exerciseName: string;
      sets: number[];
      weights: number[];
      muscleGroups: string[];
    }>();

    workouts.forEach(workout => {
      if (!exerciseMap.has(workout.exerciseName)) {
        const exercise = getExerciseById(workout.exerciseName.toLowerCase().replace(/\s+/g, '-'));
        exerciseMap.set(workout.exerciseName, {
          exerciseName: workout.exerciseName,
          sets: [],
          weights: [],
          muscleGroups: exercise?.muscleGroups || workout.muscleGroups || []
        });
      }

      const data = exerciseMap.get(workout.exerciseName)!;
      data.sets.push(workout.sets.length);
      data.weights.push(...workout.sets.map(s => s.weight));
    });

    // Convert to template exercises
    const exercises: TemplateExercise[] = Array.from(exerciseMap.entries()).map(([exerciseName, data]) => {
      const avgSets = Math.round(data.sets.reduce((a, b) => a + b, 0) / data.sets.length);
      const avgWeight = Math.round(data.weights.reduce((a, b) => a + b, 0) / data.weights.length);
      
      return {
        exerciseId: exerciseName.toLowerCase().replace(/\s+/g, '-'),
        exerciseName,
        targetSets: avgSets,
        targetReps: '8-12', // Default rep range
        targetWeight: avgWeight,
        restTime: 90 // Default rest time
      };
    });

    // Get unique muscle groups
    const allMuscleGroups = Array.from(
      new Set(
        Array.from(exerciseMap.values())
          .flatMap(data => data.muscleGroups)
      )
    );

    // Estimate duration (5 minutes per exercise + rest time)
    const estimatedDuration = exercises.length * 5 + 
      exercises.reduce((total, ex) => total + (ex.targetSets * (ex.restTime || 90) / 60), 0);

    return templateService.saveTemplate({
      name: templateName,
      description,
      exercises,
      estimatedDuration: Math.round(estimatedDuration),
      targetMuscleGroups: allMuscleGroups,
      difficulty: 'intermediate' // Default difficulty
    });
  },

  // Use template (increment use count and update last used)
  useTemplate: (id: string): WorkoutTemplate | null => {
    const template = templateService.getTemplates().find(t => t.id === id);
    if (!template) return null;

    return templateService.updateTemplate(id, {
      useCount: template.useCount + 1,
      lastUsed: new Date()
    });
  },

  // Get templates by muscle group
  getTemplatesByMuscleGroup: (muscleGroup: string): WorkoutTemplate[] => {
    return templateService.getTemplates().filter(template =>
      template.targetMuscleGroups.includes(muscleGroup)
    );
  },

  // Get templates by difficulty
  getTemplatesByDifficulty: (difficulty: 'beginner' | 'intermediate' | 'advanced'): WorkoutTemplate[] => {
    return templateService.getTemplates().filter(template =>
      template.difficulty === difficulty
    );
  },

  // Get favorite templates
  getFavoriteTemplates: (): WorkoutTemplate[] => {
    return templateService.getTemplates().filter(template => template.isFavorite);
  },

  // Toggle favorite status
  toggleFavorite: (id: string): WorkoutTemplate | null => {
    const template = templateService.getTemplates().find(t => t.id === id);
    if (!template) return null;

    return templateService.updateTemplate(id, {
      isFavorite: !template.isFavorite
    });
  },

  // Search templates
  searchTemplates: (query: string): WorkoutTemplate[] => {
    const templates = templateService.getTemplates();
    const lowercaseQuery = query.toLowerCase();

    return templates.filter(template =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      (template.description && template.description.toLowerCase().includes(lowercaseQuery)) ||
      template.exercises.some(ex => ex.exerciseName.toLowerCase().includes(lowercaseQuery)) ||
      template.targetMuscleGroups.some(mg => mg.toLowerCase().includes(lowercaseQuery)) ||
      (template.tags && template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)))
    );
  }
};
