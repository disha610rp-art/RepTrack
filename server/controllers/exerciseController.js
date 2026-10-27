import Exercise from '../models/Exercise.js';
import ProgressState from '../models/ProgressState.js';
import WorkoutSession from '../models/WorkoutSession.js';

// @route GET /api/exercises
export async function getExercises(req, res) {
  try {
    const exercises = await Exercise.find({
      $or: [{ userId: null }, { userId: req.user._id }],
    }).sort({ name: 1 });

    res.json({ success: true, count: exercises.length, data: exercises });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch exercises' });
  }
}

// @route POST /api/exercises
export async function createExercise(req, res) {
  try {
    const {
      name,
      category,
      primaryMuscle,
      secondaryMuscles,
      defaultRestSeconds,
      instructions,
      tips,
      defaultProgression,
    } = req.body;

    if (!name || !primaryMuscle) {
      return res.status(400).json({ message: 'Name and primary muscle are required' });
    }

    const exercise = await Exercise.create({
      name,
      category: category || 'Barbell',
      primaryMuscle,
      secondaryMuscles: secondaryMuscles || [],
      defaultRestSeconds: defaultRestSeconds || 120,
      instructions: instructions || '',
      tips: tips || [],
      defaultProgression: defaultProgression || {
        type: 'double',
        weightIncrementKg: 2.5,
        weightIncrementLbs: 5,
        targetSets: 3,
        repsMin: 8,
        repsMax: 12,
        failureThreshold: 3,
        deloadPercentage: 10,
      },
      isCustom: true,
      userId: req.user._id,
    });

    res.status(201).json({ success: true, data: exercise });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create exercise' });
  }
}

// @route GET /api/exercises/:id
export async function getExerciseById(req, res) {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    // Get user's progress state
    const progressState = await ProgressState.findOne({
      userId: req.user._id,
      exerciseId: exercise._id,
    });

    // Get historical 1RM trend from completed sessions
    const sessions = await WorkoutSession.find({
      userId: req.user._id,
      status: 'completed',
      'exercises.exerciseId': exercise._id,
    }).sort({ completedAt: 1 });

    const history = [];
    sessions.forEach(sess => {
      const matchEx = sess.exercises.find(
        e => e.exerciseId.toString() === exercise._id.toString()
      );
      if (matchEx) {
        const workingSets = matchEx.sets.filter(s => !s.isWarmup && s.completed);
        const max1RM = Math.max(0, ...workingSets.map(s => s.calculated1RM || 0));
        const maxWeight = Math.max(0, ...workingSets.map(s => s.actualWeight || 0));
        history.push({
          date: sess.completedAt || sess.startedAt,
          sessionId: sess._id,
          workoutName: sess.workoutName,
          max1RM,
          maxWeight,
          workingSetsCount: workingSets.length,
        });
      }
    });

    res.json({
      success: true,
      data: exercise,
      progressState,
      history,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch exercise details' });
  }
}

// @route DELETE /api/exercises/:id
export async function deleteExercise(req, res) {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    if (!exercise.isCustom || exercise.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot delete default exercises' });
    }

    await exercise.deleteOne();
    await ProgressState.deleteMany({ userId: req.user._id, exerciseId: exercise._id });

    res.json({ success: true, message: 'Exercise removed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete exercise' });
  }
}
