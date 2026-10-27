import WorkoutSession from '../models/WorkoutSession.js';
import ProgressState from '../models/ProgressState.js';
import Exercise from '../models/Exercise.js';
import Program from '../models/Program.js';
import { calculate1RM } from '../utils/oneRepMax.js';
import { evaluateSession } from '../utils/progressionEngine.js';

// @route GET /api/sessions
export async function getSessions(req, res) {
  try {
    const sessions = await WorkoutSession.find({
      userId: req.user._id,
      status: 'completed',
    })
      .populate('exercises.exerciseId')
      .sort({ completedAt: -1 });

    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch workout sessions' });
  }
}

// @route GET /api/sessions/active
export async function getActiveSession(req, res) {
  try {
    const active = await WorkoutSession.findOne({
      userId: req.user._id,
      status: 'in_progress',
    }).populate('exercises.exerciseId');

    res.json({ success: true, data: active });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch active session' });
  }
}

// @route POST /api/sessions/start
export async function startSession(req, res) {
  try {
    const { programId, workoutId, workoutName } = req.body;
    const unit = req.user.settings?.unit || 'kg';

    // If an active session already exists, return it
    const existing = await WorkoutSession.findOne({
      userId: req.user._id,
      status: 'in_progress',
    }).populate('exercises.exerciseId');

    if (existing) {
      return res.json({ success: true, data: existing, resumed: true });
    }

    let resolvedName = workoutName || 'Quick Workout';
    let exercisesPayload = [];

    if (programId && workoutId) {
      const prog = await Program.findById(programId).populate('workouts.exercises.exerciseId');
      const wkt = prog?.workouts.id(workoutId);
      if (wkt) {
        resolvedName = `${prog.name} - ${wkt.name}`;

        for (const pe of wkt.exercises) {
          const ex = pe.exerciseId;
          if (!ex) continue;

          // Lookup current progress state for this exercise
          const state = await ProgressState.findOne({
            userId: req.user._id,
            exerciseId: ex._id,
          });

          const defaultWeight = state?.currentWeight || (unit === 'kg' ? 40 : 90);
          const defaultReps = state?.targetReps || ex.defaultProgression.repsMin || 5;
          const setsCount = pe.progression?.targetSets || ex.defaultProgression.targetSets || 3;

          const sets = [];
          // Optional warmup
          if (pe.warmupSetsCount > 0 && defaultWeight > (unit === 'kg' ? 20 : 45)) {
            const barWeight = unit === 'kg' ? req.user.settings?.barWeightKg || 20 : req.user.settings?.barWeightLbs || 45;
            sets.push({
              setNumber: 1,
              isWarmup: true,
              targetWeight: barWeight,
              targetReps: 10,
              actualWeight: barWeight,
              actualReps: 10,
              completed: false,
            });
          }

          // Working sets
          for (let i = 1; i <= setsCount; i++) {
            sets.push({
              setNumber: sets.length + 1,
              isWarmup: false,
              targetWeight: defaultWeight,
              targetReps: defaultReps,
              actualWeight: defaultWeight,
              actualReps: defaultReps,
              completed: false,
            });
          }

          exercisesPayload.push({
            exerciseId: ex._id,
            notes: pe.notes || '',
            sets,
          });
        }
      }
    } else {
      // Default quick workout with first exercise
      const defaultEx = await Exercise.findOne();
      if (defaultEx) {
        const state = await ProgressState.findOne({
          userId: req.user._id,
          exerciseId: defaultEx._id,
        });
        const defaultWeight = state?.currentWeight || (unit === 'kg' ? 40 : 90);
        const defaultReps = state?.targetReps || defaultEx.defaultProgression.repsMin || 5;

        exercisesPayload.push({
          exerciseId: defaultEx._id,
          notes: '',
          sets: [
            {
              setNumber: 1,
              isWarmup: false,
              targetWeight: defaultWeight,
              targetReps: defaultReps,
              actualWeight: defaultWeight,
              actualReps: defaultReps,
              completed: false,
            },
          ],
        });
      }
    }

    const session = await WorkoutSession.create({
      userId: req.user._id,
      programId: programId || null,
      workoutId: workoutId || null,
      workoutName: resolvedName,
      startedAt: new Date(),
      unit,
      exercises: exercisesPayload,
      status: 'in_progress',
    });

    const populated = await WorkoutSession.findById(session._id).populate(
      'exercises.exerciseId'
    );

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ message: 'Failed to start workout session' });
  }
}

