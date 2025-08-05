import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { UserDetails } from '../../types';

const Onboarding: React.FC = () => {
    const [details, setDetails] = useState<Partial<UserDetails>>({ height: undefined, weight: undefined, fatPercentage: undefined });
    const [loading, setLoading] = useState(false);
    const { updateUserDetails, currentUser } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDetails({ ...details, [e.target.name]: e.target.value ? Number(e.target.value) : undefined });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateUserDetails(details as UserDetails);
            navigate('/');
        } catch (error) {
            console.error("Failed to save details", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        navigate('/');
    };
    
    const inputClasses = "bg-white/5 border border-white/20 rounded-lg w-full p-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-glow focus:border-accent transition-all";

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
             <div className="w-full max-w-md">
                <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-glass p-8">
                    <div className="mb-8 text-center">
                        <h2 className="mt-2 text-2xl font-bold text-white">
                            Welcome, {currentUser?.username}!
                        </h2>
                         <p className="text-sm text-slate-400 mt-2">
                            Tell us a bit about yourself to personalize your experience.
                        </p>
                    </div>
                    
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                             <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="height">Height (cm)</label>
                             <input type="number" name="height" id="height" value={details.height || ''} onChange={handleChange} className={inputClasses} placeholder="e.g., 180"/>
                        </div>
                        <div>
                            <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="weight">Weight (kg)</label>
                             <input type="number" name="weight" id="weight" step="0.1" value={details.weight || ''} onChange={handleChange} className={inputClasses} placeholder="e.g., 75.5"/>
                        </div>
                        <div>
                             <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="fatPercentage">Body Fat (%)</label>
                             <input type="number" name="fatPercentage" id="fatPercentage" step="0.1" value={details.fatPercentage || ''} onChange={handleChange} className={inputClasses} placeholder="Optional"/>
                        </div>

                         <div className="flex flex-col gap-4 pt-4">
                            <button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent-hover text-slate-900 font-bold py-2.5 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors disabled:opacity-50">
                                {loading ? 'Saving...' : 'Save and Continue'}
                            </button>
                             <button type="button" onClick={handleSkip} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors">
                                Skip for Now
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default Onboarding;