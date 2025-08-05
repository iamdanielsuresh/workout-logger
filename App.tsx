import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useLocalStorage from './hooks/useLocalStorage';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/shared/Header';
import Dashboard from './components/pages/Dashboard';
import WorkoutLog from './components/pages/WorkoutLog';
import PlanWorkoutLog from './components/pages/PlanWorkoutLog';
import PlanGenerator from './components/pages/PlanGenerator';
import Templates from './components/pages/Templates';
import RecoveryTracking from './components/pages/RecoveryTracking';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MyPlans from './components/pages/MyPlans';
import Onboarding from './components/auth/Onboarding';
import Profile from './components/pages/Profile';
import type { Workout, ManualPlan, ActiveWorkoutSession } from './types';

const App: React.FC = () => {
  const { currentUser } = useAuth();
  
  const workoutKey = currentUser ? `workouts_${currentUser.username}` : '';
  const plansKey = currentUser ? `manual_plans_${currentUser.username}` : '';
  const activeSessionKey = currentUser ? `active_session_${currentUser.username}` : '';

  const [workouts, setWorkouts] = useLocalStorage<Workout[]>(workoutKey, []);
  const [manualPlans, setManualPlans] = useLocalStorage<ManualPlan[]>(plansKey, []);
  const [activeSession, setActiveSession] = useLocalStorage<ActiveWorkoutSession | null>(activeSessionKey, null);

  const addWorkout = (newWorkoutData: Omit<Workout, 'id' | 'date'>) => {
    const workout: Workout = {
      ...newWorkoutData,
      id: new Date().toISOString() + Math.random(),
      date: new Date().toISOString(),
    };
    setWorkouts(prevWorkouts => [workout, ...prevWorkouts].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const addManualPlan = (newPlan: Omit<ManualPlan, 'id' | 'userId'>) => {
      if(!currentUser) return;
      const plan: ManualPlan = {
          ...newPlan,
          id: new Date().toISOString() + Math.random(),
          userId: currentUser.username,
      };
      setManualPlans(prev => [...prev, plan]);
  };

  const deleteManualPlan = (planId: string) => {
    setManualPlans(prev => prev.filter(p => p.id !== planId));
  };

  const startWorkoutSession = (planId: string, dayOfWeek: number, exercises: any[]) => {
    const session: ActiveWorkoutSession = {
      id: new Date().toISOString() + Math.random(),
      planId,
      dayOfWeek,
      startTime: new Date().toISOString(),
      exercises: exercises.map(ex => ({
        exerciseName: ex.name,
        targetSets: ex.sets || undefined,
        targetReps: ex.reps || undefined,
        sets: [{ reps: undefined, weight: undefined, isWarmup: false }],
        notes: '',
        completed: false
      }))
    };
    setActiveSession(session);
    return session;
  };

  const updateWorkoutSession = (updatedSession: ActiveWorkoutSession) => {
    setActiveSession(updatedSession);
  };

  const endWorkoutSession = () => {
    setActiveSession(null);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Header />
        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route path="/onboarding" element={
              <ProtectedRoute>
                  <Onboarding />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                  <Profile />
              </ProtectedRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard 
                  workouts={workouts} 
                  manualPlans={manualPlans}
                  activeSession={activeSession}
                  startWorkoutSession={startWorkoutSession}
                />
              </ProtectedRoute>
            } />
            <Route path="/log" element={
              <ProtectedRoute>
                <WorkoutLog workouts={workouts} addWorkout={addWorkout} />
              </ProtectedRoute>
            } />
            <Route path="/plan-workout" element={
              <ProtectedRoute>
                <PlanWorkoutLog 
                  workouts={workouts} 
                  addWorkout={addWorkout} 
                  plans={manualPlans}
                  activeSession={activeSession}
                  updateWorkoutSession={updateWorkoutSession}
                  endWorkoutSession={endWorkoutSession}
                  startWorkoutSession={startWorkoutSession}
                />
              </ProtectedRoute>
            } />
            <Route path="/my-plans" element={
              <ProtectedRoute>
                <MyPlans plans={manualPlans} addPlan={addManualPlan} deletePlan={deleteManualPlan} />
              </ProtectedRoute>
            } />
            <Route path="/generator" element={
              <ProtectedRoute>
                <PlanGenerator />
              </ProtectedRoute>
            } />
            <Route path="/templates" element={
              <ProtectedRoute>
                <Templates />
              </ProtectedRoute>
            } />
            <Route path="/recovery" element={
              <ProtectedRoute>
                <RecoveryTracking />
              </ProtectedRoute>
            } />
            
            {/* Fallback Redirect */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </ThemeProvider>
  );
};

export default App;