import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useWorkout } from '../context/WorkoutContext';

export const ProgramDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { startWorkout } = useWorkout();

  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.get(`/programs/${id}`);
        if (res.data?.data) setProgram(res.data.data);
      } catch (err) {
        console.error('Failed to load program:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p className="text-secondary">Loading routine details...</p>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h2 className="text-xl font-bold text-white mb-2">Program Not Found</h2>
        <button onClick={() => navigate('/programs')} className="btn btn-secondary">
          Back to Programs
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/programs')}
          className="text-xs text-secondary hover:text-white font-semibold mb-2"
        >
          ← Back to Programs
        </button>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-amber">{program.difficulty}</span>
              <span className="badge badge-gray font-mono">{program.daysPerWeek} Days / Week</span>
            </div>
            <h1 className="text-3xl font-black text-white">{program.name}</h1>
            <p className="text-sm text-secondary mt-1">{program.description}</p>
          </div>
        </div>
      </div>

      {/* Workouts Breakdown */}
      <div className="flex flex-col gap-6">
        {program.workouts?.map((wkt, wIdx) => (
          <div key={wkt._id || wIdx} className="card">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4 pb-3 border-b border-color" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <span className="text-xs text-amber font-mono font-bold uppercase tracking-wider">
                  Day {wkt.dayNumber}
                </span>
                <h2 className="text-xl font-black text-white">{wkt.name}</h2>
                {wkt.description && <p className="text-xs text-muted mt-0.5">{wkt.description}</p>}
              </div>

              <button
                onClick={() => {
                  startWorkout(program._id, wkt._id, `${program.name} - ${wkt.name}`);
                  navigate('/workout');
                }}
                className="btn btn-primary"
              >
                ▶ Start Workout Day
              </button>
            </div>

            {/* Exercise List */}
            <div className="flex flex-col gap-3">
              {wkt.exercises?.map((pe, pIdx) => {
                const ex = pe.exerciseId;
                const prog = pe.progression || {};

                return (
                  <div
                    key={pe._id || pIdx}
                    className="p-3 rounded"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-gray font-mono">{pe.order || pIdx + 1}</span>
                        <span className="font-bold text-white text-base">{ex?.name || 'Exercise'}</span>
                        <span className="badge badge-amber text-xs">{ex?.primaryMuscle}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="badge badge-purple font-mono text-xs">
                          {prog.targetSets || 3} Sets × {prog.repsMin || 5}{prog.repsMax !== prog.repsMin ? `-${prog.repsMax}` : ''} Reps
                        </span>
                        <span className="badge badge-emerald text-xs font-mono">
                          +{prog.weightIncrementKg || 2.5}kg increment
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted mt-1.5 font-mono">
                      <span>Rest: {ex?.defaultRestSeconds || 120}s</span>
                      <span>Deload: {prog.deloadPercentage || 10}% after {prog.failureThreshold || 3} misses</span>
                      {pe.notes && <span className="text-amber">Tip: {pe.notes}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
