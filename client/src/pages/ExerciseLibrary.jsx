import React, { useState, useEffect } from 'react';
import api from '../services/api';

export const ExerciseLibrary = () => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All');
  const [selectedEquipment, setSelectedEquipment] = useState('All');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseDetails, setExerciseDetails] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Exercise Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Barbell');
  const [newPrimaryMuscle, setNewPrimaryMuscle] = useState('Chest');
  const [newInstructions, setNewInstructions] = useState('');
  const [newRest, setNewRest] = useState(120);

  const muscles = ['All', 'Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings', 'Arms', 'Core'];
  const equipment = ['All', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight'];

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.get('/exercises');
        if (res.data?.data) setExercises(res.data.data);
      } catch (err) {
        console.warn('Exercise fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSelectExercise = async (ex) => {
    setSelectedExercise(ex);
    try {
      const res = await api.get(`/exercises/${ex._id}`);
      if (res.data) setExerciseDetails(res.data);
    } catch (err) {
      console.warn('Exercise detail fetch error:', err);
    }
  };

  const handleCreateExercise = async (e) => {
    e.preventDefault();
    if (!newName) return;
    try {
      const payload = {
        name: newName,
        category: newCategory,
        primaryMuscle: newPrimaryMuscle,
        instructions: newInstructions,
        defaultRestSeconds: Number(newRest) || 120,
        defaultProgression: {
          type: 'double',
          weightIncrementKg: 2.5,
          weightIncrementLbs: 5,
          targetSets: 3,
          repsMin: 8,
          repsMax: 12,
          failureThreshold: 3,
          deloadPercentage: 10,
        },
      };

      const res = await api.post('/exercises', payload);
      if (res.data?.data) {
        setExercises((prev) => [res.data.data, ...prev]);
        setShowCreateModal(false);
        setNewName('');
        setNewInstructions('');
      }
    } catch (err) {
      alert('Failed to create exercise: ' + err.message);
    }
  };

  const filtered = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle =
      selectedMuscle === 'All' ||
      ex.primaryMuscle === selectedMuscle ||
      (selectedMuscle === 'Arms' && (ex.primaryMuscle === 'Biceps' || ex.primaryMuscle === 'Triceps'));
    const matchesEquipment =
      selectedEquipment === 'All' || ex.category === selectedEquipment;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  return (
    <div className="app-container">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Exercise Movement Library</h1>
          <p className="text-sm text-secondary mt-1">
            Reference database with biomechanics instructions, target rest periods, and progression rules.
          </p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          + Add Custom Exercise
        </button>
      </div>

      {/* Filters Card */}
      <div className="card mb-6">
        {/* Search */}
        <input
          type="text"
          placeholder="Search by exercise name (e.g. Bench Press, Squat, Lat Pulldown)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', marginBottom: '1rem' }}
        />

        {/* Muscle Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <span className="text-xs text-muted uppercase font-bold mr-2">Muscle:</span>
          {muscles.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMuscle(m)}
              className={`btn btn-sm ${selectedMuscle === m ? 'btn-primary' : 'btn-secondary'}`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Equipment Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted uppercase font-bold mr-2">Equipment:</span>
          {equipment.map((eq) => (
            <button
              key={eq}
              onClick={() => setSelectedEquipment(eq)}
              className={`btn btn-sm ${selectedEquipment === eq ? 'btn-primary' : 'btn-secondary'}`}
            >
              {eq}
            </button>
          ))}
        </div>
      </div>

      {/* Exercises Grid */}
      <div className="grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-3 gap-4">
        {filtered.map((ex) => (
          <div
            key={ex._id}
            onClick={() => handleSelectExercise(ex)}
            className="card flex flex-col justify-between"
            style={{ cursor: 'pointer' }}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="badge badge-amber text-xs">{ex.primaryMuscle}</span>
                <span className="badge badge-gray text-xs">{ex.category}</span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{ex.name}</h3>
              <p className="text-xs text-secondary line-clamp-2 mb-3">
                {ex.instructions || 'No special notes recorded.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-color text-xs text-muted font-mono" style={{ borderColor: 'var(--border-color)' }}>
              <span>Rest: {ex.defaultRestSeconds}s</span>
              <span className="text-amber font-semibold">View Details →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div className="modal-overlay" onClick={() => setSelectedExercise(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="badge badge-amber text-xs mb-1">{selectedExercise.primaryMuscle}</span>
                <h2 className="text-xl font-black text-white">{selectedExercise.name}</h2>
              </div>
              <button onClick={() => setSelectedExercise(null)} className="btn btn-secondary btn-sm">
                ✕
              </button>
            </div>

            {/* Biomechanics & Instructions */}
            <div className="card mb-4">
              <h4 className="text-xs text-secondary font-bold uppercase tracking-wider mb-1.5">
                Execution Instructions
              </h4>
              <p className="text-sm text-white mb-3">
                {selectedExercise.instructions || 'Standard movement execution.'}
              </p>

              {selectedExercise.tips?.length > 0 && (
                <div>
                  <h4 className="text-xs text-amber font-bold uppercase tracking-wider mb-1">
                    Coaching Cues:
                  </h4>
                  <ul className="text-xs text-secondary list-disc pl-4 flex flex-col gap-1">
                    {selectedExercise.tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Progression Scheme */}
            <div className="card mb-4">
              <h4 className="text-xs text-secondary font-bold uppercase tracking-wider mb-2">
                Configured Progression Scheme
              </h4>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="badge badge-purple">
                  {selectedExercise.defaultProgression?.type || 'Linear'}
                </span>
                <span>
                  Increment: +{selectedExercise.defaultProgression?.weightIncrementKg || 2.5}kg
                </span>
                <span>
                  Target: {selectedExercise.defaultProgression?.targetSets || 3} sets × {selectedExercise.defaultProgression?.repsMin || 5} reps
                </span>
              </div>
            </div>

            {/* Historical 1RM Trend (if available) */}
            {exerciseDetails?.history?.length > 0 && (
              <div className="card mb-4">
                <h4 className="text-xs text-secondary font-bold uppercase tracking-wider mb-2">
                  Session History & Peak 1RM
                </h4>
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                  {exerciseDetails.history.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs p-1.5 rounded"
                      style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                    >
                      <span className="text-muted">{new Date(h.date).toLocaleDateString()}</span>
                      <span className="font-mono text-white font-bold">Max: {h.maxWeight}kg</span>
                      <span className="badge badge-amber font-mono">Est 1RM: {h.max1RM}kg</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={() => setSelectedExercise(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Exercise Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Create Custom Exercise</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary btn-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExercise} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs text-secondary font-semibold block mb-1">
                  Exercise Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bulgarian Split Squat"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary font-semibold block mb-1">
                    Primary Muscle Group
                  </label>
                  <select
                    value={newPrimaryMuscle}
                    onChange={(e) => setNewPrimaryMuscle(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    {muscles.filter((m) => m !== 'All').map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-secondary font-semibold block mb-1">
                    Equipment Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    {equipment.filter((eq) => eq !== 'All').map((eq) => (
                      <option key={eq} value={eq}>
                        {eq}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-secondary font-semibold block mb-1">
                  Default Rest Time (Seconds)
                </label>
                <input
                  type="number"
                  value={newRest}
                  onChange={(e) => setNewRest(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="text-xs text-secondary font-semibold block mb-1">
                  Execution Instructions & Cues
                </label>
                <textarea
                  rows="3"
                  placeholder="Stance, grip, movement pattern tips..."
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Exercise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
