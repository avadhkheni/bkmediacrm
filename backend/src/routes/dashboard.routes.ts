import { Router } from 'express';
import * as DashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/stats', DashboardController.getDashboardStats);
router.get('/overview', DashboardController.getOverview);
router.get('/upcoming-events', DashboardController.getUpcomingEvents);
router.get('/pending-actions', DashboardController.getPendingActions);
router.get('/monthly-pnl', DashboardController.getMonthlyPnL);

export default router;
