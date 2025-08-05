import React, { useState, useEffect } from 'react';
import { Workout } from '../../types';
import { getMuscleGroupRecovery, getOverallRecoveryStatus } from '../../utils/workoutCalculations';

interface RecoveryData {
  muscleGroup: string;
  status: 'ready' | 'recovering' | 'overdue' | string;
  lastTrained: string | null;
  daysSinceLastTraining: number;
  recommendation: string;
  optimalFrequency: string;
  averageDaysBetween?: number;
}

interface RecoveryTrackingProps {}

const RecoveryTracking: React.FC<RecoveryTrackingProps> = () => {
  const [recoveryData, setRecoveryData] = useState<RecoveryData[]>([]);
  const [overallStatus, setOverallStatus] = useState<string>('');
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Core'];

  useEffect(() => {
    loadWorkoutData();
  }, []);

  useEffect(() => {
    if (workouts.length > 0) {
      calculateRecoveryData();
    }
  }, [workouts]);

  const loadWorkoutData = () => {
    const stored = localStorage.getItem('workouts');
    if (stored) {
      const parsedWorkouts = JSON.parse(stored).map((workout: any) => ({
        ...workout,
        date: workout.date
      }));
      setWorkouts(parsedWorkouts);
    }
  };

  const calculateRecoveryData = () => {
    const recoveryStatuses: RecoveryData[] = [];
    
    // Get trained muscle groups from workouts
    const trainedMuscleGroups = [...new Set(
      workouts.flatMap(w => w.muscleGroups || [])
    )];
    
    trainedMuscleGroups.forEach((muscleGroup: string) => {
      const recovery = getMuscleGroupRecovery(workouts, muscleGroup);
      recoveryStatuses.push({
        muscleGroup,
        ...recovery
      });
    });

    setRecoveryData(recoveryStatuses);
    
    // Get overall status
    const overall = getOverallRecoveryStatus(workouts);
    setOverallStatus(overall);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-500';
      case 'recovering':
        return 'bg-yellow-500';
      case 'overdue':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready':
        return 'Ready to Train';
      case 'recovering':
        return 'Recovering';
      case 'overdue':
        return 'Overdue';
      default:
        return 'Unknown';
    }
  };

  const getOverallStatusColor = (status: string) => {
    if (status.includes('ready')) return 'text-green-400';
    if (status.includes('recovering')) return 'text-yellow-400';
    if (status.includes('overdue')) return 'text-red-400';
    return 'text-gray-400';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatDays = (days: number) => {
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  const getRecoveryScore = (status: string, daysSince: number) => {
    switch (status) {
      case 'ready':
        return Math.min(100, Math.max(80, 100 - (daysSince - 2) * 5));
      case 'recovering':
        return Math.max(0, 50 - daysSince * 25);
      case 'overdue':
        return Math.max(0, 20 - (daysSince - 4) * 5);
      default:
        return 0;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Recovery Tracking</h1>
        <p className="text-gray-300">Monitor muscle group recovery and optimize training frequency</p>
      </div>

      {/* Overall Status */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
        <h2 className="text-xl font-semibold text-white mb-2">Overall Recovery Status</h2>
        <div className={`text-2xl font-bold ${getOverallStatusColor(overallStatus)} mb-2`}>
          {overallStatus || 'No data available'}
        </div>
        <p className="text-gray-300">
          {overallStatus.includes('ready') && 'Most muscle groups are ready for training'}
          {overallStatus.includes('recovering') && 'Some muscle groups are still recovering'}
          {overallStatus.includes('overdue') && 'Some muscle groups need attention'}
          {!overallStatus && 'Complete some workouts to see your recovery status'}
        </p>
      </div>

      {/* Recovery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recoveryData.map(recovery => {
          const recoveryScore = getRecoveryScore(recovery.status, recovery.daysSinceLastTraining);
          
          return (
            <div key={recovery.muscleGroup} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">{recovery.muscleGroup}</h3>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(recovery.status)}`}></div>
              </div>

              {/* Recovery Score */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Recovery Score</span>
                  <span>{recoveryScore}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(recovery.status)}`}
                    style={{ width: `${recoveryScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Status and Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Status:</span>
                  <span className={`font-medium ${
                    recovery.status === 'ready' ? 'text-green-400' :
                    recovery.status === 'recovering' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {getStatusText(recovery.status)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-300">Last Trained:</span>
                  <span className="text-white">{formatDays(recovery.daysSinceLastTraining)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-300">Date:</span>
                  <span className="text-white">{formatDate(recovery.lastTrained)}</span>
                </div>

                {recovery.averageDaysBetween && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Avg Frequency:</span>
                    <span className="text-white">Every {recovery.averageDaysBetween} days</span>
                  </div>
                )}
              </div>

              {/* Training Recommendation */}
              <div className="mt-4 p-3 bg-black/20 rounded-lg">
                <div className="text-xs text-gray-300 mb-1">Recommendation:</div>
                <div className="text-sm text-white">{recovery.recommendation}</div>
                <div className="text-xs text-blue-300 mt-1">{recovery.optimalFrequency}</div>
              </div>
            </div>
          );
        })}
      </div>

      {recoveryData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">No Recovery Data</h3>
            <p>Complete some workouts to start tracking your recovery status</p>
          </div>
        </div>
      )}

      {/* Recovery Tips */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">Recovery Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-semibold text-green-400">✅ Ready (2-4 days)</h4>
            <p className="text-gray-300">Optimal training window. Muscle groups are fully recovered and primed for growth.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-yellow-400">⚠️ Recovering (0-2 days)</h4>
            <p className="text-gray-300">Still in recovery phase. Light training acceptable if feeling good.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-red-400">🔴 Overdue (4+ days)</h4>
            <p className="text-gray-300">Training window is closing. Consider training soon to maintain progress.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-blue-400">💡 General Tips</h4>
            <p className="text-gray-300">Listen to your body, prioritize sleep and nutrition, stay consistent.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecoveryTracking;
