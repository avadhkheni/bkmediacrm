import { Router } from 'express';
import * as SoundController from '../controllers/sound.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/setup', authenticate, SoundController.getSoundSetup);
router.post('/setup', authenticate, SoundController.upsertSoundSetup);
router.get('/equipment', authenticate, SoundController.getSoundEquipment);
router.post('/equipment', authenticate, SoundController.createSoundEquipment);
router.patch('/equipment/:id', authenticate, SoundController.updateSoundEquipment);
router.delete('/equipment/:id', authenticate, SoundController.deleteSoundEquipment);
router.patch('/setup/:inquiryId/workflow', authenticate, SoundController.updateSoundWorkflow);

router.get('/bookings', authenticate, SoundController.getSoundBookings);
router.post('/bookings', authenticate, SoundController.createSoundBooking);
router.delete('/bookings/:id', authenticate, SoundController.deleteSoundBooking);

export default router;
