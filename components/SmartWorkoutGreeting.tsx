import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Workout, ManualPlan } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { generateWorkoutInsights } from '../services/geminiService';

interface SmartWorkoutGreetingProps {
  workouts: Workout[];
  activePlan: ManualPlan | null;
  todaysWorkout: any;
}

const SmartWorkoutGreeting: React.FC<SmartWorkoutGreetingProps> = ({ 
  workouts, 
  activePlan, 
  todaysWorkout 
}) => {
  const { currentUser } = useAuth();
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getLastWorkoutForExercise = (exerciseName: string) => {
    return workouts
      .filter(w => w.exerciseName.toLowerCase() === exerciseName.toLowerCase())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  const generateSmartInsights = async () => {
    if (!todaysWorkout || todaysWorkout.isRestDay || !todaysWorkout.exercises) return;
    
    setIsLoadingInsights(true);
    try {
      // Gather context for AI
      const context = {
        todaysWorkout,
        previousWorkouts: todaysWorkout.exercises?.map((ex: any) => ({
          exercise: ex.name,
          lastSession: getLastWorkoutForExercise(ex.name)
        })),
        userProfile: {
          name: currentUser?.username,
          totalWorkouts: workouts.length,
          recentPerformance: workouts.slice(0, 5)
        }
      };

      const insights = await generateWorkoutInsights(context);
      setAiInsights(insights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      setAiInsights('Ready for your workout! Focus on proper form and progressive overload.');
    } finally {
      setIsLoadingInsights(false);
    }
  };

  useEffect(() => {
    generateSmartInsights();
  }, [todaysWorkout, workouts]);

  const glassPanelClasses = "bg-white/95 dark:bg-black/20 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-2xl shadow-glass p-6";

  return (
    <div className={glassPanelClasses}>
      {/* Personal Greeting */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-3xl">👋</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getGreeting()}, {currentUser?.username || 'Champion'}!
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Today's Plan */}
      {todaysWorkout && (
        <div className="mb-6">
          {'isRestDay' in todaysWorkout && todaysWorkout.isRestDay ? (
            <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-xl">
              <div className="text-4xl mb-3">😴</div>
              <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Rest & Recovery Day
              </h2>
              <p className="text-blue-600 dark:text-blue-300">
                Your muscles grow during rest. Take it easy today!
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🎯</span>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Today's Plan: {'focus' in todaysWorkout ? todaysWorkout.focus : 'Workout'}
                </h2>
              </div>

              {/* Exercise List with Previous Performance */}
              {'exercises' in todaysWorkout && todaysWorkout.exercises && (
                <div className="space-y-4 mb-6">
                  {todaysWorkout.exercises.map((exercise: any, index: number) => {
                    const lastWorkout = getLastWorkoutForExercise(exercise.name);
                    const lastBestSet = lastWorkout?.sets
                      .filter(s => !s.isWarmup)
                      .sort((a, b) => b.weight - a.weight)[0];

                    return (
                      <div key={exercise.name} className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {exercise.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Target: {exercise.sets} sets × {exercise.reps} reps
                              </p>
                            </div>
                          </div>
                          <Link
                            to={`/log?exercise=${encodeURIComponent(exercise.name)}&targetSets=${exercise.sets}&targetReps=${exercise.reps}`}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105"
                          >
                            Start
                          </Link>
                        </div>

                        {/* Previous Performance */}
                        {lastWorkout && lastBestSet && (
                          <div className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm">📊</span>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Last Session ({new Date(lastWorkout.date).toLocaleDateString()})
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Best set: {lastBestSet.reps} reps @ {lastBestSet.weight}kg
                              </div>
                              {lastWorkout.notes && (
                                <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded">
                                  💭 {lastWorkout.notes.length > 30 ? lastWorkout.notes.substring(0, 30) + '...' : lastWorkout.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* AI Insights */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🤖</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                      AI Coach Insights
                    </h3>
                    {isLoadingInsights ? (
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-300">
                        <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                        <span className="text-sm">Analyzing your performance...</span>
                      </div>
                    ) : (
                      <p className="text-sm text-purple-700 dark:text-purple-300 leading-relaxed">
                        {aiInsights || 'Ready for your workout! Focus on proper form and progressive overload.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/log"
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
        >
          <span>📝</span>
          Quick Log
        </Link>
        <Link
          to="/templates"
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
        >
          <span>📋</span>
          Templates
        </Link>
        <Link
          to="/recovery"
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
        >
          <span>😴</span>
          Recovery
        </Link>
      </div>
    </div>
  );
};

export default SmartWorkoutGreeting;
