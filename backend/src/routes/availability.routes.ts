import { Router } from 'express';
import { 
  getStaffAvailabilityController, 
  getLedAvailabilityController, 
  getVideoEquipmentAvailabilityController, 
  getSoundEquipmentAvailabilityController,
  getAvailabilitySummaryController
} from '../controllers/availability.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/staff', authorize(['ADMIN', 'OPERATIONAL', 'VIDEO_DEPT', 'LED_DEPT']), getStaffAvailabilityController);
router.get('/led', authorize(['ADMIN', 'OPERATIONAL', 'LED_DEPT']), getLedAvailabilityController);
router.get('/video-equipment', authorize(['ADMIN', 'OPERATIONAL', 'VIDEO_DEPT']), getVideoEquipmentAvailabilityController);
router.get('/sound-equipment', authorize(['ADMIN', 'OPERATIONAL', 'SOUND_DEPT']), getSoundEquipmentAvailabilityController);
router.get('/summary', authorize(['ADMIN', 'OPERATIONAL', 'VIDEO_DEPT', 'LED_DEPT']), getAvailabilitySummaryController);

export default router;
