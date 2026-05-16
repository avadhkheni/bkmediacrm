import { Router } from 'express';
import { getDispatchStaff, createDispatchStaff, deleteDispatchStaff, getLedDispatchBoxes, createLedDispatchBox, deleteLedDispatchBox } from '../controllers/dispatch.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/staff', authorize(['ADMIN', 'OPERATIONAL', 'VIDEO_DEPT', 'LED_DEPT']), getDispatchStaff);
router.post('/staff', authorize(['ADMIN', 'OPERATIONAL']), createDispatchStaff);
router.delete('/staff/:id', authorize(['ADMIN', 'OPERATIONAL']), deleteDispatchStaff);

// LED Boxes
router.get('/led-boxes', authorize(['ADMIN', 'OPERATIONAL', 'LED_DEPT']), getLedDispatchBoxes);
router.post('/led-boxes', authorize(['ADMIN', 'OPERATIONAL', 'LED_DEPT']), createLedDispatchBox);
router.delete('/led-boxes/:id', authorize(['ADMIN', 'OPERATIONAL', 'LED_DEPT']), deleteLedDispatchBox);

export default router;
