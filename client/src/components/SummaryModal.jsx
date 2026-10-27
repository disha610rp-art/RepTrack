import React from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const SummaryModal = () => {
  const { summaryModalResult, dismissSummaryModal } = useWorkout();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!summaryModalResult) return null;

  const { session, evaluation } = summaryModalResult;
  const unit = user?.settings?.unit || 'kg';

  const prEvents = evaluation?.prEvents || [];
  const recommendations = evaluation?.recommendations || [];
  const durationMinutes = Math.round((session?.durationSeconds || 0) / 60);

  const handleClose = () => {
    dismissSummaryModal();
    navigate('/');
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Celebration Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.25rem' }}>🎉 🏆 🏋️</div>
          <h2 className="text-2xl font-black text-white">Workout Complete!</h2>
          <p className="text-sm text-secondary">
            {session?.workoutName || 'Session Completed'}
          </p>
        </div>

        {/* High Level Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <span className="text-xs text-secondary uppercase font-bold tracking-wider">Total Volume</span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {session?.totalVolume || evaluation?.totalVolume || 0} <span className="text-sm text-amber">{unit}</span>
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <span className="text-xs text-secondary uppercase font-bold tracking-wider">Duration</span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {durationMinutes} <span className="text-sm text-amber">min</span>
            </div>
          </div>
        </div>

        {/* Milestone PRs (if any) */}
        {prEvents.length > 0 && (
          <div className="card" style={{ borderColor: 'var(--amber)', marginBottom: '1rem' }}>
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontSize: '1.25rem' }}>🥇</span>
              <span className="text-sm font-black text-amber uppercase tracking-wider">
                New Personal Records ({prEvents.length})
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {prEvents.map((pr, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded"
                  style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
                >
                  <div>
                    <div className="font-bold text-white text-sm">{pr.exerciseName}</div>
                    <div className="text-xs text-muted">
                      Lifted: {pr.weight} {unit} × {pr.reps} reps
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="badge badge-amber font-mono font-bold">
                      Est. 1RM: {pr.new1RM} {unit}
                    </div>
                    {pr.previous1RM > 0 && (
                      <div className="text-xs text-emerald font-semibold mt-0.5">
                        +{Math.round((pr.new1RM - pr.previous1RM) * 10) / 10} {unit} jump!
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progressive Overload Engine Recommendations */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-white">
              📈 Progressive Overload Next Targets
            </span>
            <span className="badge badge-purple text-xs">Engine Engine</span>
          </div>

          {recommendations.length === 0 ? (
            <p className="text-sm text-muted">Workout logged. Continue consistent progressive sets.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recommendations.map((rec, idx) => {
                const isOverload = rec.status === 'progressed';
                const isDeload = rec.status === 'deload_applied';

                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded"
                    style={{
                      backgroundColor: isOverload
                        ? 'rgba(16, 185, 129, 0.08)'
                        : isDeload
                        ? 'rgba(239, 68, 68, 0.08)'
                        : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${
                        isOverload
                          ? 'rgba(16, 185, 129, 0.25)'
                          : isDeload
                          ? 'rgba(239, 68, 68, 0.25)'
                          : 'var(--border-color)'
                      }`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-sm">{rec.exerciseName}</span>
                      <span
                        className={`badge ${
                          isOverload
                            ? 'badge-emerald'
                            : isDeload
                            ? 'badge-amber'
                            : 'badge-gray'
                        }`}
                      >
                        {isOverload ? 'Overload Triggered' : isDeload ? 'Deload Reset' : 'Maintain'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs mb-1 font-mono">
                      <span className="text-secondary">
                        Next Weight:{' '}
                        <strong className="text-white">
                          {rec.newWeight} {unit}
                        </strong>
                      </span>
                      <span className="text-secondary">
                        Next Target Reps:{' '}
                        <strong className="text-white">{rec.newReps} reps</strong>
                      </span>
                    </div>

                    <p className="text-xs text-muted">{rec.reason}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <button onClick={handleClose} className="btn btn-primary" style={{ width: '100%' }}>
            View Dashboard & Trends
          </button>
        </div>
      </div>
    </div>
  );
};
