import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { User, UserDetails } from '../types';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
    currentUser: User | null;
    login: (username: string) => Promise<void>;
    signup: (username: string) => Promise<void>;
    logout: () => void;
    updateUserDetails: (details: Partial<UserDetails>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [users, setUsers] = useLocalStorage<User[]>('users', []);
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
    const navigate = useNavigate();

    const auth = useMemo(() => ({
        currentUser,
        async login(username: string): Promise<void> {
            const userExists = users.find(u => u.username === username);
            if (userExists) {
                setCurrentUser(userExists);
                navigate('/');
            } else {
                throw new Error("User not found.");
            }
        },
        async signup(username: string): Promise<void> {
            const userExists = users.find(u => u.username === username);
            if (userExists) {
                throw new Error("Username is already taken.");
            }
            const newUser: User = { username };
            setUsers(prevUsers => [...prevUsers, newUser]);
            setCurrentUser(newUser);
            navigate('/onboarding');
        },
        logout() {
            setCurrentUser(null);
            navigate('/login');
        },
        async updateUserDetails(details: Partial<UserDetails>): Promise<void> {
            if (!currentUser) throw new Error("No user logged in to update.");

            const updatedUser: User = { 
                ...currentUser, 
                details: {
                    ...currentUser.details,
                    ...details
                }
            };
             
            if (updatedUser.details?.height && updatedUser.details?.weight) {
                const heightInMeters = updatedUser.details.height / 100;
                updatedUser.details.bmi = parseFloat((updatedUser.details.weight / (heightInMeters * heightInMeters)).toFixed(1));
            }

            setUsers(prevUsers => prevUsers.map(u => u.username === updatedUser.username ? updatedUser : u));
            setCurrentUser(updatedUser);
        }
    }), [currentUser, users, navigate, setCurrentUser, setUsers]);


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