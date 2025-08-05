import React from 'react';
import type { Workout } from '../types';
import { getPersonalRecords, getEstimated1RM, calculateTotalVolumeByExercise } from '../utils/workoutCalculations';

const glassPanelClasses = "bg-white/90 dark:bg-black/20 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-2xl shadow-glass p-6";

interface ExerciseStatsProps {
  workouts: Workout[];
  exerciseName: string;
}

const ExerciseStats: React.FC<ExerciseStatsProps> = ({ workouts, exerciseName }) => {
  const prs = getPersonalRecords(workouts, exerciseName);
  const estimated1RM = getEstimated1RM(workouts, exerciseName);
  const totalVolume = calculateTotalVolumeByExercise(workouts, exerciseName);
  const exerciseWorkouts = workouts.filter(w => 
    w.exerciseName.toLowerCase() === exerciseName.toLowerCase()
  );

  if (exerciseWorkouts.length === 0) {
    return (
      <div className={glassPanelClasses}>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Exercise Stats</h3>
        <p className="text-gray-500 dark:text-slate-400">No data available for this exercise yet.</p>
      </div>
    );
  }

  return (
    <div className={glassPanelClasses}>
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Personal Records - {exerciseName}</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-accent">{prs.maxWeight}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400">Max Weight (kg)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-accent">{prs.maxReps}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400">Max Reps</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-accent">{estimated1RM.toFixed(1)}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400">Est. 1RM (kg)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-accent">{totalVolume.toFixed(0)}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400">Total Volume (kg)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-600 dark:text-slate-300 mb-2">Recent Progress</h4>
          <div className="space-y-2">
            {exerciseWorkouts.slice(0, 3).map((workout, index) => (
              <div key={workout.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-slate-400">
                  {new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-gray-800 dark:text-white">
                  {workout.sets.filter(s => !s.isWarmup).length} sets
                </span>
                <span className="text-emerald-600 dark:text-accent">
                  {Math.max(...workout.sets.filter(s => !s.isWarmup).map(s => s.weight))} kg
                </span>
              </div>
            ))}
          </div>
        </div>

        {prs.bestSet && (
          <div>
            <h4 className="text-sm font-semibold text-gray-600 dark:text-slate-300 mb-2">Best Set</h4>
            <div className="bg-gray-100 dark:bg-white/5 p-3 rounded-lg">
              <div className="text-gray-800 dark:text-white font-bold">
                {prs.bestSet.reps} × {prs.bestSet.weight} kg
              </div>
              <div className="text-gray-500 dark:text-slate-400 text-xs">
                {new Date(prs.bestSet.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              {prs.bestSet.notes && (
                <div className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                  "{prs.bestSet.notes}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-slate-400">Total Sessions:</span>
          <span className="text-gray-800 dark:text-white">{exerciseWorkouts.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-slate-400">Average Volume per Session:</span>
          <span className="text-gray-800 dark:text-white">
            {(totalVolume / exerciseWorkouts.length).toFixed(0)} kg
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExerciseStats;
