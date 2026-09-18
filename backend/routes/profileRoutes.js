import { Router } from 'express';
import { getProfile, updateProfile, toggleGoal } from '../controller/profileController.js';

const router = Router();

router.get('/', getProfile);
router.put('/', updateProfile);
router.patch('/goals/:id/toggle', toggleGoal);

export default router;
