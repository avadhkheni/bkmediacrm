import { Router } from 'express';
import * as StaffController from '../controllers/staff.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadAadhar } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

router.get('/', StaffController.getStaff);
router.post('/', StaffController.createStaff);
router.get('/availability', StaffController.getStaffAvailability);
router.post('/:id/aadhar', uploadAadhar.fields([{ name: 'front', maxCount: 1 }, { name: 'back', maxCount: 1 }]), StaffController.uploadAadhar);
router.get('/:id', StaffController.getStaffById);
router.put('/:id', StaffController.updateStaff);
router.delete('/:id', StaffController.deleteStaff);
router.get('/:id/assignments', StaffController.getStaffAssignments);
router.get('/:id/payments', StaffController.getStaffPayments);

export default router;
