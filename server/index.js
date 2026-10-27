import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import exerciseRoutes from './routes/exerciseRoutes.js';
import programRoutes from './routes/programRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import progressionRoutes from './routes/progressionRoutes.js';
import seedRoutes from './routes/seedRoutes.js';
import { seedDatabase } from './controllers/seedController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/reptrack';

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/progression', progressionRoutes);
app.use('/api/seed', seedRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'online',
    app: 'RepTrack🏋️ Smart Workout Planner API',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('RepTrack🏋️ API is running. Check /api/health for system status.');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({
    message: err.message || 'Internal Server Error',
  });
});

// Connect to MongoDB Atlas / Local MongoDB
async function startServer() {
  try {
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected Successfully`);

    // Auto-seed default exercises and programs if empty
    await seedDatabase(null, null);
  } catch (error) {
    console.warn(`⚠️  MongoDB connection warning: ${error.message}`);
    console.warn(`   Configure your MongoDB Atlas MONGO_URI in server/.env`);
    console.warn(`   The server will continue running for client requests and calculators.`);
  }

  app.listen(PORT, () => {
    console.log(`🚀 RepTrack Server running on http://localhost:${PORT}`);
  });
}

startServer();
