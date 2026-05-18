import { Router } from 'express';
import { 
  getVendors, 
  createVendor, 
  updateVendor, 
  deleteVendor,
  createVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
  getVendorRentals,
  createVendorRental,
  updateVendorRental,
  deleteVendorRental
} from '../controllers/vendors.controller';

const router = Router();

// Vendor Rentals tracking routes (placed first to prevent /:id parameter collision)
router.get('/rentals', getVendorRentals);
router.post('/rentals', createVendorRental);
router.patch('/rentals/:id', updateVendorRental);
router.delete('/rentals/:id', deleteVendorRental);

router.get('/', getVendors);
router.post('/', createVendor);
router.patch('/:id', updateVendor);
router.delete('/:id', deleteVendor);

// Vendor Products endpoints
router.post('/:vendorId/products', createVendorProduct);
router.patch('/products/:productId', updateVendorProduct);
router.delete('/products/:productId', deleteVendorProduct);

export default router;
