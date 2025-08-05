import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Workout, ExerciseSet, ManualPlan, ManualPlanDay, ActiveWorkoutSession, ActiveExerciseEntry } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { generateWorkoutInsights } from '../../services/geminiService';
import { suggestNextWeight, getPersonalRecords, calculateWorkoutVolume } from '../../utils/workoutCalculations';
import { TrashIcon, PlusIcon, CheckIcon } from '../../constants';
import WorkoutTimer from '../WorkoutTimer';

const glassPanelClasses = "bg-white/95 dark:bg-black/20 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-2xl shadow-glass p-6";
const inputClasses = "bg-white dark:bg-white/5 border border-gray-300 dark:border-white/20 rounded-lg w-full p-2.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-glow focus:border-emerald-500 dark:focus:border-accent transition-all";

interface PlanWorkoutLogProps {
  workouts: Workout[];
  addWorkout: (workout: Omit<Workout, 'id' | 'date'>) => void;
  plans: ManualPlan[];
  activeSession: ActiveWorkoutSession | null;
  updateWorkoutSession: (session: ActiveWorkoutSession) => void;
  endWorkoutSession: () => void;
  startWorkoutSession: (planId: string, dayOfWeek: number, exercises: any[]) => ActiveWorkoutSession;
}

interface ExerciseLogEntry {
  exerciseName: string;
  targetSets?: string;
  targetReps?: string;
  sets: Partial<ExerciseSet>[];
  notes: string;
  completed: boolean;
}

