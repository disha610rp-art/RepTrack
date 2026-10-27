import mongoose from 'mongoose';

const loggedSetSchema = new mongoose.Schema(
  {
    setNumber: {
      type: Number,
      required: true,
    },
    isWarmup: {
      type: Boolean,
      default: false,
    },
    targetWeight: {
      type: Number,
      required: true,
    },
    targetReps: {
      type: Number,
      required: true,
    },
    actualWeight: {
      type: Number,
      required: true,
    },
    actualReps: {
      type: Number,
      required: true,
    },
    rpe: {
      type: Number,
      min: 5,
      max: 10,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    pending: {
      type: Boolean,
      default: false,
    },
    calculated1RM: {
      type: Number,
    },
    notes: String,
  },
  { _id: true }
);

const sessionExerciseSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true,
    },
    notes: String,
    sets: [loggedSetSchema],
  },
  { _id: true }
);

const workoutSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      default: null,
    },
    workoutId: {
      type: String,
      default: null,
    },
    workoutName: {
      type: String,
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      enum: ['kg', 'lbs'],
      default: 'kg',
    },
    exercises: [sessionExerciseSchema],
    totalVolume: {
      type: Number,
      default: 0,
    },
    overallRpe: {
      type: Number,
      min: 1,
      max: 10,
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const WorkoutSession = mongoose.model('WorkoutSession', workoutSessionSchema);
export default WorkoutSession;
