import { Router } from 'express';
import { getVendors, createVendor, updateVendor, deleteVendor } from '../controllers/vendors.controller';

const router = Router();

router.get('/', getVendors);
router.post('/', createVendor);
router.patch('/:id', updateVendor);
router.delete('/:id', deleteVendor);

export default router;
