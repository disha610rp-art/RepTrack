import express from 'express';
import {
  createProgram,
  deleteProgram,
  getProgramById,
  getPrograms,
  setActiveProgram,
} from '../controllers/programController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getPrograms)
  .post(createProgram);

router.route('/:id')
  .get(getProgramById)
  .delete(deleteProgram);

router.put('/:id/set-active', setActiveProgram);

export default router;
