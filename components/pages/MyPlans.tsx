import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ManualPlan, GeneratedPlan } from '../../types';
import { CalendarIcon, TrashIcon, SparklesIcon, PencilIcon, ClipboardListIcon } from '../../constants';
import { generateWorkoutPlan } from '../../services/geminiService';
import ManualPlanForm from './ManualPlanForm';


interface MyPlansProps {
    plans: ManualPlan[];
    addPlan: (plan: Omit<ManualPlan, 'id' | 'userId'>) => void;
    deletePlan: (planId: string) => void;
}

const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const glassPanelClasses = "bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-glass p-6";
const inputClasses = "bg-white/5 border border-white/20 rounded-lg w-full p-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-glow focus:border-accent transition-all";
const primaryButtonClasses = "flex items-center justify-center gap-2 px-4 py-2 bg-accent text-slate-900 font-bold rounded-lg hover:bg-accent-hover transition-colors shadow-glow-sm disabled:opacity-50 disabled:bg-slate-500";
const secondaryButtonClasses = "flex items-center justify-center gap-2 px-4 py-2 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50";


const AiPlanForm: React.FC<{ addPlan: MyPlansProps['addPlan']; closeForm: () => void; }> = ({ addPlan, closeForm }) => {
    const [planName, setPlanName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [daysPerWeek, setDaysPerWeek] = useState(3);
    const [restDays, setRestDays] = useState<number[]>([0, 6]); // Sun, Sat default
    const [goal, setGoal] = useState('a balanced mix of strength and hypertrophy');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRestDayToggle = (dayIndex: number) => {
        setRestDays(prev => 
            prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (7 - restDays.length !== daysPerWeek) {
            setError(`Training days mismatch. Please select ${7 - daysPerWeek} rest days.`);
            return;
        }
        setLoading(true);

        const prompt = `Generate a ${daysPerWeek}-day per week workout plan focused on ${goal}. The user's rest days are ${restDays.map(d => WEEK_DAYS[d]).join(', ')}. Please structure the response with a 'day' description like 'Day 1: Push Day' or 'Day 1: Full Body'.`;
        
        try {
            const generatedPlan: GeneratedPlan = await generateWorkoutPlan(prompt);

            const trainingDays = WEEK_DAYS.map((_, i) => i).filter(i => !restDays.includes(i));
            
            const mappedDays = generatedPlan.days.map((day, index) => {
                const dayOfWeek = trainingDays[index % trainingDays.length];
                // Extract focus from "Day X: Focus"
                const focus = day.day.substring(day.day.indexOf(':') + 1).trim();
                return {
                    dayOfWeek,
                    focus: focus || "Workout",
                    exercises: day.exercises
                };
            });
            
            addPlan({ planName, startDate, endDate, days: mappedDays, restDays });
            closeForm();
        } catch (err: any) {
            setError(err.message || "Failed to generate plan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-10 sm:pt-16">
            <form onSubmit={handleSubmit} className={`${glassPanelClasses} w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
                <h2 className="text-2xl font-bold mb-4 text-white">Create AI-Powered Plan</h2>
                {error && <p className="text-red-400 bg-red-500/10 p-2 rounded-md mb-4 text-sm">{error}</p>}
                <div className="space-y-4">
                    <input type="text" value={planName} onChange={e => setPlanName(e.target.value)} required className={inputClasses} placeholder="Plan Name (e.g., Summer Shred)" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="block mb-1 text-xs font-medium text-slate-300">Start Date</label>
                           <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className={inputClasses} />
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-medium text-slate-300">End Date</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className={inputClasses} />
                        </div>
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-slate-300">Primary Goal</label>
                        <input type="text" value={goal} onChange={e => setGoal(e.target.value)} required className={inputClasses} placeholder="e.g., build muscle, lose weight" />
                    </div>
                     <div>
                        <label className="block mb-1 text-sm font-medium text-slate-300">Training Days per Week: {daysPerWeek}</label>
                        <input type="range" min="1" max="6" value={daysPerWeek} onChange={e => setDaysPerWeek(Number(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer range-thumb-accent" />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-slate-300">Select Rest Days</label>
                        <div className="flex flex-wrap gap-2">
                            {WEEK_DAYS.map((day, index) => (
                                <button type="button" key={day} onClick={() => handleRestDayToggle(index)} className={`px-3 py-1 text-sm rounded-full transition-colors ${restDays.includes(index) ? 'bg-accent text-slate-900 font-bold' : 'bg-white/10 text-slate-200 hover:bg-white/20'}`}>
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                    <button type="button" onClick={closeForm} className={secondaryButtonClasses} disabled={loading}>Cancel</button>
                    <button type="submit" className={primaryButtonClasses} disabled={loading}>
                        <SparklesIcon/>
                        {loading ? 'Generating...' : 'Generate & Save'}
                    </button>
                </div>
            </form>
        </div>
    );
};


const MyPlans: React.FC<MyPlansProps> = ({ plans, addPlan, deletePlan }) => {
    const [modal, setModal] = useState<'ai' | 'manual' | null>(null);
    const navigate = useNavigate();

    const startWorkout = (planId: string, dayOfWeek: number) => {
        navigate(`/plan-workout?planId=${planId}&dayOfWeek=${dayOfWeek}`);
    };
    
    return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-white">My Plans</h1>
            <div className="flex items-center gap-2">
                <button onClick={() => setModal('manual')} className={secondaryButtonClasses}>
                    <PencilIcon />
                    <span>Create Manually</span>
                </button>
                <button onClick={() => setModal('ai')} className={primaryButtonClasses}>
                    <SparklesIcon />
                    <span>Create with AI</span>
                </button>
            </div>
        </div>

        {modal === 'ai' && <AiPlanForm addPlan={addPlan} closeForm={() => setModal(null)} />}
        {modal === 'manual' && <ManualPlanForm addPlan={addPlan} closeForm={() => setModal(null)} />}


        {plans.length === 0 ? (
            <div className={`text-center py-16 ${glassPanelClasses}`}>
                <h2 className="text-xl font-semibold text-white">No plans created yet.</h2>
                <p className="text-slate-300 mt-2">Click "Create Plan" to build your first workout regimen.</p>
            </div>
        ) : (
            <div className="space-y-6">
                {plans.map(plan => (
                    <div key={plan.id} className={glassPanelClasses}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">{plan.planName}</h2>
                                <div className="flex items-center gap-2 text-sm text-slate-300 mt-1">
                                    <CalendarIcon />
                                    <span>{new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <button onClick={() => deletePlan(plan.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1"><TrashIcon/></button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                           {WEEK_DAYS.map((dayName, i) => {
                               const workoutDay = plan.days.find(d => d.dayOfWeek === i);
                               const isRestDay = plan.restDays.includes(i);
                               return (
                                <div key={i} className={`p-4 rounded-lg ${isRestDay ? 'bg-black/10' : 'bg-white/5'} relative`}>
                                    <h3 className={`font-bold ${isRestDay ? 'text-slate-400' : 'text-accent'}`}>{dayName}</h3>
                                    {workoutDay && !isRestDay ? (
                                        <>
                                            <p className="font-semibold text-white text-sm mb-2">{workoutDay.focus}</p>
                                            <ul className="space-y-1 mb-3">
                                                {workoutDay.exercises.map(ex => <li key={ex.name} className="text-xs text-slate-300">{ex.name}</li>)}
                                            </ul>
                                            <button
                                                onClick={() => startWorkout(plan.id, i)}
                                                className="w-full px-2 py-1 bg-accent hover:bg-accent-hover text-slate-900 text-xs font-bold rounded transition-colors flex items-center justify-center gap-1"
                                            >
                                                <ClipboardListIcon className="w-3 h-3" />
                                                Start
                                            </button>
                                        </>
                                    ) : isRestDay ? (
                                        <p className="text-sm text-slate-400">Rest</p>
                                    ) : <p className="text-sm text-slate-500">Off</p>}
                                </div>
                               )
                           })}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
    );
};

export default MyPlans;