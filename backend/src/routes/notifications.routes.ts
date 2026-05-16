import { Router } from 'express';
import { getAllNotifications, markAsRead } from '../controllers/notifications.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAllNotifications);
router.put('/:id/read', markAsRead);

export default router;
