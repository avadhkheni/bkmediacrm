import { Router } from 'express';
import {
  getExpenseReports,
  createExpenseReport,
  updateExpenseReport,
  addExtraExpense,
  deleteExtraExpense,
  submitExpenseReport,
  approveExpenseReport,
} from '../controllers/expense.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['ADMIN', 'OPERATIONAL', 'ACCOUNTS', 'FINANCE']), getExpenseReports);
router.post('/', authorize(['ADMIN', 'OPERATIONAL']), createExpenseReport);
router.put('/:id', authorize(['ADMIN', 'OPERATIONAL']), updateExpenseReport);
router.post('/:id/add-extra', authorize(['ADMIN', 'OPERATIONAL']), addExtraExpense);
router.delete('/:id/extra/:extraId', authorize(['ADMIN', 'OPERATIONAL']), deleteExtraExpense);
router.post('/:id/submit', authorize(['ADMIN', 'OPERATIONAL']), submitExpenseReport);
router.post('/:id/approve', authorize(['ADMIN', 'FINANCE']), approveExpenseReport);

export default router;
