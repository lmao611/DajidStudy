import { Router } from 'express';
import { 
  getSchedules, 
  createSchedule, 
  toggleScheduleComplete, 
  deleteSchedule 
} from '../controller/scheduleController.js';
import { validateSchedule } from '../middleware/validate.js';

const router = Router();

router.get('/', getSchedules);
router.post('/', validateSchedule, createSchedule);
router.patch('/:id/toggle', toggleScheduleComplete);
router.delete('/:id', deleteSchedule);

export default router;
