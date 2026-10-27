/**
 * 1RM Scientific Formulas Engine
 * Implements Epley, Brzycki, Lombardi, Mayhew, O'Conner, Wathen, and Average blends.
 */

export function calculate1RM(weight, reps, formula = 'epley') {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;

  let result = 0;
  switch (formula) {
    case 'epley':
      // Epley: w * (1 + r / 30)
      result = weight * (1 + reps / 30);
      break;

    case 'brzycki':
      // Brzycki: w * (36 / (37 - r))
      if (reps >= 37) result = weight * 2.5;
      else result = weight * (36 / (37 - reps));
      break;

    case 'lombardi':
      // Lombardi: w * r^0.10
      result = weight * Math.pow(reps, 0.10);
      break;

    case 'mayhew':
      // Mayhew: (100 * w) / (52.2 + 41.9 * e^(-0.055 * r))
      result = (100 * weight) / (52.2 + 41.9 * Math.exp(-0.055 * reps));
      break;

    case 'oconner':
      // O'Conner: w * (1 + 0.025 * r)
      result = weight * (1 + 0.025 * reps);
      break;

    case 'wathen':
      // Wathen: (100 * w) / (48.8 + 53.8 * e^(-0.075 * r))
      result = (100 * weight) / (48.8 + 53.8 * Math.exp(-0.075 * reps));
      break;

    case 'average': {
      const e = weight * (1 + reps / 30);
      const b = reps < 37 ? weight * (36 / (37 - reps)) : weight * 2.5;
      const l = weight * Math.pow(reps, 0.10);
      const m = (100 * weight) / (52.2 + 41.9 * Math.exp(-0.055 * reps));
      const o = weight * (1 + 0.025 * reps);
      const w = (100 * weight) / (48.8 + 53.8 * Math.exp(-0.075 * reps));
      result = (e + b + l + m + o + w) / 6;
      break;
    }

    default:
      result = weight * (1 + reps / 30);
      break;
  }

  return Math.round(result * 10) / 10;
}

export function compareAllFormulas(weight, reps) {
  return {
    epley: calculate1RM(weight, reps, 'epley'),
    brzycki: calculate1RM(weight, reps, 'brzycki'),
    lombardi: calculate1RM(weight, reps, 'lombardi'),
    mayhew: calculate1RM(weight, reps, 'mayhew'),
    oconner: calculate1RM(weight, reps, 'oconner'),
    wathen: calculate1RM(weight, reps, 'wathen'),
    average: calculate1RM(weight, reps, 'average'),
  };
}

export function getRepMaxTable(oneRm) {
  if (oneRm <= 0) return [];
  const repPercentages = [
    { reps: 1, percentage: 100 },
    { reps: 2, percentage: 95 },
    { reps: 3, percentage: 93 },
    { reps: 4, percentage: 90 },
    { reps: 5, percentage: 87 },
    { reps: 6, percentage: 85 },
    { reps: 8, percentage: 80 },
    { reps: 10, percentage: 75 },
    { reps: 12, percentage: 70 },
    { reps: 15, percentage: 65 },
  ];

  return repPercentages.map(item => ({
    reps: item.reps,
    percentage: item.percentage,
    weight: Math.round(oneRm * (item.percentage / 100) * 10) / 10,
  }));
}

export function getPercentageLoadTable(oneRm) {
  if (oneRm <= 0) return [];
  const percentages = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50];
  return percentages.map(pct => ({
    percentage: pct,
    weight: Math.round(oneRm * (pct / 100) * 10) / 10,
  }));
}
