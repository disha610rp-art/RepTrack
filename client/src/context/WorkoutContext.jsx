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

  // Rest timer state & pending queue
  const [restTimer, setRestTimer] = useState({
    isActive: false,
    isPaused: false,
    remainingSeconds: 0,
    totalSeconds: 0,
    targetLabel: '',
    exerciseId: null,
    setId: null,
  });
  const [timerQueue, setTimerQueue] = useState([]);
  const timerQueueRef = React.useRef(timerQueue);

  useEffect(() => {
    timerQueueRef.current = timerQueue;
  }, [timerQueue]);

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

  // Finalize set to completed state and sync
  const finalizeSetCompleted = (exerciseId, setId) => {
    if (!exerciseId || !setId) return;
    setActiveSession(prev => {
      if (!prev) return prev;
      const updatedExercises = prev.exercises.map(ex => {
        const exId = ex.exerciseId?._id || ex.exerciseId;
        if (exId?.toString() !== exerciseId?.toString()) return ex;

        const updatedSets = ex.sets.map(s => {
          if (s._id?.toString() !== setId?.toString()) return s;
          return { ...s, completed: true, pending: false };
        });

        return { ...ex, sets: updatedSets };
      });
      return { ...prev, exercises: updatedExercises };
    });

    if (activeSession?._id) {
      api.put(`/sessions/${activeSession._id}/set`, {
        exerciseId,
        setId,
        updates: { completed: true, pending: false },
      }).catch(err => console.warn('Sync pending set completed error:', err.message));
    }
  };

  // Rest Timer Interval with Pending Queue & Active Seconds Calculation
  useEffect(() => {
    let timer = null;
    if (restTimer.isActive && !restTimer.isPaused && restTimer.remainingSeconds > 0) {
      timer = setInterval(() => {
        setRestTimer(prev => {
          // Increment actualSeconds on the active set every resumed second
          if (prev.exerciseId && prev.setId) {
            setActiveSession(currSession => {
              if (!currSession) return currSession;
              const updatedExercises = currSession.exercises.map(ex => {
                const exId = ex.exerciseId?._id || ex.exerciseId;
                if (exId?.toString() !== prev.exerciseId?.toString()) return ex;

                const updatedSets = ex.sets.map(s => {
                  if (s._id?.toString() !== prev.setId?.toString()) return s;
                  const currentSec = (s.actualSeconds || 0) + 1;
                  const targetSec = s.targetSeconds || prev.totalSeconds || 180;
                  const fullVol = (Number(s.actualWeight) || 0) * (Number(s.actualReps) || 0);
                  const ratio = targetSec > 0 ? Math.min(1, currentSec / targetSec) : 1;
                  const calcVol = Math.round(fullVol * ratio);
                  return {
                    ...s,
                    actualSeconds: currentSec,
                    targetSeconds: targetSec,
                    calculatedVolume: calcVol,
                  };
                });
                return { ...ex, sets: updatedSets };
              });
              return { ...currSession, exercises: updatedExercises };
            });
          }

          if (prev.remainingSeconds <= 1) {
            if (user?.settings?.soundEnabled) {
              playTimerCompleteSound();
            }

            // Finalize linked set to completed
            if (prev.exerciseId && prev.setId) {
              finalizeSetCompleted(prev.exerciseId, prev.setId);
            }

            // Check if another timer is in pending queue
            const queue = timerQueueRef.current;
            if (queue && queue.length > 0) {
              const nextTimer = queue[0];
              setTimerQueue(q => q.slice(1));
              return {
                isActive: true,
                isPaused: false,
                remainingSeconds: nextTimer.seconds,
                totalSeconds: nextTimer.seconds,
                targetLabel: nextTimer.targetLabel,
                exerciseId: nextTimer.exerciseId,
                setId: nextTimer.setId,
              };
            }

            return {
              isActive: false,
              isPaused: false,
              remainingSeconds: 0,
              totalSeconds: 0,
              targetLabel: '',
              exerciseId: null,
              setId: null,
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
  }, [restTimer.isActive, restTimer.isPaused, restTimer.remainingSeconds, user, activeSession?._id]);

  const startRestTimer = (seconds, label = 'Rest', metadata = {}) => {
    setRestTimer(prev => {
      // If a timer is already active and running, push to pending queue instead of dropping it!
      if (prev.isActive && prev.remainingSeconds > 0) {
        setTimerQueue(q => [
          ...q,
          {
            id: `q-${Date.now()}-${Math.random()}`,
            seconds,
            totalSeconds: seconds,
            targetLabel: label,
            exerciseId: metadata.exerciseId || null,
            setId: metadata.setId || null,
          },
        ]);
        return prev;
      }

      return {
        isActive: true,
        isPaused: false,
        remainingSeconds: seconds,
        totalSeconds: seconds,
        targetLabel: label,
        exerciseId: metadata.exerciseId || null,
        setId: metadata.setId || null,
      };
    });
  };

  const advanceRestTimer = () => {
    // Finalize current active timer's set
    if (restTimer.exerciseId && restTimer.setId) {
      finalizeSetCompleted(restTimer.exerciseId, restTimer.setId);
    }

    const queue = timerQueueRef.current;
    if (queue && queue.length > 0) {
      const nextTimer = queue[0];
      setTimerQueue(q => q.slice(1));
      setRestTimer({
        isActive: true,
        isPaused: false,
        remainingSeconds: nextTimer.seconds,
        totalSeconds: nextTimer.seconds,
        targetLabel: nextTimer.targetLabel,
        exerciseId: nextTimer.exerciseId,
        setId: nextTimer.setId,
      });
    } else {
      setRestTimer({
        isActive: false,
        isPaused: false,
        remainingSeconds: 0,
        totalSeconds: 0,
        targetLabel: '',
        exerciseId: null,
        setId: null,
      });
    }
  };

  const pauseRestTimer = () => setRestTimer(prev => ({ ...prev, isPaused: true }));
  const resumeRestTimer = () => setRestTimer(prev => ({ ...prev, isPaused: false }));
  
  const stopRestTimer = () => {
    if (restTimer.exerciseId && restTimer.setId) {
      finalizeSetCompleted(restTimer.exerciseId, restTimer.setId);
    }
    setTimerQueue([]);
    setRestTimer({
      isActive: false,
      isPaused: false,
      remainingSeconds: 0,
      totalSeconds: 0,
      targetLabel: '',
      exerciseId: null,
      setId: null,
    });
  };

  const removeSetFromQueue = (exerciseId, setId) => {
    setTimerQueue(q =>
      q.filter(
        item =>
          !(
            item.exerciseId?.toString() === exerciseId?.toString() &&
            item.setId?.toString() === setId?.toString()
          )
      )
    );
    if (
      restTimer.exerciseId?.toString() === exerciseId?.toString() &&
      restTimer.setId?.toString() === setId?.toString()
    ) {
      advanceRestTimer();
    }
  };

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

    // Auto-trigger rest timer and queue if set goes into pending state
    if (updates.pending === true && user?.settings?.restTimerAutoStart) {
      const currentEx = activeSession.exercises.find(
        e => (e.exerciseId?._id || e.exerciseId)?.toString() === exerciseId?.toString()
      );
      const restTime = currentEx?.exerciseId?.defaultRestSeconds || 120;
      const exName = currentEx?.exerciseId?.name || 'Rest';
      startRestTimer(restTime, exName, { exerciseId, setId });
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

    // Calculate volume based on completed sets and seconds active/resumed
    const calculateSessionVolume = (exercises) => {
      return (exercises || []).reduce((acc, ex) => {
        const sVol = (ex.sets || []).reduce((sum, s) => {
          if (s.isWarmup) return sum;
          const fullVol = (Number(s.actualWeight) || 0) * (Number(s.actualReps) || 0);
          if (s.completed && (!s.actualSeconds || s.actualSeconds >= (s.targetSeconds || 180))) {
            return sum + fullVol;
          }
          if (s.actualSeconds > 0) {
            const target = s.targetSeconds || 180;
            const ratio = target > 0 ? Math.min(1, Math.max(0, s.actualSeconds / target)) : 1;
            return sum + Math.round(fullVol * ratio);
          }
          if (s.completed) return sum + fullVol;
          return sum;
        }, 0);
        return acc + sVol;
      }, 0);
    };

    const calculatedTotalVol = calculateSessionVolume(activeSession.exercises);

    try {
      const res = await api.post(`/sessions/${activeSession._id}/complete`, {
        notes,
        overallRpe,
        exercises: activeSession.exercises,
      });

      stopRestTimer();
      setActiveSession(null);

      const evaluation = res.data?.evaluation || { recommendations: [], prEvents: [] };
      if (!evaluation.totalVolume || evaluation.totalVolume === 0) {
        evaluation.totalVolume = calculatedTotalVol;
      }

      if (res.data?.session) {
        res.data.session.totalVolume = evaluation.totalVolume;
      }

      if (evaluation.prEvents?.length > 0 && user?.settings?.soundEnabled) {
        playPrFanfare();
      }

      setSummaryModalResult({
        session: res.data?.session || { totalVolume: evaluation.totalVolume },
        evaluation,
      });

      return evaluation;
    } catch (err) {
      console.error('Failed to complete session on server:', err);
      const completedVol = calculatedTotalVol;

      const localSession = {
        ...activeSession,
        status: 'completed',
        totalVolume: completedVol,
        durationSeconds: Math.max(60, Math.round((Date.now() - new Date(activeSession.startedAt).getTime()) / 1000)),
      };

      stopRestTimer();
      setActiveSession(null);

      setSummaryModalResult({
        session: localSession,
        evaluation: {
          totalVolume: completedVol,
          recommendations: [],
          prEvents: [],
        },
      });
      return { totalVolume: completedVol };
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
        timerQueue,
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
        advanceRestTimer,
        finalizeSetCompleted,
        removeSetFromQueue,
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