// @route PUT /api/sessions/:id/set
export async function updateSet(req, res) {
  try {
    const { exerciseId, setId, updates } = req.body;
    const session = await WorkoutSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'in_progress',
    });

    if (!session) {
      return res.status(404).json({ message: 'Active session not found' });
    }

    const ex = session.exercises.find(e => e.exerciseId.toString() === exerciseId);
    if (!ex) {
      return res.status(404).json({ message: 'Exercise not found in session' });
    }

    const setItem = ex.sets.id(setId);
    if (!setItem) {
      return res.status(404).json({ message: 'Set not found in exercise' });
    }

    Object.assign(setItem, updates);

    // Calculate 1RM if completed or weight/reps present
    if (setItem.actualWeight > 0 && setItem.actualReps > 0) {
      const formula = req.user.settings?.default1RmFormula || 'epley';
      setItem.calculated1RM = calculate1RM(setItem.actualWeight, setItem.actualReps, formula);
    }

    await session.save();

    res.json({ success: true, data: setItem, session });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update set' });
  }
}

// @route POST /api/sessions/:id/add-set
export async function addSetToExercise(req, res) {
  try {
    const { exerciseId, isWarmup } = req.body;
    const session = await WorkoutSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'in_progress',
    });

    if (!session) return res.status(404).json({ message: 'Active session not found' });

    const ex = session.exercises.find(e => e.exerciseId.toString() === exerciseId);
    if (!ex) return res.status(404).json({ message: 'Exercise not found' });

    const lastSet = ex.sets[ex.sets.length - 1];
    const newSet = {
      setNumber: ex.sets.length + 1,
      isWarmup: !!isWarmup,
      targetWeight: lastSet ? lastSet.actualWeight : 40,
      targetReps: lastSet ? lastSet.actualReps : 5,
      actualWeight: lastSet ? lastSet.actualWeight : 40,
      actualReps: lastSet ? lastSet.actualReps : 5,
      completed: false,
    };

    ex.sets.push(newSet);
    await session.save();

    const populated = await WorkoutSession.findById(session._id).populate('exercises.exerciseId');
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add set' });
  }
}

// @route DELETE /api/sessions/:id/set/:setId
export async function removeSetFromExercise(req, res) {
  try {
    const { exerciseId } = req.query;
    const session = await WorkoutSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'in_progress',
    });

    if (!session) return res.status(404).json({ message: 'Active session not found' });

    const ex = session.exercises.find(e => e.exerciseId.toString() === exerciseId);
    if (!ex) return res.status(404).json({ message: 'Exercise not found' });

    ex.sets.pull(req.params.setId);
    // Renumber remaining sets
    ex.sets.forEach((s, idx) => {
      s.setNumber = idx + 1;
    });

    await session.save();
    const populated = await WorkoutSession.findById(session._id).populate('exercises.exerciseId');
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove set' });
  }
}

