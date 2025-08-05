import React, { useState } from 'react';
import { calculateOneRepMax, calculateRepsForPercentage } from '../utils/workoutCalculations';

const glassPanelClasses = "bg-white/90 dark:bg-black/20 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-2xl shadow-glass p-6";
const inputClasses = "bg-white dark:bg-white/5 border border-gray-300 dark:border-white/20 rounded-lg w-full p-2.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-glow focus:border-emerald-500 dark:focus:border-accent transition-all";

const OneRMCalculator: React.FC = () => {
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [calculated1RM, setCalculated1RM] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  const calculate = () => {
    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps);
    
    setError('');
    
    if (!weight || !reps) {
      setError('Please fill in both weight and reps');
      return;
    }
    
    if (weightNum <= 0) {
      setError('Weight must be greater than 0');
      return;
    }
    
    if (repsNum <= 0 || repsNum > 20) {
      setError('Reps must be between 1-20 for accurate calculations');
      return;
    }
    
    const oneRM = calculateOneRepMax(weightNum, repsNum);
    setCalculated1RM(oneRM);
  };

  // Auto-calculate when both fields have valid values
  React.useEffect(() => {
    if (weight && reps && !error) {
      const weightNum = parseFloat(weight);
      const repsNum = parseInt(reps);
      if (weightNum > 0 && repsNum > 0 && repsNum <= 20) {
        const oneRM = calculateOneRepMax(weightNum, repsNum);
        setCalculated1RM(oneRM);
        setError('');
      }
    }
  }, [weight, reps]);

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWeight(e.target.value);
    setError('');
  };

  const handleRepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReps(e.target.value);
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      calculate();
    }
  };

  const percentages = [60, 65, 70, 75, 80, 85, 90, 95];

  return (
    <div className={glassPanelClasses}>
      <div className="flex items-center gap-2 mb-4">
        <div className="text-2xl">🏋️</div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">1RM Calculator</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-slate-300">
            Weight <span className="text-emerald-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.25"
              min="0"
              value={weight}
              onChange={handleWeightChange}
              onKeyPress={handleKeyPress}
              className={inputClasses}
              placeholder="100"
              autoComplete="off"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 text-sm">
              kg
            </div>
          </div>
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-slate-300">
            Reps <span className="text-emerald-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={reps}
            onChange={handleRepsChange}
            onKeyPress={handleKeyPress}
            className={inputClasses}
            placeholder="5"
            autoComplete="off"
          />
          <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            Best accuracy: 1-10 reps
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-500/30 rounded-lg">
          <div className="text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
            <span>⚠️</span>
            {error}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={calculate}
          disabled={!weight || !reps}
          className={`flex-1 px-4 py-3 font-bold rounded-lg transition-all duration-200 ${
            !weight || !reps
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
          }`}
        >
          Calculate 1RM
        </button>
        <button
          onClick={() => {
            setWeight('');
            setReps('');
            setCalculated1RM(null);
            setError('');
          }}
          className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Clear
        </button>
      </div>

      {calculated1RM && (
        <div className="space-y-4">
          <div className="text-center p-6 bg-emerald-100 dark:bg-accent/20 border border-emerald-300 dark:border-accent/30 rounded-lg relative overflow-hidden">
            <div className="absolute top-2 right-2 text-2xl">🎯</div>
            <div className="text-3xl font-bold text-emerald-600 dark:text-accent mb-1">
              {calculated1RM.toFixed(1)} kg
            </div>
            <div className="text-sm text-gray-600 dark:text-slate-300">Estimated 1 Rep Max</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-2">
              Based on {reps} reps @ {weight} kg
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📊</span>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Training Percentages</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {percentages.map(percentage => {
                const weight = calculated1RM * (percentage / 100);
                const intensityColor = percentage >= 90 ? 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-500/30' :
                                     percentage >= 80 ? 'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-500/30' :
                                     percentage >= 70 ? 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-500/30' :
                                     'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-500/30';
                const textColor = percentage >= 90 ? 'text-red-700 dark:text-red-300' :
                                percentage >= 80 ? 'text-orange-700 dark:text-orange-300' :
                                percentage >= 70 ? 'text-yellow-700 dark:text-yellow-300' :
                                'text-green-700 dark:text-green-300';
                
                return (
                  <div key={percentage} className={`text-center p-3 border rounded-lg transition-all hover:scale-105 cursor-pointer ${intensityColor}`}>
                    <div className={`text-xs font-medium ${textColor}`}>{percentage}%</div>
                    <div className="font-bold text-gray-800 dark:text-white text-sm">{weight.toFixed(1)} kg</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      {percentage >= 90 ? 'Max effort' :
                       percentage >= 80 ? 'Heavy' :
                       percentage >= 70 ? 'Moderate' :
                       'Light'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <span className="text-lg">💡</span>
              <div>
                <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Quick Guide:</div>
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <div>• <strong>60-70%:</strong> Volume training, technique work</div>
                  <div>• <strong>70-80%:</strong> Strength building, moderate intensity</div>
                  <div>• <strong>80-90%:</strong> Heavy strength, competition prep</div>
                  <div>• <strong>90%+:</strong> Max testing, peaking phases</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-slate-400 italic text-center border-t border-gray-200 dark:border-white/10 pt-3">
            * Calculations use the Epley formula. Results are estimates and may vary based on individual factors.
          </div>
        </div>
      )}
    </div>
  );
};

export default OneRMCalculator;
