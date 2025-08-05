import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import type { Workout, ExerciseSet } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { generateWorkoutInsights } from '../services/geminiService';
import { suggestNextWeight, getPersonalRecords } from '../utils/workoutCalculations';

interface SmartWorkoutLogProps {
  workouts: Workout[];
  addWorkout: (workout: Omit<Workout, 'id' | 'date'>) => void;
}

const SmartWorkoutLog: React.FC<SmartWorkoutLogProps> = ({ workouts, addWorkout }) => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedExercise = searchParams.get('exercise');
  const targetSets = searchParams.get('targetSets');
  const targetReps = searchParams.get('targetReps');

  const [exerciseName, setExerciseName] = useState(preselectedExercise || '');
  const [sets, setSets] = useState<Partial<ExerciseSet>[]>([{ reps: undefined, weight: undefined }]);
  const [notes, setNotes] = useState('');
  const [aiInsights, setAiInsights] = useState('');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  const glassPanelClasses = "bg-white/95 dark:bg-black/20 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-2xl shadow-glass p-6";
  const inputClasses = "bg-white dark:bg-white/5 border border-gray-300 dark:border-white/20 rounded-lg w-full p-2.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-glow focus:border-emerald-500 dark:focus:border-accent transition-all";

  // Get previous workout data for selected exercise
  const previousWorkout = workouts
    .filter(w => w.exerciseName.toLowerCase() === exerciseName.toLowerCase())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const suggestedWeight = exerciseName ? suggestNextWeight(workouts, exerciseName) : 0;
  const personalRecords = exerciseName ? getPersonalRecords(workouts, exerciseName) : null;

  // Generate AI insights when exercise is selected
  useEffect(() => {
    if (exerciseName && previousWorkout) {
      generateInsights();
    }
  }, [exerciseName, previousWorkout]);

  // Initialize sets based on target or previous workout
  useEffect(() => {
    if (exerciseName) {
      const targetSetCount = targetSets ? parseInt(targetSets) : 3;
      const targetRepCount = targetReps ? parseInt(targetReps) : undefined;
      
      const newSets = Array.from({ length: targetSetCount }, (_, index) => ({
        reps: targetRepCount,
        weight: index === 0 && suggestedWeight > 0 ? suggestedWeight : undefined,
        isWarmup: false
      }));
      
      setSets(newSets);
    }
  }, [exerciseName, targetSets, targetReps, suggestedWeight]);

  const generateInsights = async () => {
    if (!exerciseName || !previousWorkout) return;
    
    setIsLoadingInsights(true);
    try {
      const context = {
        exercise: exerciseName,
        previousWorkout,
        personalRecords,
        userProfile: {
          name: currentUser?.username,
          totalWorkouts: workouts.length
        }
      };

      const insights = await generateWorkoutInsights(context);
      setAiInsights(insights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!exerciseName.trim()) {
      alert('Please enter an exercise name');
      return;
    }

    const validSets = sets.filter(set => 
      set.reps !== undefined && 
      set.weight !== undefined && 
      set.reps > 0 && 
      set.weight >= 0
    ) as ExerciseSet[];

    if (validSets.length === 0) {
      alert('Please add at least one valid set');
      return;
    }

    const workout: Omit<Workout, 'id' | 'date'> = {
      exerciseName: exerciseName.trim(),
      sets: validSets,
      notes: notes.trim()
    };

    addWorkout(workout);
    
    // Reset form
    setExerciseName('');
    setSets([{ reps: undefined, weight: undefined }]);
    setNotes('');
    setAiInsights('');
  };

  const addSet = () => {
    setSets([...sets, { reps: undefined, weight: undefined, isWarmup: false }]);
  };

  const updateSet = (index: number, field: keyof ExerciseSet, value: any) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: value };
    setSets(newSets);
  };

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className={glassPanelClasses}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📝</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Workout Log
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Track your sets and reps with AI-powered insights
            </p>
          </div>
        </div>
      </div>

      {/* Previous Performance & AI Insights */}
      {exerciseName && previousWorkout && (
        <div className={glassPanelClasses}>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Previous Performance */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">📊</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Last Session
                </h3>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {new Date(previousWorkout.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <div className="space-y-2">
                  {previousWorkout.sets.map((set, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">
                        Set {index + 1}:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {set.reps} × {set.weight}kg {set.isWarmup ? '(Warmup)' : ''}
                      </span>
                    </div>
                  ))}
                </div>
                {previousWorkout.notes && (
                  <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30 rounded text-sm">
                    <span className="text-orange-700 dark:text-orange-300">
                      💭 {previousWorkout.notes}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Insights */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🤖</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Coach
                </h3>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-500/30 rounded-lg p-4">
                {isLoadingInsights ? (
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-300">
                    <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                    <span className="text-sm">Analyzing your progress...</span>
                  </div>
                ) : (
                  <p className="text-sm text-purple-700 dark:text-purple-300 leading-relaxed">
                    {aiInsights || 'Enter your exercise to get personalized recommendations.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workout Form */}
      <form onSubmit={handleSubmit} className={glassPanelClasses}>
        {/* Exercise Selection */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Exercise <span className="text-emerald-500">*</span>
          </label>
          <input
            type="text"
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            className={inputClasses}
            placeholder="e.g., Bench Press, Squats, Deadlifts..."
            required
          />
          {suggestedWeight > 0 && (
            <div className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
              💡 Suggested starting weight: {suggestedWeight}kg
            </div>
          )}
        </div>

        {/* Sets */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sets <span className="text-emerald-500">*</span>
            </label>
            <button
              type="button"
              onClick={addSet}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded transition-colors"
            >
              + Add Set
            </button>
          </div>
          
          <div className="space-y-3">
            {sets.map((set, index) => (
              <div key={index} className="flex gap-3 items-center">
                <div className="w-12 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                  Set {index + 1}
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Reps"
                    value={set.reps || ''}
                    onChange={(e) => updateSet(index, 'reps', parseInt(e.target.value) || undefined)}
                    className={inputClasses}
                    min="1"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Weight (kg)"
                    value={set.weight || ''}
                    onChange={(e) => updateSet(index, 'weight', parseFloat(e.target.value) || undefined)}
                    className={inputClasses}
                    step="0.25"
                    min="0"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={set.isWarmup || false}
                    onChange={(e) => updateSet(index, 'isWarmup', e.target.checked)}
                    className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-gray-600 dark:text-gray-400">Warmup</span>
                </label>
                {sets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSet(index)}
                    className="p-2 text-red-500 hover:text-red-700 transition-colors"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClasses}
            placeholder="How did it feel? Any issues with form? Fatigue levels?"
            rows={3}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
        >
          Log Workout
        </button>
      </form>
    </div>
  );
};

export default SmartWorkoutLog;
