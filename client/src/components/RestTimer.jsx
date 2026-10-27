import React from 'react';
import { useWorkout } from '../context/WorkoutContext';

export const RestTimer = () => {
  const {
    restTimer,
    timerQueue,
    pauseRestTimer,
    resumeRestTimer,
    stopRestTimer,
    advanceRestTimer,
    addRestSeconds,
  } = useWorkout();

  if (!restTimer.isActive) return null;

  const minutes = Math.floor(restTimer.remainingSeconds / 60);
  const seconds = restTimer.remainingSeconds % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const pct = restTimer.totalSeconds > 0
    ? Math.max(0, Math.min(100, (restTimer.remainingSeconds / restTimer.totalSeconds) * 100))
    : 0;

  return (
    <div className="rest-timer-bar">
      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: 4,
          backgroundColor: '#1e2638',
          borderRadius: 2,
          overflow: 'hidden',
          marginBottom: '0.65rem',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
            transition: 'width 1s linear',
          }}
        />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
            }}
          >
            ⏱️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber font-bold uppercase tracking-wider">
                {restTimer.targetLabel || 'Rest Period'}
              </span>
              {timerQueue?.length > 0 && (
                <span className="badge badge-purple text-[10px] font-mono font-bold" style={{ padding: '0.1rem 0.4rem' }}>
                  +{timerQueue.length} Pending in Queue
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-black font-mono text-white tracking-tight">
                {formatted}
              </div>
              {timerQueue?.length > 0 && (
                <span className="text-xs text-secondary truncate max-w-[150px]">
                  Next: {timerQueue[0]?.targetLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* +30s */}
          <button
            onClick={() => addRestSeconds(30)}
            className="btn btn-secondary btn-sm font-mono"
            title="Add 30 seconds"
          >
            +30s
          </button>

          {/* Pause / Resume */}
          {restTimer.isPaused ? (
            <button
              onClick={resumeRestTimer}
              className="btn btn-sm btn-success"
              title="Resume timer"
            >
              ▶
            </button>
          ) : (
            <button
              onClick={pauseRestTimer}
              className="btn btn-sm btn-secondary text-amber"
              title="Pause timer"
            >
              ⏸
            </button>
          )}

          {/* Next / Skip */}
          <button
            onClick={advanceRestTimer}
            className="btn btn-sm btn-secondary font-mono text-xs"
            title={timerQueue?.length > 0 ? "Skip current rest & advance to next queued timer" : "Complete rest"}
          >
            {timerQueue?.length > 0 ? "⏭ Next" : "✓ Done"}
          </button>

          {/* Clear All */}
          <button
            onClick={stopRestTimer}
            className="btn btn-sm btn-secondary text-red"
            title="Cancel timer & clear queue"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};
