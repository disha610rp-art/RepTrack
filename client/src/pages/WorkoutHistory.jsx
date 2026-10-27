import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const WorkoutHistory = () => {
  const { user } = useAuth();
  const unit = user?.settings?.unit || 'kg';

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.get('/sessions');
        if (res.data?.data) setSessions(res.data.data);
      } catch (err) {
        console.warn('History load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this completed workout log?')) {
      try {
        await api.delete(`/sessions/${id}`);
        setSessions((prev) => prev.filter((s) => s._id !== id));
      } catch (err) {
        alert('Failed to delete workout session: ' + err.message);
      }
    }
  };

  const exportCSV = () => {
    if (sessions.length === 0) return alert('No sessions to export.');

    let csvContent = 'Date,Workout Name,Duration (min),Total Volume,Exercise,Set,Weight,Reps,RPE,Est 1RM\n';

    sessions.forEach((sess) => {
      const date = new Date(sess.completedAt || sess.startedAt).toISOString().split('T')[0];
      const dur = Math.round((sess.durationSeconds || 0) / 60);

      sess.exercises.forEach((ex) => {
        const exName = (ex.exerciseId?.name || 'Exercise').replace(/,/g, '');
        ex.sets.forEach((s) => {
          csvContent += `"${date}","${sess.workoutName}",${dur},${sess.totalVolume},"${exName}",${s.setNumber},${s.actualWeight},${s.actualReps},${s.rpe || ''},${s.calculated1RM || ''}\n`;
        });
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reptrack_workout_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Workout History & Logs</h1>
          <p className="text-sm text-secondary mt-1">
            Complete training diary with set breakdowns, volume tracking, and estimated 1RM calculations.
          </p>
        </div>

        <button onClick={exportCSV} className="btn btn-secondary">
          📥 Export CSV Training Diary
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📜</div>
          <h3 className="text-lg font-bold text-white mb-1">No Completed Sessions Yet</h3>
          <p className="text-sm text-muted">Complete workouts to review your logs and history.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sessions.map((sess) => {
            const isExpanded = expandedId === sess._id;
            const completedDate = new Date(sess.completedAt || sess.startedAt).toLocaleDateString(
              'en-US',
              {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }
            );
            const durationMins = Math.round((sess.durationSeconds || 0) / 60);

            return (
              <div
                key={sess._id}
                className="card"
                style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                onClick={() => setExpandedId(isExpanded ? null : sess._id)}
              >
                {/* Header Summary Row */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-amber font-mono font-bold">{completedDate}</span>
                      <span className="badge badge-gray font-mono">{durationMins} min</span>
                      {sess.overallRpe && (
                        <span className="badge badge-purple text-xs">RPE {sess.overallRpe}</span>
                      )}
                    </div>
                    <h2 className="text-xl font-black text-white">{sess.workoutName}</h2>
                  </div>

                  <div className="flex items-center gap-4">
                    <div style={{ textAlign: 'right' }}>
                      <span className="text-[10px] text-muted uppercase font-bold tracking-wider block">
                        Volume
                      </span>
                      <span className="text-lg font-black text-white font-mono">
                        {sess.totalVolume} <span className="text-xs text-amber font-sans">{sess.unit || unit}</span>
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDelete(sess._id, e)}
                      className="btn btn-secondary btn-icon text-muted hover:text-red"
                      title="Delete log"
                    >
                      🗑️
                    </button>

                    <span className="text-amber font-bold" style={{ fontSize: '1.25rem' }}>
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {sess.notes && (
                  <p className="text-xs text-secondary mt-2 italic">“{sess.notes}”</p>
                )}

                {/* Expanded Sets Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-color flex flex-col gap-4" style={{ borderColor: 'var(--border-color)' }}>
                    {sess.exercises.map((exItem, exI) => (
                      <div
                        key={exI}
                        className="p-3 rounded"
                        style={{ backgroundColor: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)' }}
                      >
                        <div className="font-bold text-white text-sm mb-2">
                          {exItem.exerciseId?.name || 'Exercise'}
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                <th style={{ padding: '0.25rem 0.5rem' }}>SET</th>
                                <th style={{ padding: '0.25rem 0.5rem' }}>WEIGHT</th>
                                <th style={{ padding: '0.25rem 0.5rem' }}>REPS</th>
                                <th style={{ padding: '0.25rem 0.5rem' }}>RPE</th>
                                <th style={{ padding: '0.25rem 0.5rem' }}>EST. 1RM</th>
                              </tr>
                            </thead>
                            <tbody>
                              {exItem.sets.map((s, sI) => (
                                <tr key={sI} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                  <td style={{ padding: '0.35rem 0.5rem', fontWeight: 700 }}>
                                    {s.isWarmup ? <span className="badge badge-gray text-[10px]">Warmup</span> : s.setNumber}
                                  </td>
                                  <td style={{ padding: '0.35rem 0.5rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                                    {s.actualWeight} {sess.unit || unit}
                                  </td>
                                  <td style={{ padding: '0.35rem 0.5rem', fontFamily: 'var(--font-mono)' }}>
                                    {s.actualReps}
                                  </td>
                                  <td style={{ padding: '0.35rem 0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                                    {s.rpe ? `RPE ${s.rpe}` : '—'}
                                  </td>
                                  <td style={{ padding: '0.35rem 0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--amber)', fontWeight: 800 }}>
                                    {s.calculated1RM ? `${s.calculated1RM} ${sess.unit || unit}` : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
