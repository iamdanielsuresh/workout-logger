import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import type { Workout, ExerciseSet } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { TrashIcon } from '../../constants';
import { EXERCISE_DATABASE, searchExercises, getExerciseByName, getExercisesByMuscleGroup, MUSCLE_GROUPS } from '../../data/exerciseDatabase';
import { calculateWorkoutVolume, suggestNextWeight, getEstimated1RM, getPersonalRecords } from '../../utils/workoutCalculations';
import { generateWorkoutInsights } from '../../services/geminiService';
import WorkoutTimer from '../WorkoutTimer';

const glassPanelClasses = "bg-white/95 dark:bg-black/20 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-2xl shadow-glass p-6";
const inputClasses = "bg-white dark:bg-white/5 border border-gray-300 dark:border-white/20 rounded-lg w-full p-2.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-glow focus:border-emerald-500 dark:focus:border-accent transition-all";

interface WorkoutLogProps {
  workouts: Workout[];
  addWorkout: (workout: Omit<Workout, 'id' | 'date'>) => void;
}

const WorkoutForm: React.FC<{ 
    addWorkout: (workout: Omit<Workout, 'id' | 'date'>) => void;
    prefilledExercise: string | null;
    workouts: Workout[];
}> = ({ addWorkout, prefilledExercise, workouts }) => {
    const { currentUser } = useAuth();
    const [exerciseName, setExerciseName] = useState('');
    const [sets, setSets] = useState<Partial<ExerciseSet>[]>([{ reps: undefined, weight: undefined }]);
    const [notes, setNotes] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [exerciseSuggestions, setExerciseSuggestions] = useState<typeof EXERCISE_DATABASE>([]);
    const [suggestedWeight, setSuggestedWeight] = useState<number | null>(null);
    const [workoutStartTime] = useState(new Date());
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('All');
    const [aiInsights, setAiInsights] = useState('');
    const [isLoadingInsights, setIsLoadingInsights] = useState(false);

    // Get previous workout data for selected exercise
    const previousWorkout = workouts
        .filter(w => w.exerciseName.toLowerCase() === exerciseName.toLowerCase())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    const personalRecords = exerciseName ? getPersonalRecords(workouts, exerciseName) : null;

    // Generate AI insights when exercise is selected
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
            setAiInsights('Focus on proper form and progressive overload today!');
        } finally {
            setIsLoadingInsights(false);
        }
    };
    
    useEffect(() => {
        if(prefilledExercise) {
            setExerciseName(prefilledExercise);
            // Get suggested weight for this exercise
            const suggested = suggestNextWeight(workouts, prefilledExercise);
            if (suggested > 0) {
                setSuggestedWeight(suggested);
            }
        }
    }, [prefilledExercise, workouts]);

    // Generate insights when exercise changes
    useEffect(() => {
        if (exerciseName && previousWorkout) {
            generateInsights();
        }
    }, [exerciseName, previousWorkout]);

    const handleExerciseNameChange = (value: string) => {
        setExerciseName(value);
        updateSuggestions(value, selectedMuscleGroup);

        // Get suggested weight when exercise is selected
        if (value) {
            const suggested = suggestNextWeight(workouts, value);
            if (suggested > 0) {
                setSuggestedWeight(suggested);
            } else {
                setSuggestedWeight(null);
            }
        }
    };

    const updateSuggestions = (searchTerm: string, muscleGroup: string) => {
        let suggestions = EXERCISE_DATABASE;
        
        // Filter by muscle group first
        if (muscleGroup !== 'All') {
            suggestions = getExercisesByMuscleGroup(muscleGroup);
        }
        
        // Then filter by search term
        if (searchTerm.length > 0) {
            suggestions = suggestions.filter(ex => 
                ex.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        setExerciseSuggestions(suggestions.slice(0, 8));
        setShowSuggestions(suggestions.length > 0);
    };

    const handleMuscleGroupChange = (muscleGroup: string) => {
        setSelectedMuscleGroup(muscleGroup);
        updateSuggestions(exerciseName, muscleGroup);
    };

    const selectExercise = (exercise: typeof EXERCISE_DATABASE[0]) => {
        setExerciseName(exercise.name);
        setShowSuggestions(false);
        
        // Get suggested weight
        const suggested = suggestNextWeight(workouts, exercise.name);
        if (suggested > 0) {
            setSuggestedWeight(suggested);
        }
    };

    const handleSetChange = (index: number, field: keyof ExerciseSet, value: string) => {
        const newSets = [...sets];
        if (field === 'isWarmup') {
            newSets[index] = { ...newSets[index], [field]: value === 'true' };
        } else if (field === 'notes') {
            newSets[index] = { ...newSets[index], [field]: value };
        } else {
            const numValue = value ? Number(value) : undefined;
            newSets[index] = { ...newSets[index], [field]: numValue };
        }
        setSets(newSets);
    };

    const addSet = () => {
        setSets([...sets, { reps: undefined, weight: suggestedWeight || undefined }]);
    };
    
    const removeSet = (index: number) => {
        if(sets.length > 1) {
            setSets(sets.filter((_, i) => i !== index));
        }
    };

    const applySuggestedWeight = () => {
        if (suggestedWeight) {
            const newSets = sets.map(set => ({ ...set, weight: suggestedWeight }));
            setSets(newSets);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalSets = sets.filter(s => typeof s.reps === 'number' && typeof s.weight === 'number').map(s => s as ExerciseSet);
        if (exerciseName && finalSets.length > 0) {
            const exercise = getExerciseByName(exerciseName);
            const duration = Math.round((new Date().getTime() - workoutStartTime.getTime()) / 60000); // duration in minutes
            const totalVolume = calculateWorkoutVolume(finalSets);
            
            addWorkout({ 
                exerciseName, 
                sets: finalSets, 
                notes: notes || undefined,
                duration,
                muscleGroups: exercise?.muscleGroups,
                totalVolume
            });
            setExerciseName('');
            setSets([{ reps: undefined, weight: undefined }]);
            setNotes('');
            setSuggestedWeight(null);
        } else {
            alert("Please fill in the exercise name and at least one complete set (reps and weight).");
        }
    };
    
    return (
        <div className="space-y-6">
            {/* Previous Performance & AI Insights */}
            {exerciseName && previousWorkout && (
                <div className={glassPanelClasses}>
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Previous Performance */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xl">📊</span>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Last Session - {exerciseName}
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
                                    AI Coach Insights
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
                                        {aiInsights || 'Select an exercise to get personalized recommendations.'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className={`${glassPanelClasses} mb-8`}>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Log New Workout</h2>
            
            {/* Muscle Group Filter */}
            <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-slate-300">Filter by Muscle Group</label>
                <div className="flex flex-wrap gap-2">
                    {['All', ...MUSCLE_GROUPS].map((group) => (
                        <button
                            key={group}
                            type="button"
                            onClick={() => handleMuscleGroupChange(group)}
                            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                                selectedMuscleGroup === group
                                    ? 'bg-emerald-500 text-white font-bold'
                                    : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-white/20'
                            }`}
                        >
                            {group}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-4 relative">
                <label htmlFor="exerciseName" className="block mb-2 text-sm font-medium text-slate-300">Exercise Name</label>
                <input
                    type="text"
                    id="exerciseName"
                    value={exerciseName}
                    onChange={(e) => handleExerciseNameChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onFocus={() => {
                        updateSuggestions(exerciseName, selectedMuscleGroup);
                    }}
                    className={inputClasses}
                    placeholder="e.g., Bench Press or start typing..."
                    required
                />
                {showSuggestions && exerciseSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {exerciseSuggestions.map((exercise) => (
                            <div
                                key={exercise.id}
                                onClick={() => selectExercise(exercise)}
                                className="p-3 hover:bg-slate-700 cursor-pointer border-b border-white/10 last:border-b-0"
                            >
                                <div className="text-white font-medium">{exercise.name}</div>
                                <div className="text-xs text-slate-400">
                                    {exercise.muscleGroups.join(', ')} • {exercise.category}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {suggestedWeight && (
                <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-200 text-sm font-medium">Suggested weight based on last workout:</p>
                            <p className="text-blue-100 font-bold">{suggestedWeight} kg</p>
                        </div>
                        <button
                            type="button"
                            onClick={applySuggestedWeight}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                        >
                            Apply to all sets
                        </button>
                    </div>
                </div>
            )}

            {sets.map((set, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 sm:gap-3 items-start mb-3 p-3 bg-white/5 rounded-lg">
                    <span className="col-span-12 sm:col-span-1 text-slate-300 font-semibold text-sm">Set {index+1}</span>
                    
                    <div className="col-span-4 sm:col-span-3">
                        <label htmlFor={`reps-${index}`} className="sr-only">Reps</label>
                         <input
                            type="number"
                            id={`reps-${index}`}
                            value={set.reps || ''}
                            onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                            className={inputClasses}
                            placeholder="Reps"
                            required
                        />
                    </div>
                   <div className="col-span-4 sm:col-span-3">
                       <label htmlFor={`weight-${index}`} className="sr-only">Weight</label>
                         <input
                            type="number"
                            step="0.25"
                            id={`weight-${index}`}
                            value={set.weight || ''}
                            onChange={(e) => handleSetChange(index, 'weight', e.target.value)}
                            className={inputClasses}
                            placeholder="Weight (kg)"
                            required
                        />
                    </div>
                    
                    <div className="col-span-3 sm:col-span-2">
                        <label htmlFor={`warmup-${index}`} className="sr-only">Warmup</label>
                        <select
                            id={`warmup-${index}`}
                            value={set.isWarmup ? 'true' : 'false'}
                            onChange={(e) => handleSetChange(index, 'isWarmup', e.target.value)}
                            className={inputClasses}
                        >
                            <option value="false">Work</option>
                            <option value="true">Warmup</option>
                        </select>
                    </div>
                    
                    <div className="col-span-1 flex justify-end">
                        <button type="button" onClick={() => removeSet(index)} className="text-red-500 hover:text-red-400 disabled:opacity-30 p-1" disabled={sets.length <= 1}>
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>
                    
                    <div className="col-span-12">
                        <input
                            type="text"
                            value={set.notes || ''}
                            onChange={(e) => handleSetChange(index, 'notes', e.target.value)}
                            className={`${inputClasses} text-xs`}
                            placeholder="Set notes (optional)"
                        />
                    </div>
                </div>
            ))}
            
            <div className="mb-4">
                <label htmlFor="workoutNotes" className="block mb-2 text-sm font-medium text-slate-300">Workout Notes (Optional)</label>
                <textarea
                    id="workoutNotes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={inputClasses}
                    placeholder="How did the workout feel? Any observations..."
                    rows={2}
                />
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                <button type="button" onClick={addSet} className="w-full sm:w-auto text-sm font-medium text-accent hover:text-accent-hover">
                    + Add Set
                </button>
                <div className="flex items-center gap-4">
                    {exerciseName && workouts.length > 0 && (
                        <div className="text-xs text-slate-400">
                            <div>Last 1RM estimate: {getEstimated1RM(workouts, exerciseName).toFixed(1)} kg</div>
                        </div>
                    )}
                    <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors">
                        Save Workout
                    </button>
                </div>
            </div>
        </form>
        </div>
    );
};

const WorkoutList: React.FC<{ workouts: Workout[] }> = ({ workouts }) => {
    const groupedWorkouts = workouts.reduce((acc, workout) => {
        const date = new Date(workout.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(workout);
        return acc;
    }, {} as Record<string, Workout[]>);

    const sortedDates = Object.keys(groupedWorkouts).sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
    
    return (
        <div className={glassPanelClasses}>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Workout History</h2>
            {workouts.length === 0 ? (
                <p className="text-gray-500 dark:text-slate-400">No workouts logged yet.</p>
            ) : (
                <div className="space-y-6">
                    {sortedDates.map(date => (
                        <div key={date}>
                            <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2 mb-3">{date}</h3>
                            <div className="space-y-4">
                                {groupedWorkouts[date].map(workout => (
                                    <div key={workout.id} className="bg-white/5 p-4 rounded-lg">
                                        <div className="flex flex-wrap items-center justify-between mb-2">
                                            <p className="font-bold text-white">{workout.exerciseName}</p>
                                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                                {workout.duration && <span>⏱️ {workout.duration}min</span>}
                                                {workout.totalVolume && <span>📊 {workout.totalVolume.toFixed(0)}kg total</span>}
                                                {workout.muscleGroups && (
                                                    <span className="hidden sm:inline">🎯 {workout.muscleGroups.slice(0, 2).join(', ')}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-sm">
                                            {workout.sets.map((set, i) => (
                                                <span 
                                                    key={i} 
                                                    className={`whitespace-nowrap ${set.isWarmup ? 'text-slate-500' : 'text-slate-300'}`}
                                                >
                                                    {set.isWarmup && '(W) '}{set.reps}&nbsp;×&nbsp;{set.weight}kg
                                                    {set.notes && <span className="text-slate-500 ml-1">*</span>}
                                                </span>
                                            ))}
                                        </div>
                                        {workout.notes && (
                                            <div className="text-xs text-slate-400 italic mt-2 p-2 bg-white/5 rounded">
                                                📝 {workout.notes}
                                            </div>
                                        )}
                                        {workout.sets.some(set => set.notes) && (
                                            <div className="text-xs text-slate-400 mt-2">
                                                <details className="cursor-pointer">
                                                    <summary className="hover:text-slate-300">Set notes</summary>
                                                    <div className="mt-1 space-y-1">
                                                        {workout.sets.map((set, i) => 
                                                            set.notes && (
                                                                <div key={i} className="text-slate-500">
                                                                    Set {i + 1}: {set.notes}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </details>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const WorkoutLog: React.FC<WorkoutLogProps> = ({ workouts, addWorkout }) => {
  const location = useLocation();
  const prefilledExercise = new URLSearchParams(location.search).get('exercise');
  const [showTimer, setShowTimer] = useState(false);
  
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workout Log</h1>
        <button
          onClick={() => setShowTimer(!showTimer)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            showTimer 
              ? 'bg-emerald-500 text-white' 
              : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20'
          }`}
        >
          {showTimer ? 'Hide Timer' : '⏱️ Show Timer'}
        </button>
      </div>
      
      <WorkoutForm addWorkout={addWorkout} prefilledExercise={prefilledExercise} workouts={workouts} />
      <WorkoutList workouts={workouts} />
      
      <WorkoutTimer 
        isVisible={showTimer} 
        onClose={() => setShowTimer(false)} 
      />
    </div>
  );
};

export default WorkoutLog;