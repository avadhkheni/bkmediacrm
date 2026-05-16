import { Router } from 'express';
import * as AnalyticsController from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/stats', authenticate, AnalyticsController.getInquiryStats);
router.get('/charts', authenticate, AnalyticsController.getChartData);
router.get('/performance', authenticate, AnalyticsController.getTopEmployees);
router.get('/clients', authenticate, AnalyticsController.getClientAnalytics);
router.get('/availability-report', authenticate, AnalyticsController.getAvailabilityAnalytics);
router.get('/video', authenticate, AnalyticsController.getVideoAnalytics);
router.get('/led', authenticate, AnalyticsController.getLedAnalytics);
router.get('/staff', authenticate, AnalyticsController.getStaffAnalytics);

export default router;
