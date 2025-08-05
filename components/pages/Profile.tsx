import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserDetails } from '../../types';

const Profile: React.FC = () => {
    const { currentUser, updateUserDetails } = useAuth();
    const [details, setDetails] = useState<Partial<UserDetails>>({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (currentUser?.details) {
            setDetails(currentUser.details);
        }
    }, [currentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage('');
        setDetails({ ...details, [e.target.name]: e.target.value ? Number(e.target.value) : undefined });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await updateUserDetails(details as UserDetails);
            setMessage('Profile updated successfully!');
        } catch (error) {
            setMessage('Failed to update profile.');
            console.error(error);
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };
    
    const inputClasses = "bg-white/5 border border-white/20 rounded-lg w-full p-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-glow focus:border-accent transition-all";
    const disabledInputClasses = `${inputClasses} bg-white/5 cursor-not-allowed opacity-60`;

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-6">My Profile</h1>
                <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-glass p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="username">Username</label>
                                <input type="text" id="username" value={currentUser?.username || ''} disabled className={disabledInputClasses} />
                            </div>
                            <div>
                                <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="bmi">BMI</label>
                                <input type="text" id="bmi" value={details.bmi || 'N/A'} disabled className={disabledInputClasses} />
                            </div>
                            <div>
                                <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="height">Height (cm)</label>
                                <input type="number" name="height" id="height" value={details.height || ''} onChange={handleChange} className={inputClasses} placeholder="e.g., 180"/>
                            </div>
                            <div>
                                <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="weight">Weight (kg)</label>
                                <input type="number" name="weight" id="weight" step="0.1" value={details.weight || ''} onChange={handleChange} className={inputClasses} placeholder="e.g., 75.5"/>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="fatPercentage">Body Fat (%)</label>
                                <input type="number" name="fatPercentage" id="fatPercentage" step="0.1" value={details.fatPercentage || ''} onChange={handleChange} className={inputClasses} placeholder="Optional"/>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-6">
                            {message && <p className="text-sm text-accent">{message}</p>}
                            <button
                                className="bg-accent hover:bg-accent-hover text-slate-900 font-bold py-2.5 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors disabled:opacity-50 ml-auto"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;