import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useWorkout } from '../context/WorkoutContext';

export const Programs = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProgName, setNewProgName] = useState('');
  const [newProgDesc, setNewProgDesc] = useState('');
  const [newProgDiff, setNewProgDiff] = useState('Intermediate');
  const [allExercises, setAllExercises] = useState([]);

  const { startWorkout } = useWorkout();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [progRes, exRes] = await Promise.all([
          api.get('/programs'),
          api.get('/exercises'),
        ]);
        if (progRes.data?.data) setPrograms(progRes.data.data);
        if (exRes.data?.data) setAllExercises(exRes.data.data);
      } catch (err) {
        console.warn('Program load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleStartWorkout = async (prog, wkt) => {
    const res = await startWorkout(prog._id, wkt._id, `${prog.name} - ${wkt.name}`);
    if (res.success) {
      navigate('/workout');
    }
  };

  const handleCreateProgram = async (e) => {
    e.preventDefault();
    if (!newProgName) return;

    try {
      const payload = {
        name: newProgName,
        description: newProgDesc,
        difficulty: newProgDiff,
        daysPerWeek: 3,
        workouts: [
          {
            name: 'Day 1 - Full Body A',
            dayNumber: 1,
            description: 'Compound lift primary day',
            exercises: allExercises.slice(0, 3).map((ex, idx) => ({
              exerciseId: ex._id,
              order: idx + 1,
              progression: {
                type: 'linear',
                weightIncrementKg: 2.5,
                targetSets: 3,
                repsMin: 5,
                repsMax: 5,
                failureThreshold: 3,
                deloadPercentage: 10,
              },
            })),
          },
        ],
      };

      const res = await api.post('/programs', payload);
      if (res.data?.data) {
        setPrograms((prev) => [res.data.data, ...prev]);
        setShowCreateModal(false);
        setNewProgName('');
        setNewProgDesc('');
      }
    } catch (err) {
      alert('Failed to create program: ' + err.message);
    }
  };

  return (
    <div className="app-container">
      {/* Top Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Workout Programs</h1>
          <p className="text-sm text-secondary mt-1">
            Periodized training templates configured with automated progressive overload algorithms.
          </p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          + Create Custom Program
        </button>
      </div>

      {/* Program Grid */}
      <div className="grid grid-cols-1 lg-grid-cols-2 gap-6">
        {programs.map((prog) => (
          <div key={prog._id} className="card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="badge badge-amber text-xs">{prog.difficulty}</span>
                <span className="text-xs text-muted font-mono">{prog.daysPerWeek} Days / Week</span>
              </div>

              <h2 className="text-xl font-black text-white mb-1.5">{prog.name}</h2>
              <p className="text-sm text-secondary mb-4">{prog.description}</p>

              {/* Workouts Breakdown */}
              <div className="flex flex-col gap-2.5 mb-4">
                {prog.workouts?.map((wkt) => (
                  <div
                    key={wkt._id}
                    className="p-3 rounded flex items-center justify-between"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{wkt.name}</div>
                      <div className="text-xs text-muted font-mono">
                        {wkt.exercises?.length || 0} Exercises configured
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartWorkout(prog, wkt)}
                      className="btn btn-primary btn-sm"
                    >
                      ▶ Start Session
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-color" style={{ borderColor: 'var(--border-color)' }}>
              <span className="text-xs text-muted">Author: {prog.author || 'RepTrack'}</span>
              <button
                onClick={() => navigate(`/programs/${prog._id}`)}
                className="text-xs text-amber font-bold"
              >
                Inspect Exercise Rules →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Program Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Create Custom Routine</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary btn-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs text-secondary font-semibold block mb-1">
                  Program Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4-Day Powerbuilding"
                  value={newProgName}
                  onChange={(e) => setNewProgName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="text-xs text-secondary font-semibold block mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Outline program goals and training split..."
                  value={newProgDesc}
                  onChange={(e) => setNewProgDesc(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="text-xs text-secondary font-semibold block mb-1">
                  Difficulty Level
                </label>
                <select
                  value={newProgDiff}
                  onChange={(e) => setNewProgDiff(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
