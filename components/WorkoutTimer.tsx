import React, { useState, useEffect, useRef } from 'react';

const glassPanelClasses = "bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-glass p-6";

interface WorkoutTimerProps {
  isVisible: boolean;
  onClose: () => void;
}

const WorkoutTimer: React.FC<WorkoutTimerProps> = ({ isVisible, onClose }) => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [restTime, setRestTime] = useState(90); // Default 90 seconds rest
  const [isResting, setIsResting] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (isResting && restSeconds > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestSeconds(prev => {
          if (prev <= 1) {
            setIsResting(false);
            // Play notification sound (if supported)
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
      }
    }

    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
      }
    };
  }, [isResting, restSeconds]);

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setIsRunning(false);
    setSeconds(0);
  };

  const startRestTimer = () => {
    setRestSeconds(restTime);
    setIsResting(true);
  };

  const stopRestTimer = () => {
    setIsResting(false);
    setRestSeconds(0);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`${glassPanelClasses} min-w-[280px]`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Workout Timer</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Main Workout Timer */}
        <div className="text-center mb-4">
          <div className="text-3xl font-mono font-bold text-accent mb-2">
            {formatTime(seconds)}
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={isRunning ? pauseTimer : startTimer}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isRunning 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={resetTimer}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Rest Timer */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300 text-sm">Rest Timer</span>
            <select
              value={restTime}
              onChange={(e) => setRestTime(Number(e.target.value))}
              className="bg-white/10 border border-white/20 rounded text-white text-sm px-2 py-1"
              disabled={isResting}
            >
              <option value={60}>1:00</option>
              <option value={90}>1:30</option>
              <option value={120}>2:00</option>
              <option value={180}>3:00</option>
              <option value={240}>4:00</option>
              <option value={300}>5:00</option>
            </select>
          </div>
          
          {isResting ? (
            <div className="text-center">
              <div className={`text-2xl font-mono font-bold mb-2 ${
                restSeconds <= 10 ? 'text-red-400' : 'text-accent'
              }`}>
                {formatTime(restSeconds)}
              </div>
              <button
                onClick={stopRestTimer}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors"
              >
                Stop Rest
              </button>
            </div>
          ) : (
            <button
              onClick={startRestTimer}
              className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium transition-colors"
            >
              Start Rest ({formatTime(restTime)})
            </button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="border-t border-white/10 pt-4 mt-4">
          <div className="text-xs text-slate-400 text-center">
            💡 Keep timer running during your entire workout
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutTimer;
