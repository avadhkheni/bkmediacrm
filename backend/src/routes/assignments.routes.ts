import { Router } from 'express';
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  markAssignmentPaid,
  bulkMarkPaid,
} from '../controllers/assignments.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['ADMIN', 'OPERATIONAL', 'VIDEO_DEPT', 'LED_DEPT']), getAssignments);
router.post('/', authorize(['ADMIN', 'OPERATIONAL', 'VIDEO_DEPT', 'LED_DEPT']), createAssignment);
router.put('/:id', authorize(['ADMIN', 'OPERATIONAL', 'VIDEO_DEPT', 'LED_DEPT']), updateAssignment);
router.delete('/:id', authorize(['ADMIN', 'OPERATIONAL']), deleteAssignment);
router.post('/:id/mark-paid', authorize(['ADMIN', 'ACCOUNTS']), markAssignmentPaid);
router.post('/bulk-mark-paid', authorize(['ADMIN', 'ACCOUNTS']), bulkMarkPaid);

export default router;
