import React, { useState, useEffect } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { calculatePlates, generateWarmupSets } from '../utils/plateCalculator';
import { BarbellGraphic } from './BarbellGraphic';

export const PlateModal = () => {
  const { plateModal, closePlateModal } = useWorkout();
  const { user } = useAuth();

  const unit = user?.settings?.unit || 'kg';
  const defaultBarWeight = unit === 'lbs' ? user?.settings?.barWeightLbs || 45 : user?.settings?.barWeightKg || 20;

  const [weight, setWeight] = useState(plateModal.targetWeight || 60);
  const [barWeight, setBarWeight] = useState(defaultBarWeight);

  useEffect(() => {
    if (plateModal.targetWeight) {
      setWeight(plateModal.targetWeight);
    }
  }, [plateModal.targetWeight]);

  if (!plateModal.isOpen) return null;

  const result = calculatePlates(Number(weight) || defaultBarWeight, barWeight);
  const warmupSets = generateWarmupSets(Number(weight) || defaultBarWeight, barWeight);

  return (
    <div className="modal-overlay" onClick={closePlateModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
          <div>
            <div className="text-xs text-amber font-bold uppercase tracking-wider">
              Barbell Loading Helper
            </div>
            <h2 className="text-xl font-black text-white">
              {plateModal.exerciseName ? `${plateModal.exerciseName} — Plate Math` : 'Plate Calculator'}
            </h2>
          </div>
          <button
            onClick={closePlateModal}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '1rem', padding: '0.35rem 0.6rem' }}
          >
            ✕
          </button>
        </div>

        {/* Input & Quick Adjusters */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <label className="text-xs text-secondary font-semibold block mb-1">
                Target Weight ({unit})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  style={{ width: 120, fontSize: '1.25rem', fontWeight: 800 }}
                />
                <button
                  onClick={() => setWeight((prev) => Math.max(barWeight, prev - 2.5))}
                  className="btn btn-secondary btn-sm"
                >
                  -2.5
                </button>
                <button
                  onClick={() => setWeight((prev) => prev + 2.5)}
                  className="btn btn-secondary btn-sm"
                >
                  +2.5
                </button>
                <button
                  onClick={() => setWeight((prev) => prev + 5)}
                  className="btn btn-secondary btn-sm"
                >
                  +5
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-secondary font-semibold block mb-1">
                Barbell Weight
              </label>
              <select
                value={barWeight}
                onChange={(e) => setBarWeight(parseFloat(e.target.value))}
                style={{ fontWeight: 600 }}
              >
                <option value={20}>Standard Olympic Bar (20 {unit})</option>
                <option value={15}>Women's / Technique Bar (15 {unit})</option>
                <option value={45}>Standard 45lb Bar (45 {unit})</option>
                <option value={10}>Light / EZ Bar (10 {unit})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Visual Barbell Graphic */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div className="text-xs text-secondary font-semibold mb-2">Visual Barbell Sleeve</div>
          <BarbellGraphic
            platesPerSide={result.platesPerSide}
            barWeight={barWeight}
            unit={unit}
          />
        </div>

        {/* Plates Needed Per Side Summary */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-white">Plates Needed Per Side:</span>
            <span className="badge badge-emerald font-mono">
              Load: {result.weightPerSide} {unit} / side
            </span>
          </div>

          {result.platesPerSide.length === 0 ? (
            <p className="text-sm text-muted italic">Just the empty barbell ({barWeight} {unit}).</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {result.platesPerSide.map((plate, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: plate.color,
                    color: plate.textColor,
                    padding: '0.4rem 0.8rem',
                    borderRadius: 8,
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>{plate.weight} {unit}</span>
                  <span style={{ opacity: 0.85, fontSize: '0.75rem' }}>× {plate.count}</span>
                </div>
              ))}
            </div>
          )}

          {!result.isExact && (
            <div className="text-xs text-amber mt-2">
              ⚠️ Note: Leftover remainder of {result.remainder} {unit} cannot be loaded with standard plates.
            </div>
          )}
        </div>

        {/* Warmup Sets Ladder */}
        <div>
          <h4 className="text-sm font-bold text-white mb-2">Warm-Up Sets Ladder</h4>
          <div className="flex flex-col gap-1.5">
            {warmupSets.map((ws, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.825rem',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="badge badge-gray font-mono">Set {idx + 1}</span>
                  <span className="font-bold text-white font-mono">{ws.weight} {unit}</span>
                  <span className="text-secondary font-mono">× {ws.reps} reps</span>
                </div>
                <span className="text-xs text-muted">{ws.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-4">
          <button onClick={closePlateModal} className="btn btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
