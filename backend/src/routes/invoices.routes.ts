import { Router } from 'express';
import { getInvoices, createInvoice, getInvoiceById, recordPayment } from '../controllers/invoices.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['ADMIN', 'OPERATIONAL', 'ACCOUNTS', 'FINANCE']), getInvoices);
router.post('/', authorize(['ADMIN', 'ACCOUNTS']), createInvoice);
router.get('/:id', authorize(['ADMIN', 'OPERATIONAL', 'ACCOUNTS', 'FINANCE']), getInvoiceById);
router.post('/:id/record-payment', authorize(['ADMIN', 'ACCOUNTS']), recordPayment);

export default router;
