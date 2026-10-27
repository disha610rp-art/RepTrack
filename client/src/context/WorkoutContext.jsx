import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { playCountdownBeep, playPrFanfare, playTimerCompleteSound } from '../utils/soundEffects';

const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [activeSession, setActiveSession] = useState(null);
  const [loadingActive, setLoadingActive] = useState(false);
  const [summaryModalResult, setSummaryModalResult] = useState(null);

  // Plate modal state
  const [plateModal, setPlateModal] = useState({
    isOpen: false,
    targetWeight: 60,
    exerciseName: '',
  });

  // Rest timer state
  const [restTimer, setRestTimer] = useState({
    isActive: false,
    isPaused: false,
    remainingSeconds: 0,
    totalSeconds: 0,
    targetLabel: '',
  });

  // Load active session from server when user is authenticated
  useEffect(() => {
    async function fetchActive() {
      if (!isAuthenticated) {
        setActiveSession(null);
        return;
      }
      try {
        setLoadingActive(true);
        const res = await api.get('/sessions/active');
        if (res.data?.data) {
          setActiveSession(res.data.data);
        }
      } catch (err) {
        console.warn('Could not fetch active session from API:', err.message);
      } finally {
        setLoadingActive(false);
      }
    }
    fetchActive();
  }, [isAuthenticated]);

  // Rest Timer Interval
  useEffect(() => {
    let timer = null;
    if (restTimer.isActive && !restTimer.isPaused && restTimer.remainingSeconds > 0) {
      timer = setInterval(() => {
        setRestTimer(prev => {
          if (prev.remainingSeconds <= 1) {
            if (user?.settings?.soundEnabled) {
              playTimerCompleteSound();
            }
            return {
              ...prev,
              isActive: false,
              isPaused: false,
              remainingSeconds: 0,
            };
          }

          const nextSec = prev.remainingSeconds - 1;
          if (user?.settings?.soundEnabled && nextSec <= 3 && nextSec >= 1) {
            playCountdownBeep(nextSec === 1);
          }

          return {
            ...prev,
            remainingSeconds: nextSec,
          };
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [restTimer.isActive, restTimer.isPaused, restTimer.remainingSeconds, user]);

  const startRestTimer = (seconds, label = 'Rest') => {
    setRestTimer({
      isActive: true,
      isPaused: false,
      remainingSeconds: seconds,
      totalSeconds: seconds,
      targetLabel: label,
    });
  };

  const pauseRestTimer = () => setRestTimer(prev => ({ ...prev, isPaused: true }));
  const resumeRestTimer = () => setRestTimer(prev => ({ ...prev, isPaused: false }));
  const stopRestTimer = () => setRestTimer({ isActive: false, isPaused: false, remainingSeconds: 0, totalSeconds: 0, targetLabel: '' });
  const addRestSeconds = (sec) => setRestTimer(prev => ({
    ...prev,
    remainingSeconds: Math.max(0, prev.remainingSeconds + sec),
    totalSeconds: prev.totalSeconds + (sec > 0 ? sec : 0),
  }));

  const openPlateModal = (targetWeight, exerciseName = '') => {
    setPlateModal({
      isOpen: true,
      targetWeight: Number(targetWeight) || 60,
      exerciseName,
    });
  };

  const closePlateModal = () => {
    setPlateModal(prev => ({ ...prev, isOpen: false }));
  };

  const startWorkout = async (programId, workoutId, workoutName) => {
    try {
      const res = await api.post('/sessions/start', {
        programId,
        workoutId,
        workoutName,
      });
      if (res.data?.data) {
        setActiveSession(res.data.data);
      }
      return { success: true, session: res.data.data };
    } catch (err) {
      console.error('Failed to start session:', err);
      // Fallback local session if server is offline
      const fallbackSession = {
        _id: `sess-local-${Date.now()}`,
        workoutName: workoutName || 'Quick Workout',
        startedAt: new Date().toISOString(),
        unit: user?.settings?.unit || 'kg',
        status: 'in_progress',
        exercises: [],
      };
      setActiveSession(fallbackSession);
      return { success: true, session: fallbackSession };
    }
  };

  const updateLoggedSet = async (exerciseId, setId, updates) => {
    if (!activeSession) return;

    // Optimistic local state update
    setActiveSession(prev => {
      if (!prev) return prev;
      const updatedExercises = prev.exercises.map(ex => {
        const exId = ex.exerciseId?._id || ex.exerciseId;
        if (exId?.toString() !== exerciseId?.toString()) return ex;

        const updatedSets = ex.sets.map(s => {
          if (s._id?.toString() !== setId?.toString()) return s;
          return { ...s, ...updates };
        });

        return { ...ex, sets: updatedSets };
      });
      return { ...prev, exercises: updatedExercises };
    });

    // Auto-trigger rest timer if completed flipped to true
    if (updates.completed === true && user?.settings?.restTimerAutoStart) {
      const currentEx = activeSession.exercises.find(
        e => (e.exerciseId?._id || e.exerciseId)?.toString() === exerciseId?.toString()
      );
      const restTime = currentEx?.exerciseId?.defaultRestSeconds || 120;
      const exName = currentEx?.exerciseId?.name || 'Rest';
      startRestTimer(restTime, exName);
    }

    try {
      await api.put(`/sessions/${activeSession._id}/set`, {
        exerciseId,
        setId,
        updates,
      });
    } catch (err) {
      console.warn('API set sync error (retained in local memory):', err.message);
    }
  };

  const addSet = async (exerciseId, isWarmup = false) => {
    if (!activeSession) return;
    try {
      const res = await api.post(`/sessions/${activeSession._id}/add-set`, {
        exerciseId,
        isWarmup,
      });
      if (res.data?.data) {
        setActiveSession(res.data.data);
      }
    } catch (err) {
      // Local fallback
      setActiveSession(prev => {
        const updatedExercises = prev.exercises.map(ex => {
          const exId = ex.exerciseId?._id || ex.exerciseId;
          if (exId?.toString() !== exerciseId?.toString()) return ex;
          const lastSet = ex.sets[ex.sets.length - 1];
          const newSet = {
            _id: `set-${Date.now()}`,
            setNumber: ex.sets.length + 1,
            isWarmup,
            targetWeight: lastSet ? lastSet.actualWeight : 40,
            targetReps: lastSet ? lastSet.actualReps : 5,
            actualWeight: lastSet ? lastSet.actualWeight : 40,
            actualReps: lastSet ? lastSet.actualReps : 5,
            completed: false,
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        });
        return { ...prev, exercises: updatedExercises };
      });
    }
  };

  const removeSet = async (exerciseId, setId) => {
    if (!activeSession) return;
    try {
      const res = await api.delete(`/sessions/${activeSession._id}/set/${setId}?exerciseId=${exerciseId}`);
      if (res.data?.data) {
        setActiveSession(res.data.data);
      }
    } catch (err) {
      // Local fallback
      setActiveSession(prev => {
        const updatedExercises = prev.exercises.map(ex => {
          const exId = ex.exerciseId?._id || ex.exerciseId;
          if (exId?.toString() !== exerciseId?.toString()) return ex;
          const filtered = ex.sets.filter(s => s._id?.toString() !== setId?.toString());
          filtered.forEach((s, i) => (s.setNumber = i + 1));
          return { ...ex, sets: filtered };
        });
        return { ...prev, exercises: updatedExercises };
      });
    }
  };

  const addExerciseToActiveWorkout = async (exerciseId) => {
    if (!activeSession) return;
    try {
      const res = await api.post(`/sessions/${activeSession._id}/add-exercise`, {
        exerciseId,
      });
      if (res.data?.data) {
        setActiveSession(res.data.data);
      }
    } catch (err) {
      console.warn('API add exercise error:', err.message);
    }
  };

  const finishWorkout = async (notes, overallRpe) => {
    if (!activeSession) return null;
    try {
      const res = await api.post(`/sessions/${activeSession._id}/complete`, {
        notes,
        overallRpe,
      });

      stopRestTimer();
      setActiveSession(null);

      const evaluation = res.data?.evaluation || { recommendations: [], prEvents: [] };
      if (evaluation.prEvents?.length > 0 && user?.settings?.soundEnabled) {
        playPrFanfare();
      }

      setSummaryModalResult({
        session: res.data?.session,
        evaluation,
      });

      return evaluation;
    } catch (err) {
      console.error('Failed to complete session on server:', err);
      stopRestTimer();
      setActiveSession(null);
      return null;
    }
  };

  const cancelWorkout = async () => {
    if (!activeSession) return;
    try {
      await api.post(`/sessions/${activeSession._id}/cancel`);
    } catch (err) {}
    stopRestTimer();
    setActiveSession(null);
  };

  const dismissSummaryModal = () => setSummaryModalResult(null);

  return (
    <WorkoutContext.Provider
      value={{
        activeSession,
        loadingActive,
        restTimer,
        plateModal,
        summaryModalResult,
        startWorkout,
        updateLoggedSet,
        addSet,
        removeSet,
        addExerciseToActiveWorkout,
        finishWorkout,
        cancelWorkout,
        startRestTimer,
        pauseRestTimer,
        resumeRestTimer,
        stopRestTimer,
        addRestSeconds,
        openPlateModal,
        closePlateModal,
        dismissSummaryModal,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error('useWorkout must be used within a WorkoutProvider');
  return context;
};
