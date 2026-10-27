import { calculate1RM } from './oneRepMax.js';

/**
 * Progression Engine
 * Evaluates session sets against exercise rules (Linear, Double Progression, RPE)
 * Calculates volume, detects new 1RM Personal Records, and generates next session targets.
 */
export function evaluateSession(session, exercisesMap, currentStatesMap, unit = 'kg') {
  const recommendations = [];
  const updatedStates = { ...currentStatesMap };
  const prEvents = [];
  let totalVolume = 0;

  for (const sessionExercise of session.exercises) {
    const exerciseIdStr = sessionExercise.exerciseId.toString();
    const exercise = exercisesMap[exerciseIdStr];
    if (!exercise) continue;

    // Working sets (include completed sets, or sets that have elapsed seconds/pending activity)
    const workingSets = sessionExercise.sets.filter(
      s => !s.isWarmup && (s.completed || s.pending || (s.actualSeconds && s.actualSeconds > 0)) && s.actualReps > 0 && s.actualWeight > 0
    );
    if (workingSets.length === 0) continue;

    let exerciseVolume = 0;
    for (const s of workingSets) {
      const fullVol = (s.actualWeight || 0) * (s.actualReps || 0);
      let setVol = fullVol;

      if (!s.completed && (s.actualSeconds > 0 || s.pending)) {
        const sec = s.actualSeconds || 0;
        const target = s.targetSeconds || 180;
        const ratio = target > 0 ? Math.min(1, Math.max(0, sec / target)) : 1;
        setVol = Math.round(fullVol * ratio);
      } else if (s.completed && s.actualSeconds > 0 && s.targetSeconds > 0 && s.actualSeconds < s.targetSeconds) {
        const ratio = Math.min(1, Math.max(0, s.actualSeconds / s.targetSeconds));
        setVol = Math.round(fullVol * ratio);
      }

      s.calculatedVolume = setVol;
      exerciseVolume += setVol;
    }

    totalVolume += exerciseVolume;

    const currentState = updatedStates[exerciseIdStr] || {
      exerciseId: exercise._id,
      currentWeight: workingSets[0].actualWeight,
      targetReps: workingSets[0].targetReps || exercise.defaultProgression.repsMin || 5,
      consecutiveFailures: 0,
      isDeloadActive: false,
      personalRecord1RM: 0,
      personalRecord1RMDate: new Date(),
      maxWeightLifted: 0,
      maxWeightLiftedReps: 0,
      lastUpdated: new Date(),
    };

    // Calculate best 1RM in this session
    let sessionBest1RM = 0;
    let heaviestWeight = 0;
    let heaviestReps = 0;

    for (const s of workingSets) {
      const e1rm = calculate1RM(s.actualWeight, s.actualReps, 'epley');
      if (e1rm > sessionBest1RM) {
        sessionBest1RM = e1rm;
      }
      if (s.actualWeight > heaviestWeight) {
        heaviestWeight = s.actualWeight;
        heaviestReps = s.actualReps;
      }
    }

    // Check if new PR
    if (sessionBest1RM > currentState.personalRecord1RM && sessionBest1RM > 0) {
      prEvents.push({
        exerciseId: exercise._id,
        exerciseName: exercise.name,
        previous1RM: currentState.personalRecord1RM,
        new1RM: sessionBest1RM,
        weight: heaviestWeight,
        reps: heaviestReps,
        date: session.completedAt || new Date(),
      });
      currentState.personalRecord1RM = sessionBest1RM;
      currentState.personalRecord1RMDate = session.completedAt || new Date();
    }

    if (heaviestWeight > currentState.maxWeightLifted) {
      currentState.maxWeightLifted = heaviestWeight;
      currentState.maxWeightLiftedReps = heaviestReps;
    }

    // Progression logic
    const scheme = exercise.defaultProgression;
    const weightInc = unit === 'kg' ? scheme.weightIncrementKg : scheme.weightIncrementLbs;
    const currentWeight = currentState.currentWeight || workingSets[0].actualWeight;

    let recStatus = 'maintained';
    let newWeight = currentWeight;
    let newReps = currentState.targetReps;
    let reason = '';

    if (scheme.type === 'linear') {
      const allSetsHitTarget =
        workingSets.length >= scheme.targetSets &&
        workingSets.every(s => s.actualReps >= s.targetReps);

      if (allSetsHitTarget) {
        recStatus = 'progressed';
        newWeight = Math.round((currentWeight + weightInc) * 10) / 10;
        newReps = scheme.repsMin;
        currentState.consecutiveFailures = 0;
        currentState.isDeloadActive = false;
        reason = `Hit target reps (${workingSets[0].targetReps}) on all ${workingSets.length} sets. Overload triggered: +${weightInc}${unit}.`;
      } else {
        currentState.consecutiveFailures += 1;
        if (currentState.consecutiveFailures >= scheme.failureThreshold) {
          recStatus = 'deload_applied';
          const drop = Math.max(weightInc * 2, currentWeight * (scheme.deloadPercentage / 100));
          newWeight = Math.max(weightInc * 2, Math.round((currentWeight - drop) / (weightInc / 2)) * (weightInc / 2));
          newReps = scheme.repsMin;
          currentState.consecutiveFailures = 0;
          currentState.isDeloadActive = true;
          reason = `Plateau detected (${scheme.failureThreshold} failed attempts). Deload of ${scheme.deloadPercentage}% applied to recover momentum.`;
        } else {
          recStatus = 'maintained';
          reason = `Missed target reps on one or more sets. Maintain ${currentWeight}${unit} for next session (Attempt ${currentState.consecutiveFailures}/${scheme.failureThreshold}).`;
        }
      }
    } else if (scheme.type === 'double') {
      const allHitMax =
        workingSets.length >= scheme.targetSets &&
        workingSets.every(s => s.actualReps >= scheme.repsMax);

      if (allHitMax) {
        recStatus = 'progressed';
        newWeight = Math.round((currentWeight + weightInc) * 10) / 10;
        newReps = scheme.repsMin;
        currentState.consecutiveFailures = 0;
        currentState.isDeloadActive = false;
        reason = `Reached top of rep range (${scheme.repsMax} reps) across all sets! Increased weight by +${weightInc}${unit} and reset target to ${scheme.repsMin} reps.`;
      } else {
        const anyBelowMin = workingSets.some(s => s.actualReps < scheme.repsMin);
        if (anyBelowMin) {
          currentState.consecutiveFailures += 1;
          if (currentState.consecutiveFailures >= scheme.failureThreshold) {
            recStatus = 'deload_applied';
            const drop = Math.max(weightInc * 2, currentWeight * (scheme.deloadPercentage / 100));
            newWeight = Math.max(weightInc * 2, Math.round((currentWeight - drop) / (weightInc / 2)) * (weightInc / 2));
            newReps = scheme.repsMin;
            currentState.consecutiveFailures = 0;
            currentState.isDeloadActive = true;
            reason = `Plateau below minimum rep range. Deload of ${scheme.deloadPercentage}% applied.`;
          } else {
            recStatus = 'maintained';
            reason = `Fell short of minimum rep range (${scheme.repsMin} reps). Maintain ${currentWeight}${unit} (Attempt ${currentState.consecutiveFailures}/${scheme.failureThreshold}).`;
          }
        } else {
          recStatus = 'maintained';
          currentState.consecutiveFailures = 0;
          const minAchieved = Math.min(...workingSets.map(s => s.actualReps));
          newReps = Math.min(scheme.repsMax, minAchieved + 1);
          reason = `Steady rep progression (${Math.min(...workingSets.map(s => s.actualReps))}-${Math.max(...workingSets.map(s => s.actualReps))} reps). Push towards ${scheme.repsMax} reps next session before increasing weight.`;
        }
      }
    } else if (scheme.type === 'rpe_based') {
      const setsWithRpe = workingSets.filter(s => s.rpe);
      const avgRpe = setsWithRpe.length > 0
        ? setsWithRpe.reduce((a, b) => a + b.rpe, 0) / setsWithRpe.length
        : 8.5;

      const targetRpe = scheme.targetRpe || 8.5;
      if (avgRpe < targetRpe - 1) {
        recStatus = 'progressed';
        newWeight = Math.round((currentWeight + weightInc) * 10) / 10;
        reason = `Average RPE (${avgRpe.toFixed(1)}) was well below target (${targetRpe}). Load increased by +${weightInc}${unit}.`;
      } else {
        recStatus = 'maintained';
        reason = `RPE was in target zone (${avgRpe.toFixed(1)} vs ${targetRpe}). Maintain weight.`;
      }
    }

    currentState.currentWeight = newWeight;
    currentState.targetReps = newReps;
    currentState.lastUpdated = session.completedAt || new Date();
    updatedStates[exerciseIdStr] = currentState;

    recommendations.push({
      exerciseId: exercise._id,
      exerciseName: exercise.name,
      ruleType: scheme.type,
      status: recStatus,
      previousWeight: currentWeight,
      newWeight,
      previousReps: currentState.targetReps,
      newReps,
      reason,
      estimated1RM: sessionBest1RM,
    });
  }

  return {
    recommendations,
    updatedStates,
    prEvents,
    totalVolume,
  };
}
