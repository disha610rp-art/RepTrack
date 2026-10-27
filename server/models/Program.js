import mongoose from 'mongoose';

const programExerciseSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true,
    },
    order: {
      type: Number,
      default: 1,
    },
    progression: {
      type: {
        type: String,
        enum: ['linear', 'double', 'rpe_based', 'percentage_1rm', 'step'],
        default: 'linear',
      },
      weightIncrementKg: { type: Number, default: 2.5 },
      weightIncrementLbs: { type: Number, default: 5 },
      targetSets: { type: Number, default: 3 },
      repsMin: { type: Number, default: 5 },
      repsMax: { type: Number, default: 5 },
      targetRpe: { type: Number, default: 8.5 },
      failureThreshold: { type: Number, default: 3 },
      deloadPercentage: { type: Number, default: 10 },
    },
    notes: String,
    warmupSetsCount: {
      type: Number,
      default: 2,
    },
  },
  { _id: true }
);

const programWorkoutSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    dayNumber: {
      type: Number,
      required: true,
    },
    description: String,
    exercises: [programExerciseSchema],
  },
  { _id: true }
);

const programSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Program name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
    },
    daysPerWeek: {
      type: Number,
      default: 3,
    },
    author: {
      type: String,
      default: 'RepTrack',
    },
    workouts: [programWorkoutSchema],
    isCustom: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null means standard pre-built template
    },
  },
  {
    timestamps: true,
  }
);

const Program = mongoose.model('Program', programSchema);
export default Program;
