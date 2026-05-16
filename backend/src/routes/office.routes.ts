import { Router } from 'express';
import * as OfficeController from '../controllers/office.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/tasks', authenticate, OfficeController.getTasks);
router.post('/tasks', authenticate, OfficeController.createTask);
router.patch('/tasks/:id', authenticate, OfficeController.updateTask);
router.delete('/tasks/:id', authenticate, OfficeController.deleteTask);

export default router;
