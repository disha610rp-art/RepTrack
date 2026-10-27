import express from 'express';
import { seedDatabase } from '../controllers/seedController.js';

const router = express.Router();

router.post('/', seedDatabase);
router.get('/', seedDatabase);

export default router;
