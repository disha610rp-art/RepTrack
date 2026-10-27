import ProgressState from '../models/ProgressState.js';
import WorkoutSession from '../models/WorkoutSession.js';
import Exercise from '../models/Exercise.js';
import { calculatePlates, generateWarmupSets } from '../utils/plateCalculator.js';
import { compareAllFormulas, getPercentageLoadTable, getRepMaxTable } from '../utils/oneRepMax.js';

// @route GET /api/progression/analytics
export async function getAnalytics(req, res) {
  try {
    const sessions = await WorkoutSession.find({
      userId: req.user._id,
      status: 'completed',
    })
      .populate('exercises.exerciseId')
      .sort({ completedAt: 1 });

    const progressStates = await ProgressState.find({
      userId: req.user._id,
    }).populate('exerciseId');

    const totalSessions = sessions.length;
    const totalVolume = sessions.reduce((acc, s) => acc + (s.totalVolume || 0), 0);
    const prCount = progressStates.filter(st => st.personalRecord1RM > 0).length;

    // Build 1RM trend timelines per lift
    const trendsByExercise = {};
    const muscleVolumeMap = {
      Chest: 0,
      Back: 0,
      Quads: 0,
      Hamstrings: 0,
      Shoulders: 0,
      Arms: 0,
      Core: 0,
      Calves: 0,
      Glutes: 0,
    };

    sessions.forEach(sess => {
      const sessDate = sess.completedAt || sess.startedAt;
      const dateStr = new Date(sessDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      sess.exercises.forEach(sessEx => {
        const ex = sessEx.exerciseId;
        if (!ex) return;

        // Tonnage per muscle group
        const workingSets = sessEx.sets.filter(s => !s.isWarmup && s.completed);
        const exVolume = workingSets.reduce(
          (sum, s) => sum + s.actualWeight * s.actualReps,
          0
        );

        const muscle = ex.primaryMuscle;
        if (muscle === 'Biceps' || muscle === 'Triceps' || muscle === 'Arms') {
          muscleVolumeMap.Arms = (muscleVolumeMap.Arms || 0) + exVolume;
        } else if (muscleVolumeMap[muscle] !== undefined) {
          muscleVolumeMap[muscle] += exVolume;
        } else {
          muscleVolumeMap[muscle] = exVolume;
        }

        // Best 1RM for trend line
        const best1RM = Math.max(0, ...workingSets.map(s => s.calculated1RM || 0));
        if (best1RM > 0) {
          if (!trendsByExercise[ex._id.toString()]) {
            trendsByExercise[ex._id.toString()] = {
              name: ex.name,
              primaryMuscle: ex.primaryMuscle,
              data: [],
            };
          }
          trendsByExercise[ex._id.toString()].data.push({
            date: dateStr,
            fullDate: sessDate,
            oneRM: best1RM,
            workingSetsCount: workingSets.length,
          });
        }
      });
    });

    // Recent PRs
    const prEvents = progressStates
      .filter(s => s.personalRecord1RM > 0 && s.exerciseId)
      .map(s => ({
        exerciseId: s.exerciseId._id,
        exerciseName: s.exerciseId.name,
        oneRM: s.personalRecord1RM,
        maxWeight: s.maxWeightLifted,
        maxWeightReps: s.maxWeightLiftedReps,
        date: s.personalRecord1RMDate,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({
      success: true,
      data: {
        totalSessions,
        totalVolume,
        prCount,
        muscleVolumeMap,
        trendsByExercise,
        prEvents,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to generate analytics' });
  }
}

// @route GET /api/progression/states
export async function getProgressStates(req, res) {
  try {
    const states = await ProgressState.find({ userId: req.user._id }).populate(
      'exerciseId'
    );
    res.json({ success: true, count: states.length, data: states });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch progress states' });
  }
}

// @route POST /api/progression/calculate-plates
export function calculatePlatesEndpoint(req, res) {
  try {
    const { targetWeight, barWeight, availablePlates, unit } = req.body;
    const result = calculatePlates(
      Number(targetWeight) || 60,
      Number(barWeight) || (unit === 'lbs' ? 45 : 20),
      availablePlates
    );
    const warmups = generateWarmupSets(
      Number(targetWeight) || 60,
      Number(barWeight) || (unit === 'lbs' ? 45 : 20)
    );

    res.json({ success: true, result, warmups });
  } catch (error) {
    res.status(500).json({ message: 'Plate calculation error' });
  }
}

// @route POST /api/progression/calculate-1rm
export function calculate1RmEndpoint(req, res) {
  try {
    const { weight, reps } = req.body;
    const comparisons = compareAllFormulas(Number(weight) || 0, Number(reps) || 0);
    const repMaxTable = getRepMaxTable(comparisons.epley);
    const percentagesTable = getPercentageLoadTable(comparisons.epley);

    res.json({
      success: true,
      oneRM: comparisons.epley,
      comparisons,
      repMaxTable,
      percentagesTable,
    });
  } catch (error) {
    res.status(500).json({ message: '1RM calculation error' });
  }
}
