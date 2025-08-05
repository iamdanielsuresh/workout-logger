import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { DumbbellIcon } from '../../constants';

const Signup: React.FC = () => {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (username.length < 3) {
            setError('Username must be at least 3 characters long.');
            return;
        }

        setLoading(true);
        try {
            await signup(username);
            navigate('/onboarding');
        } catch (err: any) {
            setError(err.message || 'Failed to create an account.');
        } finally {
            setLoading(false);
        }
    };
    
    const inputClasses = "bg-white/5 border border-white/20 rounded-lg w-full p-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-glow focus:border-accent transition-all";

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md">
                <form
                    onSubmit={handleSubmit}
                    className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-glass p-8"
                >
                    <div className="mb-8 text-center">
                        <DumbbellIcon className="mx-auto h-12 w-12 text-accent" />
                        <h2 className="mt-2 text-2xl font-bold text-white">
                            Create a new account
                        </h2>
                        <p className="text-sm text-slate-400 mt-2">
                            Or{' '}
                            <Link to="/login" className="font-medium text-accent hover:text-accent-hover">
                                sign in to your existing account
                            </Link>
                        </p>
                    </div>

                    {error && (
                         <div className="bg-red-500/10 text-red-300 p-3 rounded-lg mb-4 text-sm border border-red-500/20">
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="username">
                            Username
                        </label>
                        <input
                            className={inputClasses}
                            id="username"
                            type="text"
                            placeholder="Choose a username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between mt-6">
                        <button
                            className="w-full bg-accent hover:bg-accent-hover text-slate-900 font-bold py-2.5 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors disabled:opacity-50"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;