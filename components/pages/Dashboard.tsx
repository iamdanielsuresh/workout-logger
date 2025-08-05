import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { Workout, ManualPlan, ActiveWorkoutSession } from '../../types';
import ProgressChart from '../ProgressChart';
import ExerciseStats from '../ExerciseStats';
import OneRMCalculator from '../OneRMCalculator';
import PlateCalculator from '../PlateCalculator';
import SmartWorkoutGreeting from '../SmartWorkoutGreeting';
import { useAuth } from '../../contexts/AuthContext';
import { QUOTES } from '../../constants';
import { getPersonalRecords, calculateWorkoutVolume } from '../../utils/workoutCalculations';

const glassPanelClasses = "bg-white/90 dark:bg-black/20 backdrop-blur-xl border border-gray-300 dark:border-white/10 rounded-2xl shadow-lg p-6";
const inputClasses = "bg-white dark:bg-white/5 border border-gray-300 dark:border-white/20 rounded-lg w-full p-2.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all";

interface DashboardProps {
  workouts: Workout[];
  manualPlans: ManualPlan[];
  activeSession: ActiveWorkoutSession | null;
  startWorkoutSession: (planId: string, dayOfWeek: number, exercises: any[]) => ActiveWorkoutSession;
}

const Dashboard: React.FC<DashboardProps> = ({ workouts, manualPlans, activeSession, startWorkoutSession }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const uniqueExercises = useMemo(() => {
    const exerciseSet = new Set(workouts.map(w => w.exerciseName).sort());
    return Array.from(exerciseSet);
  }, [workouts]);

  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [showStats, setShowStats] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showPlateCalculator, setShowPlateCalculator] = useState(false);

  // Enhanced statistics
  const workoutStats = useMemo(() => {
    const totalWorkouts = workouts.length;
    const totalVolume = workouts.reduce((total, workout) => 
      total + calculateWorkoutVolume(workout.sets), 0
    );
    
    // Calculate streak (consecutive days with workouts)
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let currentStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const dayWorkouts = sortedWorkouts.filter(w => {
        const workoutDate = new Date(w.date);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === checkDate.getTime();
      });
      
      if (dayWorkouts.length > 0) {
        currentStreak++;
      } else if (currentStreak > 0) {
        break; // Streak broken
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    const thisWeekWorkouts = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return workoutDate >= weekStart;
    }).length;

    // Calculate this month's progress
    const thisMonthWorkouts = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      const now = new Date();
      return workoutDate.getMonth() === now.getMonth() && workoutDate.getFullYear() === now.getFullYear();
    }).length;

    return {
      totalWorkouts,
      totalVolume: Math.round(totalVolume),
      currentStreak,
      thisWeekWorkouts,
      thisMonthWorkouts
    };
  }, [workouts]);

  const activePlan = useMemo(() => {
    const now = new Date();
    return manualPlans.find(p => new Date(p.startDate) <= now && new Date(p.endDate) >= now);
  }, [manualPlans]);

  const todaysWorkout = useMemo(() => {
    if (!activePlan) return null;
    const today = new Date();
    const todayDayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

    if (activePlan.restDays.includes(todayDayOfWeek)) {
        return { isRestDay: true };
    }
    
    const workoutDay = activePlan.days.find(d => d.dayOfWeek === todayDayOfWeek);
    return workoutDay ? { isRestDay: false, ...workoutDay } : null;

  }, [activePlan]);

  const lastWorkout = useMemo(() => {
      if(workouts.length === 0) return null;
      // Assuming workouts are sorted by date descending
      const latestWorkout = workouts[0];
      return {
          ...latestWorkout,
          date: new Date(latestWorkout.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
      };
  }, [workouts]);

  // Check if there's an active workout session for today's workout
  const isActiveSessionForToday = useMemo(() => {
    if (!activeSession || !activePlan || !todaysWorkout) return false;
    const today = new Date().getDay();
    return activeSession.planId === activePlan.id && activeSession.dayOfWeek === today;
  }, [activeSession, activePlan, todaysWorkout]);

  const handleStartWorkout = () => {
    if (!activePlan || !todaysWorkout || 'isRestDay' in todaysWorkout) return;
    
    const today = new Date().getDay();
    const session = startWorkoutSession(activePlan.id, today, todaysWorkout.exercises || []);
    navigate(`/plan-workout?sessionId=${session.id}`);
  };

  const handleContinueWorkout = () => {
    if (!activeSession) return;
    navigate(`/plan-workout?sessionId=${activeSession.id}`);
  };

  useEffect(() => {
    if (uniqueExercises.length > 0 && !selectedExercise) {
      setSelectedExercise(uniqueExercises[0]);
    }
  }, [uniqueExercises, selectedExercise]);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Smart Workout Greeting */}
      <SmartWorkoutGreeting 
        workouts={workouts}
        activePlan={activePlan}
        todaysWorkout={todaysWorkout}
      />

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
          <span className="text-xl">⚡</span>
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link 
            to="/log" 
            className="flex flex-col items-center gap-2 p-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <span className="text-2xl">📝</span>
            <span className="text-sm font-medium">Log Workout</span>
          </Link>
          
          <button
            onClick={() => setShowPlateCalculator(true)}
            className="flex flex-col items-center gap-2 p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <span className="text-2xl">🏋️</span>
            <span className="text-sm font-medium">Plate Calc</span>
          </button>
          
          <Link 
            to="/templates" 
            className="flex flex-col items-center gap-2 p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <span className="text-2xl">📋</span>
            <span className="text-sm font-medium">Templates</span>
          </Link>
          
          <Link 
            to="/recovery" 
            className="flex flex-col items-center gap-2 p-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <span className="text-2xl">😴</span>
            <span className="text-sm font-medium">Recovery</span>
          </Link>
        </div>
      </div>

      {/* Quick Stats Overview */}
      {workouts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className={glassPanelClasses}>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-500">{workoutStats.currentStreak}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Day Streak 🔥</div>
            </div>
          </div>
          <div className={glassPanelClasses}>
                        <div className="text-center">
              <div className="text-2xl font-bold text-emerald-500">{workoutStats.thisWeekWorkouts}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">This Week 📈</div>
            </div>
          </div>
          <div className={glassPanelClasses}>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-500">{workoutStats.thisMonthWorkouts}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">This Month 🗓️</div>
            </div>
          </div>
          <div className={glassPanelClasses}>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-500">{workoutStats.totalVolume.toLocaleString()}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Volume 💪</div>
            </div>
          </div>
          <div className={glassPanelClasses}>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-500">{workoutStats.totalWorkouts}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Workouts ⚡</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className={`lg:col-span-2 ${glassPanelClasses}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-emerald-500 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Today's Focus
              </h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
            </div>
            {todaysWorkout ? (
                'isRestDay' in todaysWorkout && todaysWorkout.isRestDay ? (
                    <div className="text-center py-8">
                        <div className="text-6xl mb-3">😴</div>
                        <p className="text-gray-900 dark:text-white text-lg font-semibold mb-2">Rest Day</p>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">Recovery is just as important as training!</p>
                        <div className="flex gap-2 justify-center">
                          <Link to="/recovery" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors">
                            Check Recovery
                          </Link>
                          <Link to="/my-plans" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            View Plan
                          </Link>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 rounded-lg">
                          <p className="text-emerald-800 dark:text-emerald-200 text-lg font-semibold flex items-center gap-2">
                            <span className="text-xl">💪</span>
                            {'focus' in todaysWorkout && todaysWorkout.focus}
                          </p>
                          <div className="flex gap-2 mt-3">
                            {isActiveSessionForToday ? (
                              <button
                                onClick={handleContinueWorkout}
                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg transition-colors"
                              >
                                ⏭️ Continue Workout
                              </button>
                            ) : (
                              <button
                                onClick={handleStartWorkout}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors"
                              >
                                🚀 Start Today's Workout
                              </button>
                            )}
                            <Link to="/my-plans" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                              View Plan
                            </Link>
                          </div>
                          {isActiveSessionForToday && activeSession && (
                            <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-orange-700 dark:text-orange-300 text-sm font-medium">
                                  🔥 Workout in Progress
                                </span>
                                <span className="text-orange-600 dark:text-orange-400 text-xs">
                                  {activeSession.exercises.filter(e => e.completed).length}/{activeSession.exercises.length} exercises
                                </span>
                              </div>
                              <div className="mt-2 w-full bg-orange-200 dark:bg-orange-800 rounded-full h-2">
                                <div 
                                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${(activeSession.exercises.filter(e => e.completed).length / activeSession.exercises.length) * 100}%` 
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                           {'exercises' in todaysWorkout && todaysWorkout.exercises?.map((ex, index) => (
                               <div key={ex.name} className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                   <div className="flex items-center gap-3">
                                     <div className="text-lg font-bold text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                                       {index + 1}
                                     </div>
                                     <div>
                                       <span className="font-semibold text-gray-900 dark:text-white block">{ex.name}</span>
                                       <span className="text-sm text-gray-600 dark:text-gray-400">
                                         {ex.sets && ex.reps ? `${ex.sets} sets × ${ex.reps} reps` : 'Flexible sets/reps'}
                                       </span>
                                     </div>
                                   </div>
                                   <Link 
                                     to={`/log?exercise=${encodeURIComponent(ex.name)}`} 
                                     className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 shadow-md"
                                   >
                                       Quick Log
                                   </Link>
                               </div>
                            ))}
                        </div>
                    </div>
                )
            ) : activePlan ? (
                 <div className="text-center py-8">
                    <div className="text-4xl mb-3">🤷‍♂️</div>
                    <p className="text-gray-900 dark:text-white text-lg font-semibold mb-2">Free Training Day</p>
                    <p className="text-gray-600 dark:text-slate-300 mb-4">No specific workout scheduled for today. Perfect for cardio, mobility, or trying something new!</p>
                    <div className="flex gap-2 justify-center">
                      <Link to="/log" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">
                        Log Custom Workout
                      </Link>
                      <Link to="/templates" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
                        Use Template
                      </Link>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="text-4xl mb-3">📋</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Active Plan</h3>
                    <p className="text-gray-600 dark:text-slate-300 mb-4">Create a training plan to get personalized daily workouts.</p>
                    <div className="flex gap-2 justify-center">
                      <Link to="/my-plans" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">
                          Create Plan
                      </Link>
                      <Link to="/generator" className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors">
                          AI Generate
                      </Link>
                    </div>
                </div>
            )}
        </div>
        <div className={glassPanelClasses}>
             <h2 className="text-xl font-bold text-emerald-500 mb-4">Recent Activity</h2>
             {workouts.length > 0 ? (
                <div className="space-y-3">
                    {workouts.slice(0, 4).map((workout, index) => {
                        const workoutPRs = getPersonalRecords(workouts, workout.exerciseName);
                        const isNewPR = workouts
                            .filter(w => w.exerciseName === workout.exerciseName)
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.id === workout.id &&
                            workout.sets.some(set => !set.isWarmup && set.weight === workoutPRs.maxWeight);
                        
                        return (
                            <div key={workout.id} className="bg-gray-100/50 dark:bg-white/5 p-3 rounded-lg border border-gray-200/50 dark:border-white/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-gray-800 dark:text-white font-medium text-sm">{workout.exerciseName}</p>
                                            {isNewPR && <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">PR!</span>}
                                        </div>
                                        <p className="text-gray-500 dark:text-slate-400 text-xs">
                                            {new Date(workout.date).toLocaleDateString('en-US', { 
                                                month: 'short', 
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-emerald-500 text-sm font-bold">
                                            {Math.max(...workout.sets.filter(s => !s.isWarmup).map(s => s.weight))} kg
                                        </p>
                                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                                            {workout.sets.filter(s => !s.isWarmup).length} sets
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <Link to="/log" className="block text-center text-emerald-500 text-sm hover:text-emerald-600 mt-3">&
                        View all workouts →
                    </Link>
                </div>
             ) : (
                <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-slate-400 mb-4">You haven't logged any workouts yet.</p>
                    <Link to="/log" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors">
                        Log Your First Workout
                    </Link>
                </div>
             )}
        </div>
      </div>

      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">Progress Tracker</h2>
            {uniqueExercises.length > 0 && (
            <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                    <label htmlFor="exercise-select" className="text-gray-600 dark:text-slate-300 whitespace-nowrap text-sm">Select Exercise:</label>
                    <select
                    id="exercise-select"
                    value={selectedExercise}
                    onChange={(e) => setSelectedExercise(e.target.value)}
                    className={inputClasses}
                    >
                    {uniqueExercises.map(ex => (
                        <option key={ex} value={ex}>{ex}</option>
                    ))}
                    </select>
                </div>
                <button
                    onClick={() => setShowStats(!showStats)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        showStats 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-white/20'
                    }`}
                >
                    {showStats ? 'Hide Stats' : 'Show Stats'}
                </button>
            </div>
            )}
        </div>
        
        {uniqueExercises.length > 0 ? (
            <div className={`space-y-6 ${showStats ? 'grid lg:grid-cols-2 gap-6' : ''}`}>
                <ProgressChart workouts={workouts} exercise={selectedExercise} />
                {showStats && <ExerciseStats workouts={workouts} exerciseName={selectedExercise} />}
            </div>
        ) : (
            <div className={`text-center py-16 ${glassPanelClasses}`}>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">No Progress to Show Yet</h2>
                <p className="text-gray-600 dark:text-slate-300 mt-2">Log a workout to start tracking your strength gains!</p>
            </div>
        )}
      </div>

      {/* Training Tools Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Training Tools</h2>
          <button
            onClick={() => setShowTools(!showTools)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              showTools 
                ? 'bg-emerald-500 text-white' 
                : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20'
            }`}
          >
            {showTools ? 'Hide Tools' : 'Show Tools'}
          </button>
        </div>
        
        {showTools && (
          <div className="grid md:grid-cols-2 gap-6">
            <OneRMCalculator />
            <div className={glassPanelClasses}>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Quick Tools</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowPlateCalculator(true)}
                  className="block w-full px-4 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors text-center"
                >
                  🏋️ Plate Calculator
                </button>
                <Link 
                  to="/log" 
                  className="block w-full px-4 py-3 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors text-center"
                >
                  📝 Log New Workout
                </Link>
                <Link 
                  to="/my-plans" 
                  className="block w-full px-4 py-3 bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-white/20 transition-colors text-center"
                >
                  📋 Manage Plans
                </Link>
                <Link 
                  to="/generator" 
                  className="block w-full px-4 py-3 bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-white/20 transition-colors text-center"
                >
                  ✨ Generate New Plan
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <PlateCalculator 
        isVisible={showPlateCalculator} 
        onClose={() => setShowPlateCalculator(false)} 
      />
      
      {/* Floating Action Button for Quick Workout Log */}
      <div className="fixed bottom-6 right-6 z-40">
        <Link 
          to="/log"
          className="group flex items-center gap-3 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-full shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-110"
        >
          <span className="text-xl">💪</span>
          <span className="hidden sm:block">Quick Log</span>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;