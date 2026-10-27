import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';

export const Dashboard = () => {
  const { user } = useAuth();
  const { activeSession, startWorkout } = useWorkout();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLiftId, setSelectedLiftId] = useState(null);
  const [programs, setPrograms] = useState([]);

  const unit = user?.settings?.unit || 'kg';

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [anaRes, progRes] = await Promise.all([
          api.get('/progression/analytics').catch(() => ({ data: { data: null } })),
          api.get('/programs').catch(() => ({ data: { data: [] } })),
        ]);

        if (anaRes.data?.data) {
          setAnalytics(anaRes.data.data);
          const trendKeys = Object.keys(anaRes.data.data.trendsByExercise || {});
          if (trendKeys.length > 0) {
            setSelectedLiftId(trendKeys[0]);
          }
        }
        if (progRes.data?.data) {
          setPrograms(progRes.data.data);
        }
      } catch (err) {
        console.warn('Dashboard data fetch warning:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleStartQuick = async () => {
    const res = await startWorkout(null, null, 'Quick Workout');
    if (res.success) navigate('/workout');
  };

  const handleStartProgramWorkout = async (prog, wkt) => {
    const res = await startWorkout(prog._id, wkt._id, `${prog.name} - ${wkt.name}`);
    if (res.success) navigate('/workout');
  };

  const currentTrend = selectedLiftId && analytics?.trendsByExercise
    ? analytics.trendsByExercise[selectedLiftId]
    : null;

  return (
    <div className="app-container">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">
            Welcome back, <span className="text-amber">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-sm text-secondary mt-1">
            Progressive overload engine is active. Track your sets, calibrate your 1RM, and smash personal records.
          </p>
        </div>

        {activeSession ? (
          <button
            onClick={() => navigate('/workout')}
            className="btn btn-primary"
            style={{ fontSize: '1rem', padding: '0.75rem 1.4rem' }}
          >
            ▶ Resume Active Session
          </button>
        ) : (
          <button
            onClick={handleStartQuick}
            className="btn btn-primary"
            style={{ fontSize: '1rem', padding: '0.75rem 1.4rem' }}
          >
            🏋️ Start Quick Workout
          </button>
        )}
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg-grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="card-header">
            <span className="text-xs text-muted uppercase font-bold tracking-wider">Completed Sessions</span>
            <span style={{ fontSize: '1.25rem' }}>🏋️</span>
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {analytics?.totalSessions || 0}
          </div>
          <div className="text-xs text-emerald font-semibold mt-1">Logged workouts</div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="text-xs text-muted uppercase font-bold tracking-wider">Total Tonnage</span>
            <span style={{ fontSize: '1.25rem' }}>🔥</span>
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {analytics?.totalVolume
              ? (analytics.totalVolume > 1000
                  ? `${(analytics.totalVolume / 1000).toFixed(1)}k`
                  : analytics.totalVolume)
              : 0}
            <span className="text-sm text-amber ml-1 font-sans">{unit}</span>
          </div>
          <div className="text-xs text-secondary mt-1">Cumulative volume lifted</div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="text-xs text-muted uppercase font-bold tracking-wider">Milestone PRs</span>
            <span style={{ fontSize: '1.25rem' }}>🏆</span>
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {analytics?.prCount || 0}
          </div>
          <div className="text-xs text-amber font-semibold mt-1">1RM records set</div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="text-xs text-muted uppercase font-bold tracking-wider">Overload Engine</span>
            <span style={{ fontSize: '1.25rem' }}>📈</span>
          </div>
          <div className="text-3xl font-black text-emerald font-mono">
            Online
          </div>
          <div className="text-xs text-secondary mt-1">Auto-progression active</div>
        </div>
      </div>

      {/* Main Analytics Row: 1RM Trends & Volume Breakdown */}
      <div className="grid grid-cols-1 lg-grid-cols-3 gap-6 mb-6">
        {/* 1RM Trend Chart (2 columns) */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div>
              <h2 className="card-title">Estimated 1RM Progression Timeline</h2>
              <p className="text-xs text-muted">
                Calculated using scientific formulas from logged working sets
              </p>
            </div>

            {/* Lift Selector Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {analytics?.trendsByExercise &&
                Object.entries(analytics.trendsByExercise).map(([id, info]) => (
                  <button
                    key={id}
                    onClick={() => setSelectedLiftId(id)}
                    className={`btn btn-sm ${
                      selectedLiftId === id ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    {info.name.replace('Barbell ', '').replace('Conventional ', '')}
                  </button>
                ))}
            </div>
          </div>

          {currentTrend && currentTrend.data?.length > 0 ? (
            <div>
              {/* SVG Line Chart */}
              <div
                style={{
                  height: 220,
                  width: '100%',
                  position: 'relative',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  borderRadius: 12,
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}
              >
                {/* SVG Visual Graph */}
                <svg
                  style={{ width: '100%', height: '100%', overflow: 'visible' }}
                  viewBox="0 0 500 160"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {(() => {
                    const dataPoints = currentTrend.data;
                    const max = Math.max(...dataPoints.map((d) => d.oneRM));
                    const min = Math.min(...dataPoints.map((d) => d.oneRM)) * 0.9;
                    const range = max - min || 1;

                    const coords = dataPoints.map((d, idx) => {
                      const x = (idx / (dataPoints.length - 1 || 1)) * 480 + 10;
                      const y = 140 - ((d.oneRM - min) / range) * 110;
                      return { x, y, ...d };
                    });

                    const pathStr = coords.reduce(
                      (acc, c, idx) => (idx === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`),
                      ''
                    );

                    const areaStr = `${pathStr} L ${coords[coords.length - 1].x} 150 L ${coords[0].x} 150 Z`;

                    return (
                      <>
                        {/* Area */}
                        <path d={areaStr} fill="url(#trendGradient)" />
                        {/* Line */}
                        <path
                          d={pathStr}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Dots */}
                        {coords.map((c, i) => (
                          <g key={i}>
                            <circle
                              cx={c.x}
                              cy={c.y}
                              r="5"
                              fill="#f59e0b"
                              stroke="#0a0d14"
                              strokeWidth="2.5"
                            />
                            <text
                              x={c.x}
                              y={c.y - 10}
                              fill="#fff"
                              fontSize="10"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {c.oneRM}
                            </text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>

                {/* X Axis Labels */}
                <div
                  className="flex items-center justify-between text-xs text-muted font-mono"
                  style={{ marginTop: 8 }}
                >
                  {currentTrend.data.map((d, i) => (
                    <span key={i}>{d.date}</span>
                  ))}
                </div>
              </div>

              {/* Stat footer */}
              <div className="flex items-center justify-between mt-3 text-xs text-secondary">
                <span>
                  Lift: <strong className="text-white">{currentTrend.name}</strong>
                </span>
                <span className="font-mono">
                  Peak Estimated 1RM:{' '}
                  <strong className="text-amber">
                    {Math.max(...currentTrend.data.map((d) => d.oneRM))} {unit}
                  </strong>
                </span>
              </div>
            </div>
          ) : (
            <div
              style={{
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
              }}
            >
              Complete workout sessions to view 1RM progression charts.
            </div>
          )}
        </div>

        {/* Muscle Volume Breakdown (1 column) */}
        <div className="card">
          <h2 className="card-title mb-1">Volume by Muscle Group</h2>
          <p className="text-xs text-muted mb-4">Cumulative distribution of total tonnage</p>

          <div className="flex flex-col gap-3">
            {analytics?.muscleVolumeMap &&
              Object.entries(analytics.muscleVolumeMap)
                .filter(([_, vol]) => vol > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([muscle, vol]) => {
                  const maxVol = Math.max(
                    ...Object.values(analytics.muscleVolumeMap)
                  );
                  const pct = maxVol > 0 ? (vol / maxVol) * 100 : 0;

                  return (
                    <div key={muscle}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-white">{muscle}</span>
                        <span className="font-mono text-secondary">
                          {vol > 1000 ? `${(vol / 1000).toFixed(1)}k` : vol} {unit}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: 'var(--bg-input)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background:
                              muscle === 'Chest'
                                ? '#f59e0b'
                                : muscle === 'Back'
                                ? '#3b82f6'
                                : muscle === 'Quads' || muscle === 'Hamstrings'
                                ? '#10b981'
                                : '#8b5cf6',
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>

      {/* Lower Row: Milestone PRs Showcase & Routine Quick Launcher */}
      <div className="grid grid-cols-1 lg-grid-cols-2 gap-6">
        {/* Personal Records Showcase */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="card-title">🏆 All-Time Personal Records</h2>
            <span className="badge badge-amber text-xs">Peak 1RM</span>
          </div>

          <div className="flex flex-col gap-2">
            {analytics?.prEvents && analytics.prEvents.length > 0 ? (
              analytics.prEvents.slice(0, 5).map((pr, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                      }}
                    >
                      🥇
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{pr.exerciseName}</div>
                      <div className="text-xs text-muted font-mono">
                        Best set: {pr.maxWeight} {unit} × {pr.maxWeightReps} reps
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div className="badge badge-amber font-mono font-black text-sm">
                      {pr.oneRM} {unit}
                    </div>
                    <div className="text-[10px] text-muted mt-0.5">
                      {new Date(pr.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">Complete sets to set your first PRs.</p>
            )}
          </div>
        </div>

        {/* Programs Quick Launch */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="card-title">📋 Scheduled Programs</h2>
            <button onClick={() => navigate('/programs')} className="text-xs text-amber font-semibold">
              Browse All →
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {programs.slice(0, 3).map((prog) => (
              <div
                key={prog._id}
                className="p-3 rounded"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white text-sm">{prog.name}</span>
                  <span className="badge badge-gray">{prog.difficulty}</span>
                </div>
                <p className="text-xs text-muted mb-2.5 line-clamp-1">{prog.description}</p>

                {/* Workouts */}
                <div className="flex items-center gap-2 flex-wrap">
                  {prog.workouts?.map((wkt) => (
                    <button
                      key={wkt._id}
                      onClick={() => handleStartProgramWorkout(prog, wkt)}
                      className="btn btn-secondary btn-sm text-xs font-semibold"
                    >
                      ▶ {wkt.name.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
