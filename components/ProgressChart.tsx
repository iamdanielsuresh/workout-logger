import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import type { Workout } from '../types';
import { calculateWorkoutVolume } from '../utils/workoutCalculations';

interface ProgressChartProps {
  workouts: Workout[];
  exercise: string;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-slate-900/80 backdrop-blur-lg border border-white/10 rounded-xl shadow-glass">
        <p className="label text-slate-400">{`Date: ${label}`}</p>
        <p className="intro text-white font-bold">{`Max Weight: ${payload[0].value} kg`}</p>
      </div>
    );
  }
  return null;
};

const ProgressChart: React.FC<ProgressChartProps> = ({ workouts, exercise }) => {
  const [chartType, setChartType] = useState<'weight' | 'volume'>('weight');
  const filteredWorkouts = workouts.filter(w => w.exerciseName.toLowerCase() === exercise.toLowerCase());

  const glassPanelClasses = "bg-white/90 dark:bg-black/20 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-2xl shadow-glass p-6";

  if (filteredWorkouts.length < 2) {
    return (
        <div className={`flex flex-col items-center justify-center h-96 ${glassPanelClasses}`}>
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Need More Data</h3>
            <p className="text-gray-600 dark:text-slate-300 text-center mb-4">
              Log at least two sessions of "{exercise}" to see your progress chart.
            </p>
            <Link 
              to="/log" 
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
            >
              Log First Session
            </Link>
        </div>
    );
  }
  
  const data = filteredWorkouts
    .map(w => ({
      date: new Date(w.date).toLocaleDateString('en-CA'), // YYYY-MM-DD for sorting
      maxWeight: Math.max(...w.sets.filter(s => !s.isWarmup).map(s => s.weight)),
      volume: calculateWorkoutVolume(w.sets),
    }))
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(d => ({...d, date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}));

  const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white/95 dark:bg-slate-900/80 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-xl shadow-lg">
          <p className="label text-gray-600 dark:text-slate-400">{`Date: ${label}`}</p>
          {chartType === 'weight' ? (
            <p className="intro text-gray-900 dark:text-white font-bold">{`Max Weight: ${payload[0].value} kg`}</p>
          ) : (
            <p className="intro text-gray-900 dark:text-white font-bold">{`Volume: ${payload[0].value} kg`}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`h-96 w-full ${glassPanelClasses}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📈</span>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{exercise} Progress</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('weight')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              chartType === 'weight' 
                ? 'bg-emerald-500 text-white shadow-md' 
                : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-white/20'
            }`}
          >
            💪 Max Weight
          </button>
          <button
            onClick={() => setChartType('volume')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              chartType === 'volume' 
                ? 'bg-emerald-500 text-white shadow-md' 
                : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-white/20'
            }`}
          >
            📊 Volume
          </button>
        </div>
      </div>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="date" stroke="#cbd5e1" />
          <YAxis 
            stroke="#cbd5e1" 
            domain={['dataMin - 5', 'dataMax + 5']} 
            unit={chartType === 'weight' ? 'kg' : 'kg'}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 246, 255, 0.1)' }}/>
          <Legend wrapperStyle={{ color: '#e2e8f0' }} />
          <Line 
            type="monotone" 
            dataKey={chartType} 
            name={chartType === 'weight' ? 'Max Weight (kg)' : 'Volume (kg)'} 
            stroke="#00f6ff" 
            strokeWidth={2} 
            activeDot={{ r: 8, fill: '#00f6ff' }} 
            dot={{r: 4, fill: '#00f6ff'}} 
            style={{ filter: 'url(#glow)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressChart;