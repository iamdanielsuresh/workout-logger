import React, { useState } from 'react';
import type { ManualPlan, ManualPlanDay } from '../../types';
import { PlusIcon, TrashIcon, PencilIcon } from '../../constants';

interface ManualPlanFormProps {
    addPlan: (plan: Omit<ManualPlan, 'id' | 'userId'>) => void;
    closeForm: () => void;
}

const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const glassPanelClasses = "bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-glass p-6";
const inputClasses = "bg-white/5 border border-white/20 rounded-lg w-full p-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-glow focus:border-accent transition-all";
const primaryButtonClasses = "flex items-center justify-center gap-2 px-4 py-2 bg-accent text-slate-900 font-bold rounded-lg hover:bg-accent-hover transition-colors shadow-glow-sm disabled:opacity-50";
const secondaryButtonClasses = "flex items-center justify-center gap-2 px-4 py-2 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50";


const ManualPlanForm: React.FC<ManualPlanFormProps> = ({ addPlan, closeForm }) => {
    const [planName, setPlanName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [days, setDays] = useState<ManualPlanDay[]>([]);
    const [trainingDays, setTrainingDays] = useState<number[]>([]);

    const handleTrainingDayToggle = (dayIndex: number) => {
        setTrainingDays(prev => {
            const newTrainingDays = prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex];
            
            // Sync `days` state with `trainingDays`
            const newDays = newTrainingDays.map(dIndex => {
                const existingDay = days.find(d => d.dayOfWeek === dIndex);
                return existingDay || { dayOfWeek: dIndex, focus: '', exercises: [{ name: '', sets: '', reps: '' }] };
            }).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
            setDays(newDays);

            return newTrainingDays.sort();
        });
    };

    const handleDayChange = (dayIndex: number, field: 'focus', value: string) => {
        setDays(prev => prev.map(d => d.dayOfWeek === dayIndex ? { ...d, [field]: value } : d));
    };

    const handleExerciseChange = (dayIndex: number, exIndex: number, field: 'name' | 'sets' | 'reps', value: string) => {
        setDays(prev => prev.map(d => {
            if (d.dayOfWeek === dayIndex) {
                const newExercises = d.exercises.map((ex, i) => i === exIndex ? { ...ex, [field]: value } : ex);
                return { ...d, exercises: newExercises };
            }
            return d;
        }));
    };

    const addExercise = (dayIndex: number) => {
        setDays(prev => prev.map(d => {
            if (d.dayOfWeek === dayIndex) {
                return { ...d, exercises: [...d.exercises, { name: '', sets: '', reps: '' }] };
            }
            return d;
        }));
    };
    
    const removeExercise = (dayIndex: number, exIndex: number) => {
        setDays(prev => prev.map(d => {
            if (d.dayOfWeek === dayIndex) {
                 if (d.exercises.length > 1) {
                    const newExercises = d.exercises.filter((_, i) => i !== exIndex);
                    return { ...d, exercises: newExercises };
                 }
            }
            return d;
        }));
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const restDays = WEEK_DAYS.map((_, i) => i).filter(i => !trainingDays.includes(i));
        addPlan({ planName, startDate, endDate, days, restDays });
        closeForm();
    };


    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-10 sm:pt-16">
            <form onSubmit={handleSubmit} className={`${glassPanelClasses} w-full max-w-3xl max-h-[90vh] overflow-y-auto`}>
                <h2 className="text-2xl font-bold mb-4 text-white">Create Manual Plan</h2>
                <div className="space-y-4">
                    <input type="text" value={planName} onChange={e => setPlanName(e.target.value)} required className={inputClasses} placeholder="Plan Name (e.g., My PPL Split)" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className={inputClasses} />
                         <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className={inputClasses} />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-slate-300">Select Training Days</label>
                        <div className="flex flex-wrap gap-2">
                            {WEEK_DAYS.map((day, index) => (
                                <button type="button" key={day} onClick={() => handleTrainingDayToggle(index)} className={`px-3 py-1 text-sm rounded-full transition-colors ${trainingDays.includes(index) ? 'bg-accent text-slate-900 font-bold' : 'bg-white/10 text-slate-200 hover:bg-white/20'}`}>
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>

                    {days.length > 0 && <div className="border-t border-white/10 pt-4"></div>}

                    <div className="space-y-6">
                        {days.map(day => (
                            <div key={day.dayOfWeek} className="bg-black/20 p-4 rounded-lg">
                                <h3 className="font-bold text-lg text-accent mb-3">{WEEK_DAYS[day.dayOfWeek]}</h3>
                                <input 
                                    type="text" 
                                    value={day.focus} 
                                    onChange={(e) => handleDayChange(day.dayOfWeek, 'focus', e.target.value)} 
                                    required 
                                    className={`${inputClasses} mb-3`} 
                                    placeholder="Day Focus (e.g., Push Day)" 
                                />
                                {day.exercises.map((ex, exIndex) => (
                                    <div key={exIndex} className="grid grid-cols-12 gap-2 items-center mb-2">
                                        <div className="col-span-12 sm:col-span-5">
                                             <input type="text" value={ex.name} onChange={(e) => handleExerciseChange(day.dayOfWeek, exIndex, 'name', e.target.value)} required className={inputClasses} placeholder="Exercise Name" />
                                        </div>
                                        <div className="col-span-5 sm:col-span-3">
                                             <input type="text" value={ex.sets} onChange={(e) => handleExerciseChange(day.dayOfWeek, exIndex, 'sets', e.target.value)} className={inputClasses} placeholder="Sets (optional)" />
                                        </div>
                                         <div className="col-span-5 sm:col-span-3">
                                             <input type="text" value={ex.reps} onChange={(e) => handleExerciseChange(day.dayOfWeek, exIndex, 'reps', e.target.value)} className={inputClasses} placeholder="Reps (optional)" />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1 flex justify-end">
                                             <button type="button" onClick={() => removeExercise(day.dayOfWeek, exIndex)} className="text-red-500 hover:text-red-400 disabled:opacity-30 p-1" disabled={day.exercises.length <= 1}>
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addExercise(day.dayOfWeek)} className="mt-2 flex items-center gap-1 text-accent hover:text-accent-hover text-sm font-medium">
                                    <PlusIcon className="h-4 w-4"/> Add Exercise
                                </button>
                            </div>
                        ))}
                    </div>

                </div>

                <div className="flex justify-end gap-4 mt-6">
                    <button type="button" onClick={closeForm} className={secondaryButtonClasses}>Cancel</button>
                    <button type="submit" className={primaryButtonClasses}>
                        <PencilIcon />
                        Save Plan
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ManualPlanForm;