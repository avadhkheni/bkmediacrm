import { Router } from 'express';
import * as VideoController from '../controllers/video.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/equipment', authenticate, VideoController.getEquipment);
router.post('/equipment', authenticate, VideoController.createEquipment);
router.patch('/equipment/:id', authenticate, VideoController.updateEquipment);
router.delete('/equipment/:id', authenticate, VideoController.deleteEquipment);
router.get('/bookings', authenticate, VideoController.getBookings);
router.post('/bookings', authenticate, VideoController.createBooking);
router.delete('/bookings/:id', authenticate, VideoController.deleteBooking);
router.get('/data-sheets', authenticate, VideoController.getDataSheets);
router.post('/data-sheets', authenticate, VideoController.createDataSheet);
router.post('/data-sheets/:id/entries/bulk', authenticate, VideoController.createDataSheetEntriesBulk);

export default router;
