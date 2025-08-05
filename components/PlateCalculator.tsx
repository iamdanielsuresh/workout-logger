import React, { useState } from 'react';

const glassPanelClasses = "bg-white/95 dark:bg-black/20 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-2xl shadow-glass p-6";
const inputClasses = "bg-white dark:bg-white/5 border border-gray-300 dark:border-white/20 rounded-lg w-full p-2.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-glow focus:border-emerald-500 dark:focus:border-accent transition-all";

interface PlateCalculatorProps {
  isVisible: boolean;
  onClose: () => void;
}

const PlateCalculator: React.FC<PlateCalculatorProps> = ({ isVisible, onClose }) => {
  const [targetWeight, setTargetWeight] = useState<string>('');
  const [barWeight, setBarWeight] = useState<number>(20); // Standard Olympic bar
  const [availablePlates] = useState([25, 20, 15, 10, 5, 2.5, 1.25]); // Common plate weights

  const calculatePlates = (weight: number, bar: number) => {
    const plateWeight = (weight - bar) / 2; // Weight per side
    if (plateWeight <= 0) return [];

    const plates: { weight: number; count: number }[] = [];
    let remaining = plateWeight;

    for (const plate of availablePlates) {
      const count = Math.floor(remaining / plate);
      if (count > 0) {
        plates.push({ weight: plate, count });
        remaining = Math.round((remaining - (count * plate)) * 100) / 100;
      }
    }

    return plates;
  };

  const plates = targetWeight ? calculatePlates(parseFloat(targetWeight), barWeight) : [];
  const actualWeight = barWeight + (plates.reduce((sum, p) => sum + (p.weight * p.count), 0) * 2);
  const difference = targetWeight ? parseFloat(targetWeight) - actualWeight : 0;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${glassPanelClasses} max-w-md w-full max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Plate Calculator</h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-slate-300">Target Weight (kg)</label>
            <input
              type="number"
              step="0.25"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              className={inputClasses}
              placeholder="e.g., 100"
              autoFocus
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-slate-300">Bar Weight (kg)</label>
            <select
              value={barWeight}
              onChange={(e) => setBarWeight(Number(e.target.value))}
              className={inputClasses}
            >
              <option value={20}>Olympic Bar (20kg)</option>
              <option value={15}>Women's Bar (15kg)</option>
              <option value={10}>Training Bar (10kg)</option>
              <option value={7}>Ez-Curl Bar (~7kg)</option>
              <option value={0}>Dumbbells/Other (0kg)</option>
            </select>
          </div>
        </div>

        {targetWeight && (
          <div className="space-y-4">
            <div className="text-center p-4 bg-emerald-100 dark:bg-accent/20 border border-emerald-300 dark:border-accent/30 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600 dark:text-accent">{actualWeight} kg</div>
              <div className="text-sm text-gray-600 dark:text-slate-300">
                Actual Weight {difference !== 0 && (
                  <span className={difference > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                    ({difference > 0 ? '-' : '+'}{Math.abs(difference).toFixed(2)} kg)
                  </span>
                )}
              </div>
            </div>

            {plates.length > 0 ? (
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Plates per side:</h4>
                <div className="space-y-2">
                  {plates.map((plate) => (
                    <div key={plate.weight} className="flex justify-between items-center p-3 bg-gray-100 dark:bg-white/5 rounded-lg">
                      <span className="text-gray-800 dark:text-white font-medium">{plate.weight} kg plates</span>
                      <span className="text-emerald-600 dark:text-accent font-bold">× {plate.count}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-500/20 border border-blue-300 dark:border-blue-500/30 rounded-lg">
                  <div className="text-sm text-blue-700 dark:text-blue-200">
                    <strong>Loading order:</strong> Load heaviest plates first, closest to the bar
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-slate-400">
                  {parseFloat(targetWeight) <= barWeight 
                    ? 'Target weight is less than or equal to bar weight' 
                    : 'Enter a target weight to see plate breakdown'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="text-xs text-slate-400 text-center">
            💡 Always use collars to secure plates during lifting
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlateCalculator;
