import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { calculatePlates, generateWarmupSets } from '../utils/plateCalculator';
import { compareAllFormulas, getPercentageLoadTable, getRepMaxTable } from '../utils/oneRepMax';
import { BarbellGraphic } from '../components/BarbellGraphic';

export const CalculatorSuite = () => {
  const { user } = useAuth();
  const unit = user?.settings?.unit || 'kg';
  const defaultBarWeight = unit === 'lbs' ? 45 : 20;

  const [activeTab, setActiveTab] = useState('plates'); // 'plates' | 'onerm'

  // Plate Calculator State
  const [targetWeight, setTargetWeight] = useState(100);
  const [barWeight, setBarWeight] = useState(defaultBarWeight);

  // 1RM Calculator State
  const [liftWeight, setLiftWeight] = useState(80);
  const [liftReps, setLiftReps] = useState(5);

  // Plate Calculations
  const plateResult = calculatePlates(Number(targetWeight) || defaultBarWeight, barWeight);
  const warmupLadder = generateWarmupSets(Number(targetWeight) || defaultBarWeight, barWeight);

  // 1RM Calculations
  const formulaResults = compareAllFormulas(Number(liftWeight) || 0, Number(liftReps) || 0);
  const repMaxTable = getRepMaxTable(formulaResults.epley);
  const percentageTable = getPercentageLoadTable(formulaResults.epley);

  return (
    <div className="app-container">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Barbell & 1RM Calculator Suite</h1>
          <p className="text-sm text-secondary mt-1">
            Sports-science calculation suite for barbell loading mathematics and one-rep-max estimations.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-color" style={{ backgroundColor: 'var(--bg-card)' }}>
          <button
            onClick={() => setActiveTab('plates')}
            className={`btn btn-sm ${activeTab === 'plates' ? 'btn-primary' : 'btn-secondary'}`}
          >
            🏋️ Barbell Plates
          </button>
          <button
            onClick={() => setActiveTab('onerm')}
            className={`btn btn-sm ${activeTab === 'onerm' ? 'btn-primary' : 'btn-secondary'}`}
          >
            🧮 1RM Formulas & Percentages
          </button>
        </div>
      </div>

      {activeTab === 'plates' ? (
        /* BARBELL PLATE CALCULATOR */
        <div className="flex flex-col gap-6">
          {/* Controls Card */}
          <div className="card">
            <div className="grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-3 gap-4 items-end">
              {/* Target Weight */}
              <div>
                <label className="text-xs text-secondary font-semibold block mb-1">
                  Target Working Weight ({unit})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', fontSize: '1.25rem', fontWeight: 800 }}
                  />
                  <button
                    onClick={() => setTargetWeight((prev) => Math.max(barWeight, prev - 2.5))}
                    className="btn btn-secondary"
                  >
                    -2.5
                  </button>
                  <button
                    onClick={() => setTargetWeight((prev) => prev + 2.5)}
                    className="btn btn-secondary"
                  >
                    +2.5
                  </button>
                </div>
              </div>

              {/* Bar Weight */}
              <div>
                <label className="text-xs text-secondary font-semibold block mb-1">
                  Barbell Specification
                </label>
                <select
                  value={barWeight}
                  onChange={(e) => setBarWeight(parseFloat(e.target.value))}
                  style={{ width: '100%', fontWeight: 600 }}
                >
                  <option value={20}>Standard Olympic Bar (20 {unit})</option>
                  <option value={15}>Women's / Technique Bar (15 {unit})</option>
                  <option value={45}>Standard 45lb Bar (45 {unit})</option>
                  <option value={10}>Light / EZ Bar (10 {unit})</option>
                </select>
              </div>

              {/* Weight Per Side Summary */}
              <div
                style={{
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.65rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">
                    Weight Each Side
                  </span>
                  <span className="text-xl font-black text-amber font-mono">
                    {plateResult.weightPerSide} {unit}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">
                    Total Achieved
                  </span>
                  <span className="text-xl font-black text-white font-mono">
                    {plateResult.totalAchievedWeight} {unit}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Barbell Graphic */}
          <div className="card">
            <h2 className="card-title mb-3">Barbell Sleeve Loading Visualizer</h2>
            <BarbellGraphic
              platesPerSide={plateResult.platesPerSide}
              barWeight={barWeight}
              unit={unit}
            />

            {/* Plates Breakdown Badges */}
            <div className="mt-4 pt-4 border-t border-color" style={{ borderColor: 'var(--border-color)' }}>
              <span className="text-xs text-secondary font-bold uppercase tracking-wider block mb-2">
                Plates Needed on EACH Side:
              </span>
              {plateResult.platesPerSide.length === 0 ? (
                <p className="text-sm text-muted italic">Empty barbell.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {plateResult.platesPerSide.map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: p.color,
                        color: p.textColor,
                        padding: '0.45rem 0.9rem',
                        borderRadius: 8,
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      }}
                    >
                      <span>{p.weight} {unit}</span>
                      <span style={{ opacity: 0.85, fontSize: '0.8rem' }}>× {p.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Warmup Ladder */}
          <div className="card">
            <h2 className="card-title mb-1">Recommended Warm-Up Ladder</h2>
            <p className="text-xs text-muted mb-4">
              Scientific ramping sets before attempting working load ({targetWeight} {unit})
            </p>

            <div className="grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-4 gap-3">
              {warmupLadder.map((ws, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="badge badge-gray font-mono">Set {idx + 1}</span>
                    <span className="text-xs text-amber font-mono font-bold">{ws.percentage}%</span>
                  </div>
                  <div className="text-xl font-black text-white font-mono my-1">
                    {ws.weight} {unit} <span className="text-xs text-secondary font-sans">× {ws.reps} reps</span>
                  </div>
                  <p className="text-xs text-muted">{ws.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* 1RM CALCULATOR & REP-MAX TABLES */
        <div className="flex flex-col gap-6">
          {/* Inputs */}
          <div className="card">
            <div className="grid grid-cols-1 sm-grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-xs text-secondary font-semibold block mb-1">
                  Weight Lifted ({unit})
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={liftWeight}
                  onChange={(e) => setLiftWeight(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', fontSize: '1.25rem', fontWeight: 800 }}
                />
              </div>

              <div>
                <label className="text-xs text-secondary font-semibold block mb-1">
                  Repetitions Completed
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={liftReps}
                  onChange={(e) => setLiftReps(parseInt(e.target.value, 10) || 1)}
                  style={{ width: '100%', fontSize: '1.25rem', fontWeight: 800 }}
                />
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid var(--amber)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.65rem 1rem',
                  textAlign: 'center',
                }}
              >
                <span className="text-[10px] text-amber font-black uppercase tracking-wider block">
                  Calculated One-Rep Max
                </span>
                <span className="text-2xl font-black text-white font-mono">
                  {formulaResults.epley} <span className="text-sm text-amber font-sans">{unit}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Formula Comparison Grid */}
          <div className="card">
            <h2 className="card-title mb-1">Scientific 1RM Formulas Compared</h2>
            <p className="text-xs text-muted mb-4">
              Peer-reviewed formulas from exercise physiology literature
            </p>

            <div className="grid grid-cols-2 sm-grid-cols-3 lg-grid-cols-4 gap-3">
              {[
                { name: 'Epley Formula (1985)', val: formulaResults.epley, formula: 'w × (1 + r/30)' },
                { name: 'Brzycki Formula (1993)', val: formulaResults.brzycki, formula: 'w × (36 / (37 - r))' },
                { name: 'Lombardi (1989)', val: formulaResults.lombardi, formula: 'w × r^0.10' },
                { name: 'Mayhew et al. (1992)', val: formulaResults.mayhew, formula: '100w / (52.2 + 41.9e^-0.055r)' },
                { name: 'O\'Conner et al. (1989)', val: formulaResults.oconner, formula: 'w × (1 + 0.025r)' },
                { name: 'Wathen (1994)', val: formulaResults.wathen, formula: '100w / (48.8 + 53.8e^-0.075r)' },
                { name: 'Scientific Average Blend', val: formulaResults.average, formula: 'Mean of all 6 formulas' },
              ].map((f, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span className="text-xs font-bold text-white block">{f.name}</span>
                  <span className="text-xl font-black text-amber font-mono my-1 block">
                    {f.val} {unit}
                  </span>
                  <span className="text-[10px] text-muted font-mono">{f.formula}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rep-Max Table & Training Percentages */}
          <div className="grid grid-cols-1 lg-grid-cols-2 gap-6">
            {/* Rep Max Estimates Table */}
            <div className="card">
              <h2 className="card-title mb-1">Estimated Rep-Max Table</h2>
              <p className="text-xs text-muted mb-3">Calculated maximum weight for various rep targets</p>

              <table style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.4rem 0', textAlign: 'left' }}>TARGET</th>
                    <th style={{ padding: '0.4rem 0', textAlign: 'center' }}>% OF 1RM</th>
                    <th style={{ padding: '0.4rem 0', textAlign: 'right' }}>ESTIMATED LOAD</th>
                  </tr>
                </thead>
                <tbody>
                  {repMaxTable.map((row) => (
                    <tr key={row.reps} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '0.45rem 0', fontWeight: 700, color: '#fff' }}>
                        {row.reps} Rep Max ({row.reps}RM)
                      </td>
                      <td style={{ padding: '0.45rem 0', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {row.percentage}%
                      </td>
                      <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 800, color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
                        {row.weight} {unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Training Load Percentages */}
            <div className="card">
              <h2 className="card-title mb-1">Training Load Percentages</h2>
              <p className="text-xs text-muted mb-3">Common training zone percentages for programming</p>

              <table style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.4rem 0', textAlign: 'left' }}>ZONE %</th>
                    <th style={{ padding: '0.4rem 0', textAlign: 'center' }}>TRAINING OBJECTIVE</th>
                    <th style={{ padding: '0.4rem 0', textAlign: 'right' }}>TARGET WEIGHT</th>
                  </tr>
                </thead>
                <tbody>
                  {percentageTable.map((p) => {
                    let desc = 'Hypertrophy / Volume';
                    if (p.percentage >= 90) desc = 'Absolute Maximal Strength';
                    else if (p.percentage >= 80) desc = 'Heavy Strength Work';
                    else if (p.percentage >= 70) desc = 'Hypertrophy / Power';
                    else desc = 'Endurance / Technique';

                    return (
                      <tr key={p.percentage} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '0.45rem 0', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                          {p.percentage}%
                        </td>
                        <td style={{ padding: '0.45rem 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          {desc}
                        </td>
                        <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 800, color: 'var(--emerald)', fontFamily: 'var(--font-mono)' }}>
                          {p.weight} {unit}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
