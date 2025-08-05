import React, { useState } from 'react';
import { generateWorkoutPlan } from '../../services/geminiService';
import type { GeneratedPlan } from '../../types';
import { SparklesIcon } from '../../constants';

const glassPanelClasses = "bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-glass p-6";
const inputClasses = "bg-white/5 border border-white/20 rounded-lg w-full p-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-glow focus:border-accent transition-all";
const primaryButtonClasses = "flex items-center justify-center gap-2 px-6 py-2.5 bg-accent text-slate-900 font-bold rounded-lg hover:bg-accent-hover transition-colors shadow-glow-sm disabled:bg-slate-500 disabled:text-slate-300 disabled:cursor-not-allowed";

const PlanGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('A 3-day plan for a beginner focused on building muscle');
    const [plan, setPlan] = useState<GeneratedPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt) {
            setError("Please enter a description for the plan you want.");
            return;
        }
        setLoading(true);
        setError(null);
        setPlan(null);
        try {
            const result = await generateWorkoutPlan(prompt);
            setPlan(result);
        } catch (err: any) {
            setError(err.message || "An unknown error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className={glassPanelClasses}>
                <h1 className="text-3xl font-bold text-white mb-2">AI Workout Plan Generator</h1>
                <p className="text-slate-300 mb-4">Describe your fitness goals, and let our AI create a custom plan for you.</p>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className={inputClasses}
                        placeholder="e.g., 4-day weight loss plan for intermediate"
                        disabled={loading}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !prompt}
                        className={primaryButtonClasses}
                    >
                        {loading ? 'Generating...' : (
                            <>
                                <SparklesIcon />
                                <span>Generate Plan</span>
                            </>
                        )}
                    </button>
                </div>
                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>

            {loading && (
                <div className="mt-8 text-center">
                    <div className="animate-pulse">
                        <div className="h-8 bg-white/10 rounded-md w-1/2 mx-auto mb-6"></div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={glassPanelClasses}>
                                    <div className="h-6 bg-white/10 rounded w-1/4 mb-4"></div>
                                    <div className="space-y-3">
                                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                                        <div className="h-4 bg-white/10 rounded w-1/2"></div>
                                        <div className="h-4 bg-white/10 rounded w-5/6"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {plan && (
                <div className="mt-8">
                    <h2 className="text-center text-3xl font-bold text-white mb-6">{plan.planName}</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plan.days.map((day, dayIndex) => (
                            <div key={dayIndex} className={`${glassPanelClasses} flex flex-col`}>
                                <h3 className="text-xl font-bold text-accent mb-4">{day.day}</h3>
                                <ul className="space-y-3 text-slate-100">
                                    {day.exercises.map((ex, exIndex) => (
                                        <li key={exIndex} className="border-b border-white/10 pb-3 last:border-b-0">
                                            <p className="font-semibold">{ex.name}</p>
                                            <p className="text-sm text-slate-300">Sets: {ex.sets} &nbsp;&bull;&nbsp; Reps: {ex.reps}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
};

export default PlanGenerator;