const PlanWorkoutLog: React.FC<PlanWorkoutLogProps> = ({ 
  workouts, 
  addWorkout, 
  plans, 
  activeSession, 
  updateWorkoutSession, 
  endWorkoutSession, 
  startWorkoutSession 
}) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get parameters from URL
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('sessionId');
  const planId = searchParams.get('planId');
  const dayOfWeek = searchParams.get('dayOfWeek');
  
  const [showTimer, setShowTimer] = useState(false);
  const [workoutStartTime] = useState(new Date());
  const [exerciseEntries, setExerciseEntries] = useState<ExerciseLogEntry[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [aiInsights, setAiInsights] = useState<{ [key: string]: string }>({});
  const [isLoadingInsights, setIsLoadingInsights] = useState<{ [key: string]: boolean }>({});
  const [currentSession, setCurrentSession] = useState<ActiveWorkoutSession | null>(null);

  // Determine if we're working with an active session or creating a new one
  const workingSession = sessionId ? activeSession : null;
  const currentPlan = workingSession ? 
    plans.find(p => p.id === workingSession.planId) : 
    plans.find(p => p.id === planId);
  const currentDay = workingSession ? 
    currentPlan?.days.find(d => d.dayOfWeek === workingSession.dayOfWeek) :
    currentPlan?.days.find(d => d.dayOfWeek === parseInt(dayOfWeek || '0'));

  useEffect(() => {
    if (workingSession) {
      // Continue existing session
      setExerciseEntries(workingSession.exercises.map(ex => ({
        exerciseName: ex.exerciseName,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        sets: ex.sets,
        notes: ex.notes,
        completed: ex.completed
      })));
      setCurrentSession(workingSession);
      
      // Find current exercise index
      const currentIndex = workingSession.exercises.findIndex(ex => !ex.completed);
      setCurrentExerciseIndex(currentIndex >= 0 ? currentIndex : workingSession.exercises.length - 1);
    } else if (currentDay) {
      // Start new session
      const entries: ExerciseLogEntry[] = currentDay.exercises.map(exercise => ({
        exerciseName: exercise.name,
        targetSets: exercise.sets || undefined,
        targetReps: exercise.reps || undefined,
        sets: [{ reps: undefined, weight: undefined, isWarmup: false }],
        notes: '',
        completed: false
      }));
      setExerciseEntries(entries);
      
      // Create session if we have plan and day info
      if (planId && dayOfWeek) {
        const session = startWorkoutSession(planId, parseInt(dayOfWeek), currentDay.exercises);
        setCurrentSession(session);
      }
    }
  }, [workingSession, currentDay, planId, dayOfWeek, startWorkoutSession]);

  // Generate AI insights for an exercise
  const generateInsights = async (exerciseName: string) => {
    const previousWorkout = workouts
      .filter(w => w.exerciseName.toLowerCase() === exerciseName.toLowerCase())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    if (!previousWorkout) return;

    setIsLoadingInsights(prev => ({ ...prev, [exerciseName]: true }));
    
    try {
      const personalRecords = getPersonalRecords(workouts, exerciseName);
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
      setAiInsights(prev => ({ ...prev, [exerciseName]: insights }));
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setIsLoadingInsights(prev => ({ ...prev, [exerciseName]: false }));
    }
  };

  const updateExerciseSet = (exerciseIndex: number, setIndex: number, field: keyof ExerciseSet, value: any) => {
    setExerciseEntries(prev => {
      const newEntries = [...prev];
      const newSets = [...newEntries[exerciseIndex].sets];
      
      if (field === 'isWarmup') {
        newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      } else if (field === 'notes') {
        newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      } else {
        const numValue = value ? Number(value) : undefined;
        newSets[setIndex] = { ...newSets[setIndex], [field]: numValue };
      }
      
      newEntries[exerciseIndex] = { ...newEntries[exerciseIndex], sets: newSets };
      
      // Update session if active
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          exercises: newEntries.map(entry => ({
            exerciseName: entry.exerciseName,
            targetSets: entry.targetSets,
            targetReps: entry.targetReps,
            sets: entry.sets,
            notes: entry.notes,
            completed: entry.completed
          }))
        };
        updateWorkoutSession(updatedSession);
      }
      
      return newEntries;
    });
  };

  const addSetToExercise = (exerciseIndex: number) => {
    setExerciseEntries(prev => {
      const newEntries = [...prev];
      const exercise = newEntries[exerciseIndex];
      const suggestedWeight = suggestNextWeight(workouts, exercise.exerciseName);
      
      newEntries[exerciseIndex] = {
        ...exercise,
        sets: [...exercise.sets, { 
          reps: undefined, 
          weight: suggestedWeight > 0 ? suggestedWeight : undefined, 
          isWarmup: false 
        }]
      };
      return newEntries;
    });
  };

  const removeSetFromExercise = (exerciseIndex: number, setIndex: number) => {
    setExerciseEntries(prev => {
      const newEntries = [...prev];
      const exercise = newEntries[exerciseIndex];
      
      if (exercise.sets.length > 1) {
        newEntries[exerciseIndex] = {
          ...exercise,
          sets: exercise.sets.filter((_, i) => i !== setIndex)
        };
      }
      return newEntries;
    });
  };

  const updateExerciseNotes = (exerciseIndex: number, notes: string) => {
    setExerciseEntries(prev => {
      const newEntries = [...prev];
      newEntries[exerciseIndex] = { ...newEntries[exerciseIndex], notes };
      
      // Update session if active
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          exercises: newEntries.map(entry => ({
            exerciseName: entry.exerciseName,
            targetSets: entry.targetSets,
            targetReps: entry.targetReps,
            sets: entry.sets,
            notes: entry.notes,
            completed: entry.completed
          }))
        };
        updateWorkoutSession(updatedSession);
      }
      
      return newEntries;
    });
  };

  const completeExercise = (exerciseIndex: number) => {
    const exercise = exerciseEntries[exerciseIndex];
    const validSets = exercise.sets.filter(set => 
      set.reps !== undefined && 
      set.weight !== undefined && 
      set.reps > 0 && 
      set.weight >= 0
    ) as ExerciseSet[];

    if (validSets.length === 0) {
      alert('Please add at least one valid set before completing this exercise');
      return;
    }

    const duration = Math.round((new Date().getTime() - workoutStartTime.getTime()) / 60000);
    const totalVolume = calculateWorkoutVolume(validSets);

    const workout: Omit<Workout, 'id' | 'date'> = {
      exerciseName: exercise.exerciseName,
      sets: validSets,
      notes: exercise.notes || undefined,
      duration,
      totalVolume
    };

    addWorkout(workout);

    // Mark exercise as completed and update session
    setExerciseEntries(prev => {
      const newEntries = [...prev];
      newEntries[exerciseIndex] = { ...newEntries[exerciseIndex], completed: true };
      
      // Update session if active
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          exercises: newEntries.map(entry => ({
            exerciseName: entry.exerciseName,
            targetSets: entry.targetSets,
            targetReps: entry.targetReps,
            sets: entry.sets,
            notes: entry.notes,
            completed: entry.completed
          }))
        };
        updateWorkoutSession(updatedSession);
      }
      
      return newEntries;
    });

    // Move to next exercise
    if (exerciseIndex < exerciseEntries.length - 1) {
      setCurrentExerciseIndex(exerciseIndex + 1);
    }
  };

  const handleEndWorkout = () => {
    const completedCount = exerciseEntries.filter(e => e.completed).length;
    const totalCount = exerciseEntries.length;
    
    if (completedCount === 0) {
      const confirmEnd = window.confirm(
        "You haven't completed any exercises yet. Are you sure you want to end this workout?"
      );
      if (!confirmEnd) return;
    } else if (completedCount < totalCount) {
      const confirmEnd = window.confirm(
        `You've completed ${completedCount} out of ${totalCount} exercises. Are you sure you want to end this workout? Your progress will be saved.`
      );
      if (!confirmEnd) return;
    }
    
    // End the session
    endWorkoutSession();
    navigate('/dashboard');
  };

  const getPreviousWorkout = (exerciseName: string) => {
    return workouts
      .filter(w => w.exerciseName.toLowerCase() === exerciseName.toLowerCase())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  const getSuggestedWeight = (exerciseName: string) => {
    return suggestNextWeight(workouts, exerciseName);
  };

  if (!currentPlan || !currentDay) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className={glassPanelClasses}>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Workout Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The workout plan or day you're looking for couldn't be found.
          </p>
          <button
            onClick={() => navigate('/my-plans')}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
          >
            Back to My Plans
          </button>
        </div>
      </div>
    );
  }

  const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const completedCount = exerciseEntries.filter(e => e.completed).length;
  const totalExercises = exerciseEntries.length;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className={glassPanelClasses}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentDay.focus}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {WEEK_DAYS[currentDay.dayOfWeek]} • {currentPlan.planName}
            </p>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Progress: {completedCount}/{totalExercises} exercises completed
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTimer(!showTimer)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showTimer 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20'
              }`}
            >
              {showTimer ? 'Hide Timer' : '⏱️ Timer'}
            </button>
            <button
              onClick={handleEndWorkout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              🏁 End Workout
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20 rounded-lg font-medium transition-colors"
            >
              📱 Dashboard
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / totalExercises) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="space-y-6">
        {exerciseEntries.map((exercise, exerciseIndex) => {
          const previousWorkout = getPreviousWorkout(exercise.exerciseName);
          const suggestedWeight = getSuggestedWeight(exercise.exerciseName);
          const isCurrentExercise = exerciseIndex === currentExerciseIndex;
          
          return (
            <div 
              key={exerciseIndex} 
              className={`${glassPanelClasses} ${
                isCurrentExercise ? 'ring-2 ring-emerald-500 dark:ring-emerald-400' : ''
              } ${exercise.completed ? 'opacity-75' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {exercise.exerciseName}
                    </h3>
                    {exercise.completed && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium">
                        <CheckIcon className="w-4 h-4" />
                        Completed
                      </div>
                    )}
                  </div>
                  {(exercise.targetSets || exercise.targetReps) && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Target: {exercise.targetSets && `${exercise.targetSets} sets`}
                      {exercise.targetSets && exercise.targetReps && ' × '}
                      {exercise.targetReps && `${exercise.targetReps} reps`}
                    </p>
                  )}
                </div>
                
                {!exercise.completed && (
                  <div className="flex items-center gap-2">
                    {suggestedWeight > 0 && (
                      <div className="text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Suggested</div>
                        <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          {suggestedWeight}kg
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => generateInsights(exercise.exerciseName)}
                      className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                      title="Get AI insights"
                    >
                      🤖
                    </button>
                  </div>
                )}
              </div>

              {/* Previous Performance & AI Insights */}
              {previousWorkout && !exercise.completed && (
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {/* Previous Performance */}
                  <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      📊 Last Session
                    </h4>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {new Date(previousWorkout.date).toLocaleDateString()}
                    </div>
                    <div className="space-y-1">
                      {previousWorkout.sets.map((set, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Set {index + 1}:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {set.reps} × {set.weight}kg {set.isWarmup ? '(W)' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                    {previousWorkout.notes && (
                      <div className="mt-2 p-2 bg-orange-100 dark:bg-orange-900/20 rounded text-xs text-orange-700 dark:text-orange-300">
                        💭 {previousWorkout.notes}
                      </div>
                    )}
                  </div>

                  {/* AI Insights */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-500/30 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      🤖 AI Coach
                    </h4>
                    {isLoadingInsights[exercise.exerciseName] ? (
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-300">
                        <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                        <span className="text-sm">Analyzing...</span>
                      </div>
                    ) : (
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        {aiInsights[exercise.exerciseName] || 'Click the robot icon to get personalized insights.'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Sets Logging */}
              {!exercise.completed && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">Sets</h4>
                    <button
                      onClick={() => addSetToExercise(exerciseIndex)}
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Set
                    </button>
                  </div>

                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                      <div className="col-span-12 sm:col-span-1 flex items-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {setIndex + 1}
                        </span>
                      </div>
                      
                      <div className="col-span-4 sm:col-span-3">
                        <input
                          type="number"
                          placeholder="Reps"
                          value={set.reps || ''}
                          onChange={(e) => updateExerciseSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                          className={inputClasses}
                          min="1"
                        />
                      </div>
                      
                      <div className="col-span-4 sm:col-span-3">
                        <input
                          type="number"
                          placeholder="Weight (kg)"
                          value={set.weight || ''}
                          onChange={(e) => updateExerciseSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                          className={inputClasses}
                          step="0.25"
                          min="0"
                        />
                      </div>
                      
                      <div className="col-span-3 sm:col-span-2">
                        <select
                          value={set.isWarmup ? 'true' : 'false'}
                          onChange={(e) => updateExerciseSet(exerciseIndex, setIndex, 'isWarmup', e.target.value === 'true')}
                          className={inputClasses}
                        >
                          <option value="false">Work</option>
                          <option value="true">Warmup</option>
                        </select>
                      </div>
                      
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => removeSetFromExercise(exerciseIndex, setIndex)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                          disabled={exercise.sets.length <= 1}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="col-span-12">
                        <input
                          type="text"
                          placeholder="Set notes (optional)"
                          value={set.notes || ''}
                          onChange={(e) => updateExerciseSet(exerciseIndex, setIndex, 'notes', e.target.value)}
                          className={`${inputClasses} text-sm`}
                        />
                      </div>
                    </div>
                  ))}

                  {/* Exercise Notes */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Exercise Notes (Optional)
                    </label>
                    <textarea
                      value={exercise.notes}
                      onChange={(e) => updateExerciseNotes(exerciseIndex, e.target.value)}
                      className={inputClasses}
                      placeholder="How did this exercise feel? Any form notes or fatigue observations..."
                      rows={2}
                    />
                  </div>

                  {/* Complete Exercise Button */}
                  <button
                    onClick={() => completeExercise(exerciseIndex)}
                    className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                  >
                    <CheckIcon className="w-5 h-5 inline mr-2" />
                    Complete Exercise
                  </button>
                </div>
              )}

              {/* Completed Exercise Summary */}
              {exercise.completed && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 rounded-lg p-4">
                  <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">
                    ✅ Completed
                  </h4>
                  <div className="text-sm text-emerald-700 dark:text-emerald-300">
                    Logged successfully to your workout history.
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Workout Complete Message */}
      {completedCount === totalExercises && totalExercises > 0 && (
        <div className={`${glassPanelClasses} text-center`}>
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Workout Complete!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Great job finishing your {currentDay?.focus} workout!
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleEndWorkout}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors"
            >
              🏁 Finish & Save
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
            >
              📱 Dashboard
            </button>
          </div>
        </div>
      )}

      <WorkoutTimer 
        isVisible={showTimer} 
        onClose={() => setShowTimer(false)} 
      />
    </div>
  );
};

export default PlanWorkoutLog;
