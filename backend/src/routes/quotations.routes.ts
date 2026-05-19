import { Router } from 'express';
import * as QuotationsController from '../controllers/quotations.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadSignedCopy } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

router.get('/next-number', QuotationsController.getNextQuotationNumber);
router.post('/', QuotationsController.createQuotation);
router.get('/inquiry/:inquiryId', QuotationsController.getQuotationsByInquiry);
router.get('/:id', QuotationsController.getQuotationById);
router.put('/:id', QuotationsController.updateQuotation);
router.post('/:id/revise', QuotationsController.reviseQuotation);
router.post('/:id/approve', QuotationsController.approveQuotation);
router.post('/:id/decline', QuotationsController.declineQuotation);
router.post('/:id/send', QuotationsController.sendQuotation);
router.delete('/:id', QuotationsController.deleteQuotation);
router.patch('/:id/status', QuotationsController.updateQuotationStatus);
router.post('/:id/signed-copy', uploadSignedCopy.single('signedCopy'), QuotationsController.uploadSignedCopy);

export default router;
