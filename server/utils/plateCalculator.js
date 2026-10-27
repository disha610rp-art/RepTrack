/**
 * Barbell Plate Loading Calculator
 */

export const STANDARD_KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
export const STANDARD_LBS_PLATES = [45, 35, 25, 10, 5, 2.5];

export const PLATE_COLOR_MAP = {
  // KG Plates
  25: { color: '#dc2626', textColor: '#ffffff', height: 110, name: '25kg Red' },
  20: { color: '#2563eb', textColor: '#ffffff', height: 104, name: '20kg Blue' },
  15: { color: '#eab308', textColor: '#0f172a', height: 95, name: '15kg Yellow' },
  10: { color: '#16a34a', textColor: '#ffffff', height: 85, name: '10kg Green' },
  5: { color: '#e2e8f0', textColor: '#0f172a', height: 70, name: '5kg White' },
  2.5: { color: '#1e293b', textColor: '#ffffff', height: 60, name: '2.5kg Black' },
  1.25: { color: '#94a3b8', textColor: '#0f172a', height: 48, name: '1.25kg Silver' },

  // LBS Plates
  45: { color: '#2563eb', textColor: '#ffffff', height: 110, name: '45lb Blue' },
  35: { color: '#eab308', textColor: '#0f172a', height: 95, name: '35lb Yellow' },
};

export function calculatePlates(targetWeight, barWeight = 20, availablePlates = STANDARD_KG_PLATES) {
  if (targetWeight <= barWeight) {
    return {
      targetWeight,
      barWeight,
      platesPerSide: [],
      totalAchievedWeight: barWeight,
      weightPerSide: 0,
      remainder: 0,
      isExact: targetWeight === barWeight,
    };
  }

  const weightNeeded = targetWeight - barWeight;
  let remainingPerSide = weightNeeded / 2;
  const sortedPlates = [...availablePlates].sort((a, b) => b - a);

  const plateCounts = {};
  for (const plate of sortedPlates) {
    if (plate <= 0) continue;
    const count = Math.floor(remainingPerSide / plate);
    if (count > 0) {
      plateCounts[plate] = count;
      remainingPerSide = Math.round((remainingPerSide - count * plate) * 100) / 100;
    }
  }

  const platesPerSide = [];
  for (const plate of sortedPlates) {
    const count = plateCounts[plate] || 0;
    if (count > 0) {
      const meta = PLATE_COLOR_MAP[plate] || {
        color: '#475569',
        textColor: '#ffffff',
        height: 60,
        name: `${plate} plate`,
      };
      platesPerSide.push({
        weight: plate,
        count,
        color: meta.color,
        textColor: meta.textColor,
        heightPx: meta.height,
        name: meta.name,
      });
    }
  }

  const achievedPerSide = platesPerSide.reduce((acc, p) => acc + p.weight * p.count, 0);
  const totalAchieved = barWeight + achievedPerSide * 2;
  const remainder = Math.round((targetWeight - totalAchieved) * 10) / 10;

  return {
    targetWeight,
    barWeight,
    platesPerSide,
    totalAchievedWeight: Math.round(totalAchieved * 10) / 10,
    weightPerSide: Math.round(achievedPerSide * 10) / 10,
    remainder,
    isExact: Math.abs(remainder) < 0.01,
  };
}

export function generateWarmupSets(workingWeight, barWeight = 20) {
  if (workingWeight <= barWeight) {
    return [{ percentage: 100, weight: barWeight, reps: 10, description: 'Empty Bar Warmup' }];
  }

  const diff = workingWeight - barWeight;
  const sets = [
    { percentage: Math.round((barWeight / workingWeight) * 100), weight: barWeight, reps: 10, description: 'Bar - Joint lubrication & mobility' },
  ];

  const set2Weight = Math.round((barWeight + diff * 0.35) / 2.5) * 2.5;
  if (set2Weight > barWeight && set2Weight < workingWeight * 0.7) {
    sets.push({ percentage: Math.round((set2Weight / workingWeight) * 100), weight: set2Weight, reps: 5, description: 'Light set - Groove pattern' });
  }

  const set3Weight = Math.round((barWeight + diff * 0.65) / 2.5) * 2.5;
  if (set3Weight > set2Weight && set3Weight < workingWeight * 0.85) {
    sets.push({ percentage: Math.round((set3Weight / workingWeight) * 100), weight: set3Weight, reps: 3, description: 'Moderate set - CNS priming' });
  }

  const set4Weight = Math.round((barWeight + diff * 0.85) / 2.5) * 2.5;
  if (set4Weight > set3Weight && set4Weight < workingWeight) {
    sets.push({ percentage: Math.round((set4Weight / workingWeight) * 100), weight: set4Weight, reps: 1, description: 'Heavy single - Potentiation' });
  }

  return sets;
}
