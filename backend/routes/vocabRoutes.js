import { Router } from 'express';
import { 
  getVocabularies, 
  createVocabulary, 
  toggleMasteredVocab, 
  deleteVocabulary 
} from '../controller/vocabController.js';
import { validateVocab } from '../middleware/validate.js';

const router = Router();

router.get('/', getVocabularies);
router.post('/', validateVocab, createVocabulary);
router.patch('/:id/toggle', toggleMasteredVocab);
router.delete('/:id', deleteVocabulary);

export default router;