// @route POST /api/sessions/:id/add-exercise
export async function addExerciseToSession(req, res) {
  try {
    const { exerciseId } = req.body;
    const session = await WorkoutSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'in_progress',
    });

    if (!session) return res.status(404).json({ message: 'Active session not found' });

    const ex = await Exercise.findById(exerciseId);
    if (!ex) return res.status(404).json({ message: 'Exercise not found' });

    const state = await ProgressState.findOne({
      userId: req.user._id,
      exerciseId: ex._id,
    });

    const defaultWeight = state?.currentWeight || (session.unit === 'kg' ? 40 : 90);
    const defaultReps = state?.targetReps || ex.defaultProgression.repsMin || 5;

    session.exercises.push({
      exerciseId: ex._id,
      notes: '',
      sets: [
        {
          setNumber: 1,
          isWarmup: false,
          targetWeight: defaultWeight,
          targetReps: defaultReps,
          actualWeight: defaultWeight,
          actualReps: defaultReps,
          completed: false,
        },
      ],
    });

    await session.save();
    const populated = await WorkoutSession.findById(session._id).populate('exercises.exerciseId');
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add exercise to session' });
  }
}

// @route POST /api/sessions/:id/complete
export async function completeSession(req, res) {
  try {
    const { notes, overallRpe } = req.body;
    const session = await WorkoutSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'in_progress',
    });

    if (!session) {
      return res.status(404).json({ message: 'Active session not found' });
    }

    const durationSeconds = Math.max(
      60,
      Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000)
    );

    session.completedAt = new Date();
    session.durationSeconds = durationSeconds;
    session.status = 'completed';
    session.notes = notes || session.notes;
    session.overallRpe = overallRpe || session.overallRpe;

    // Fetch exercises & user's current progress states for progression evaluation
    const exerciseIds = session.exercises.map(e => e.exerciseId);
    const exercises = await Exercise.find({ _id: { $in: exerciseIds } });
    const exercisesMap = {};
    exercises.forEach(e => {
      exercisesMap[e._id.toString()] = e;
    });

    const currentStates = await ProgressState.find({
      userId: req.user._id,
      exerciseId: { $in: exerciseIds },
    });
    const currentStatesMap = {};
    currentStates.forEach(s => {
      currentStatesMap[s.exerciseId.toString()] = s.toObject();
    });

    // Run progression engine
    const evaluation = evaluateSession(
      session,
      exercisesMap,
      currentStatesMap,
      session.unit
    );

    session.totalVolume = evaluation.totalVolume;
    await session.save();

    // Persist updated progress states to MongoDB
    for (const [exIdStr, stateObj] of Object.entries(evaluation.updatedStates)) {
      await ProgressState.findOneAndUpdate(
        { userId: req.user._id, exerciseId: exIdStr },
        {
          currentWeight: stateObj.currentWeight,
          targetReps: stateObj.targetReps,
          consecutiveFailures: stateObj.consecutiveFailures,
          isDeloadActive: stateObj.isDeloadActive,
          personalRecord1RM: stateObj.personalRecord1RM,
          personalRecord1RMDate: stateObj.personalRecord1RMDate,
          maxWeightLifted: stateObj.maxWeightLifted,
          maxWeightLiftedReps: stateObj.maxWeightLiftedReps,
          lastUpdated: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    const populated = await WorkoutSession.findById(session._id).populate(
      'exercises.exerciseId'
    );

    res.json({
      success: true,
      session: populated,
      evaluation: {
        recommendations: evaluation.recommendations,
        prEvents: evaluation.prEvents,
        totalVolume: evaluation.totalVolume,
      },
    });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ message: 'Failed to complete session' });
  }
}

// @route POST /api/sessions/:id/cancel
export async function cancelSession(req, res) {
  try {
    const session = await WorkoutSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'in_progress',
    });

    if (!session) return res.status(404).json({ message: 'Active session not found' });

    session.status = 'abandoned';
    session.completedAt = new Date();
    await session.save();

    res.json({ success: true, message: 'Session cancelled' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel session' });
  }
}

// @route DELETE /api/sessions/:id
export async function deleteSession(req, res) {
  try {
    const session = await WorkoutSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!session) return res.status(404).json({ message: 'Session not found' });

    await session.deleteOne();
    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete session' });
  }
}
