import express from 'express';
import {
  calculate1RmEndpoint,
  calculatePlatesEndpoint,
  getAnalytics,
  getProgressStates,
} from '../controllers/progressionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public calculators
router.post('/calculate-plates', calculatePlatesEndpoint);
router.post('/calculate-1rm', calculate1RmEndpoint);

// Protected user analytics
router.get('/analytics', protect, getAnalytics);
router.get('/states', protect, getProgressStates);

export default router;
