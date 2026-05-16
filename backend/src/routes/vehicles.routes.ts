import { Router } from 'express';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../controllers/vehicles.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['ADMIN', 'OPERATIONAL', 'VIDEO_DEPT', 'LED_DEPT']), getVehicles);
router.post('/', authorize(['ADMIN', 'OPERATIONAL']), createVehicle);
router.put('/:id', authorize(['ADMIN', 'OPERATIONAL']), updateVehicle);
router.delete('/:id', authorize(['ADMIN']), deleteVehicle);

export default router;
