import { Router } from 'express';
import { getStaffAvailabilityController, getLedAvailabilityController, getVideoEquipmentAvailabilityController } from '../controllers/availability.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/staff', authorize(['ADMIN', 'OPERATIONAL', 'VIDEO_DEPT', 'LED_DEPT']), getStaffAvailabilityController);
router.get('/led', authorize(['ADMIN', 'OPERATIONAL', 'LED_DEPT']), getLedAvailabilityController);
router.get('/video-equipment', authorize(['ADMIN', 'OPERATIONAL', 'VIDEO_DEPT']), getVideoEquipmentAvailabilityController);

export default router;
