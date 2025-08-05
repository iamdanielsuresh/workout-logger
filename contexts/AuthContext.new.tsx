import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import type { User, UserDetails } from '../types';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, username: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUserDetails: (details: Partial<UserDetails>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Convert Supabase user to our User type
    const convertSupabaseUser = (supabaseUser: SupabaseUser): User => ({
        id: supabaseUser.id,
        username: supabaseUser.email?.split('@')[0] || supabaseUser.id,
        email: supabaseUser.email || '',
        details: {} // Will be loaded from database if available
    });

    // Check for existing session on mount
    useEffect(() => {
        const getSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    setCurrentUser(convertSupabaseUser(session.user));
                }
            } catch (error) {
                console.error('Error getting session:', error);
            } finally {
                setLoading(false);
            }
        };

        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    setCurrentUser(convertSupabaseUser(session.user));
                } else {
                    setCurrentUser(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const auth = useMemo(() => ({
        currentUser,
        loading,
        async login(email: string, password: string): Promise<void> {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) {
                throw new Error(error.message);
            }
            
            if (data.user) {
                setCurrentUser(convertSupabaseUser(data.user));
                navigate('/');
            }
        },
        
        async signup(email: string, password: string, username: string): Promise<void> {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username
                    }
                }
            });
            
            if (error) {
                throw new Error(error.message);
            }
            
            if (data.user) {
                setCurrentUser(convertSupabaseUser(data.user));
                navigate('/onboarding');
            }
        },
        
        async logout(): Promise<void> {
            const { error } = await supabase.auth.signOut();
            if (error) {
                throw new Error(error.message);
            }
            setCurrentUser(null);
            navigate('/login');
        },
        
        async updateUserDetails(details: Partial<UserDetails>): Promise<void> {
            if (!currentUser) throw new Error("No user logged in to update.");

            // Calculate BMI if height and weight are provided
            let updatedDetails = { ...details };
            if (details.height && details.weight) {
                const heightInMeters = details.height / 100;
                updatedDetails.bmi = parseFloat((details.weight / (heightInMeters * heightInMeters)).toFixed(1));
            }

            // Update the current user state
            const updatedUser: User = { 
                ...currentUser, 
                details: {
                    ...currentUser.details,
                    ...updatedDetails
                }
            };
            
            setCurrentUser(updatedUser);
            
            // Here you could also update the user profile in Supabase if needed
            // await supabase.auth.updateUser({ data: updatedDetails });
        }
    }), [currentUser, loading, navigate]);

    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
