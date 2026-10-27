import mongoose from 'mongoose';

const progressStateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true,
      index: true,
    },
    currentWeight: {
      type: Number,
      required: true,
    },
    targetReps: {
      type: Number,
      required: true,
    },
    consecutiveFailures: {
      type: Number,
      default: 0,
    },
    isDeloadActive: {
      type: Boolean,
      default: false,
    },
    personalRecord1RM: {
      type: Number,
      default: 0,
    },
    personalRecord1RMDate: {
      type: Date,
      default: Date.now,
    },
    maxWeightLifted: {
      type: Number,
      default: 0,
    },
    maxWeightLiftedReps: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index so one progress state per user per exercise
progressStateSchema.index({ userId: 1, exerciseId: 1 }, { unique: true });

const ProgressState = mongoose.model('ProgressState', progressStateSchema);
export default ProgressState;
