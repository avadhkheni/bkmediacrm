import { Router } from 'express';
import { getInquiries, createInquiry, getInquiryById, updateInquiry, deleteInquiry, updateInquiryStatus, getInquiryTimeline, rejectExpenseReport } from '../controllers/inquiries.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['ADMIN', 'OPERATIONAL', 'ACCOUNTS', 'FINANCE', 'VIDEO_DEPT', 'LED_DEPT']), getInquiries);
router.post('/', authorize(['ADMIN', 'OPERATIONAL', 'VIDEO_DEPT', 'LED_DEPT']), createInquiry);
router.get('/:id', authorize(['ADMIN', 'OPERATIONAL', 'ACCOUNTS', 'FINANCE', 'VIDEO_DEPT', 'LED_DEPT']), getInquiryById);
router.put('/:id', authorize(['ADMIN', 'OPERATIONAL', 'VIDEO_DEPT', 'LED_DEPT']), updateInquiry);
router.delete('/:id', authorize(['ADMIN', 'OPERATIONAL', 'VIDEO_DEPT', 'LED_DEPT']), deleteInquiry);
router.put('/:id/status', authorize(['ADMIN', 'OPERATIONAL', 'VIDEO_DEPT', 'LED_DEPT']), updateInquiryStatus);
router.get('/:id/timeline', authorize(['ADMIN', 'OPERATIONAL', 'ACCOUNTS', 'VIDEO_DEPT', 'LED_DEPT']), getInquiryTimeline);
router.post('/:inquiryId/expense-report/reject', authorize(['ADMIN', 'FINANCE']), rejectExpenseReport);

export default router;
