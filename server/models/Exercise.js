import mongoose from 'mongoose';

const progressionSchemeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['linear', 'double', 'rpe_based', 'percentage_1rm', 'step'],
      default: 'linear',
    },
    weightIncrementKg: {
      type: Number,
      default: 2.5,
    },
    weightIncrementLbs: {
      type: Number,
      default: 5.0,
    },
    targetSets: {
      type: Number,
      default: 3,
    },
    repsMin: {
      type: Number,
      default: 5,
    },
    repsMax: {
      type: Number,
      default: 5,
    },
    targetRpe: {
      type: Number,
      default: 8.5,
    },
    failureThreshold: {
      type: Number,
      default: 3,
    },
    deloadPercentage: {
      type: Number,
      default: 10,
    },
  },
  { _id: false }
);

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exercise name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Kettlebell', 'Smith Machine'],
      default: 'Barbell',
    },
    primaryMuscle: {
      type: String,
      enum: ['Chest', 'Back', 'Shoulders', 'Arms', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Biceps', 'Triceps', 'Core', 'Full Body'],
      required: true,
    },
    secondaryMuscles: [
      {
        type: String,
        enum: ['Chest', 'Back', 'Shoulders', 'Arms', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Biceps', 'Triceps', 'Core', 'Full Body'],
      },
    ],
    defaultRestSeconds: {
      type: Number,
      default: 120,
    },
    instructions: {
      type: String,
      default: '',
    },
    tips: [String],
    defaultProgression: {
      type: progressionSchemeSchema,
      default: () => ({}),
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null means global default exercise
    },
  },
  {
    timestamps: true,
  }
);

const Exercise = mongoose.model('Exercise', exerciseSchema);
export default Exercise;
