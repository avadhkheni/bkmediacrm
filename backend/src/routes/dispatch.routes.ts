import { Router } from 'express';
import { getDispatchStaff, createDispatchStaff, deleteDispatchStaff } from '../controllers/dispatch.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/staff', authorize(['ADMIN', 'OPERATIONAL', 'VIDEO_DEPT', 'LED_DEPT']), getDispatchStaff);
router.post('/staff', authorize(['ADMIN', 'OPERATIONAL']), createDispatchStaff);
router.delete('/staff/:id', authorize(['ADMIN', 'OPERATIONAL']), deleteDispatchStaff);

export default router;
