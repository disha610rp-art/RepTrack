import express from 'express';
import {
  createExercise,
  deleteExercise,
  getExerciseById,
  getExercises,
} from '../controllers/exerciseController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getExercises)
  .post(createExercise);

router.route('/:id')
  .get(getExerciseById)
  .delete(deleteExercise);

export default router;
