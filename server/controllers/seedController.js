import User from '../models/User.js';
import Exercise from '../models/Exercise.js';
import Program from '../models/Program.js';
import WorkoutSession from '../models/WorkoutSession.js';
import ProgressState from '../models/ProgressState.js';
import { DEFAULT_EXERCISES } from '../data/defaultExercises.js';

export async function seedDatabase(req, res) {
  try {
    // 1. Seed global exercises if not present
    let exercises = await Exercise.find({ userId: null });
    if (exercises.length === 0) {
      exercises = await Exercise.insertMany(
        DEFAULT_EXERCISES.map(ex => ({ ...ex, isCustom: false, userId: null }))
      );
      console.log(`Seeded ${exercises.length} default exercises.`);
    }

    const exMap = {};
    exercises.forEach(e => {
      exMap[e.name] = e._id;
    });

    // 2. Seed default programs if not present
    let programs = await Program.find({ userId: null });
    if (programs.length === 0) {
      const pplProgram = {
        name: 'Push Pull Legs (PPL) Hypertrophy',
        description: 'Gold-standard 3-day split prioritizing compound strength followed by hypertrophy accessory work.',
        difficulty: 'Intermediate',
        daysPerWeek: 3,
        author: 'RepTrack Coaches',
        isCustom: false,
        userId: null,
        workouts: [
          {
            name: 'Push Day (Chest, Shoulders, Triceps)',
            dayNumber: 1,
            description: 'Heavy bench press and overhead press with accessory isolation.',
            exercises: [
              {
                exerciseId: exMap['Barbell Bench Press'],
                order: 1,
                progression: { type: 'linear', weightIncrementKg: 2.5, targetSets: 3, repsMin: 5, repsMax: 5, failureThreshold: 3, deloadPercentage: 10 },
                notes: 'Primary compound movement.',
                warmupSetsCount: 3,
              },
              {
                exerciseId: exMap['Standing Barbell Overhead Press (OHP)'],
                order: 2,
                progression: { type: 'linear', weightIncrementKg: 1.25, targetSets: 3, repsMin: 5, repsMax: 5, failureThreshold: 3, deloadPercentage: 10 },
                notes: 'Lock out fully overhead.',
              },
              {
                exerciseId: exMap['Incline Dumbbell Press'],
                order: 3,
                progression: { type: 'double', weightIncrementKg: 2, targetSets: 3, repsMin: 8, repsMax: 12, failureThreshold: 3, deloadPercentage: 10 },
                notes: 'Focus on upper pectoral stretch.',
              },
              {
                exerciseId: exMap['Dumbbell Lateral Raise'],
                order: 4,
                progression: { type: 'double', weightIncrementKg: 1, targetSets: 4, repsMin: 12, repsMax: 16, failureThreshold: 3, deloadPercentage: 10 },
                notes: 'Strict form, no swinging.',
              },
              {
                exerciseId: exMap['Cable Tricep Rope Pushdown'],
                order: 5,
                progression: { type: 'double', weightIncrementKg: 1.25, targetSets: 3, repsMin: 10, repsMax: 15, failureThreshold: 3, deloadPercentage: 10 },
                notes: 'Flare rope apart at bottom.',
              },
            ],
          },
          {
            name: 'Pull Day (Back, Rear Delts, Biceps)',
            dayNumber: 2,
            description: 'Deadlift foundation followed by vertical/horizontal pulling.',
            exercises: [
              {
                exerciseId: exMap['Conventional Barbell Deadlift'],
                order: 1,
                progression: { type: 'linear', weightIncrementKg: 5, targetSets: 3, repsMin: 5, repsMax: 5, failureThreshold: 3, deloadPercentage: 10 },
                notes: 'Reset between every rep.',
                warmupSetsCount: 3,
              },
              {
                exerciseId: exMap['Lat Pulldown (Wide Grip)'],
                order: 2,
                progression: { type: 'double', weightIncrementKg: 2.5, targetSets: 3, repsMin: 8, repsMax: 12, failureThreshold: 3, deloadPercentage: 10 },
                notes: 'Lead with elbows.',
              },
              {
                exerciseId: exMap['Barbell Bent-Over Row'],
                order: 3,
                progression: { type: 'double', weightIncrementKg: 2.5, targetSets: 4, repsMin: 6, repsMax: 10, failureThreshold: 3, deloadPercentage: 10 },
                notes: 'Maintain neutral lumbar spine.',
              },
              {
                exerciseId: exMap['Rope Face Pulls'],
                order: 4,
                progression: { type: 'double', weightIncrementKg: 1.25, targetSets: 3, repsMin: 12, repsMax: 15, failureThreshold: 3, deloadPercentage: 10 },
                notes: 'External rotation focus.',
              },
              {
                exerciseId: exMap['Barbell Bicep Curl'],
                order: 5,
                progression: { type: 'double', weightIncrementKg: 1.25, targetSets: 3, repsMin: 8, repsMax: 12, failureThreshold: 3, deloadPercentage: 10 },
                notes: 'Pin elbows to ribs.',
              },
            ],
          },
          {
            name: 'Leg Day (Quads, Hamstrings, Glutes)',
            dayNumber: 3,
            description: 'Heavy squats paired with posterior chain development.',
            exercises: [
              {
                exerciseId: exMap['Barbell Back Squat'],
                order: 1,
                progression: { type: 'linear', weightIncrementKg: 2.5, targetSets: 3, repsMin: 5, repsMax: 5, failureThreshold: 3, deloadPercentage: 10 },
                notes: 'Squat to parallel or lower.',
                warmupSetsCount: 3,
              },
              {
                exerciseId: exMap['Romanian Deadlift (RDL)'],
                order: 2,
                progression: { type: 'double', weightIncrementKg: 2.5, targetSets: 3, repsMin: 8, repsMax: 12, failureThreshold: 3, deloadPercentage: 10 },
                notes: 'Deep hamstring stretch.',
              },
              {
                exerciseId: exMap['45-Degree Leg Press'],
                order: 3,
                progression: { type: 'double', weightIncrementKg: 10, targetSets: 3, repsMin: 10, repsMax: 15, failureThreshold: 3, deloadPercentage: 10 },
                notes: 'Controlled eccentric tempo.',
              },
            ],
          },
        ],
      };

      const ssProgram = {
        name: 'Starting Strength 5x5 Linear Progression',
        description: 'The proven novice strength protocol. 5 sets of 5 reps on the classic core barbell lifts.',
        difficulty: 'Beginner',
        daysPerWeek: 3,
        author: 'Mark Rippetoe inspired',
        isCustom: false,
        userId: null,
        workouts: [
          {
            name: 'Workout A (Squat, Bench, Deadlift)',
            dayNumber: 1,
            exercises: [
              { exerciseId: exMap['Barbell Back Squat'], order: 1, progression: { type: 'linear', weightIncrementKg: 2.5, targetSets: 5, repsMin: 5, repsMax: 5, failureThreshold: 3, deloadPercentage: 10 } },
              { exerciseId: exMap['Barbell Bench Press'], order: 2, progression: { type: 'linear', weightIncrementKg: 2.5, targetSets: 5, repsMin: 5, repsMax: 5, failureThreshold: 3, deloadPercentage: 10 } },
              { exerciseId: exMap['Conventional Barbell Deadlift'], order: 3, progression: { type: 'linear', weightIncrementKg: 5, targetSets: 1, repsMin: 5, repsMax: 5, failureThreshold: 3, deloadPercentage: 10 } },
            ],
          },
          {
            name: 'Workout B (Squat, Press, Row)',
            dayNumber: 2,
            exercises: [
              { exerciseId: exMap['Barbell Back Squat'], order: 1, progression: { type: 'linear', weightIncrementKg: 2.5, targetSets: 5, repsMin: 5, repsMax: 5, failureThreshold: 3, deloadPercentage: 10 } },
              { exerciseId: exMap['Standing Barbell Overhead Press (OHP)'], order: 2, progression: { type: 'linear', weightIncrementKg: 1.25, targetSets: 5, repsMin: 5, repsMax: 5, failureThreshold: 3, deloadPercentage: 10 } },
              { exerciseId: exMap['Barbell Bent-Over Row'], order: 3, progression: { type: 'linear', weightIncrementKg: 2.5, targetSets: 5, repsMin: 5, repsMax: 5, failureThreshold: 3, deloadPercentage: 10 } },
            ],
          },
        ],
      };

      programs = await Program.insertMany([pplProgram, ssProgram]);
      console.log(`Seeded ${programs.length} default programs.`);
    }

    // 3. Create or Reset Demo User
    let demoUser = await User.findOne({ email: 'demo@reptrack.com' });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Demo Athlete',
        email: 'demo@reptrack.com',
        password: 'password123',
        settings: {
          unit: 'kg',
          default1RmFormula: 'epley',
          barWeightKg: 20,
          barWeightLbs: 45,
          soundEnabled: true,
          restTimerAutoStart: true,
        },
        activeProgram: programs[0]._id,
      });
      console.log('Created Demo User: demo@reptrack.com / password123');
    }

    // 4. Seed Demo History & Progress States
    await ProgressState.deleteMany({ userId: demoUser._id });
    await WorkoutSession.deleteMany({ userId: demoUser._id });

    // Seed progress states
    const statesToSeed = [
      { exerciseId: exMap['Barbell Bench Press'], currentWeight: 82.5, targetReps: 5, personalRecord1RM: 95.7, maxWeightLifted: 82.5, maxWeightLiftedReps: 5 },
      { exerciseId: exMap['Barbell Back Squat'], currentWeight: 110.0, targetReps: 5, personalRecord1RM: 127.6, maxWeightLifted: 110.0, maxWeightLiftedReps: 5 },
      { exerciseId: exMap['Conventional Barbell Deadlift'], currentWeight: 145.0, targetReps: 5, personalRecord1RM: 168.2, maxWeightLifted: 145.0, maxWeightLiftedReps: 5 },
      { exerciseId: exMap['Standing Barbell Overhead Press (OHP)'], currentWeight: 52.5, targetReps: 5, personalRecord1RM: 60.9, maxWeightLifted: 52.5, maxWeightLiftedReps: 5 },
      { exerciseId: exMap['Incline Dumbbell Press'], currentWeight: 28.0, targetReps: 10, personalRecord1RM: 37.3, maxWeightLifted: 28.0, maxWeightLiftedReps: 10 },
      { exerciseId: exMap['Barbell Bent-Over Row'], currentWeight: 75.0, targetReps: 8, personalRecord1RM: 95.0, maxWeightLifted: 75.0, maxWeightLiftedReps: 8 },
      { exerciseId: exMap['Lat Pulldown (Wide Grip)'], currentWeight: 65.0, targetReps: 10, personalRecord1RM: 86.7, maxWeightLifted: 65.0, maxWeightLiftedReps: 10 },
      { exerciseId: exMap['Romanian Deadlift (RDL)'], currentWeight: 90.0, targetReps: 10, personalRecord1RM: 120.0, maxWeightLifted: 90.0, maxWeightLiftedReps: 10 },
    ];

    for (const st of statesToSeed) {
      if (st.exerciseId) {
        await ProgressState.create({
          userId: demoUser._id,
          exerciseId: st.exerciseId,
          currentWeight: st.currentWeight,
          targetReps: st.targetReps,
          consecutiveFailures: 0,
          isDeloadActive: false,
          personalRecord1RM: st.personalRecord1RM,
          personalRecord1RMDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          maxWeightLifted: st.maxWeightLifted,
          maxWeightLiftedReps: st.maxWeightLiftedReps,
          lastUpdated: new Date(),
        });
      }
    }

    // Seed realistic progression history sessions
    const sampleDates = [
      new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    ];

    const seededSessions = [
      {
        userId: demoUser._id,
        workoutName: 'Push Day (Chest, Shoulders, Triceps)',
        startedAt: sampleDates[0],
        completedAt: new Date(sampleDates[0].getTime() + 4500000),
        durationSeconds: 4500,
        unit: 'kg',
        totalVolume: 5625,
        status: 'completed',
        notes: 'Starting cycle. Bench press 75kg 3x5 felt smooth.',
        exercises: [
          {
            exerciseId: exMap['Barbell Bench Press'],
            sets: [
              { setNumber: 1, isWarmup: true, targetWeight: 40, targetReps: 10, actualWeight: 40, actualReps: 10, completed: true },
              { setNumber: 2, isWarmup: false, targetWeight: 75, targetReps: 5, actualWeight: 75, actualReps: 5, rpe: 8, completed: true, calculated1RM: 87.5 },
              { setNumber: 3, isWarmup: false, targetWeight: 75, targetReps: 5, actualWeight: 75, actualReps: 5, rpe: 8.5, completed: true, calculated1RM: 87.5 },
              { setNumber: 4, isWarmup: false, targetWeight: 75, targetReps: 5, actualWeight: 75, actualReps: 5, rpe: 9, completed: true, calculated1RM: 87.5 },
            ],
          },
        ],
      },
      {
        userId: demoUser._id,
        workoutName: 'Pull Day (Back, Rear Delts, Biceps)',
        startedAt: sampleDates[1],
        completedAt: new Date(sampleDates[1].getTime() + 4500000),
        durationSeconds: 4500,
        unit: 'kg',
        totalVolume: 7800,
        status: 'completed',
        notes: 'Deadlift 130kg 3x5.',
        exercises: [
          {
            exerciseId: exMap['Conventional Barbell Deadlift'],
            sets: [
              { setNumber: 1, isWarmup: false, targetWeight: 130, targetReps: 5, actualWeight: 130, actualReps: 5, rpe: 8, completed: true, calculated1RM: 151.7 },
              { setNumber: 2, isWarmup: false, targetWeight: 130, targetReps: 5, actualWeight: 130, actualReps: 5, rpe: 8.5, completed: true, calculated1RM: 151.7 },
            ],
          },
        ],
      },
      {
        userId: demoUser._id,
        workoutName: 'Leg Day (Quads, Hamstrings, Glutes)',
        startedAt: sampleDates[2],
        completedAt: new Date(sampleDates[2].getTime() + 4500000),
        durationSeconds: 4500,
        unit: 'kg',
        totalVolume: 8200,
        status: 'completed',
        notes: 'Squats 100kg 3x5.',
        exercises: [
          {
            exerciseId: exMap['Barbell Back Squat'],
            sets: [
              { setNumber: 1, isWarmup: false, targetWeight: 100, targetReps: 5, actualWeight: 100, actualReps: 5, rpe: 8, completed: true, calculated1RM: 116.7 },
              { setNumber: 2, isWarmup: false, targetWeight: 100, targetReps: 5, actualWeight: 100, actualReps: 5, rpe: 8.5, completed: true, calculated1RM: 116.7 },
            ],
          },
        ],
      },
      {
        userId: demoUser._id,
        workoutName: 'Push Day (Chest, Shoulders, Triceps)',
        startedAt: sampleDates[3],
        completedAt: new Date(sampleDates[3].getTime() + 4500000),
        durationSeconds: 4500,
        unit: 'kg',
        totalVolume: 6200,
        status: 'completed',
        notes: 'Progression: Bench pressed 77.5kg 3x5!',
        exercises: [
          {
            exerciseId: exMap['Barbell Bench Press'],
            sets: [
              { setNumber: 1, isWarmup: false, targetWeight: 77.5, targetReps: 5, actualWeight: 77.5, actualReps: 5, rpe: 8.5, completed: true, calculated1RM: 90.4 },
              { setNumber: 2, isWarmup: false, targetWeight: 77.5, targetReps: 5, actualWeight: 77.5, actualReps: 5, rpe: 9, completed: true, calculated1RM: 90.4 },
            ],
          },
        ],
      },
      {
        userId: demoUser._id,
        workoutName: 'Pull Day (Back, Rear Delts, Biceps)',
        startedAt: sampleDates[4],
        completedAt: new Date(sampleDates[4].getTime() + 4500000),
        durationSeconds: 4500,
        unit: 'kg',
        totalVolume: 8100,
        status: 'completed',
        notes: 'Deadlift 135kg 3x5.',
        exercises: [
          {
            exerciseId: exMap['Conventional Barbell Deadlift'],
            sets: [
              { setNumber: 1, isWarmup: false, targetWeight: 135, targetReps: 5, actualWeight: 135, actualReps: 5, rpe: 8.5, completed: true, calculated1RM: 157.5 },
            ],
          },
        ],
      },
      {
        userId: demoUser._id,
        workoutName: 'Push Day (Chest, Shoulders, Triceps)',
        startedAt: sampleDates[5],
        completedAt: new Date(sampleDates[5].getTime() + 4500000),
        durationSeconds: 4500,
        unit: 'kg',
        totalVolume: 6600,
        status: 'completed',
        notes: 'Bench press 80kg milestone achieved!',
        exercises: [
          {
            exerciseId: exMap['Barbell Bench Press'],
            sets: [
              { setNumber: 1, isWarmup: false, targetWeight: 80, targetReps: 5, actualWeight: 80, actualReps: 5, rpe: 8.5, completed: true, calculated1RM: 93.3 },
              { setNumber: 2, isWarmup: false, targetWeight: 80, targetReps: 5, actualWeight: 80, actualReps: 5, rpe: 9, completed: true, calculated1RM: 93.3 },
            ],
          },
        ],
      },
      {
        userId: demoUser._id,
        workoutName: 'Pull Day (Deadlift PR)',
        startedAt: sampleDates[6],
        completedAt: new Date(sampleDates[6].getTime() + 4500000),
        durationSeconds: 4500,
        unit: 'kg',
        totalVolume: 8700,
        status: 'completed',
        notes: 'NEW PR: 145kg x 5 reps! Estimated 1RM 168.2kg.',
        exercises: [
          {
            exerciseId: exMap['Conventional Barbell Deadlift'],
            sets: [
              { setNumber: 1, isWarmup: false, targetWeight: 145, targetReps: 5, actualWeight: 145, actualReps: 5, rpe: 9, completed: true, calculated1RM: 168.2 },
            ],
          },
        ],
      },
      {
        userId: demoUser._id,
        workoutName: 'Push Day (Bench PR)',
        startedAt: sampleDates[7],
        completedAt: new Date(sampleDates[7].getTime() + 4500000),
        durationSeconds: 4500,
        unit: 'kg',
        totalVolume: 7100,
        status: 'completed',
        notes: 'NEW PR: 82.5kg x 5 on Bench Press! Estimated 1RM 95.7kg.',
        exercises: [
          {
            exerciseId: exMap['Barbell Bench Press'],
            sets: [
              { setNumber: 1, isWarmup: false, targetWeight: 82.5, targetReps: 5, actualWeight: 82.5, actualReps: 5, rpe: 9, completed: true, calculated1RM: 95.7 },
              { setNumber: 2, isWarmup: false, targetWeight: 82.5, targetReps: 5, actualWeight: 82.5, actualReps: 5, rpe: 9.5, completed: true, calculated1RM: 95.7 },
            ],
          },
        ],
      },
    ];

    await WorkoutSession.insertMany(seededSessions);
    console.log(`Seeded ${seededSessions.length} workout sessions for demo user.`);

    if (res) {
      res.json({
        success: true,
        message: 'Database seeded successfully with default exercises, programs, and demo user.',
        demoCredentials: {
          email: 'demo@reptrack.com',
          password: 'password123',
        },
      });
    }
  } catch (error) {
    console.error('Seed error:', error);
    if (res) {
      res.status(500).json({ message: error.message || 'Seed failed' });
    }
  }
}
