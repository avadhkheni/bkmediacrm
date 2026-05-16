import { Router } from 'express';
import * as LedController from '../controllers/led.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/stock', authenticate, LedController.getLedStock);
router.get('/stock/:id', authenticate, LedController.getLedStockById);
router.post('/stock', authenticate, LedController.createLedStock);
router.patch('/stock/:id', authenticate, LedController.updateLedStock);
router.delete('/stock/:id', authenticate, LedController.deleteLedStock);
router.get('/allocations', authenticate, LedController.getWarehouseAllocations);
router.post('/allocations', authenticate, LedController.createWarehouseAllocation);
router.get('/dispatch-boxes', authenticate, LedController.getDispatchBoxes);
router.post('/dispatch-boxes', authenticate, LedController.createDispatchBox);

export default router;
