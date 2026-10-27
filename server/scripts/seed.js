import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedDatabase } from '../controllers/seedController.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/reptrack';

async function runSeed() {
  try {
    console.log('Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB. Running seed...');
    await seedDatabase(null, null);
    console.log('Seeding finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed script error:', error);
    process.exit(1);
  }
}

runSeed();
