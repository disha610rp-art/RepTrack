import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import { calculate1RM } from '../utils/oneRepMax';

export const ActiveWorkout = () => {
  const { user } = useAuth();
  const {
    activeSession,
    updateLoggedSet,
    addSet,
    removeSet,
    addExerciseToActiveWorkout,
    finishWorkout,
    cancelWorkout,
    openPlateModal,
    startWorkout,
    startRestTimer,
    advanceRestTimer,
  } = useWorkout();

  const navigate = useNavigate();
  const unit = user?.settings?.unit || 'kg';

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');
  const [overallRpe, setOverallRpe] = useState(8);
  const [allExercises, setAllExercises] = useState([]);
  const [showAddExModal, setShowAddExModal] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [finishing, setFinishing] = useState(false);

  const completedVolume = (activeSession?.exercises || []).reduce((acc, ex) => {
    const setsVol = (ex.sets || []).reduce((sum, s) => {
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
    return acc + setsVol;
  }, 0);

  const pendingVolume = (activeSession?.exercises || []).reduce((acc, ex) => {
    const setsVol = (ex.sets || []).reduce((sum, s) => {
      if (s.isWarmup || !s.pending) return sum;
      const fullVol = (Number(s.actualWeight) || 0) * (Number(s.actualReps) || 0);
      const target = s.targetSeconds || 180;
      const remainingSec = Math.max(0, target - (s.actualSeconds || 0));
      const remainingRatio = target > 0 ? remainingSec / target : 0;
      return sum + Math.round(fullVol * remainingRatio);
    }, 0);
    return acc + setsVol;
  }, 0);

  const handleToggleSetDone = (exerciseId, set) => {
    const exIdStr = exerciseId?.toString();
    const currentEx = activeSession?.exercises?.find(
      e => (e.exerciseId?._id || e.exerciseId)?.toString() === exIdStr
    );
    const restTime = currentEx?.exerciseId?.defaultRestSeconds || 120;
    const exName = currentEx?.exerciseId?.name || 'Rest';

    if (set.completed) {
      // Toggle off
      updateLoggedSet(exIdStr, set._id, { completed: false, pending: false });
    } else if (set.pending) {
      // If clicked while in pending queue, immediately finalize as completed
      updateLoggedSet(exIdStr, set._id, { completed: true, pending: false });
      advanceRestTimer();
    } else {
      // New completion -> check if rest timer auto starts
      if (user?.settings?.restTimerAutoStart) {
        updateLoggedSet(exIdStr, set._id, { completed: false, pending: true });
        startRestTimer(restTime, exName, { exerciseId: exIdStr, setId: set._id });
      } else {
        updateLoggedSet(exIdStr, set._id, { completed: true, pending: false });
      }
    }
  };

  // Elapsed Workout Timer
  useEffect(() => {
    if (!activeSession) return;
    const startMs = new Date(activeSession.startedAt).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startMs) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Load exercise catalog for "Add Exercise" selector
  useEffect(() => {
    async function loadEx() {
      try {
        const res = await api.get('/exercises');
        if (res.data?.data) setAllExercises(res.data.data);
      } catch (err) {}
    }
    loadEx();
  }, []);

  const formatElapsed = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const handleFinish = async () => {
    setFinishing(true);
    await finishWorkout(sessionNotes, overallRpe);
    setFinishing(false);
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to discard this workout session?')) {
      cancelWorkout();
      navigate('/');
    }
  };

  // If no active session, show empty state with Start button
  if (!activeSession) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🏋️</div>
        <h2 className="text-2xl font-black text-white mb-2">No Active Workout Session</h2>
        <p className="text-sm text-secondary mb-6 max-w-md mx-auto">
          Start a new workout routine with automated progressive overload rules or choose a program from your library.
        </p>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => startWorkout(null, null, 'Quick Workout')}
            className="btn btn-primary"
            style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }}
          >
            Start Quick Workout
          </button>
          <button
            onClick={() => navigate('/programs')}
            className="btn btn-secondary"
            style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }}
          >
            Browse Programs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Session Top Bar */}
      <div className="card mb-6" style={{ borderColor: 'var(--amber)' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-emerald">● Live Session</span>
              <span className="badge badge-gray font-mono">{activeSession.unit || unit}</span>
            </div>
            <h1 className="text-2xl font-black text-white">{activeSession.workoutName}</h1>
          </div>

          {/* Stopwatch & Live Volume Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div
              style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                padding: '0.5rem 1rem',
                borderRadius: 12,
                border: '1px solid var(--border-color)',
                textAlign: 'center',
              }}
            >
              <div className="text-[10px] text-muted font-bold uppercase tracking-wider">Elapsed Time</div>
              <div className="text-2xl font-black font-mono text-amber">
                {formatElapsed(elapsedSeconds)}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                padding: '0.5rem 1rem',
                borderRadius: 12,
                border: '1px solid var(--border-color)',
                textAlign: 'center',
              }}
            >
              <div className="text-[10px] text-muted font-bold uppercase tracking-wider">Completed Volume</div>
              <div className="text-2xl font-black font-mono text-emerald">
                {completedVolume} <span className="text-xs font-normal text-secondary">{activeSession.unit || unit}</span>
              </div>
            </div>

            {pendingVolume > 0 && (
              <div
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  padding: '0.5rem 1rem',
                  borderRadius: 12,
                  border: '1px dashed #f59e0b',
                  textAlign: 'center',
                }}
              >
                <div className="text-[10px] text-amber font-bold uppercase tracking-wider">⏳ In Queue</div>
                <div className="text-2xl font-black font-mono text-amber">
                  +{pendingVolume} <span className="text-xs font-normal text-secondary">{activeSession.unit || unit}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleFinish}
              disabled={finishing}
              className="btn btn-primary"
              style={{ fontSize: '0.95rem', padding: '0.65rem 1.35rem' }}
            >
              {finishing ? 'Evaluating...' : '✓ Finish Workout'}
            </button>

            <button
              onClick={handleCancel}
              className="btn btn-secondary btn-icon text-red"
              title="Cancel / Discard"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Exercises List */}
      <div className="flex flex-col gap-6 mb-6">
        {activeSession.exercises.map((sessionEx, exIdx) => {
          const ex = sessionEx.exerciseId;
          const exIdStr = ex?._id || ex;
          const progression = ex?.defaultProgression || {};

          return (
            <div key={exIdStr || exIdx} className="card">
              {/* Exercise Header */}
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4 pb-3 border-b border-color" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{ex?.name || 'Exercise'}</h3>
                    <span className="badge badge-amber text-xs">{ex?.primaryMuscle}</span>
                    <span className="badge badge-purple text-xs">
                      {progression.type === 'linear'
                        ? `Linear (+${progression.weightIncrementKg}kg)`
                        : progression.type === 'double'
                        ? `Double (${progression.repsMin}-${progression.repsMax} reps)`
                        : 'Standard'}
                    </span>
                  </div>
                  {sessionEx.notes && (
                    <p className="text-xs text-secondary mt-1">{sessionEx.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addSet(exIdStr, false)}
                    className="btn btn-secondary btn-sm"
                  >
                    + Add Set
                  </button>
                  <button
                    onClick={() => addSet(exIdStr, true)}
                    className="btn btn-secondary btn-sm text-secondary"
                  >
                    + Warmup
                  </button>
                </div>
              </div>

              {/* Set Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '0.5rem 0.5rem', width: 45 }}>SET</th>
                      <th style={{ padding: '0.5rem 0.5rem', width: 110 }}>PREV TARGET</th>
                      <th style={{ padding: '0.5rem 0.5rem', width: 100 }}>WEIGHT ({unit})</th>
                      <th style={{ padding: '0.5rem 0.5rem', width: 85 }}>REPS</th>
                      <th style={{ padding: '0.5rem 0.5rem', width: 75 }}>RPE</th>
                      <th style={{ padding: '0.5rem 0.5rem', width: 60 }}>PLATES</th>
                      <th style={{ padding: '0.5rem 0.5rem', width: 100 }}>EST. 1RM</th>
                      <th style={{ padding: '0.5rem 0.5rem', width: 60, textAlign: 'center' }}>DONE</th>
                      <th style={{ padding: '0.5rem 0.5rem', width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionEx.sets.map((set, sIdx) => {
                      const estimated1RM = calculate1RM(set.actualWeight, set.actualReps, 'epley');

                      return (
                        <tr
                          key={set._id || sIdx}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                            backgroundColor: set.completed
                              ? 'rgba(16, 185, 129, 0.05)'
                              : set.pending
                              ? 'rgba(245, 158, 11, 0.07)'
                              : 'transparent',
                          }}
                        >
                          {/* Set # */}
                          <td style={{ padding: '0.65rem 0.5rem', fontWeight: 800 }}>
                            {set.isWarmup ? (
                              <span className="badge badge-gray text-xs" style={{ padding: '0.15rem 0.35rem' }}>W</span>
                            ) : (
                              <span className="text-secondary font-mono">{set.setNumber}</span>
                            )}
                          </td>

                          {/* Prev Target */}
                          <td style={{ padding: '0.65rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                            {set.targetWeight} {unit} × {set.targetReps}
                          </td>

                          {/* Actual Weight Input */}
                          <td style={{ padding: '0.65rem 0.5rem' }}>
                            <input
                              type="number"
                              step="0.5"
                              value={set.actualWeight || ''}
                              onChange={(e) =>
                                updateLoggedSet(exIdStr, set._id, {
                                  actualWeight: parseFloat(e.target.value) || 0,
                                })
                              }
                              style={{ width: 85, fontWeight: 700, padding: '0.4rem 0.5rem' }}
                            />
                          </td>

                          {/* Actual Reps Input */}
                          <td style={{ padding: '0.65rem 0.5rem' }}>
                            <input
                              type="number"
                              value={set.actualReps || ''}
                              onChange={(e) =>
                                updateLoggedSet(exIdStr, set._id, {
                                  actualReps: parseInt(e.target.value, 10) || 0,
                                })
                              }
                              style={{ width: 70, fontWeight: 700, padding: '0.4rem 0.5rem' }}
                            />
                          </td>

                          {/* RPE Selector */}
                          <td style={{ padding: '0.65rem 0.5rem' }}>
                            <select
                              value={set.rpe || 8}
                              onChange={(e) =>
                                updateLoggedSet(exIdStr, set._id, {
                                  rpe: parseFloat(e.target.value),
                                })
                              }
                              style={{ padding: '0.4rem 0.3rem', fontSize: '0.8rem' }}
                            >
                              <option value={6}>6</option>
                              <option value={7}>7</option>
                              <option value={7.5}>7.5</option>
                              <option value={8}>8</option>
                              <option value={8.5}>8.5</option>
                              <option value={9}>9</option>
                              <option value={9.5}>9.5</option>
                              <option value={10}>10</option>
                            </select>
                          </td>

                          {/* Plate Calculator Button */}
                          <td style={{ padding: '0.65rem 0.5rem' }}>
                            <button
                              onClick={() => openPlateModal(set.actualWeight || set.targetWeight, ex?.name)}
                              className="btn btn-secondary btn-sm"
                              title="Calculate Barbell Plates"
                              style={{ padding: '0.35rem 0.5rem' }}
                            >
                              🧮
                            </button>
                          </td>

                          {/* Live 1RM calculated */}
                          <td style={{ padding: '0.65rem 0.5rem', fontFamily: 'var(--font-mono)' }}>
                            {estimated1RM > 0 ? (
                              <span className="badge badge-amber text-xs font-bold">
                                {estimated1RM} {unit}
                              </span>
                            ) : (
                              <span className="text-muted text-xs">—</span>
                            )}
                          </td>

                          {/* Completed / Pending Button */}
                          <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                            <button
                              onClick={() => handleToggleSetDone(exIdStr, set)}
                              style={{
                                minWidth: set.pending ? 80 : 28,
                                height: 28,
                                padding: set.pending ? '0 0.4rem' : 0,
                                borderRadius: 6,
                                border: '2px solid',
                                borderColor: set.completed
                                  ? '#10b981'
                                  : set.pending
                                  ? '#f59e0b'
                                  : 'var(--border-color)',
                                backgroundColor: set.completed
                                  ? '#10b981'
                                  : set.pending
                                  ? 'rgba(245, 158, 11, 0.2)'
                                  : 'transparent',
                                color: set.completed ? '#000' : set.pending ? '#fbbf24' : 'var(--text-muted)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: set.pending ? '0.72rem' : '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                              }}
                              title={
                                set.completed
                                  ? 'Completed (Click to uncheck)'
                                  : set.pending
                                  ? `Active for ${set.actualSeconds || 0}s (Click to confirm complete now)`
                                  : 'Click to complete set'
                              }
                            >
                              {set.completed
                                ? '✓'
                                : set.pending
                                ? set.actualSeconds > 0
                                  ? `⏳ ${set.actualSeconds}s`
                                  : '⏳ Pending'
                                : ''}
                            </button>
                          </td>

                          {/* Delete Set */}
                          <td style={{ padding: '0.65rem 0.5rem' }}>
                            <button
                              onClick={() => removeSet(exIdStr, set._id)}
                              className="text-muted hover:text-red"
                              title="Delete set"
                              style={{ fontSize: '0.9rem' }}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Exercise & Session Notes Bottom Bar */}
      <div className="card mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <button
            onClick={() => setShowAddExModal(true)}
            className="btn btn-secondary"
          >
            + Add Another Exercise to Workout
          </button>

          <div className="flex items-center gap-3">
            <label className="text-xs text-secondary font-semibold">Overall Session RPE:</label>
            <select
              value={overallRpe}
              onChange={(e) => setOverallRpe(Number(e.target.value))}
              style={{ width: 80 }}
            >
              {[5, 6, 7, 8, 8.5, 9, 9.5, 10].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-secondary font-semibold block mb-1">
            Workout Notes / How Did It Feel?
          </label>
          <textarea
            rows="2"
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder="e.g. Bar speed on bench press was explosive. Triceps felt fatigued on set 3."
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Add Exercise Modal */}
      {showAddExModal && (
        <div className="modal-overlay" onClick={() => setShowAddExModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Add Exercise to Workout</h3>
              <button
                onClick={() => setShowAddExModal(false)}
                className="btn btn-secondary btn-sm"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="Search exercise library..."
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              style={{ width: '100%', marginBottom: '1rem' }}
            />

            <div className="flex flex-col gap-2" style={{ maxHeight: 350, overflowY: 'auto' }}>
              {allExercises
                .filter((ex) =>
                  ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
                  ex.primaryMuscle.toLowerCase().includes(exerciseSearch.toLowerCase())
                )
                .map((ex) => (
                  <div
                    key={ex._id}
                    className="flex items-center justify-between p-2.5 rounded card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      addExerciseToActiveWorkout(ex._id);
                      setShowAddExModal(false);
                    }}
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{ex.name}</div>
                      <div className="text-xs text-muted">{ex.primaryMuscle} • {ex.category}</div>
                    </div>
                    <button className="btn btn-primary btn-sm">+ Select</button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
