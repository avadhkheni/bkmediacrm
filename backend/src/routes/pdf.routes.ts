import { Router } from 'express';
import {
  getQuotationPdf,
  getInvoicePdf,
  getVideoRequirementsPdf,
  getLedRequirementsPdf,
  getLedClearSizePdf,
  getDispatchPdf,
  getExpenseReportPdf,
  getVendorRentalsPdf,
  getIndividualVendorRentalPdf,
} from '../controllers/pdf.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/quotation/:quotationId', authorize(['ADMIN', 'OPERATIONAL', 'ACCOUNTS']), getQuotationPdf);
router.get('/invoice/:invoiceId', authorize(['ADMIN', 'OPERATIONAL', 'ACCOUNTS', 'FINANCE']), getInvoicePdf);
router.get('/requirements/video/:inquiryId', authorize(['ADMIN', 'OPERATIONAL', 'VIDEO_DEPT']), getVideoRequirementsPdf);
router.get('/requirements/led/:inquiryId', authorize(['ADMIN', 'OPERATIONAL', 'LED_DEPT']), getLedRequirementsPdf);
router.get('/requirements/led-clear-size/:inquiryId', authorize(['ADMIN', 'OPERATIONAL', 'LED_DEPT']), getLedClearSizePdf);
router.get('/dispatch/:inquiryId', authorize(['ADMIN', 'OPERATIONAL']), getDispatchPdf);
router.get('/expense-report/:inquiryId', authorize(['ADMIN']), getExpenseReportPdf);
router.get('/vendor-rentals', authorize(['ADMIN', 'OPERATIONAL', 'ACCOUNTS', 'FINANCE', 'VIDEO_DEPT', 'LED_DEPT']), getVendorRentalsPdf);
router.get('/vendor-rentals/:rentalId', authorize(['ADMIN', 'OPERATIONAL', 'ACCOUNTS', 'FINANCE', 'VIDEO_DEPT', 'LED_DEPT']), getIndividualVendorRentalPdf);

export default router;
