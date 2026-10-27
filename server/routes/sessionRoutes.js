import express from 'express';
import {
  addExerciseToSession,
  addSetToExercise,
  cancelSession,
  completeSession,
  deleteSession,
  getActiveSession,
  getSessions,
  removeSetFromExercise,
  startSession,
  updateSet,
} from '../controllers/sessionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getSessions);
router.get('/active', getActiveSession);
router.post('/start', startSession);
router.put('/:id/set', updateSet);
router.post('/:id/add-set', addSetToExercise);
router.delete('/:id/set/:setId', removeSetFromExercise);
router.post('/:id/add-exercise', addExerciseToSession);
router.post('/:id/complete', completeSession);
router.post('/:id/cancel', cancelSession);
router.delete('/:id', deleteSession);

export default router;
